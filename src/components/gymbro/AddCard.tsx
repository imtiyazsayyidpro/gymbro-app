"use client";

import { cn } from "@/lib/utils";

type AddCardProps = {
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
};

export function AddCard({ title, description, onClick, className }: AddCardProps) {
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
        "relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-[#c8f135]/20 bg-[#1a1a1b] transition-all hover:border-[#c8f135]/40 hover:bg-[#c8f135]/[0.03]",
        className,
      )}
    >
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,241,53,0.10)_0%,transparent_70%)]" />
      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-[#c8f135]/25 bg-[#c8f135]/10">
        <span className="text-[22px] leading-none font-light text-[#c8f135]">+</span>
      </div>
      <p className="relative z-10 text-[13px] font-semibold text-[#c8f135]">{title}</p>
      <p className="relative z-10 text-[11px] text-white/30">{description}</p>
    </div>
  );
}
