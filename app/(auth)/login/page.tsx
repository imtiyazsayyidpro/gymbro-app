"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { VoltButton } from "@/components/ui/volt-button";
import { IconInput } from "@/components/ui/icon-input";
import { AuthService } from "@/src/services/AuthService";
import { StorageService } from "@/src/services/StorageService";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Login failed";
  }

  return "Login failed";
}

function HeroPanel() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-base md:w-1/2">
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(200,241,53,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />
      {/* Volt glow blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(200,241,53,0.18) 0%, transparent 65%)",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Brand */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-volt/20 bg-volt/8">
          <Image src="/assets/logo.png" alt="Gymbro logo" width={56} height={56} className="h-14 w-14 object-contain" priority />
        </div>
        <h1 className="text-6xl text-volt tracking-widest leading-none" style={{ fontFamily: "var(--font-display)" }}>
          GYMBRO
        </h1>
        <p className="text-xs text-white/30 mt-1.5">Track your lifts. Own your progress.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (StorageService.getAccessToken()) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await AuthService.login({ email, password });
      const userId = response.data?.data?.userId;

      if (!userId) {
        throw new Error("User ID missing from login response");
      }

      StorageService.setPendingUserId(userId);
      toast.success("OTP sent successfully");
      router.push("/verify-otp");
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <IconInput
        id="email"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        leftIcon={<Mail />}
      />

      <IconInput
        id="password"
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        leftIcon={<Lock />}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-white/30 hover:text-white/60 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <VoltButton type="submit" loading={isSubmitting} className="mt-1">
        {isSubmitting ? "SENDING..." : "CONTINUE"}
      </VoltButton>

      <p className="pt-4 text-center text-xs text-white/30">
        New to the crew?{" "}
        <Link className="font-semibold text-volt hover:text-volt/80" href="/register">
          Claim your spot
        </Link>
      </p>
    </form>
  );

  return (
    <main className="min-h-dvh flex flex-col md:flex-row bg-base">
      {/* Hero — top on mobile, left panel on desktop */}
      <HeroPanel />

      {/* Form — bottom drawer on mobile, right panel on desktop */}
      <div
        className="
          bg-[#111112] border-t border-white/6 rounded-t-[24px] px-6 pt-4 pb-10
          md:w-1/2 md:rounded-none md:border-t-0 md:border-l md:border-white/5
          md:flex md:flex-col md:items-center md:justify-center md:px-12 md:py-12
        "
      >
        <div className="w-full max-w-md">
          {/* Drag handle — mobile only */}
          <div className="w-8 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />

          {/* Desktop sign-in label */}
          <p className="hidden md:block text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-5">Sign in to continue</p>

          {formContent}
        </div>
      </div>
    </main>
  );
}
