"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, CheckCircle2, Dumbbell, Play, Timer, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

const statusClassNames: Record<WorkoutStatus, string> = {
  COMPLETED: "border-[#c8f135]/15 bg-[#c8f135]/10 text-[#c8f135]",
  IN_PROGRESS: "border-[#5eead4]/15 bg-[#5eead4]/10 text-[#5eead4]",
  CANCELLED: "border-red-400/15 bg-red-400/10 text-red-300",
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

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEnum(value?: string | null) {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getSetVolume(set: WorkoutSet) {
  if (set.weight == null || set.reps == null) return 0;

  return set.weight * set.reps;
}

function getExerciseVolume(exercise: WorkoutExercise) {
  return exercise.sets.reduce((total, set) => total + getSetVolume(set), 0);
}

function getExerciseStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-0 bg-[#c8f135]/10 text-[#c8f135]";
    case "IN_PROGRESS":
      return "border-0 bg-[#5eead4]/10 text-[#5eead4]";
    case "SKIPPED":
      return "border-0 bg-white/5 text-white/25";
    case "PENDING":
    default:
      return "border-0 bg-white/7 text-white/40";
  }
}

function getSetTypeClass(setType: string) {
  switch (setType) {
    case "NORMAL":
      return "border-[#c8f135]/15 bg-[#c8f135]/10 text-[#c8f135]";
    case "WARMUP":
      return "border-[#5eead4]/15 bg-[#5eead4]/10 text-[#5eead4]";
    case "DROP":
      return "border-[#a78bfa]/15 bg-[#a78bfa]/10 text-[#c4b5fd]";
    case "FAILURE":
      return "border-red-400/15 bg-red-400/10 text-red-300";
    default:
      return "border-white/10 bg-white/5 text-white/45";
  }
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Trophy }) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30">
      <div className="pointer-events-none absolute -right-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.10] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <CardContent className="relative z-10 flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#c8f135]/15 bg-[#c8f135]/8 text-[#c8f135]">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold text-[#f0f0ee]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutExerciseCard({ workoutExercise }: { workoutExercise: WorkoutExercise }) {
  const sortedSets = [...workoutExercise.sets].sort((a, b) => a.setNumber - b.setNumber);
  const exerciseVolume = getExerciseVolume(workoutExercise);

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30 hover:bg-[#c8f135]/[0.03]">
      <Image src="/assets/cards/exercises.png" alt="" width={190} height={190} className="pointer-events-none absolute -right-16 top-24 size-52 -translate-y-1/2 object-contain opacity-[0.07] transition-opacity group-hover:opacity-[0.12]" />
      <div className="pointer-events-none absolute -right-10 top-24 h-36 w-36 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <CardContent className="relative z-10 space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="font-[family-name:var(--font-display)] text-lg leading-none text-[#c8f135]">{workoutExercise.order}</span>
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-[#f0f0ee]">{workoutExercise.exercise.name}</h2>
                <p className="mt-1 text-xs text-white/30">{formatNumber(exerciseVolume)} volume</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("text-[11px] font-medium", getExerciseStatusClass(workoutExercise.status))}>{formatEnum(workoutExercise.status)}</Badge>
              <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">Sets: {formatOptional(workoutExercise.targetSets)}</Badge>
              <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">Reps: {formatOptional(workoutExercise.targetReps)}</Badge>
              <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">Rest: {formatOptional(workoutExercise.restSeconds, "s")}</Badge>
            </div>
          </div>
        </div>

        <Separator className="bg-white/5" />

        {sortedSets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/35">No sets logged.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sortedSets.map((set) => (
              <div key={set.id} className="relative overflow-hidden rounded-xl border border-[#c8f135]/10 bg-[#111112]/80 p-3">
                <div className="pointer-events-none absolute -right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-xl" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest text-[#c8f135] uppercase">Set {set.setNumber}</p>
                      <p className="mt-1 text-lg font-semibold text-[#f0f0ee]">
                        {formatOptional(set.weight)}
                        <span className="px-1 text-white/25">x</span>
                        {formatOptional(set.reps)}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold hover:bg-transparent", getSetTypeClass(set.setType))}>{formatEnum(set.setType)}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-white/25 uppercase">Volume</p>
                    <p className="mt-1 text-sm font-semibold text-white/60">{formatNumber(getSetVolume(set))}</p>
                  </div>
                  {set.notes ? <p className="text-xs leading-5 text-white/35">{set.notes}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
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
      exercises: sortedExercises.length,
      sets: allSets.length,
      reps: allSets.reduce((total, set) => total + (set.reps ?? 0), 0),
      volume: allSets.reduce((total, set) => total + getSetVolume(set), 0),
    }),
    [allSets, sortedExercises.length],
  );

  return (
    <div className="space-y-5 pb-6">
      <Button asChild variant="ghost" className="-ml-2 h-9 rounded-xl px-2 text-white/40 hover:bg-white/5 hover:text-white/75">
        <Link href="/workout">
          <ArrowLeft className="size-4" />
          History
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3 bg-white/10" />
          <Skeleton className="h-4 w-1/2 bg-white/10" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-2xl bg-white/10" />
            ))}
          </div>
          <Skeleton className="h-44 rounded-2xl bg-white/10" />
        </div>
      ) : !workout ? (
        <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
          <CardContent className="space-y-2 p-5">
            <h1 className="text-base font-semibold text-[#f0f0ee]">Workout not found</h1>
            <p className="text-sm text-white/35">This workout could not be loaded.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="relative overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b] py-0">
            <Image src="/assets/cards/home-workout-history.png" alt="" width={220} height={220} className="pointer-events-none absolute -right-16 top-1/2 size-56 -translate-y-1/2 object-contain opacity-[0.08]" />
            <div className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
            <CardContent className="relative z-10 space-y-5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/35">
                    <CalendarDays className="size-4 text-[#c8f135]" />
                    {formatDateTime(workout.date)}
                  </div>
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[#f0f0ee]">{workout.name || "Workout"}</h1>
                  {workout.completedAt ? <p className="text-sm text-white/35">Completed {formatDateTime(workout.completedAt)}</p> : null}
                </div>
                <Badge className={cn("w-fit rounded-full border px-3 py-1 text-xs font-semibold hover:bg-transparent", statusClassNames[workout.status])}>{formatEnum(workout.status)}</Badge>
              </div>

              {workout.status === "IN_PROGRESS" ? (
                <Button asChild className="h-11 w-full rounded-xl bg-[#c8f135] font-semibold text-[#0e0e0f] hover:bg-[#d4f54d] sm:w-fit">
                  <Link href="/workout/active">
                    <Play className="size-4" />
                    Resume Workout
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <MetricCard label="Exercises" value={totals.exercises} icon={Dumbbell} />
            <MetricCard label="Sets" value={totals.sets} icon={CheckCircle2} />
            <MetricCard label="Reps" value={formatNumber(totals.reps)} icon={Timer} />
            <MetricCard label="Volume" value={formatNumber(totals.volume)} icon={Trophy} />
          </div>

          <div className="space-y-3">
            {sortedExercises.map((workoutExercise) => (
              <WorkoutExerciseCard key={workoutExercise.id} workoutExercise={workoutExercise} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
