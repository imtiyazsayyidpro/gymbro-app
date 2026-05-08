"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StorageService } from "@/src/services/StorageService";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>();

  useEffect(() => {
    function syncToken() {
      setToken(StorageService.getAccessToken());
    }

    syncToken();
    window.addEventListener("storage", syncToken);

    return () => window.removeEventListener("storage", syncToken);
  }, []);

  useEffect(() => {
    if (token === null) {
      router.replace("/login");
    }
  }, [router, token]);

  if (token === undefined || token === null) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0e0e0f] px-6">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8f135]/10 blur-3xl" />
        <Image src="/assets/cards/home-start-workout.png" alt="" width={360} height={360} className="pointer-events-none absolute -right-24 bottom-0 size-80 object-contain opacity-[0.08] sm:size-96" priority />
        <Image src="/assets/cards/progress-card.png" alt="" width={280} height={280} className="pointer-events-none absolute -left-24 top-10 size-72 object-contain opacity-[0.06]" priority />

        <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[#c8f135]/14 bg-[#1a1a1b]/90 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8f135]/45 to-transparent" />
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#c8f135]/20 bg-[#c8f135]/10">
            <Image src="/assets/logo.png" alt="Gymbro logo" width={48} height={48} className="size-12 object-contain" priority />
          </div>
          <p className="mt-5 font-[family-name:var(--font-display)] text-2xl tracking-widest text-[#c8f135]">GYMBRO</p>
          <p className="mt-2 text-sm text-white/40">Preparing your training space</p>
          <div className="mx-auto mt-5 flex w-fit gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-[#c8f135]" />
            <span className="size-2 animate-pulse rounded-full bg-[#c8f135]/70 [animation-delay:160ms]" />
            <span className="size-2 animate-pulse rounded-full bg-[#c8f135]/40 [animation-delay:320ms]" />
          </div>
        </div>
      </div>
    );
  }

  return children;
}
