"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, Home, Library, ListChecks, LogOut } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/src/components/gymbro/ConfirmationModal";
import { StorageService } from "@/src/services/StorageService";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Routines", href: "/routines", icon: ListChecks },
  { label: "Workout", href: "/workout/active", icon: Dumbbell },
  { label: "Exercises", href: "/exercises", icon: Library },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/workout/active") return pathname.startsWith("/workout");
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/6 bg-[#111112]/95 backdrop-blur-md md:hidden">
      <div className="grid h-16 grid-cols-5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center justify-center text-[10px] font-medium transition-colors", isActive ? "text-[#c8f135]" : "text-white/30")}>
              <span className={cn("mb-1 h-0.5 w-6 rounded-full", isActive ? "bg-[#c8f135]" : "bg-transparent")} />
              <Icon className="size-5" />
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={onLogoutClick} className="flex min-w-0 flex-col items-center justify-center text-[10px] font-medium text-white/30 transition-colors hover:text-white/70">
          <span className="mb-1 h-0.5 w-6 rounded-full bg-transparent" />
          <LogOut className="size-5" />
          <span className="mt-1 truncate">Logout</span>
        </button>
      </div>
    </nav>
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
        <main className="min-h-dvh px-4 pt-5 pb-20 sm:px-6 md:ml-[224px] md:px-8 md:pb-0 lg:px-10">
          <div className="mx-auto w-full">{children}</div>
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
