import { Api } from "./Api";

export const ProgressService = {
  getExerciseProgress(exerciseId: number, params?: Record<string, unknown>) {
    return Api.get(`/v1/progress/exercises/${exerciseId}`, { params });
  },

  getExerciseSetTypeBreakdown(exerciseId: number, params?: Record<string, unknown>) {
    return Api.get(`/v1/progress/exercises/${exerciseId}/set-type-breakdown`, { params });
  },

  getRoutineVolumeProgress(routineId: number, params?: Record<string, unknown>) {
    return Api.get(`/v1/progress/routines/${routineId}/volume`, { params });
  },

  getMuscleGroupVolumeBreakdown(params?: Record<string, unknown>) {
    return Api.get("/v1/progress/muscle-groups/volume-breakdown", { params });
  },
};
