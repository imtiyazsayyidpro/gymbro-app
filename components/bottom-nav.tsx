"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, Library, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Routines", href: "/routines", icon: ListChecks },
  { label: "Workout", href: "/workout/active", icon: Dumbbell },
  { label: "Exercises", href: "/exercises", icon: Library },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors",
                isActive && "text-foreground",
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
