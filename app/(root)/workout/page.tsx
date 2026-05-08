"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Dumbbell, History } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function WorkoutHistoryCard({ workout }: { workout: WorkoutSummary }) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30 hover:bg-[#c8f135]/[0.03]">
      <Image src="/assets/cards/home-workout-history.png" alt="" width={190} height={190} className="pointer-events-none absolute -right-16 top-1/2 size-52 -translate-y-1/2 object-contain opacity-[0.08] transition-opacity group-hover:opacity-[0.14]" />
      <div className="pointer-events-none absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <CardContent className="relative z-10 space-y-4 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <Dumbbell className="size-4 shrink-0 text-[#c8f135]" />
            <h2 className="truncate text-[15px] font-semibold text-[#f0f0ee]">{workout.name || workout.routine?.name || "Workout"}</h2>
          </div>
          <p className="flex items-center gap-2 text-xs text-white/35">
            <CalendarDays className="size-3.5" />
            {formatDate(workout.date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {workout.routine?.name ? <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">{workout.routine.name}</Badge> : null}
          {typeof workout._count?.exercises === "number" ? <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">{workout._count.exercises} exercises</Badge> : null}
        </div>

        <Separator className="bg-white/5" />

        <Button asChild variant="ghost" className="h-10 w-full justify-between rounded-xl px-3 text-white/45 hover:bg-white/5 hover:text-[#c8f135]">
          <Link href={`/workout/${workout.id}`}>
            View details
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await WorkoutService.getWorkoutHistory({ status: "COMPLETED" });
      setWorkouts(parseWorkouts(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchWorkouts();
    });
  }, [fetchWorkouts]);

  return (
    <div className="space-y-5 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">Workout History</h1>
        <p className="text-sm text-white/40">Review your completed training sessions.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-2xl border-white/6 bg-[#1a1a1b]">
              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36 bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
                <Skeleton className="h-6 w-48 bg-white/10" />
                <Skeleton className="h-px w-full bg-white/10" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <Card className="relative overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b]">
          <Image src="/assets/cards/home-workout-history.png" alt="" width={220} height={220} className="pointer-events-none absolute -right-14 top-1/2 size-56 -translate-y-1/2 object-contain opacity-[0.08]" />
          <div className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
          <CardContent className="relative z-10 space-y-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl border border-[#c8f135]/20 bg-[#c8f135]/10 text-[#c8f135]">
              <History className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#f0f0ee]">No workouts found</h2>
              <p className="text-sm text-white/35">Start a workout from a routine to build your history.</p>
            </div>
            <Button asChild className="h-11 w-full rounded-xl bg-[#c8f135] font-semibold text-[#0e0e0f] hover:bg-[#d4f54d] sm:w-fit">
              <Link href="/routines">Go to routines</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {workouts.map((workout) => (
            <WorkoutHistoryCard key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </div>
  );
}
