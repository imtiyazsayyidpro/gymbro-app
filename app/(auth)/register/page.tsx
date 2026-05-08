"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { VoltButton } from "@/components/ui/volt-button";
import { IconInput } from "@/components/ui/icon-input";
import { AuthService } from "@/src/services/AuthService";
import { StorageService } from "@/src/services/StorageService";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Registration failed";
  }

  return "Registration failed";
}

function HeroPanel() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-base md:w-1/2">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(200,241,53,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
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
      const response = await AuthService.register({ name, email, mobile, password });
      const userId = response.data?.data?.userId;

      if (!userId) {
        throw new Error("User ID missing from registration response");
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

  return (
    <main className="min-h-dvh flex flex-col md:flex-row bg-base">
      <HeroPanel />

      <div
        className="
          bg-[#111112] border-t border-white/6 rounded-t-[24px] px-6 pt-4 pb-10
          md:w-1/2 md:rounded-none md:border-t-0 md:border-l md:border-white/5
          md:flex md:flex-col md:items-center md:justify-center md:px-12 md:py-12
        "
      >
        <div className="w-full max-w-md">
          <div className="w-8 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />

          <p className="hidden md:block text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-5">Create your account</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <IconInput id="name" type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required leftIcon={<User />} />

            <IconInput id="email" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required leftIcon={<Mail />} />

            <IconInput id="mobile" type="tel" placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required leftIcon={<Phone />} />

            <IconInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              leftIcon={<Lock />}
              rightElement={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-white/30 transition-colors hover:text-white/60" tabIndex={-1}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <VoltButton type="submit" loading={isSubmitting} className="mt-1">
              {isSubmitting ? "SENDING..." : "CREATE ACCOUNT"}
            </VoltButton>

            <p className="pt-4 text-center text-xs text-white/30">
              Already in the gym?{" "}
              <Link className="font-semibold text-volt hover:text-volt/80" href="/login">
                Jump back in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
