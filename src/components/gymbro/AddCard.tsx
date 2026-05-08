"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type AddCardProps = {
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  imageSrc?: string;
};

function getDefaultImageSrc(title: string) {
  return title.toLowerCase().includes("routine") ? "/assets/cards/routine.png" : "/assets/cards/exercises.png";
}

export function AddCard({ title, description, onClick, className, imageSrc }: AddCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-[#c8f135]/20 bg-[#1a1a1b] transition-all hover:border-[#c8f135]/40 hover:bg-[#c8f135]/[0.03]",
        className,
      )}
    >
      <Image
        src={imageSrc ?? getDefaultImageSrc(title)}
        alt=""
        width={220}
        height={220}
        className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.06] transition-all group-hover:scale-105 group-hover:opacity-[0.11]"
      />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,241,53,0.14)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.09)_0%,transparent_62%)]" />
      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-[#c8f135]/25 bg-[#c8f135]/10">
        <span className="text-[22px] leading-none font-light text-[#c8f135]">+</span>
      </div>
      <p className="relative z-10 text-[13px] font-semibold text-[#c8f135]">{title}</p>
      <p className="relative z-10 text-[11px] text-white/30">{description}</p>
    </div>
  );
}
