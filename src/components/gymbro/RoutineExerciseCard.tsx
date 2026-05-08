"use client";

import { GripVertical, MoreVertical } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ButtonHTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RoutineExerciseCardProps = {
  order: number;
  exerciseName: string;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  isDragging?: boolean;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  onEdit: () => void;
  onRemove: () => void;
};

function formatValue(value?: number | string | null, suffix = "") {
  if (value == null || value === "") return "Not set";
  return `${value}${suffix}`;
}

function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align="end"
        sideOffset={8}
        className={cn(
          "z-50 min-w-32 overflow-hidden rounded-xl border border-white/10 bg-[#151516] p-1 text-[#f0f0ee] shadow-xl outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-white/5 focus:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export function RoutineExerciseCard({
  order,
  exerciseName,
  targetSets,
  targetReps,
  restSeconds,
  notes,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onRemove,
}: RoutineExerciseCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-white/6 bg-[#1a1a1b] py-0 transition-all hover:border-white/10",
        isDragging && "scale-[1.01] border-[#c8f135]/35 bg-[#1f2119] shadow-[0_18px_44px_rgba(0,0,0,0.36),0_0_24px_rgba(200,241,53,0.08)]",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            <button
              type="button"
              {...dragHandleProps}
              className={cn(
                "-ml-1 mt-0.5 flex size-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/5 hover:text-[#c8f135] active:cursor-grabbing",
                dragHandleProps?.className,
              )}
              aria-label={`Drag ${exerciseName}`}
            >
              <GripVertical className="size-4" />
            </button>

            <div className="min-w-0 space-y-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="font-[family-name:var(--font-display)] text-lg leading-none text-[#c8f135]">
                  {order}
                </span>
                <h2 className="truncate text-[15px] font-semibold text-[#f0f0ee]">{exerciseName}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">
                  Sets: {formatValue(targetSets)}
                </Badge>
                <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">
                  Reps: {formatValue(targetReps)}
                </Badge>
                <Badge className="border-0 bg-white/5 text-[11px] font-medium text-white/50">
                  Rest: {formatValue(restSeconds, "s")}
                </Badge>
              </div>
              {notes ? <p className="text-sm leading-6 text-white/35">{notes}</p> : null}
            </div>
          </div>

          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mt-2 -mr-2 size-8 shrink-0 rounded-full text-white/35 hover:bg-white/5 hover:text-white/70"
                aria-label={`Open menu for ${exerciseName}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={onRemove}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPrimitive.Root>
        </div>
      </CardContent>
    </Card>
  );
}
