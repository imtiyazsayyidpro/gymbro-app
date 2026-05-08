"use client";

import { Archive, ArrowRight } from "lucide-react";
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
    <Card className="rounded-2xl border border-white/6 bg-[#1a1a1b] py-0 transition-colors hover:border-white/10">
      <CardContent className="flex min-h-40 flex-col justify-between p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-[15px] leading-tight font-semibold text-[#f0f0ee]">{name}</h2>
            <Badge className="shrink-0 border-0 bg-[#c8f135]/10 px-2 py-0.5 text-[10px] font-semibold text-[#c8f135]">{exerciseCount}</Badge>
          </div>
          <p className="line-clamp-2 min-h-8 text-[12px] leading-5 text-white/35">{description || "No description"}</p>
        </div>

        <div className="space-y-3 mt-5">
          <Separator className="bg-white/5" />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={onArchive} className="size-9 rounded-full text-white/35 hover:bg-white/5 hover:text-white/70" aria-label={`Archive ${name}`}>
              <Archive className="size-4" />
            </Button>
            <Button type="button" variant="ghost" onClick={onOpen} className="h-9 justify-start w-fit rounded-xl text-white/45 hover:bg-transparent hover:text-[#c8f135]">
              Open
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
