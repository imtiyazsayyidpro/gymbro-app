"use client";

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AddCard } from "@/src/components/gymbro/AddCard";
import { Combobox } from "@/src/components/gymbro/Combobox";
import { ConfirmationModal } from "@/src/components/gymbro/ConfirmationModal";
import { RoutineExerciseCard } from "@/src/components/gymbro/RoutineExerciseCard";
import { ExerciseService } from "@/src/services/ExerciseService";
import { RoutineExercisePayload, RoutineService } from "@/src/services/RoutineService";
import { WorkoutService } from "@/src/services/WorkoutService";

type Exercise = {
  id: number;
  name: string;
  primaryMuscleGroup?: string | null;
  equipment?: string | null;
};

type RoutineExercise = {
  id: number;
  exerciseId: number;
  order: number;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  exercise: Exercise;
};

type Routine = {
  id: number;
  name: string;
  description?: string | null;
  exercises: RoutineExercise[];
};

type RoutineExerciseForm = {
  exerciseId: string;
  order: string;
  targetSets: string;
  targetReps: string;
  restSeconds: string;
  notes: string;
};

const emptyForm: RoutineExerciseForm = {
  exerciseId: "",
  order: "",
  targetSets: "",
  targetReps: "",
  restSeconds: "",
  notes: "",
};

const fieldClassName = "h-11 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:text-white/25! caret-[#c8f135] focus:border-[#c8f135]/40 focus:ring-0 focus-visible:ring-0";

const labelClassName = "text-[11px] font-semibold tracking-widest text-white/40 uppercase";

const typedTextStyle: CSSProperties = {
  color: "#f0f0ee",
  WebkitTextFillColor: "#f0f0ee",
};

function sortRoutineExercises(exercises: RoutineExercise[]) {
  return [...exercises].sort((a, b) => a.order - b.order);
}

function normalizeRoutineExerciseOrder(exercises: RoutineExercise[]) {
  return exercises.map((exercise, index) => ({ ...exercise, order: index + 1 }));
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseRoutine(response: unknown): Routine | null {
  return (response as { data?: { data?: Routine } }).data?.data ?? null;
}

function parseExercises(response: unknown): Exercise[] {
  return (response as { data?: { data?: { exercises?: Exercise[] } } }).data?.data?.exercises ?? [];
}

function getFormFromRoutineExercise(routineExercise: RoutineExercise): RoutineExerciseForm {
  return {
    exerciseId: String(routineExercise.exerciseId),
    order: String(routineExercise.order),
    targetSets: routineExercise.targetSets == null ? "" : String(routineExercise.targetSets),
    targetReps: routineExercise.targetReps ?? "",
    restSeconds: routineExercise.restSeconds == null ? "" : String(routineExercise.restSeconds),
    notes: routineExercise.notes ?? "",
  };
}

function buildPayload(form: RoutineExerciseForm, fallbackOrder: number): RoutineExercisePayload {
  return {
    exerciseId: Number(form.exerciseId),
    order: form.order ? Number(form.order) : fallbackOrder,
    targetSets: form.targetSets ? Number(form.targetSets) : null,
    targetReps: form.targetReps.trim() || null,
    restSeconds: form.restSeconds ? Number(form.restSeconds) : null,
    notes: form.notes.trim() || null,
  };
}

type SortableRoutineExerciseItemProps = {
  routineExercise: RoutineExercise;
  isDragging: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

function SortableRoutineExerciseItem({ routineExercise, isDragging, onEdit, onRemove }: SortableRoutineExerciseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: routineExercise.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} data-routine-exercise-id={routineExercise.id}>
      <RoutineExerciseCard
        order={routineExercise.order}
        exerciseName={routineExercise.exercise.name}
        targetSets={routineExercise.targetSets}
        targetReps={routineExercise.targetReps}
        restSeconds={routineExercise.restSeconds}
        notes={routineExercise.notes}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners } as ButtonHTMLAttributes<HTMLButtonElement>}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    </div>
  );
}

export default function RoutineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routineId = Number(params.id);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoutineExercise, setEditingRoutineExercise] = useState<RoutineExercise | null>(null);
  const [removingRoutineExercise, setRemovingRoutineExercise] = useState<RoutineExercise | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [draggingRoutineExerciseId, setDraggingRoutineExerciseId] = useState<number | null>(null);
  const [form, setForm] = useState<RoutineExerciseForm>(emptyForm);
  const dragStartExercisesRef = useRef<RoutineExercise[]>([]);
  const latestRoutineExercisesRef = useRef<RoutineExercise[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const exerciseComboboxOptions = useMemo(
    () =>
      exerciseOptions.map((exercise) => ({
        value: String(exercise.id),
        label: exercise.name,
      })),
    [exerciseOptions],
  );
  const nextOrder = routineExercises.length + 1;

  useEffect(() => {
    latestRoutineExercisesRef.current = routineExercises;
  }, [routineExercises]);

  const fetchRoutine = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await RoutineService.getRoutineById(routineId);
      const nextRoutine = parseRoutine(response);
      const nextRoutineExercises = sortRoutineExercises(nextRoutine?.exercises ?? []);
      setRoutine(nextRoutine);
      setRoutineExercises(nextRoutineExercises);
      latestRoutineExercisesRef.current = nextRoutineExercises;
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [routineId]);

  async function fetchExerciseOptions() {
    try {
      const response = await ExerciseService.getAllExercises({ limit: 100 });
      setExerciseOptions(parseExercises(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchRoutine();
      fetchExerciseOptions();
    });
  }, [fetchRoutine]);

  async function persistRoutineExerciseOrder(nextExercises: RoutineExercise[], previousExercises: RoutineExercise[]) {
    const previousOrderById = new Map(previousExercises.map((exercise) => [exercise.id, exercise.order]));
    const changedExercises = nextExercises.filter((exercise) => previousOrderById.get(exercise.id) !== exercise.order);

    if (changedExercises.length === 0) return;

    try {
      await Promise.all(changedExercises.map((exercise) => RoutineService.updateRoutineExercise(routineId, exercise.id, { order: exercise.order })));
      toast.success("Routine order updated");
      setRoutine((current) => (current ? { ...current, exercises: nextExercises } : current));
    } catch (error) {
      setRoutineExercises(previousExercises);
      toast.error(getErrorMessage(error));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    dragStartExercisesRef.current = latestRoutineExercisesRef.current;
    setDraggingRoutineExerciseId(Number(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = Number(event.active.id);
    const overId = Number(event.over?.id);
    setDraggingRoutineExerciseId(null);

    if (!overId || activeId === overId) {
      dragStartExercisesRef.current = [];
      return;
    }

    const oldIndex = latestRoutineExercisesRef.current.findIndex((exercise) => exercise.id === activeId);
    const newIndex = latestRoutineExercisesRef.current.findIndex((exercise) => exercise.id === overId);

    if (oldIndex === -1 || newIndex === -1) {
      dragStartExercisesRef.current = [];
      return;
    }

    const nextExercises = normalizeRoutineExerciseOrder(arrayMove(latestRoutineExercisesRef.current, oldIndex, newIndex));
    latestRoutineExercisesRef.current = nextExercises;
    setRoutineExercises(nextExercises);
    await persistRoutineExerciseOrder(nextExercises, dragStartExercisesRef.current);
    dragStartExercisesRef.current = [];
  }

  function handleDragCancel() {
    setDraggingRoutineExerciseId(null);
    setRoutineExercises(dragStartExercisesRef.current);
    latestRoutineExercisesRef.current = dragStartExercisesRef.current;
    dragStartExercisesRef.current = [];
  }

  function openAddDialog() {
    setEditingRoutineExercise(null);
    setForm({ ...emptyForm, order: String(nextOrder) });
    setIsDialogOpen(true);
  }

  function openEditDialog(routineExercise: RoutineExercise) {
    setEditingRoutineExercise(routineExercise);
    setForm(getFormFromRoutineExercise(routineExercise));
    setIsDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = buildPayload(form, nextOrder);

      if (editingRoutineExercise) {
        await RoutineService.updateRoutineExercise(routineId, editingRoutineExercise.id, payload);
        toast.success("Routine exercise updated");
      } else {
        await RoutineService.addExerciseToRoutine(routineId, payload);
        toast.success("Exercise added to routine");
      }

      setIsDialogOpen(false);
      await fetchRoutine();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (!removingRoutineExercise) return;
    setIsRemoving(true);

    try {
      await RoutineService.removeExerciseFromRoutine(routineId, removingRoutineExercise.id);
      toast.success("Exercise removed");
      setRemovingRoutineExercise(null);
      await fetchRoutine();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleStartWorkout() {
    setIsStarting(true);

    try {
      await WorkoutService.startRoutine(routineId);
      toast.success("Workout started");
      router.push("/workout/active");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/routines" className="inline-flex text-sm font-medium text-white/40 transition-colors hover:text-white/70">
        ← Routines
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3 bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-28 w-full rounded-2xl bg-white/10" />
        </div>
      ) : !routine ? (
        <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
          <CardHeader>
            <CardTitle className="text-[#f0f0ee]">Routine not found</CardTitle>
            <CardDescription>This routine could not be loaded.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">{routine.name}</h1>
              {routine.description ? <p className="text-sm leading-6 text-white/40">{routine.description}</p> : null}
            </div>
            <div className="sm:shrink-0">
              <Button
                type="button"
                onClick={handleStartWorkout}
                disabled={isStarting || routineExercises.length === 0}
                className="h-10 rounded-xl bg-[#c8f135] px-4 font-[family-name:var(--font-display)] tracking-widest text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
              >
                {isStarting ? "STARTING..." : "START WORKOUT"}
              </Button>
            </div>
          </div>

          {routineExercises.length === 0 ? (
            <AddCard title="Add Exercise" description="Build this routine" onClick={openAddDialog} />
          ) : (
            <div className="space-y-3 pb-20">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <SortableContext items={routineExercises.map((routineExercise) => routineExercise.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {routineExercises.map((routineExercise) => (
                      <SortableRoutineExerciseItem
                        key={routineExercise.id}
                        routineExercise={routineExercise}
                        isDragging={draggingRoutineExerciseId === routineExercise.id}
                        onEdit={() => openEditDialog(routineExercise)}
                        onRemove={() => setRemovingRoutineExercise(routineExercise)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <AddCard title="Add Exercise" description="Build this routine" onClick={openAddDialog} />
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#111112] text-[#f0f0ee] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wider">{editingRoutineExercise ? "EDIT EXERCISE" : "ADD EXERCISE"}</DialogTitle>
            <DialogDescription className="text-white/40">Set the template targets for this routine</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className={labelClassName}>Exercise</Label>
              <Combobox
                value={form.exerciseId}
                options={exerciseComboboxOptions}
                placeholder="Choose exercise"
                searchPlaceholder="Search exercise..."
                emptyText="No exercise found."
                disabled={!!editingRoutineExercise}
                onChange={(value) => setForm((current) => ({ ...current, exerciseId: value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="targetSets" className={labelClassName}>
                  Target sets
                </Label>
                <Input
                  id="targetSets"
                  type="number"
                  min={1}
                  value={form.targetSets}
                  onChange={(event) => setForm((current) => ({ ...current, targetSets: event.target.value }))}
                  className={fieldClassName}
                  style={typedTextStyle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetReps" className={labelClassName}>
                  Target reps
                </Label>
                <Input id="targetReps" value={form.targetReps} onChange={(event) => setForm((current) => ({ ...current, targetReps: event.target.value }))} className={fieldClassName} style={typedTextStyle} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restSeconds" className={labelClassName}>
                Rest seconds
              </Label>
              <Input
                id="restSeconds"
                type="number"
                min={1}
                value={form.restSeconds}
                onChange={(event) => setForm((current) => ({ ...current, restSeconds: event.target.value }))}
                className={fieldClassName}
                style={typedTextStyle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className={labelClassName}>
                Notes
              </Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-24 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus:ring-0 focus-visible:ring-0"
                style={typedTextStyle}
              />
            </div>

            <div className="-mx-4 -mb-4 mt-6 flex items-center justify-end gap-3 border-t border-white/7 bg-[#181819] px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="rounded-xl text-white/50 hover:bg-white/5 hover:text-white/80">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.exerciseId}
                className="h-11 rounded-xl bg-[#c8f135] px-6 font-[family-name:var(--font-display)] text-base tracking-widest text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
              >
                {isSaving ? "SAVING..." : "SAVE"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={Boolean(removingRoutineExercise)}
        onOpenChange={(open) => {
          if (!open) setRemovingRoutineExercise(null);
        }}
        title="REMOVE EXERCISE"
        description={removingRoutineExercise ? `Remove ${removingRoutineExercise.exercise.name} from this routine?` : ""}
        confirmLabel="REMOVE"
        isLoading={isRemoving}
        onConfirm={handleRemove}
      />
    </div>
  );
}
