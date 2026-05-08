"use client";

import React, { CSSProperties, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AddCard } from "@/src/components/gymbro/AddCard";
import { ConfirmationModal } from "@/src/components/gymbro/ConfirmationModal";
import { RoutineCard } from "@/src/components/gymbro/RoutineCard";
import { RoutineService } from "@/src/services/RoutineService";

type Routine = {
  id: number;
  name: string;
  description?: string | null;
  _count?: {
    exercises?: number;
  };
};

const fieldClassName = "h-11 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus:ring-0 focus-visible:ring-0";

const labelClassName = "text-[11px] font-semibold tracking-widest text-white/40 uppercase";

const typedTextStyle: CSSProperties = {
  color: "#f0f0ee",
  WebkitTextFillColor: "#f0f0ee",
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseRoutines(response: unknown): Routine[] {
  return (response as { data?: { data?: { routines?: Routine[] } } }).data?.data?.routines ?? [];
}

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [archivingRoutine, setArchivingRoutine] = useState<Routine | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function fetchRoutines() {
    setIsLoading(true);

    try {
      const response = await RoutineService.getAllRoutines();
      setRoutines(parseRoutines(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchRoutines();
    });
  }, []);

  async function handleCreateRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await RoutineService.createRoutine({
        name: name.trim(),
        description: description.trim() || null,
      });
      const routineId = response.data?.data?.id;

      toast.success("Routine created");
      setIsDialogOpen(false);
      setName("");
      setDescription("");

      if (routineId) {
        router.push(`/routines/${routineId}`);
      } else {
        await fetchRoutines();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!archivingRoutine) return;
    setIsArchiving(true);

    try {
      await RoutineService.deleteRoutine(archivingRoutine.id);
      toast.success("Routine archived");
      setArchivingRoutine(null);
      await fetchRoutines();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">Routines</h1>
        <p className="text-sm text-white/40">Create reusable templates for routine-based workouts</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="rounded-2xl border-white/6 bg-[#1a1a1b]">
              <CardContent className="space-y-5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-5 w-24 bg-white/10" />
                  <Skeleton className="h-5 w-8 rounded-full bg-white/10" />
                </div>
                <Skeleton className="h-10 w-full bg-white/10" />
                <Skeleton className="h-px w-full bg-white/10" />
                <Skeleton className="h-8 w-full bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : routines.length === 0 ? (
        <div className="grid gap-3 pb-20 lg:grid-cols-3 lg:gap-4">
          <div className="stagger-item" style={{ "--stagger-index": 0 } as React.CSSProperties}>
            <AddCard title="New Routine" description="Plan a workout" onClick={() => setIsDialogOpen(true)} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 pb-20 lg:grid-cols-3 lg:gap-4">
          <div className="stagger-item" style={{ "--stagger-index": 0 } as React.CSSProperties}>
            <AddCard title="New Routine" description="Plan a workout" onClick={() => setIsDialogOpen(true)} />
          </div>
          {routines.map((routine, index) => (
            <div key={routine.id} className="stagger-item" style={{ "--stagger-index": index + 1 } as React.CSSProperties}>
              <RoutineCard
                name={routine.name}
                description={routine.description}
                exerciseCount={routine._count?.exercises ?? 0}
                onOpen={() => router.push(`/routines/${routine.id}`)}
                onArchive={() => setArchivingRoutine(routine)}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#111112] text-[#f0f0ee] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wider">NEW ROUTINE</DialogTitle>
            <DialogDescription className="text-white/40">Create the template first, then add exercises</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateRoutine}>
            <div className="space-y-2">
              <Label htmlFor="name" className={labelClassName}>
                Name
              </Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClassName} style={typedTextStyle} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={labelClassName}>
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
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
                disabled={isSaving}
                className="h-11 rounded-xl bg-[#c8f135] px-6 font-[family-name:var(--font-display)] text-base tracking-widest text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
              >
                {isSaving ? "CREATING..." : "SAVE"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={Boolean(archivingRoutine)}
        onOpenChange={(open) => {
          if (!open) setArchivingRoutine(null);
        }}
        title="ARCHIVE ROUTINE"
        description={archivingRoutine ? `Archive ${archivingRoutine.name}? This routine will be hidden from active lists.` : ""}
        confirmLabel="ARCHIVE"
        isLoading={isArchiving}
        onConfirm={handleArchive}
      />
    </div>
  );
}
