import * as React from "react"
import { cn } from "@/lib/utils"

interface VoltButtonProps extends React.ComponentProps<"button"> {
  loading?: boolean
}

export function VoltButton({
  className,
  children,
  loading,
  disabled,
  ...props
}: VoltButtonProps) {
  return (
    <button
      data-slot="button"
      disabled={loading || disabled}
      className={cn(
        "inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-volt font-heading text-lg tracking-widest text-black shadow-volt transition-opacity disabled:opacity-50 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
