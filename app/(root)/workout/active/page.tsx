"use client";

import Image from "next/image";
import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, History, MoreVertical, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { AlertDialog, DropdownMenu } from "radix-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutineService } from "@/src/services/RoutineService";
import { WorkoutService, WorkoutSetPayload } from "@/src/services/WorkoutService";
import { cn } from "@/lib/utils";

type WorkoutSetType = "NORMAL" | "WARMUP" | "DROP" | "FAILURE";
type WorkoutExerciseStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
type WorkoutMode = "LOGGING" | "RESTING";

type WorkoutSet = {
  id: number;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  setType: WorkoutSetType;
  notes?: string | null;
};

type WorkoutExercise = {
  id: number;
  order: number;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  status: WorkoutExerciseStatus;
  exercise: {
    id: number;
    name: string;
  };
  sets: WorkoutSet[];
};

type Workout = {
  id: number;
  name?: string | null;
  routine?: {
    name: string;
  } | null;
  exercises: WorkoutExercise[];
};

type Routine = {
  id: number;
  name: string;
  description?: string | null;
  _count?: {
    exercises?: number;
  };
};

type SetForm = {
  weight: string;
  reps: string;
  setType: WorkoutSetType;
  notes: string;
};

type LastSetSummary = {
  weight: string;
  reps: string;
  setType: WorkoutSetType;
} | null;

type ExerciseLastSession = {
  workoutSessionId: number;
  workoutName?: string | null;
  routine?: {
    id: number;
    name: string;
  } | null;
  date: string;
  completedAt?: string | null;
  exercise: {
    id: number;
    name: string;
  };
  sets: WorkoutSet[];
};

const emptySetForm: SetForm = {
  weight: "",
  reps: "",
  setType: "NORMAL",
  notes: "",
};

const setTypes: Array<{ value: WorkoutSetType; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "WARMUP", label: "Warmup" },
  { value: "DROP", label: "Drop" },
  { value: "FAILURE", label: "Fail" },
];

function getInputStyle(value: string) {
  return {
    color: value ? "#f0f0ee" : "rgba(255, 255, 255, 0.18)",
    WebkitTextFillColor: value ? "#f0f0ee" : "rgba(255, 255, 255, 0.18)",
  };
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseWorkout(response: unknown): Workout | null {
  return (response as { data?: { data?: Workout | null } }).data?.data ?? null;
}

function parseRoutines(response: unknown): Routine[] {
  return (response as { data?: { data?: { routines?: Routine[] } } }).data?.data?.routines ?? [];
}

function parseExerciseLastSession(response: unknown): ExerciseLastSession | null {
  return (response as { data?: { data?: ExerciseLastSession | null } }).data?.data ?? null;
}

function formatOptional(value?: number | string | null, suffix = "") {
  if (value == null || value === "") return "Not set";
  return `${value}${suffix}`;
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildSetPayload(form: SetForm): WorkoutSetPayload {
  return {
    weight: form.weight === "" ? null : Number(form.weight),
    reps: form.reps === "" ? null : Number(form.reps),
    setType: form.setType,
    notes: null,
  };
}

function getFormFromSet(set: WorkoutSet): SetForm {
  return {
    weight: set.weight == null ? "" : String(set.weight),
    reps: set.reps == null ? "" : String(set.reps),
    setType: set.setType,
    notes: set.notes ?? "",
  };
}

function getStatusClass(status: WorkoutExerciseStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-0 bg-[#c8f135]/10 text-[#c8f135]";
    case "COMPLETED":
      return "border-0 bg-green-500/10 text-green-400";
    case "SKIPPED":
      return "border-0 bg-white/5 text-white/20";
    case "PENDING":
    default:
      return "border-0 bg-white/7 text-white/40";
  }
}

function getSetTypeLabel(type: WorkoutSetType) {
  return setTypes.find((setType) => setType.value === type)?.label ?? type;
}

function sortedSets(sets: WorkoutSet[]) {
  return [...sets].sort((a, b) => a.setNumber - b.setNumber);
}

function updateWorkoutExerciseInState(workout: Workout | null, workoutExerciseId: number, updater: (exercise: WorkoutExercise) => WorkoutExercise) {
  if (!workout) return workout;

  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => (exercise.id === workoutExerciseId ? updater(exercise) : exercise)),
  };
}

function WorkoutMenu({ onComplete, onCancel, disabled }: { onComplete: () => void; onCancel: () => void; disabled: boolean }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full text-white/40 hover:bg-white/5 hover:text-white/80" aria-label="Workout menu">
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-48 overflow-hidden rounded-xl border border-white/10 bg-[#151516] p-1 text-[#f0f0ee] shadow-xl outline-none">
          <DropdownMenu.Item disabled={disabled} onSelect={onComplete} className="flex cursor-default items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/5 focus:bg-white/5 data-disabled:opacity-40">
            ✓ Finish Workout
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={disabled}
            onSelect={onCancel}
            className="flex cursor-default items-center rounded-lg px-3 py-2 text-sm text-red-300 outline-none hover:bg-red-500/10 focus:bg-red-500/10 data-disabled:opacity-40"
          >
            ✕ Cancel Workout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function NoActiveWorkout({
  routines,
  isLoadingRoutines,
  startingRoutineId,
  onStartRoutine,
}: {
  routines: Routine[];
  isLoadingRoutines: boolean;
  startingRoutineId: number | null;
  onStartRoutine: (routineId: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-[family-name:var(--font-display)] text-xs tracking-widest text-[#c8f135] uppercase">No active workout</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">Start from a routine</h1>
        <p className="text-sm text-white/40">Choose a template and start logging immediately.</p>
      </div>

      {isLoadingRoutines ? (
        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="rounded-2xl border-white/6 bg-[#1a1a1b]">
              <CardContent className="space-y-5 p-4">
                <Skeleton className="h-5 w-24 bg-white/10" />
                <Skeleton className="h-10 w-full bg-white/10" />
                <Skeleton className="h-px w-full bg-white/10" />
                <Skeleton className="h-11 w-full rounded-xl bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : routines.length === 0 ? (
        <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
          <CardHeader>
            <CardTitle className="text-white">No routines found</CardTitle>
            <CardDescription>Create a routine first, then start a workout from here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 pb-20 lg:grid-cols-3 lg:gap-4">
          {routines.map((routine) => {
            const isStarting = startingRoutineId === routine.id;

            return (
              <Card
                key={routine.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (startingRoutineId == null) onStartRoutine(routine.id);
                }}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && startingRoutineId == null) {
                    event.preventDefault();
                    onStartRoutine(routine.id);
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30 hover:bg-[#c8f135]/[0.03]"
              >
                <Image
                  src="/assets/cards/routine.png"
                  alt=""
                  width={190}
                  height={190}
                  className="pointer-events-none absolute -right-16 -bottom-16 size-52 object-contain opacity-[0.08] transition-opacity group-hover:opacity-[0.14]"
                />
                <div className="pointer-events-none absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
                <CardContent className="relative z-10 flex min-h-40 flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h2 className="truncate text-[15px] font-semibold text-[#f0f0ee]">{routine.name}</h2>
                      {routine.description ? <p className="line-clamp-2 text-xs leading-5 text-white/35">{routine.description}</p> : <p className="text-xs text-white/25">Routine template</p>}
                    </div>
                    <Badge className="shrink-0 border-0 bg-[#c8f135]/10 text-[10px] font-semibold text-[#c8f135]">{routine._count?.exercises ?? 0}</Badge>
                  </div>

                  <div className="mt-auto space-y-3 pt-5">
                    <Separator className="bg-white/5" />
                    <Button
                      type="button"
                      size="icon"
                      disabled={startingRoutineId != null}
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartRoutine(routine.id);
                      }}
                      className="size-10 rounded-full bg-[#c8f135] text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.18)] hover:bg-[#d4f54d]"
                      aria-label={`Start ${routine.name}`}
                    >
                      {isStarting ? <span className="size-3 animate-pulse rounded-full bg-[#0e0e0f]" /> : <Play className="size-4 fill-current" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<WorkoutMode>("LOGGING");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [startingRoutineId, setStartingRoutineId] = useState<number | null>(null);
  const [isSavingSet, setIsSavingSet] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [setForm, setSetForm] = useState<SetForm>(emptySetForm);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [editSetForm, setEditSetForm] = useState<SetForm>(emptySetForm);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [lastSetSummary, setLastSetSummary] = useState<LastSetSummary>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [flashingSetId, setFlashingSetId] = useState<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const [historyExercise, setHistoryExercise] = useState<WorkoutExercise | null>(null);
  const [lastExerciseSession, setLastExerciseSession] = useState<ExerciseLastSession | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const exercises = useMemo(() => [...(workout?.exercises ?? [])].sort((a, b) => a.order - b.order), [workout]);
  const currentExercise = exercises[currentIndex] ?? null;
  const currentSets = useMemo(() => sortedSets(currentExercise?.sets ?? []), [currentExercise]);

  const fetchActiveWorkout = useCallback(async (preferredExerciseId?: number) => {
    setIsLoading(true);

    try {
      const response = await WorkoutService.getActiveWorkout();
      const activeWorkout = parseWorkout(response);
      setWorkout(activeWorkout);

      if (activeWorkout?.exercises?.length) {
        const sortedExercises = [...activeWorkout.exercises].sort((a, b) => a.order - b.order);
        const preferredIndex = preferredExerciseId ? sortedExercises.findIndex((exercise) => exercise.id === preferredExerciseId) : -1;
        const firstOpenIndex = sortedExercises.findIndex((exercise) => exercise.status !== "COMPLETED" && exercise.status !== "SKIPPED");
        setCurrentIndex(preferredIndex >= 0 ? preferredIndex : firstOpenIndex >= 0 ? firstOpenIndex : 0);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRoutines = useCallback(async () => {
    setIsLoadingRoutines(true);

    try {
      const response = await RoutineService.getAllRoutines({ limit: 100 });
      setRoutines(parseRoutines(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingRoutines(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchActiveWorkout();
    });
  }, [fetchActiveWorkout]);

  useEffect(() => {
    if (isLoading || workout) return;

    queueMicrotask(() => {
      fetchRoutines();
    });
  }, [fetchRoutines, isLoading, workout]);

  useEffect(() => {
    if (mode !== "RESTING" || timerSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setTimerSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [mode, timerSeconds]);

  function selectExercise(index: number) {
    setCurrentIndex(index);
    setMode("LOGGING");
    setTimerSeconds(0);
  }

  function stopRest() {
    setTimerSeconds(0);
    setMode("LOGGING");
  }

  async function handleAddSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workout || !currentExercise) return;

    const previousWorkout = workout;
    const payload = buildSetPayload(setForm);
    const optimisticSet: WorkoutSet = {
      id: -Date.now(),
      setNumber: currentSets.at(-1)?.setNumber ? (currentSets.at(-1)?.setNumber ?? 0) + 1 : 1,
      weight: payload.weight,
      reps: payload.reps,
      setType: payload.setType ?? "NORMAL",
      notes: payload.notes,
    };
    const summary = {
      weight: setForm.weight || "0",
      reps: setForm.reps || "0",
      setType: setForm.setType,
    };

    setIsSavingSet(true);
    setWorkout((current) =>
      updateWorkoutExerciseInState(current, currentExercise.id, (exercise) => ({
        ...exercise,
        status: exercise.status === "PENDING" ? "IN_PROGRESS" : exercise.status,
        sets: sortedSets([...exercise.sets, optimisticSet]),
      })),
    );
    setSetForm(emptySetForm);
    setLastSetSummary(summary);

    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    setFlashingSetId(optimisticSet.id);
    flashTimerRef.current = window.setTimeout(() => {
      setFlashingSetId(null);
      flashTimerRef.current = null;
    }, 600);

    if (currentExercise.restSeconds && currentExercise.restSeconds > 0) {
      setTimerSeconds(currentExercise.restSeconds);
      setMode("RESTING");
    } else {
      setMode("LOGGING");
    }

    try {
      await WorkoutService.addSet(workout.id, currentExercise.id, payload);
      toast.success("Set added");
      await fetchActiveWorkout(currentExercise.id);
    } catch (error) {
      setWorkout(previousWorkout);
      setSetForm(setForm);
      setMode("LOGGING");
      setTimerSeconds(0);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingSet(false);
    }
  }

  async function handleUpdateSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workout || !currentExercise || !editingSet) return;

    const previousWorkout = workout;
    const payload = buildSetPayload(editSetForm);
    const editingSetId = editingSet.id;
    setWorkout((current) =>
      updateWorkoutExerciseInState(current, currentExercise.id, (exercise) => ({
        ...exercise,
        sets: sortedSets(
          exercise.sets.map((set) =>
            set.id === editingSetId
              ? {
                  ...set,
                  weight: payload.weight,
                  reps: payload.reps,
                  setType: payload.setType ?? set.setType,
                  notes: payload.notes,
                }
              : set,
          ),
        ),
      })),
    );
    setEditingSet(null);

    try {
      await WorkoutService.updateSet(workout.id, currentExercise.id, editingSetId, payload);
      toast.success("Set updated");
      await fetchActiveWorkout(currentExercise.id);
    } catch (error) {
      setWorkout(previousWorkout);
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDeleteSet(set: WorkoutSet) {
    if (!workout || !currentExercise) return;

    const previousWorkout = workout;
    setWorkout((current) =>
      updateWorkoutExerciseInState(current, currentExercise.id, (exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((exerciseSet) => exerciseSet.id !== set.id),
      })),
    );

    try {
      await WorkoutService.deleteSet(workout.id, currentExercise.id, set.id);
      toast.success("Set deleted");
      await fetchActiveWorkout(currentExercise.id);
    } catch (error) {
      setWorkout(previousWorkout);
      toast.error(getErrorMessage(error));
    }
  }

  async function handleStatusUpdate(status: WorkoutExerciseStatus) {
    if (!workout || !currentExercise) return;

    const previousWorkout = workout;
    const previousIndex = currentIndex;
    const nextIndex = currentIndex < exercises.length - 1 ? currentIndex + 1 : currentIndex;
    const nextExerciseId = exercises[nextIndex]?.id ?? currentExercise.id;

    setIsUpdatingStatus(true);
    setWorkout((current) =>
      updateWorkoutExerciseInState(current, currentExercise.id, (exercise) => ({
        ...exercise,
        status,
      })),
    );
    setMode("LOGGING");
    setTimerSeconds(0);
    setCurrentIndex(nextIndex);

    try {
      await WorkoutService.updateWorkoutExercise(workout.id, currentExercise.id, { status });
      toast.success(status === "SKIPPED" ? "Exercise skipped" : "Exercise updated");
      await fetchActiveWorkout(nextExerciseId);
    } catch (error) {
      setWorkout(previousWorkout);
      setCurrentIndex(previousIndex);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleCompleteWorkout() {
    if (!workout) return;

    setIsFinishing(true);

    try {
      await WorkoutService.completeWorkout(workout.id);
      toast.success("Workout completed");
      router.push("/workout");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsFinishing(false);
    }
  }

  async function handleCancelWorkout() {
    if (!workout) return;

    setIsFinishing(true);

    try {
      await WorkoutService.cancelWorkout(workout.id);
      toast.success("Workout cancelled");
      router.push("/routines");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsFinishing(false);
      setIsCancelDialogOpen(false);
    }
  }

  async function handleStartRoutine(routineId: number) {
    setStartingRoutineId(routineId);

    try {
      await WorkoutService.startRoutine(routineId);
      toast.success("Workout started");
      await fetchActiveWorkout();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setStartingRoutineId(null);
    }
  }

  async function openExerciseHistory(exercise: WorkoutExercise) {
    setHistoryExercise(exercise);
    setLastExerciseSession(null);
    setIsHistoryLoading(true);

    try {
      const response = await WorkoutService.getExerciseLastSession(exercise.exercise.id);
      setLastExerciseSession(parseExerciseLastSession(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
        <Skeleton className="h-24 w-full rounded-2xl bg-white/10" />
        <Skeleton className="h-72 w-full rounded-2xl bg-white/10" />
      </div>
    );
  }

  if (!workout) {
    return <NoActiveWorkout routines={routines} isLoadingRoutines={isLoadingRoutines} startingRoutineId={startingRoutineId} onStartRoutine={handleStartRoutine} />;
  }

  return (
    <>
      <AlertDialog.Root open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <div className="min-h-[calc(100dvh-2.5rem)] bg-[#0e0e0f] md:-m-8 md:flex md:min-h-dvh lg:-m-10">
          <WorkoutDesktopSidebar
            workout={workout}
            exercises={exercises}
            currentIndex={currentIndex}
            isFinishing={isFinishing}
            onSelectExercise={selectExercise}
            onComplete={handleCompleteWorkout}
            onCancel={() => setIsCancelDialogOpen(true)}
          />

          <div className="flex min-h-[calc(100dvh-2.5rem)] flex-1 flex-col md:min-h-dvh">
            <WorkoutMobileTopBar workout={workout} isFinishing={isFinishing} onComplete={handleCompleteWorkout} onCancel={() => setIsCancelDialogOpen(true)} />

            <div className="md:hidden">
              <ExerciseDotsNav exercises={exercises} currentIndex={currentIndex} onSelectExercise={selectExercise} />
            </div>

            <main className="flex flex-1 flex-col px-1 py-5 md:overflow-y-auto md:px-12 md:py-8">
              {currentExercise ? (
                <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col md:mx-0 md:max-w-none">
                  <ExerciseHeader exercise={currentExercise} onOpenHistory={() => openExerciseHistory(currentExercise)} />

                  <div className="flex flex-1 flex-col justify-center py-6 md:justify-start md:pt-24">
                    {mode === "RESTING" ? (
                      <RestingPanel timerSeconds={timerSeconds} lastSetSummary={lastSetSummary} onSkipRest={stopRest} />
                    ) : (
                      <LoggingPanel
                        setForm={setForm}
                        setSetForm={setSetForm}
                        currentSets={currentSets}
                        isSavingSet={isSavingSet}
                        flashingSetId={flashingSetId}
                        onSubmit={handleAddSet}
                        onEditSet={(set) => {
                          setEditingSet(set);
                          setEditSetForm(getFormFromSet(set));
                        }}
                        onDeleteSet={handleDeleteSet}
                      />
                    )}
                  </div>

                  {mode === "LOGGING" ? <BottomActionBar isUpdatingStatus={isUpdatingStatus} onComplete={() => handleStatusUpdate("COMPLETED")} onSkip={() => handleStatusUpdate("SKIPPED")} /> : null}
                </div>
              ) : null}
            </main>
          </div>
        </div>

        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#111112] p-5 text-[#f0f0ee] shadow-xl outline-none">
            <AlertDialog.Title className="font-[family-name:var(--font-display)] text-2xl tracking-wider">Cancel Workout?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-white/45">All logged sets will be lost.</AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="ghost" disabled={isFinishing} className="rounded-xl text-white/55 hover:bg-white/5 hover:text-white/85">
                  Keep Going
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button type="button" disabled={isFinishing} onClick={handleCancelWorkout} className="rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25">
                  Yes, Cancel
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <EditSetDialog editingSet={editingSet} editSetForm={editSetForm} setEditSetForm={setEditSetForm} onClose={() => setEditingSet(null)} onSubmit={handleUpdateSet} />
      <ExerciseHistoryDialog
        exercise={historyExercise}
        session={lastExerciseSession}
        isLoading={isHistoryLoading}
        onClose={() => {
          setHistoryExercise(null);
          setLastExerciseSession(null);
        }}
      />
    </>
  );
}

function WorkoutMobileTopBar({ workout, isFinishing, onComplete, onCancel }: { workout: Workout; isFinishing: boolean; onComplete: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-1 py-3 md:hidden">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-white">{workout.name || "Workout"}</h1>
        {workout.routine?.name ? <p className="truncate text-xs text-white/35">{workout.routine.name}</p> : null}
      </div>
      <WorkoutMenu onComplete={onComplete} onCancel={onCancel} disabled={isFinishing} />
    </div>
  );
}

function WorkoutDesktopSidebar({
  workout,
  exercises,
  currentIndex,
  isFinishing,
  onSelectExercise,
  onComplete,
  onCancel,
}: {
  workout: Workout;
  exercises: WorkoutExercise[];
  currentIndex: number;
  isFinishing: boolean;
  onSelectExercise: (index: number) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-white/6 bg-[#111112] md:flex md:min-h-dvh md:flex-col">
      <div className="flex pt-12 pb-4 pl-6 pr-3 items-center justify-between border-b border-white/6">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-white">{workout.name || "Workout"}</h1>
          {workout.routine?.name ? <p className="truncate text-xs text-white/35">{workout.routine.name}</p> : null}
        </div>
        <WorkoutMenu onComplete={onComplete} onCancel={onCancel} disabled={isFinishing} />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {exercises.map((exercise, index) => {
          const isActive = index === currentIndex;
          const isDone = exercise.status === "COMPLETED" || exercise.status === "SKIPPED";

          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onSelectExercise(index)}
              className={cn(
                "w-full rounded-xl border-l-2 border-transparent p-3 text-left transition-colors",
                isActive ? "border-[#c8f135] bg-[#c8f135]/8 text-[#c8f135]" : isDone ? "text-white/30 hover:bg-white/5" : "text-white/40 hover:bg-white/5 hover:text-white/70",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-[family-name:var(--font-display)] text-lg leading-none">{isDone ? "✓" : exercise.order}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold">{exercise.exercise.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("px-2 py-0 text-[10px]", getStatusClass(exercise.status))}>{exercise.status}</Badge>
                    <span className="text-[11px] text-white/30">{exercise.sets.length} sets</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ExerciseDotsNav({ exercises, currentIndex, onSelectExercise }: { exercises: WorkoutExercise[]; currentIndex: number; onSelectExercise: (index: number) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-white/5 px-1 py-3">
      {exercises.map((exercise, index) => {
        const isActive = index === currentIndex;
        const isDone = exercise.status === "COMPLETED" || exercise.status === "SKIPPED";

        return (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelectExercise(index)}
            className={cn(
              "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
              isActive ? "border border-[#c8f135]/30 bg-[#c8f135]/15 text-[#c8f135]" : isDone ? "border border-[#c8f135]/20 bg-[#c8f135]/8 text-[#c8f135]/50" : "bg-white/5 text-white/30",
            )}
          >
            {isDone ? "✓" : exercise.order}
          </button>
        );
      })}
    </div>
  );
}

function ExerciseHeader({ exercise, onOpenHistory }: { exercise: WorkoutExercise; onOpenHistory: () => void }) {
  return (
    <div className="space-y-3 lg:mt-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-white">{exercise.exercise.name}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenHistory}
          className="size-10 shrink-0 rounded-full text-white/35 hover:bg-white/5 hover:text-[#c8f135]"
          aria-label={`View ${exercise.exercise.name} history`}
        >
          <History className="size-5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge className={cn("px-2 py-1 text-[11px]", getStatusClass(exercise.status))}>{exercise.status}</Badge>
        <Badge className="border-0 bg-white/5 px-2 py-1 text-[11px] text-white/50">Sets: {formatOptional(exercise.targetSets)}</Badge>
        <Badge className="border-0 bg-white/5 px-2 py-1 text-[11px] text-white/50">Reps: {formatOptional(exercise.targetReps)}</Badge>
        {exercise.notes ? <Badge className="border-0 bg-white/5 px-2 py-1 text-[11px] text-white/35">Note</Badge> : null}
      </div>
    </div>
  );
}

function LoggingPanel({
  setForm,
  setSetForm,
  currentSets,
  isSavingSet,
  flashingSetId,
  onSubmit,
  onEditSet,
  onDeleteSet,
}: {
  setForm: SetForm;
  setSetForm: React.Dispatch<React.SetStateAction<SetForm>>;
  currentSets: WorkoutSet[];
  isSavingSet: boolean;
  flashingSetId: number | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditSet: (set: WorkoutSet) => void;
  onDeleteSet: (set: WorkoutSet) => void;
}) {
  function patchForm(patch: Partial<SetForm>) {
    setSetForm((current) => ({ ...current, ...patch }));
  }

  return (
    <form className="mx-auto w-full max-w-lg space-y-5 md:mx-0 md:max-w-none" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          min={0}
          step="0.5"
          inputMode="decimal"
          placeholder="kg"
          value={setForm.weight}
          onChange={(event) => patchForm({ weight: event.target.value })}
          className="h-14 rounded-xl border-white/7 bg-[#1a1a1b] text-center text-2xl font-bold !text-[#f0f0ee] placeholder:!text-white/10 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
          style={getInputStyle(setForm.weight)}
        />
        <Input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="reps"
          value={setForm.reps}
          onChange={(event) => patchForm({ reps: event.target.value })}
          className="h-14 rounded-xl border-white/7 bg-[#1a1a1b] text-center text-2xl font-bold !text-[#f0f0ee] placeholder:!text-white/10 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
          style={getInputStyle(setForm.reps)}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {setTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => patchForm({ setType: type.value })}
            className={cn(
              "h-10 rounded-full border text-xs font-semibold transition-colors",
              setForm.setType === type.value ? "border-[#c8f135]/30 bg-[#c8f135]/10 text-[#c8f135]" : "border-white/7 bg-white/4 text-white/35 hover:bg-white/5",
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Notes are intentionally hidden for now; keep SetForm.notes for API payload compatibility. */}
      {/* <Input
        placeholder="Notes"
        value={setForm.notes}
        onChange={(event) => patchForm({ notes: event.target.value })}
        className="h-11 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
        style={inputStyle}
      /> */}

      <Button
        type="submit"
        disabled={isSavingSet}
        className="h-14 w-full rounded-xl bg-[#c8f135] font-[family-name:var(--font-display)] text-lg tracking-widest text-[#0e0e0f] shadow-[0_0_20px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
      >
        <Plus className="size-5" />
        {isSavingSet ? "SAVING..." : "SAVE SET"}
      </Button>

      <Separator className="bg-white/5" />

      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">Logged · {currentSets.length} sets</p>
        {currentSets.length === 0 ? (
          <p className="rounded-xl border border-white/6 bg-white/[0.02] p-3 text-sm text-white/35">No sets yet.</p>
        ) : (
          currentSets.map((set) => (
            <div
              key={set.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-2",
                set.id === flashingSetId ? "set-complete-flash" : "stagger-item",
              )}
              style={{ "--stagger-index": 0 } as React.CSSProperties}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-white/55">{set.setNumber}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#f0f0ee]">
                  {formatOptional(set.weight)}kg × {formatOptional(set.reps)} reps
                </p>
                <p className="text-[11px] text-white/35">{getSetTypeLabel(set.setType)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => onEditSet(set)} className="size-8 rounded-full text-white/35 hover:bg-white/5 hover:text-white/80">
                <Pencil className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onDeleteSet(set)} className="size-8 rounded-full text-white/35 hover:bg-white/5 hover:text-red-300">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </form>
  );
}

function RestingPanel({ timerSeconds, lastSetSummary, onSkipRest }: { timerSeconds: number; lastSetSummary: LastSetSummary; onSkipRest: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">Rest</p>
        <p className="font-[family-name:var(--font-display)] text-7xl leading-none text-[#c8f135]">{formatTimer(timerSeconds)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-white/35">Last set</p>
        <p className="text-xl font-semibold text-[#f0f0ee]">{lastSetSummary ? `${lastSetSummary.weight}kg × ${lastSetSummary.reps} reps` : "Saved"}</p>
      </div>

      <div className="w-full space-y-3">
        <Button
          type="button"
          onClick={onSkipRest}
          className="h-14 w-full rounded-xl bg-[#c8f135] font-[family-name:var(--font-display)] text-lg tracking-widest text-[#0e0e0f] shadow-[0_0_20px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
        >
          SKIP REST
        </Button>
      </div>
    </div>
  );
}

function BottomActionBar({ isUpdatingStatus, onComplete, onSkip }: { isUpdatingStatus: boolean; onComplete: () => void; onSkip: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-1 mt-auto flex gap-2 border-t border-white/5 bg-[#0e0e0f]/95 px-1 py-3 backdrop-blur md:static md:bg-transparent md:px-0">
      <Button type="button" disabled={isUpdatingStatus} onClick={onComplete} className="h-12 flex-[2] rounded-xl border border-[#c8f135]/20 bg-[#c8f135]/8 font-semibold text-[#c8f135] hover:bg-[#c8f135]/12">
        <Check className="size-4" />
        Mark Complete
      </Button>
      <Button type="button" disabled={isUpdatingStatus} onClick={onSkip} className="h-12 flex-1 rounded-xl border border-white/7 bg-white/4 text-white/35 hover:bg-white/5 hover:text-white/60">
        Skip
      </Button>
    </div>
  );
}

function EditSetDialog({
  editingSet,
  editSetForm,
  setEditSetForm,
  onClose,
  onSubmit,
}: {
  editingSet: WorkoutSet | null;
  editSetForm: SetForm;
  setEditSetForm: React.Dispatch<React.SetStateAction<SetForm>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={!!editingSet} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#111112] text-[#f0f0ee] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wider">EDIT SET</DialogTitle>
          <DialogDescription className="text-white/40">Update a previously logged set.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              step="0.5"
              value={editSetForm.weight}
              onChange={(event) => setEditSetForm((current) => ({ ...current, weight: event.target.value }))}
              className="h-12 rounded-xl border-white/7 bg-[#1a1a1b] text-center text-xl font-bold !text-[#f0f0ee] placeholder:!text-white/10 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
              style={getInputStyle(editSetForm.weight)}
            />
            <Input
              type="number"
              min={1}
              value={editSetForm.reps}
              onChange={(event) => setEditSetForm((current) => ({ ...current, reps: event.target.value }))}
              className="h-12 rounded-xl border-white/7 bg-[#1a1a1b] text-center text-xl font-bold !text-[#f0f0ee] placeholder:!text-white/10 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
              style={getInputStyle(editSetForm.reps)}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {setTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setEditSetForm((current) => ({ ...current, setType: type.value }))}
                className={cn(
                  "h-10 rounded-full border text-xs font-semibold transition-colors",
                  editSetForm.setType === type.value ? "border-[#c8f135]/30 bg-[#c8f135]/10 text-[#c8f135]" : "border-white/7 bg-white/4 text-white/35 hover:bg-white/5",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
          {/* Notes are intentionally hidden for now; keep SetForm.notes for API payload compatibility. */}
          {/* <Input
            placeholder="Notes"
            value={editSetForm.notes}
            onChange={(event) => setEditSetForm((current) => ({ ...current, notes: event.target.value }))}
            className="h-11 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
            style={inputStyle}
          /> */}
          <div className="-mx-4 -mb-4 mt-6 flex items-center justify-end gap-3 border-t border-white/7 bg-[#181819] px-4 py-4">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-white/50 hover:bg-white/5 hover:text-white/80">
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-xl bg-[#c8f135] px-6 font-[family-name:var(--font-display)] text-white tracking-widest text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]">
              SAVE
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseHistoryDialog({ exercise, session, isLoading, onClose }: { exercise: WorkoutExercise | null; session: ExerciseLastSession | null; isLoading: boolean; onClose: () => void }) {
  const sets = useMemo(() => sortedSets(session?.sets ?? []), [session]);

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#111112] text-[#f0f0ee] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wider">LAST SESSION</DialogTitle>
          <DialogDescription className="text-white/40">{exercise ? exercise.exercise.name : "Exercise history"}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        ) : !session ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
            <p className="text-sm font-medium text-[#f0f0ee]">No previous sets found</p>
            <p className="mt-1 text-xs leading-5 text-white/35">Complete a workout with this exercise and it will show here next time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/7 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">Completed</p>
              <p className="mt-1 text-sm font-semibold text-[#f0f0ee]">{formatSessionDate(session.completedAt ?? session.date)}</p>
              <p className="mt-1 truncate text-xs text-white/35">{session.workoutName || session.routine?.name || "Workout session"}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">Sets · {sets.length}</p>
              {sets.map((set) => (
                <div key={set.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-white/55">{set.setNumber}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f0f0ee]">
                      {formatOptional(set.weight)}kg × {formatOptional(set.reps)} reps
                    </p>
                    {set.notes ? <p className="truncate text-xs text-white/35">{set.notes}</p> : null}
                  </div>
                  <Badge className={cn("border-0 px-2 py-1 text-[10px]", set.setType === "NORMAL" ? "bg-[#c8f135]/10 text-[#c8f135]" : "bg-white/7 text-white/45")}>{getSetTypeLabel(set.setType)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="-mx-4 -mb-4 mt-3 flex justify-end border-t border-white/7 bg-[#181819] px-4 py-4">
          <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-xl px-5 text-white/50 hover:bg-white/5 hover:text-white/80">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
