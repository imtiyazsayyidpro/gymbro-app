"use client";

import { MoreVertical } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

export function ExerciseCard({
  name,
  primaryMuscleGroup,
  equipment,
  exerciseType,
  onEdit,
  onArchive,
}: ExerciseCardProps) {
  return (
    <Card className="rounded-2xl border border-white/6 bg-[#1a1a1b] py-0 transition-colors hover:border-white/10">
      <CardContent className="flex min-h-36 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[10px] font-semibold tracking-widest text-[#c8f135] uppercase">
              {formatEnum(primaryMuscleGroup)}
            </p>
            <h2 className="line-clamp-2 text-[14px] leading-tight font-semibold text-[#f0f0ee]">
              {name}
            </h2>
          </div>

          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mt-2 -mr-2 size-8 shrink-0 rounded-full text-white/35 hover:bg-white/5 hover:text-white/70"
                aria-label={`Open menu for ${name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={onArchive}>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPrimitive.Root>
        </div>

        <div className="space-y-3">
          <Separator className="bg-white/5" />
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[11px] text-white/35">{formatEnum(equipment)}</p>
            <Badge
              variant="outline"
              className="shrink-0 border-white/10 bg-transparent px-2 py-0.5 text-[10px] font-medium text-white/30"
            >
              {formatEnum(exerciseType)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
