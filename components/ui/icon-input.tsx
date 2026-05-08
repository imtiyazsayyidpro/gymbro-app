import * as React from "react"
import { cn } from "@/lib/utils"

interface IconInputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export function IconInput({
  leftIcon,
  rightElement,
  className,
  ...props
}: IconInputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 [&_svg]:size-4">
          {leftIcon}
        </span>
      )}
      <input
        data-slot="input"
        className={cn(
          "h-[50px] w-full rounded-xl border border-white/6 bg-surface text-sm text-text-primary placeholder:text-white/30 transition-colors focus:bg-volt/3 focus:border-volt/40 focus:outline-none focus:ring-0",
          leftIcon ? "pl-10" : "pl-4",
          rightElement ? "pr-11" : "pr-4",
          className
        )}
        {...props}
      />
      {rightElement && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightElement}
        </span>
      )}
    </div>
  )
}
