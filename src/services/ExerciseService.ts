import { Api } from "./Api";

export type ExercisePayload = {
  name: string;
  description?: string | null;
  videoUrl?: string | null;
  primaryMuscleGroup?: string | null;
  muscleGroups?: string[] | null;
  equipment?: string | null;
  exerciseType?: string;
};

export const ExerciseService = {
  getAll(params?: Record<string, unknown>) {
    return Api.get("/v1/exercises", { params });
  },

  getAllExercises(params?: Record<string, unknown>) {
    return Api.get("/v1/exercises", { params });
  },

  getById(id: number) {
    return Api.get(`/v1/exercises/${id}`);
  },

  create(data: ExercisePayload) {
    return Api.post("/v1/exercises", data);
  },

  createExercise(data: ExercisePayload) {
    return Api.post("/v1/exercises", data);
  },

  update(id: number, data: Partial<ExercisePayload>) {
    return Api.put(`/v1/exercises/${id}`, data);
  },

  updateExercise(id: number, data: Partial<ExercisePayload>) {
    return Api.put(`/v1/exercises/${id}`, data);
  },

  delete(id: number) {
    return Api.delete(`/v1/exercises/${id}`);
  },

  deleteExercise(id: number) {
    return Api.delete(`/v1/exercises/${id}`);
  },
};
