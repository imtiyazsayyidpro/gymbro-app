import * as React from "react"
import { cn } from "@/lib/utils"

interface VoltButtonProps extends React.ComponentProps<"button"> {
  loading?: boolean
}

function spawnRipple(event: React.PointerEvent<HTMLButtonElement>) {
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  const span = document.createElement("span")
  span.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:rgba(0,0,0,0.12);animation:gymbro-ripple 550ms ease-out forwards;`
  el.appendChild(span)
  setTimeout(() => span.remove(), 600)
}

export function VoltButton({
  className,
  children,
  loading,
  disabled,
  onPointerDown,
  ...props
}: VoltButtonProps) {
  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!loading && !disabled) spawnRipple(e)
    onPointerDown?.(e)
  }

  return (
    <button
      data-slot="button"
      disabled={loading || disabled}
      onPointerDown={handlePointerDown}
      className={cn(
        "relative inline-flex h-[50px] w-full overflow-clip items-center justify-center rounded-xl bg-volt font-heading text-lg tracking-widest text-black shadow-volt transition-opacity disabled:opacity-60 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full animate-[gymbro-shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
      )}
      {children}
    </button>
  )
}
