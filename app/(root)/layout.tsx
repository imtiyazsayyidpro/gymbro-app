"use client";

import React, { useState } from "react";
import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, History, Home, Library, LogOut } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/src/components/gymbro/ConfirmationModal";
import { StorageService } from "@/src/services/StorageService";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Progress", href: "/progress", icon: Activity },
  { label: "History", href: "/workout", icon: History },
  { label: "Exercises", href: "/exercises", icon: Library },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/workout") return pathname.startsWith("/workout");
  return pathname.startsWith(href);
}

function DesktopSidebar({ onLogoutClick }: { onLogoutClick: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-40 hidden h-screen min-h-dvh w-[224px] flex-col overflow-hidden border-r border-white/6 bg-[#111112] md:flex">
      <div className="space-y-5 p-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-[#c8f135]/15 bg-[#c8f135]/8">
            <Image src="/assets/logo.png" alt="Gymbro logo" width={32} height={32} className="size-8 object-contain" priority />
          </div>
          <span className="font-[family-name:var(--font-display)] text-xl tracking-widest text-[#c8f135]">GYMBRO</span>
        </Link>
        <Separator className="bg-white/6" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                "h-11 w-full justify-start gap-3 rounded-xl px-3 text-sm font-medium",
                isActive ? "bg-[#c8f135]/8 text-[#c8f135] hover:bg-[#c8f135]/10 hover:text-[#c8f135]" : "text-white/40 hover:bg-white/5 hover:text-white/70",
              )}
            >
              <Link href={item.href}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="space-y-3 rounded-2xl border border-white/6 bg-white/[0.02] p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#c8f135]/10 font-semibold text-[#c8f135]">GB</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#f0f0ee]">Gymbro</p>
              <p className="truncate text-xs text-white/35">Signed in</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onLogoutClick}
            className="h-10 w-full justify-start gap-3 rounded-xl px-3 text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/75"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MobileBottomNav({ onLogoutClick }: { onLogoutClick: () => void }) {
  const pathname = usePathname();
  const activeNavIndex = navItems.findIndex((item) => isNavItemActive(pathname, item.href));

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 md:hidden" style={{ viewTransitionName: "bottom-nav" } as React.CSSProperties}>
      <nav className="relative flex h-[62px] items-stretch overflow-hidden rounded-2xl border border-white/8 bg-[#111112]/96 shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">

        {/* Sliding volt pill */}
        {activeNavIndex >= 0 && (
          <div
            className="pointer-events-none absolute inset-y-1.5 rounded-xl bg-[#c8f135]/8 shadow-[0_0_16px_rgba(200,241,53,0.12)]"
            style={{
              width: `${100 / 5}%`,
              transform: `translateX(${activeNavIndex * 100}%)`,
              transition: "transform 380ms cubic-bezier(0.25, 1.4, 0.5, 1)",
            }}
          />
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200",
                isActive ? "text-[#c8f135]" : "text-white/25 hover:text-white/50",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-all duration-200",
                  isActive && "scale-110 drop-shadow-[0_0_8px_rgba(200,241,53,0.5)]",
                )}
              />
              <span className="text-[9px] font-semibold tracking-widest uppercase">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onLogoutClick}
          className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 text-white/20 transition-colors duration-200 hover:text-white/50"
        >
          <LogOut className="size-5" />
          <span className="text-[9px] font-semibold tracking-widest uppercase">Logout</span>
        </button>

      </nav>
    </div>
  );
}

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  function handleConfirmLogout() {
    StorageService.removeAccessToken();
    setIsLogoutOpen(false);
    router.replace("/login");
  }

  return (
    <AuthGuard>
      <div className="min-h-dvh bg-[#0e0e0f]">
        <DesktopSidebar onLogoutClick={() => setIsLogoutOpen(true)} />
        <main className="min-h-dvh overflow-x-hidden px-4 pt-5 pb-24 sm:px-6 md:ml-[224px] md:px-8 md:pb-0 lg:px-10">
          <ViewTransition enter="page-fade" exit="page-fade">
            <div className="mx-auto w-full">{children}</div>
          </ViewTransition>
        </main>
        <MobileBottomNav onLogoutClick={() => setIsLogoutOpen(true)} />
        <ConfirmationModal
          open={isLogoutOpen}
          onOpenChange={setIsLogoutOpen}
          title="LOGOUT"
          description="Are you sure you want to logout? You will need to sign in again to continue."
          confirmLabel="LOGOUT"
          onConfirm={handleConfirmLogout}
        />
      </div>
    </AuthGuard>
  );
}
