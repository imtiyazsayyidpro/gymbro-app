"use client";

import Image from "next/image";
import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ExerciseCardProps = {
  name: string;
  primaryMuscleGroup?: string | null;
  equipment?: string | null;
  exerciseType?: string | null;
  onEdit: () => void;
  onArchive: () => void;
};

function formatEnum(value?: string | null) {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function ExerciseCard({
  name,
  primaryMuscleGroup,
  equipment,
  exerciseType,
  onEdit,
  onArchive,
}: ExerciseCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30 hover:bg-[#c8f135]/[0.03]"
    >
      <Image src="/assets/cards/exercises.png" alt="" width={190} height={190} className="pointer-events-none absolute -right-16 top-1/2 size-52 -translate-y-1/2 object-contain opacity-[0.08] transition-opacity group-hover:opacity-[0.14]" />
      <div className="pointer-events-none absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <CardContent className="relative z-10 flex min-h-36 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[10px] font-semibold tracking-widest text-[#c8f135] uppercase">
              {formatEnum(primaryMuscleGroup)}
            </p>
            <h2 className="line-clamp-2 text-[14px] leading-tight font-semibold text-[#f0f0ee]">
              {name}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onArchive();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
            className="-mt-2 -mr-2 size-8 shrink-0 rounded-full text-white/35 hover:bg-white/5 hover:text-white/70"
            aria-label={`Archive ${name}`}
          >
            <Archive className="size-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <Separator className="bg-white/5" />
          <div className="flex flex-col items-start gap-2">
            <Badge
              variant="outline"
              className="shrink-0 border-[#c8f135]/15 bg-[#c8f135]/8 px-2 py-0.5 text-[10px] font-medium text-[#c8f135]"
            >
              {formatEnum(exerciseType)}
            </Badge>
            <p className="max-w-[70%] truncate text-[11px] text-white/35">{formatEnum(equipment)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
