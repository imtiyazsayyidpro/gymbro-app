"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, CalendarDays, Dumbbell, History, Library, ListChecks, Play } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExerciseService } from "@/src/services/ExerciseService";
import { RoutineService } from "@/src/services/RoutineService";
import { WorkoutService } from "@/src/services/WorkoutService";

type WorkoutStatus = "COMPLETED" | "IN_PROGRESS" | "CANCELLED";

type WorkoutSummary = {
  id: number;
  name?: string | null;
  date: string;
  status: WorkoutStatus;
  routine?: {
    name: string;
  } | null;
};

type DashboardStats = {
  routines: number;
  exercises: number;
  workouts: number;
  latestWorkout?: WorkoutSummary | null;
  activeWorkoutId?: number | null;
};

const navigationCards = [
  {
    title: "Start Workout",
    description: "Resume or begin today's session",
    href: "/workout/active",
    icon: Play,
    accent: "#c8f135",
    imageSrc: "/assets/cards/home-start-workout.png",
  },
  {
    title: "Workout History",
    description: "Review completed sessions",
    href: "/workout",
    icon: History,
    accent: "#c8f135",
    imageSrc: "/assets/cards/home-workout-history.png",
  },
  {
    title: "Exercises",
    description: "Manage your movement library",
    href: "/exercises",
    icon: Library,
    accent: "#c8f135",
    imageSrc: "/assets/cards/exercises.png",
  },
  {
    title: "Routines",
    description: "Build reusable templates",
    href: "/routines",
    icon: ListChecks,
    accent: "#c8f135",
    imageSrc: "/assets/cards/routine.png",
  },
  {
    title: "Progress",
    description: "Track volume and trends",
    href: "/progress",
    icon: Activity,
    accent: "#c8f135",
    imageSrc: "/assets/cards/progress-card.png",
  },
];

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseTotal(response: unknown) {
  return (response as { data?: { data?: { pagination?: { total?: number } } } }).data?.data?.pagination?.total ?? 0;
}

function parseWorkouts(response: unknown): WorkoutSummary[] {
  return (response as { data?: { data?: { workouts?: WorkoutSummary[] } } }).data?.data?.workouts ?? [];
}

function parseActiveWorkoutId(response: unknown) {
  return (response as { data?: { data?: { id?: number } } }).data?.data?.id ?? null;
}

function formatDate(value?: string) {
  if (!value) return "No sessions yet";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HomeNavCard({
  title,
  description,
  href,
  icon: Icon,
  accent,
  imageSrc,
  className,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof Dumbbell;
  accent: string;
  imageSrc: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative min-h-40 overflow-hidden rounded-2xl border border-white/7 bg-[#1a1a1b] p-4 transition-all hover:border-[#c8f135]/35 hover:bg-[#1d1d1e]",
        className,
      )}
    >
      <Image src={imageSrc} alt="" width={190} height={190} className="pointer-events-none absolute -right-16 top-1/2 size-52 -translate-y-1/2 object-contain opacity-[0.08] transition-opacity group-hover:opacity-[0.14]" />
      <div className="pointer-events-none absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full opacity-40 blur-2xl" style={{ backgroundColor: accent }} />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border bg-white/[0.03]" style={{ borderColor: `${accent}40`, color: accent }}>
            <Icon className="size-5" />
          </div>
          <ArrowRight className="size-4 text-white/20 transition-colors group-hover:text-[#c8f135]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-[15px] font-semibold text-[#f0f0ee]">{title}</h2>
          <p className="text-[12px] leading-5 text-white/35">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  imageSrc,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Dumbbell;
  imageSrc: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-[#c8f135]/12 bg-[#1a1a1b] py-0 transition-colors hover:border-[#c8f135]/30">
      <Image src={imageSrc} alt="" width={140} height={140} className="pointer-events-none absolute -right-10 top-1/2 size-36 -translate-y-1/2 object-contain opacity-[0.06] transition-opacity group-hover:opacity-[0.12]" />
      <div className="pointer-events-none absolute -right-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#c8f135] opacity-[0.12] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,rgba(200,241,53,0.08)_0%,transparent_62%)]" />
      <CardContent className="relative z-10 p-4">
        <div className="flex size-9 items-center justify-center rounded-xl border border-[#c8f135]/18 bg-[#c8f135]/8 text-[#c8f135]">
          <Icon className="size-4" />
        </div>
        <p className="mt-4 text-[10px] font-semibold tracking-widest text-white/35 uppercase">{label}</p>
        <p className="mt-2 truncate text-2xl font-semibold text-[#f0f0ee]">{value}</p>
        <p className="mt-1 truncate text-xs text-white/30">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    routines: 0,
    exercises: 0,
    workouts: 0,
    latestWorkout: null,
    activeWorkoutId: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const activeCard = useMemo(() => {
    if (!stats.activeWorkoutId) return null;

    return {
      label: "Active workout",
      href: "/workout/active",
    };
  }, [stats.activeWorkoutId]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);

    try {
      const [routinesResponse, exercisesResponse, workoutsResponse, activeResponse] = await Promise.allSettled([
        RoutineService.getAllRoutines({ page: 1, limit: 1 }),
        ExerciseService.getAllExercises({ page: 1, limit: 1 }),
        WorkoutService.getWorkoutHistory({ page: 1, limit: 5 }),
        WorkoutService.getActiveWorkout(),
      ]);

      const workouts = workoutsResponse.status === "fulfilled" ? parseWorkouts(workoutsResponse.value) : [];

      setStats({
        routines: routinesResponse.status === "fulfilled" ? parseTotal(routinesResponse.value) : 0,
        exercises: exercisesResponse.status === "fulfilled" ? parseTotal(exercisesResponse.value) : 0,
        workouts: workoutsResponse.status === "fulfilled" ? parseTotal(workoutsResponse.value) : 0,
        latestWorkout: workouts[0] ?? null,
        activeWorkoutId: activeResponse.status === "fulfilled" ? parseActiveWorkoutId(activeResponse.value) : null,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchStats();
    });
  }, [fetchStats]);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">Home</h1>
          <p className="text-sm text-white/40">Jump into the parts of Gymbro you actually use.</p>
        </div>
        {activeCard ? (
          <Badge asChild className="w-fit border-[#c8f135]/15 bg-[#c8f135]/10 px-3 py-1.5 text-[#c8f135] hover:bg-[#c8f135]/12">
            <Link href={activeCard.href}>{activeCard.label}</Link>
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        {navigationCards.map((card, index) => (
          <HomeNavCard key={card.href} {...card} className={index === 0 ? "lg:col-span-2" : undefined} />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-[#f0f0ee]">Key stats</h2>
          <Link href="/progress" className="text-xs font-medium text-white/35 transition-colors hover:text-[#c8f135]">
            View Progress
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard label="Routines" value={stats.routines} detail="Templates ready" icon={ListChecks} imageSrc="/assets/cards/routine.png" />
            <StatCard label="Exercises" value={stats.exercises} detail="Library movements" icon={Library} imageSrc="/assets/cards/exercises.png" />
            <StatCard label="Workouts" value={stats.workouts} detail="Sessions tracked" icon={History} imageSrc="/assets/cards/home-workout-history.png" />
            <StatCard label="Latest" value={formatDate(stats.latestWorkout?.date)} detail={stats.latestWorkout?.routine?.name ?? stats.latestWorkout?.name ?? "Workout history"} icon={CalendarDays} imageSrc="/assets/cards/progress-card.png" />
          </div>
        )}
      </div>
    </div>
  );
}
