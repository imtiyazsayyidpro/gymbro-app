"use client";

import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCard } from "@/src/components/gymbro/AddCard";
import { ConfirmationModal } from "@/src/components/gymbro/ConfirmationModal";
import { ExerciseCard } from "@/src/components/gymbro/ExerciseCard";
import { ExerciseFormDialog, ExerciseFormState } from "@/src/components/gymbro/ExerciseFormDialog";
import { SearchInput } from "@/src/components/gymbro/SearchInput";
import { ExercisePayload, ExerciseService } from "@/src/services/ExerciseService";

type Exercise = {
  id: number;
  name: string;
  description?: string | null;
  videoUrl?: string | null;
  primaryMuscleGroup?: string | null;
  muscleGroups?: string[] | null;
  equipment?: string | null;
  exerciseType: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const emptyForm: ExerciseFormState = {
  name: "",
  description: "",
  videoUrl: "",
  primaryMuscleGroup: "",
  muscleGroups: "",
  equipment: "",
  exerciseType: "RESISTANCE",
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseExercises(response: unknown): Exercise[] {
  const data = (response as { data?: { data?: { exercises?: Exercise[] } } }).data?.data;

  return data?.exercises ?? [];
}

function parsePagination(response: unknown): Pagination {
  const pagination = (response as { data?: { data?: { pagination?: Partial<Pagination> } } }).data?.data?.pagination;

  return {
    total: pagination?.total ?? 0,
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 10,
    totalPages: pagination?.totalPages ?? 1,
  };
}

function getFormFromExercise(exercise: Exercise): ExerciseFormState {
  return {
    name: exercise.name,
    description: exercise.description ?? "",
    videoUrl: exercise.videoUrl ?? "",
    primaryMuscleGroup: exercise.primaryMuscleGroup ?? "",
    muscleGroups: Array.isArray(exercise.muscleGroups) ? exercise.muscleGroups.join(", ") : "",
    equipment: exercise.equipment ?? "",
    exerciseType: exercise.exerciseType ?? "RESISTANCE",
  };
}

function buildPayload(form: ExerciseFormState): ExercisePayload {
  const muscleGroups = form.muscleGroups
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    videoUrl: form.videoUrl.trim() || null,
    primaryMuscleGroup: form.primaryMuscleGroup || null,
    muscleGroups: muscleGroups.length ? muscleGroups : null,
    equipment: form.equipment || null,
    exerciseType: form.exerciseType || "RESISTANCE",
  };
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [archivingExercise, setArchivingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseFormState>(emptyForm);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchExercises = useCallback(
    async (targetPage = 1) => {
      if (targetPage === 1) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      try {
        const response = await ExerciseService.getAllExercises({
          page: targetPage,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
        });
        const nextExercises = parseExercises(response);
        setExercises((current) => (targetPage === 1 ? nextExercises : [...current, ...nextExercises]));
        setPagination(parsePagination(response));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [debouncedSearch, pagination.limit],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchExercises(page);
    });
  }, [fetchExercises, page]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || isLoading || isFetchingMore || pagination.page >= pagination.totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setPage((currentPage) => currentPage + 1);
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [isFetchingMore, isLoading, pagination.page, pagination.totalPages]);

  function openCreateDialog() {
    setEditingExercise(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  }

  function openEditDialog(exercise: Exercise) {
    setEditingExercise(exercise);
    setForm(getFormFromExercise(exercise));
    setIsDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = buildPayload(form);

      if (editingExercise) {
        await ExerciseService.updateExercise(editingExercise.id, payload);
        toast.success("Exercise updated");
      } else {
        await ExerciseService.createExercise(payload);
        toast.success("Exercise created");
      }

      setIsDialogOpen(false);
      setPage(1);
      await fetchExercises(1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function openArchiveDialog(exercise: Exercise) {
    setArchivingExercise(exercise);
  }

  async function handleArchive() {
    if (!archivingExercise) return;
    setIsArchiving(true);
    try {
      await ExerciseService.deleteExercise(archivingExercise.id);
      toast.success("Exercise archived");
      setArchivingExercise(null);
      setPage(1);
      await fetchExercises(1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">Exercises</h1>
        <p className="text-sm text-white/40">Build your library before creating routines</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search exercises..." />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="rounded-2xl border-white/6 bg-[#1a1a1b]">
              <CardContent className="space-y-5 p-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-white/10" />
                  <Skeleton className="h-5 w-3/4 bg-white/10" />
                </div>
                <Skeleton className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-14 bg-white/10" />
                  <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : exercises.length === 0 && debouncedSearch ? (
        <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
          <CardHeader>
            <CardTitle className="text-white">No exercises found</CardTitle>
            <CardDescription>Try a different search term.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setSearch("")} variant="ghost" className="h-11 w-full rounded-xl text-white/55 hover:bg-white/5 hover:text-white/80">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : exercises.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 pb-20 lg:grid-cols-3 lg:gap-4">
          <div className="stagger-item" style={{ "--stagger-index": 0 } as React.CSSProperties}>
            <AddCard title="New Exercise" description="Grow your library" onClick={openCreateDialog} />
          </div>
        </div>
      ) : (
        <div className="space-y-5 pb-20">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            <div className="stagger-item" style={{ "--stagger-index": 0 } as React.CSSProperties}>
              <AddCard title="New Exercise" description="Grow your library" onClick={openCreateDialog} />
            </div>
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="stagger-item" style={{ "--stagger-index": index + 1 } as React.CSSProperties}>
                <ExerciseCard
                  name={exercise.name}
                  primaryMuscleGroup={exercise.primaryMuscleGroup}
                  equipment={exercise.equipment}
                  exerciseType={exercise.exerciseType}
                  onEdit={() => openEditDialog(exercise)}
                  onArchive={() => openArchiveDialog(exercise)}
                />
              </div>
            ))}
          </div>

          {isFetchingMore ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="rounded-2xl border-white/6 bg-[#1a1a1b]">
                  <CardContent className="space-y-5 p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-white/10" />
                      <Skeleton className="h-5 w-3/4 bg-white/10" />
                    </div>
                    <Skeleton className="h-px w-full bg-white/10" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-14 bg-white/10" />
                      <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <div ref={loadMoreRef} className="h-1" />

          {pagination.total > 0 && pagination.page >= pagination.totalPages ? <p className="text-center text-xs text-white/30">All exercises loaded</p> : null}
        </div>
      )}

      <ExerciseFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} mode={editingExercise ? "edit" : "add"} form={form} setForm={setForm} isSaving={isSaving} onSubmit={handleSubmit} />

      <ConfirmationModal
        open={Boolean(archivingExercise)}
        onOpenChange={(open) => {
          if (!open) setArchivingExercise(null);
        }}
        title="ARCHIVE EXERCISE"
        description={archivingExercise ? `Archive ${archivingExercise.name}? You can keep previous workout data, but this exercise will be hidden from active lists.` : ""}
        confirmLabel="ARCHIVE"
        isLoading={isArchiving}
        onConfirm={handleArchive}
      />
    </div>
  );
}
