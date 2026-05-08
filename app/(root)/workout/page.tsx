"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutService } from "@/src/services/WorkoutService";

type WorkoutStatus = "COMPLETED" | "IN_PROGRESS" | "CANCELLED";

type WorkoutSummary = {
  id: number;
  name?: string | null;
  date: string;
  status: WorkoutStatus;
  routine?: {
    name: string;
  } | null;
  _count?: {
    exercises?: number;
  };
};

const ALL_STATUSES = "ALL";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseWorkouts(response: unknown): WorkoutSummary[] {
  return (response as { data?: { data?: { workouts?: WorkoutSummary[] } } }).data?.data?.workouts ?? [];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [status, setStatus] = useState<string>(ALL_STATUSES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkouts = useCallback(
    async (selectedStatus = status) => {
      setIsLoading(true);

      try {
        const response = await WorkoutService.getWorkoutHistory({
          ...(selectedStatus !== ALL_STATUSES && { status: selectedStatus }),
        });
        setWorkouts(parseWorkouts(response));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchWorkouts();
    });
  }, [fetchWorkouts]);

  async function handleStatusChange(value: string) {
    setStatus(value);
    await fetchWorkouts(value);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Workout history</h1>
          <p className="text-sm text-muted-foreground">Review completed, active, and cancelled sessions.</p>
        </div>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No workouts found</CardTitle>
            <CardDescription>Start a workout from a routine to build your history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/routines">Go to routines</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate text-base">{workout.name || "Workout"}</CardTitle>
                    <CardDescription>{formatDate(workout.date)}</CardDescription>
                  </div>
                  <Badge>{workout.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {workout.routine?.name && <Badge variant="secondary">{workout.routine.name}</Badge>}
                  {typeof workout._count?.exercises === "number" && <Badge variant="outline">{workout._count.exercises} exercises</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/workout/${workout.id}`}>
                    View details
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
