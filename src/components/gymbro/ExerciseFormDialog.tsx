"use client";

import { CSSProperties, Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/src/components/gymbro/Combobox";

const MUSCLE_GROUPS = ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS", "LEGS", "QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "CORE", "ABS", "FULL_BODY", "CARDIO", "OTHER"];

const EQUIPMENT = ["BODYWEIGHT", "BARBELL", "DUMBBELL", "KETTLEBELL", "MACHINE", "CABLE", "RESISTANCE_BAND", "EZ_BAR", "TRAP_BAR", "BENCH", "PULL_UP_BAR", "CARDIO_MACHINE", "OTHER"];

const EXERCISE_TYPES = ["RESISTANCE", "CARDIO", "MOBILITY", "STRETCHING", "BALANCE", "OTHER"];

export type ExerciseFormState = {
  name: string;
  description: string;
  videoUrl: string;
  primaryMuscleGroup: string;
  muscleGroups: string;
  equipment: string;
  exerciseType: string;
};

type ExerciseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  trigger?: ReactNode;
};

function formatEnum(value?: string | null) {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

const fieldClassName = "h-11 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus:ring-0 focus-visible:ring-0";

const labelClassName = "text-[11px] font-semibold tracking-widest text-white/40 uppercase";

const typedTextStyle: CSSProperties = {
  color: "#f0f0ee",
  WebkitTextFillColor: "#f0f0ee",
};

const muscleGroupOptions = MUSCLE_GROUPS.map((muscleGroup) => ({
  value: muscleGroup,
  label: formatEnum(muscleGroup),
}));

const equipmentOptions = EQUIPMENT.map((equipment) => ({
  value: equipment,
  label: formatEnum(equipment),
}));

const exerciseTypeOptions = EXERCISE_TYPES.map((exerciseType) => ({
  value: exerciseType,
  label: formatEnum(exerciseType),
}));

export function ExerciseFormDialog({ open, onOpenChange, mode, form, setForm, isSaving, onSubmit, trigger }: ExerciseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#111112] text-[#f0f0ee] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wider">{mode === "edit" ? "EDIT EXERCISE" : "NEW EXERCISE"}</DialogTitle>
          <DialogDescription className="text-white/40">Details are used when building routines</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name" className={labelClassName}>
              Name
            </Label>
            <Input id="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClassName} style={typedTextStyle} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={labelClassName}>
              Description
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-24 rounded-xl border-white/7 bg-[#1a1a1b] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus:ring-0 focus-visible:ring-0"
              style={typedTextStyle}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="min-w-0 space-y-2">
              <Label className={labelClassName}>Primary Muscle</Label>
              <Combobox
                value={form.primaryMuscleGroup}
                options={muscleGroupOptions}
                placeholder="Optional"
                searchPlaceholder="Search muscle..."
                emptyText="No muscle found."
                allowNone
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    primaryMuscleGroup: value,
                  }))
                }
              />
            </div>

            <div className="min-w-0 space-y-2">
              <Label className={labelClassName}>Equipment</Label>
              <Combobox
                value={form.equipment}
                options={equipmentOptions}
                placeholder="Optional"
                searchPlaceholder="Search equipment..."
                emptyText="No equipment found."
                allowNone
                onChange={(value) => setForm((current) => ({ ...current, equipment: value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClassName}>Exercise Type</Label>
            <Combobox
              value={form.exerciseType}
              options={exerciseTypeOptions}
              placeholder="Select exercise type"
              searchPlaceholder="Search type..."
              emptyText="No type found."
              onChange={(value) => setForm((current) => ({ ...current, exerciseType: value }))}
            />
          </div>

          <div className="-mx-4 -mb-4 mt-6 flex items-center justify-end gap-3 border-t border-white/7 bg-[#181819] px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl text-white/50 hover:bg-white/5 hover:text-white/80">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-xl bg-[#c8f135] px-6 font-[family-name:var(--font-display)] text-base tracking-widest text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
            >
              {isSaving ? "SAVING..." : "SAVE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
