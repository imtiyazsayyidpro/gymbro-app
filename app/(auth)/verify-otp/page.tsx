"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { VoltButton } from "@/components/ui/volt-button";
import { AuthService } from "@/src/services/AuthService";
import { StorageService } from "@/src/services/StorageService";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "OTP verification failed";
  }

  return "OTP verification failed";
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

export default function VerifyOtpPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (StorageService.getAccessToken()) {
      router.replace("/");
      return;
    }

    if (!StorageService.getPendingUserId()) {
      router.replace("/login");
    }
  }, [router]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (code.length === 6 && !isSubmitting) {
      formRef.current?.requestSubmit();
    }
  }, [code, isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const userId = StorageService.getPendingUserId();

    if (!userId) {
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AuthService.verifyOtp({ userId, code });
      const token = response.data?.data?.token;

      if (!token) {
        throw new Error("Token missing from OTP response");
      }

      StorageService.setAccessToken(token);
      StorageService.removePendingUserId();
      toast.success("Logged in successfully");
      router.replace("/");
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <div className="w-full max-w-md flex flex-col justify-center lg:items-center">
          {/* Drag handle — mobile only */}
          <div className="w-8 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />

          {/* Heading */}
          <h2 className="text-3xl text-volt tracking-widest leading-none mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            CHECK YOUR EMAIL
          </h2>
          <p className="text-sm text-white/35 mb-6">
            We sent a 6-digit code to <span className="text-volt">your email</span>.
          </p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 w-fit">
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={setCode} disabled={isSubmitting} containerClassName="w-full justify-center gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPGroup key={i}>
                  <InputOTPSlot
                    index={i}
                    className="size-[46px] rounded-xl border border-white/6 bg-surface text-text-primary text-[1rem] font-semibold data-[active=true]:border-volt/40 data-[active=true]:bg-volt/3 data-[active=true]:ring-0 sm:size-[50px]"
                  />
                </InputOTPGroup>
              ))}
            </InputOTP>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <VoltButton type="submit" loading={isSubmitting} disabled={code.length < 6}>
              {isSubmitting ? "VERIFYING..." : "VERIFY"}
            </VoltButton>

            <p className="text-xs text-white/30 text-center mt-2 cursor-pointer hover:text-white/50 transition-colors" onClick={() => router.back()}>
              ← Back to login
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
