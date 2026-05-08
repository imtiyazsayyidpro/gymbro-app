import { Api } from "./Api";

export type WorkoutExerciseUpdatePayload = {
  order?: number;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
};

export type WorkoutSetPayload = {
  setNumber?: number;
  weight?: number | null;
  reps?: number | null;
  setType?: "NORMAL" | "WARMUP" | "DROP" | "FAILURE";
  notes?: string | null;
};

export const WorkoutService = {
  startRoutine(routineId: number) {
    return Api.post(`/v1/workouts/start-routine/${routineId}`);
  },

  getActive() {
    return Api.get("/v1/workouts/active");
  },

  getActiveWorkout() {
    return Api.get("/v1/workouts/active");
  },

  getAll(params?: Record<string, unknown>) {
    return Api.get("/v1/workouts", { params });
  },

  getWorkoutHistory(params?: Record<string, unknown>) {
    return Api.get("/v1/workouts", { params });
  },

  getExerciseLastSession(exerciseId: number) {
    return Api.get(`/v1/workouts/exercises/${exerciseId}/last-session`);
  },

  getById(id: number) {
    return Api.get(`/v1/workouts/${id}`);
  },

  getWorkoutById(id: number) {
    return Api.get(`/v1/workouts/${id}`);
  },

  updateExercise(workoutId: number, workoutExerciseId: number, data: WorkoutExerciseUpdatePayload) {
    return Api.patch(`/v1/workouts/${workoutId}/exercises/${workoutExerciseId}`, data);
  },

  updateWorkoutExercise(workoutId: number, workoutExerciseId: number, data: WorkoutExerciseUpdatePayload) {
    return Api.patch(`/v1/workouts/${workoutId}/exercises/${workoutExerciseId}`, data);
  },

  addSet(workoutId: number, workoutExerciseId: number, data: WorkoutSetPayload) {
    return Api.post(`/v1/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, data);
  },

  updateSet(workoutId: number, workoutExerciseId: number, setId: number, data: WorkoutSetPayload) {
    return Api.patch(`/v1/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`, data);
  },

  deleteSet(workoutId: number, workoutExerciseId: number, setId: number) {
    return Api.delete(`/v1/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`);
  },

  complete(id: number) {
    return Api.patch(`/v1/workouts/${id}/complete`);
  },

  completeWorkout(id: number) {
    return Api.patch(`/v1/workouts/${id}/complete`);
  },

  cancel(id: number) {
    return Api.patch(`/v1/workouts/${id}/cancel`);
  },

  cancelWorkout(id: number) {
    return Api.patch(`/v1/workouts/${id}/cancel`);
  },
};
