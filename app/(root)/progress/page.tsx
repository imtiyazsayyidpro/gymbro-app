"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Dumbbell, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/src/components/gymbro/SearchInput";
import { ExerciseService } from "@/src/services/ExerciseService";
import { ProgressService } from "@/src/services/ProgressService";
import { RoutineService } from "@/src/services/RoutineService";

type TabValue = "exercises" | "routines" | "muscles";

type ExerciseOption = {
  id: number;
  name: string;
};

type RoutineOption = {
  id: number;
  name: string;
};

type Pagination = {
  page: number;
  totalPages: number;
};

type ExerciseChartPoint = {
  date: string;
  workoutSessionId: number;
  workoutName?: string | null;
  workingVolume: number;
  totalVolume: number;
  bestWeight?: number | null;
  totalReps: number;
  totalSets: number;
};

type RoutineChartPoint = {
  date: string;
  workoutSessionId: number;
  workoutName?: string | null;
  workingVolume: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
};

type BreakdownItem = {
  setType?: string;
  muscleGroup?: string;
  volume: number;
  setCount: number;
  percentage: number;
};

type ExerciseProgress = {
  chart: ExerciseChartPoint[];
  breakdown: BreakdownItem[];
};

type RoutineProgress = {
  chart: RoutineChartPoint[];
};

const chartColors = ["#c8f135", "#5eead4", "#f0f0ee", "#a78bfa", "#f59e0b"];

const tabs: Array<{ value: TabValue; label: string; icon: typeof Dumbbell }> = [
  { value: "exercises", label: "Exercises", icon: Dumbbell },
  { value: "routines", label: "Routines", icon: ListChecks },
  { value: "muscles", label: "Muscle", icon: Activity },
];

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Something went wrong";
  }

  return "Something went wrong";
}

function parseExercises(response: unknown): ExerciseOption[] {
  return (response as { data?: { data?: { exercises?: ExerciseOption[] } } }).data?.data?.exercises ?? [];
}

function parseRoutines(response: unknown): RoutineOption[] {
  return (response as { data?: { data?: { routines?: RoutineOption[] } } }).data?.data?.routines ?? [];
}

function parsePagination(response: unknown): Pagination {
  const pagination = (response as { data?: { data?: { pagination?: Partial<Pagination> } } }).data?.data?.pagination;

  return {
    page: pagination?.page ?? 1,
    totalPages: pagination?.totalPages ?? 1,
  };
}

function parseExerciseProgress(response: unknown) {
  return (response as { data?: { data?: { chart?: ExerciseChartPoint[] } } }).data?.data?.chart ?? [];
}

function parseRoutineProgress(response: unknown) {
  return (response as { data?: { data?: { chart?: RoutineChartPoint[] } } }).data?.data?.chart ?? [];
}

function parseBreakdown(response: unknown): BreakdownItem[] {
  return (response as { data?: { data?: { breakdown?: BreakdownItem[] } } }).data?.data?.breakdown ?? [];
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatEnum(value?: string) {
  if (!value) return "Other";

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "0";

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

async function fetchAllExercises() {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const allExercises: ExerciseOption[] = [];

  while (page <= totalPages && page <= 20) {
    const response = await ExerciseService.getAllExercises({ page, limit });
    allExercises.push(...parseExercises(response));
    totalPages = parsePagination(response).totalPages;
    page += 1;
  }

  return allExercises;
}

async function fetchAllRoutines() {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const allRoutines: RoutineOption[] = [];

  while (page <= totalPages && page <= 20) {
    const response = await RoutineService.getAllRoutines({ page, limit });
    allRoutines.push(...parseRoutines(response));
    totalPages = parsePagination(response).totalPages;
    page += 1;
  }

  return allRoutines;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit);
    results.push(...(await Promise.all(batch.map(mapper))));
  }

  return results;
}

function EmptyChartMessage({ message = "Complete a few workouts to see progress charts." }: { message?: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/35">{message}</div>;
}

function MiniLineChart({
  data,
  series,
  heightClassName = "h-56",
}: {
  data: Array<Record<string, number | string | null | undefined>>;
  series: Array<{ key: string; label: string; color: string }>;
  heightClassName?: string;
}) {
  if (!data.length) {
    return <EmptyChartMessage />;
  }

  const chartConfig = series.reduce<ChartConfig>((config, item) => {
    config[item.key] = {
      label: item.label,
      color: item.color,
    };
    return config;
  }, {});

  const chartData = data.map((item) => ({
    ...item,
    label: formatDate(item.date as string),
  }));

  return (
    <div className="space-y-3">
      <ChartContainer
        config={chartConfig}
        className={cn("w-full overflow-hidden rounded-2xl bg-[#111112] p-2 text-white/40 [&_.recharts-cartesian-axis-tick_text]:fill-white/30 [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-white/8", heightClassName)}
      >
        <LineChart data={chartData} margin={{ top: 12, right: 12, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent className="border-white/10 bg-[#111112] text-[#f0f0ee]" />} />
          {series.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} stroke={`var(--color-${line.key})`} strokeWidth={2.5} dot={false} animationDuration={1200} animationEasing="ease-out" />
          ))}
        </LineChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {series.map((line) => (
          <div key={line.key} className="flex items-center gap-2 text-xs text-white/35">
            <span className="size-2 rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, labelKey }: { data: BreakdownItem[]; labelKey: "setType" | "muscleGroup" }) {
  const activeData = data.filter((item) => item.volume > 0);
  const totalVolume = activeData.reduce((total, item) => total + item.volume, 0);

  if (!activeData.length || totalVolume === 0) {
    return <EmptyChartMessage />;
  }

  const chartData = activeData.map((item, index) => ({
    ...item,
    label: formatEnum(item[labelKey]),
    fill: chartColors[index % chartColors.length],
  }));

  const chartConfig = chartData.reduce<ChartConfig>((config, item) => {
    const key = String(item[labelKey]);
    config[key] = {
      label: item.label,
      color: item.fill,
    };
    return config;
  }, {});

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-52 text-white/40">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="border-white/10 bg-[#111112] text-[#f0f0ee]" />} />
          <Pie data={chartData} dataKey="volume" nameKey="label" innerRadius={54} outerRadius={82} stroke="#1a1a1b" strokeWidth={3} animationBegin={0} animationDuration={900} animationEasing="ease-out">
            <LabelList dataKey="percentage" className="fill-[#0e0e0f] text-xs font-semibold" stroke="none" formatter={(value) => `${Number(value ?? 0)}%`} />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="grid w-full gap-2">
        {chartData.map((item, index) => (
          <div key={`${item[labelKey]}-${index}`} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="truncate text-[#f0f0ee]">{item.label}</span>
            </div>
            <span className="text-white/40">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#f0f0ee]">{value ?? "Not set"}</p>
    </div>
  );
}

function ExerciseProgressCard({ exercise, progress }: { exercise: ExerciseOption; progress?: ExerciseProgress }) {
  const latestSession = progress?.chart.at(-1);

  return (
    <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-white">{exercise.name}</CardTitle>
            <CardDescription className="text-white/40">Volume, best weight, and reps over time</CardDescription>
          </div>
          <Badge className="shrink-0 rounded-full border-[#c8f135]/15 bg-[#c8f135]/10 text-[#c8f135] hover:bg-[#c8f135]/10">{progress?.chart.length ?? 0}</Badge>
        </div>
        {latestSession ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricPill label="Latest" value={formatDate(latestSession.date)} />
            <MetricPill label="Volume" value={formatNumber(latestSession.workingVolume)} />
            <MetricPill label="Best" value={formatNumber(latestSession.bestWeight)} />
            <MetricPill label="Reps" value={formatNumber(latestSession.totalReps)} />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <MiniLineChart
          data={progress?.chart ?? []}
          series={[
            { key: "workingVolume", label: "Working volume", color: chartColors[0] },
            { key: "bestWeight", label: "Best weight", color: chartColors[1] },
            { key: "totalReps", label: "Total reps", color: chartColors[3] },
          ]}
        />
        <div className="border-t border-white/7 pt-4">
          <p className="mb-3 text-[11px] font-semibold tracking-widest text-white/35 uppercase">Set Type</p>
          <DonutChart data={progress?.breakdown ?? []} labelKey="setType" />
        </div>
      </CardContent>
    </Card>
  );
}

function RoutineProgressCard({ routine, progress }: { routine: RoutineOption; progress?: RoutineProgress }) {
  const latestSession = progress?.chart.at(-1);

  return (
    <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-white">{routine.name}</CardTitle>
            <CardDescription className="text-white/40">Routine volume compared over completed sessions</CardDescription>
          </div>
          <Badge className="shrink-0 rounded-full border-[#c8f135]/15 bg-[#c8f135]/10 text-[#c8f135] hover:bg-[#c8f135]/10">{progress?.chart.length ?? 0}</Badge>
        </div>
        {latestSession ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <MetricPill label="Latest" value={formatDate(latestSession.date)} />
            <MetricPill label="Volume" value={formatNumber(latestSession.workingVolume)} />
            <MetricPill label="Sets" value={formatNumber(latestSession.totalSets)} />
            <MetricPill label="Reps" value={formatNumber(latestSession.totalReps)} />
            <MetricPill label="Exercises" value={formatNumber(latestSession.exerciseCount)} />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <MiniLineChart
          data={progress?.chart ?? []}
          series={[
            { key: "workingVolume", label: "Working volume", color: chartColors[0] },
            { key: "totalVolume", label: "Total volume", color: chartColors[1] },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="rounded-2xl border-white/6 bg-[#1a1a1b]">
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-5 w-36 bg-white/10" />
            <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-56 w-full rounded-2xl bg-white/10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("exercises");
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<Record<number, ExerciseProgress>>({});
  const [routineProgress, setRoutineProgress] = useState<Record<number, RoutineProgress>>({});
  const [muscleGroupBreakdown, setMuscleGroupBreakdown] = useState<BreakdownItem[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [routineSearch, setRoutineSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    if (!query) return exercises;

    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [exerciseSearch, exercises]);

  const filteredRoutines = useMemo(() => {
    const query = routineSearch.trim().toLowerCase();
    if (!query) return routines;

    return routines.filter((routine) => routine.name.toLowerCase().includes(query));
  }, [routineSearch, routines]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [exerciseOptions, routineOptions, muscleGroupResponse] = await Promise.all([fetchAllExercises(), fetchAllRoutines(), ProgressService.getMuscleGroupVolumeBreakdown()]);

      setExercises(exerciseOptions);
      setRoutines(routineOptions);
      setMuscleGroupBreakdown(parseBreakdown(muscleGroupResponse));

      const exerciseEntries = await mapWithConcurrency(
        exerciseOptions,
        3,
        async (exercise) => {
          const [progressResponse, breakdownResponse] = await Promise.all([ProgressService.getExerciseProgress(exercise.id), ProgressService.getExerciseSetTypeBreakdown(exercise.id)]);

          return [
            exercise.id,
            {
              chart: parseExerciseProgress(progressResponse),
              breakdown: parseBreakdown(breakdownResponse),
            },
          ] as const;
        },
      );

      const routineEntries = await mapWithConcurrency(
        routineOptions,
        3,
        async (routine) => {
          const response = await ProgressService.getRoutineVolumeProgress(routine.id);

          return [
            routine.id,
            {
              chart: parseRoutineProgress(response),
            },
          ] as const;
        },
      );

      setExerciseProgress(Object.fromEntries(exerciseEntries));
      setRoutineProgress(Object.fromEntries(routineEntries));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  return (
    <div className="space-y-5 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f0ee]">Progress</h1>
        <p className="text-sm text-white/40">Track your completed workout trends without digging through menus</p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/6 bg-[#111112] p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-colors",
                isActive ? "bg-[#c8f135] text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.18)]" : "text-white/40 hover:bg-white/5 hover:text-white/75",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate hidden lg:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingCards />
      ) : activeTab === "exercises" ? (
        <div key="exercises" className="stagger-item space-y-4" style={{ "--stagger-index": 0 } as React.CSSProperties}>
          <SearchInput value={exerciseSearch} onChange={setExerciseSearch} placeholder="Search exercises..." />
          {filteredExercises.length ? (
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {filteredExercises.map((exercise, index) => (
                <div key={exercise.id} className="stagger-item min-w-0" style={{ "--stagger-index": index + 1 } as React.CSSProperties}>
                  <ExerciseProgressCard exercise={exercise} progress={exerciseProgress[exercise.id]} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartMessage message="No exercises match your search." />
          )}
        </div>
      ) : activeTab === "routines" ? (
        <div key="routines" className="stagger-item space-y-4" style={{ "--stagger-index": 0 } as React.CSSProperties}>
          <SearchInput value={routineSearch} onChange={setRoutineSearch} placeholder="Search routines..." />
          {filteredRoutines.length ? (
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {filteredRoutines.map((routine, index) => (
                <div key={routine.id} className="stagger-item min-w-0" style={{ "--stagger-index": index + 1 } as React.CSSProperties}>
                  <RoutineProgressCard routine={routine} progress={routineProgress[routine.id]} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartMessage message="No routines match your search." />
          )}
        </div>
      ) : (
        <div key="muscles" className="stagger-item grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-4" style={{ "--stagger-index": 0 } as React.CSSProperties}>
          <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
            <CardHeader>
              <CardTitle className="text-white">Muscle group volume</CardTitle>
              <CardDescription className="text-white/40">Working volume by primary muscle group</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart data={muscleGroupBreakdown} labelKey="muscleGroup" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/6 bg-[#1a1a1b]">
            <CardHeader>
              <CardTitle className="text-white">Breakdown</CardTitle>
              <CardDescription className="text-white/40">Where your completed set volume is going</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {muscleGroupBreakdown.length === 0 ? (
                <p className="text-sm text-white/40">Complete a few workouts to see progress charts.</p>
              ) : (
                muscleGroupBreakdown.map((item, index) => (
                  <div key={item.muscleGroup ?? index} className="flex items-center justify-between gap-3 rounded-2xl border border-white/7 bg-white/[0.03] p-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#f0f0ee]">{formatEnum(item.muscleGroup)}</p>
                        <p className="text-xs text-white/35">{formatNumber(item.setCount)} sets</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-[#f0f0ee]">{formatNumber(item.volume)}</p>
                      <Badge className="rounded-full border-[#c8f135]/15 bg-[#c8f135]/10 text-[#c8f135] hover:bg-[#c8f135]/10">{item.percentage}%</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
