"use client";

import Image from "next/image";
import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type RoutineCardProps = {
  name: string;
  description?: string | null;
  exerciseCount?: number;
  onOpen: () => void;
  onArchive: () => void;
};

export function RoutineCard({ name, description, exerciseCount = 0, onOpen, onArchive }: RoutineCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30 hover:bg-[#c8f135]/[0.03]"
    >
      <Image src="/assets/cards/routine.png" alt="" width={190} height={190} className="pointer-events-none absolute -right-16 -bottom-16 size-52 object-contain opacity-[0.08] transition-opacity group-hover:opacity-[0.14]" />
      <div className="pointer-events-none absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.08] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <CardContent className="relative z-10 flex min-h-40 flex-col justify-between p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-[15px] leading-tight font-semibold text-[#f0f0ee]">{name}</h2>
            <Badge className="shrink-0 border-0 bg-[#c8f135]/10 px-2 py-0.5 text-[10px] font-semibold text-[#c8f135]">{exerciseCount}</Badge>
          </div>
          <p className="line-clamp-2 min-h-8 text-[12px] leading-5 text-white/35">{description || "No description"}</p>
        </div>

        <div className="space-y-3 mt-5">
          <Separator className="bg-white/5" />
          <div className="flex justify-start">
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
              className="size-9 rounded-full text-white/35 hover:bg-white/5 hover:text-white/70"
              aria-label={`Archive ${name}`}
            >
              <Archive className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
