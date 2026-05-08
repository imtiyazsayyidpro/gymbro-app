"use client";

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
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  return children;
}
