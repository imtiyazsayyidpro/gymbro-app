"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutService } from "@/src/services/WorkoutService";

type WorkoutStatus = "COMPLETED" | "IN_PROGRESS" | "CANCELLED";

type WorkoutSet = {
  id: number;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  setType: string;
  notes?: string | null;
};

type WorkoutExercise = {
  id: number;
  order: number;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  status: string;
  exercise: {
    name: string;
  };
  sets: WorkoutSet[];
};

type Workout = {
  id: number;
  name?: string | null;
  date: string;
  status: WorkoutStatus;
  completedAt?: string | null;
  exercises: WorkoutExercise[];
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseWorkout(response: unknown): Workout | null {
  return (response as { data?: { data?: Workout } }).data?.data ?? null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatOptional(value?: number | string | null, suffix = "") {
  if (value == null || value === "") return "Not set";

  return `${value}${suffix}`;
}

function getSetVolume(set: WorkoutSet) {
  if (set.weight == null || set.reps == null) return 0;

  return set.weight * set.reps;
}

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const workoutId = Number(params.id);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkout = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await WorkoutService.getWorkoutById(workoutId);
      setWorkout(parseWorkout(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchWorkout();
    });
  }, [fetchWorkout]);

  const sortedExercises = useMemo(() => [...(workout?.exercises ?? [])].sort((a, b) => a.order - b.order), [workout]);
  const allSets = useMemo(() => sortedExercises.flatMap((exercise) => exercise.sets), [sortedExercises]);
  const totals = useMemo(
    () => ({
      sets: allSets.length,
      reps: allSets.reduce((total, set) => total + (set.reps ?? 0), 0),
      volume: allSets.reduce((total, set) => total + getSetVolume(set), 0),
    }),
    [allSets],
  );

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/workout">
          <ArrowLeft className="size-4" />
          History
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !workout ? (
        <Card>
          <CardHeader>
            <CardTitle>Workout not found</CardTitle>
            <CardDescription>This workout could not be loaded.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{workout.name || "Workout"}</h1>
              <p className="text-sm text-muted-foreground">{formatDateTime(workout.date)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{workout.status}</Badge>
              {workout.completedAt && <Badge variant="secondary">Completed {formatDateTime(workout.completedAt)}</Badge>}
            </div>
            {workout.status === "IN_PROGRESS" && (
              <Button asChild className="w-full">
                <Link href="/workout/active">Resume Workout</Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Sets</CardDescription>
                <CardTitle>{totals.sets}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Reps</CardDescription>
                <CardTitle>{totals.reps}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Volume</CardDescription>
                <CardTitle>{totals.volume}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-3">
            {sortedExercises.map((workoutExercise) => (
              <Card key={workoutExercise.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate text-base">
                        {workoutExercise.order}. {workoutExercise.exercise.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{workoutExercise.status}</Badge>
                        <Badge variant="secondary">Sets: {formatOptional(workoutExercise.targetSets)}</Badge>
                        <Badge variant="outline">Reps: {formatOptional(workoutExercise.targetReps)}</Badge>
                        <Badge variant="outline">Rest: {formatOptional(workoutExercise.restSeconds, "s")}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Separator />
                  {workoutExercise.sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sets logged.</p>
                  ) : (
                    workoutExercise.sets.map((set) => (
                      <div key={set.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium">Set {set.setNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatOptional(set.weight)} x {formatOptional(set.reps)} reps
                            </p>
                            {set.notes && <p className="text-sm text-muted-foreground">{set.notes}</p>}
                          </div>
                          <Badge variant="outline">{set.setType}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
