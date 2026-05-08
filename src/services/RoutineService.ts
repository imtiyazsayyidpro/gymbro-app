import { Api } from "./Api";

export type RoutineExercisePayload = {
  exerciseId: number;
  order: number;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
};

export type RoutinePayload = {
  name: string;
  description?: string | null;
  exercises?: RoutineExercisePayload[];
};

export const RoutineService = {
  getAll(params?: Record<string, unknown>) {
    return Api.get("/v1/routines", { params });
  },

  getAllRoutines(params?: Record<string, unknown>) {
    return Api.get("/v1/routines", { params });
  },

  getById(id: number) {
    return Api.get(`/v1/routines/${id}`);
  },

  getRoutineById(id: number) {
    return Api.get(`/v1/routines/${id}`);
  },

  create(data: RoutinePayload) {
    return Api.post("/v1/routines", data);
  },

  createRoutine(data: RoutinePayload) {
    return Api.post("/v1/routines", data);
  },

  update(id: number, data: Partial<Pick<RoutinePayload, "name" | "description">>) {
    return Api.patch(`/v1/routines/${id}`, data);
  },

  delete(id: number) {
    return Api.delete(`/v1/routines/${id}`);
  },

  deleteRoutine(id: number) {
    return Api.delete(`/v1/routines/${id}`);
  },

  addExercise(routineId: number, data: RoutineExercisePayload) {
    return Api.post(`/v1/routines/${routineId}/exercises`, data);
  },

  addExerciseToRoutine(routineId: number, data: RoutineExercisePayload) {
    return Api.post(`/v1/routines/${routineId}/exercises`, data);
  },

  updateExercise(routineId: number, routineExerciseId: number, data: Partial<RoutineExercisePayload>) {
    return Api.patch(`/v1/routines/${routineId}/exercises/${routineExerciseId}`, data);
  },

  updateRoutineExercise(routineId: number, routineExerciseId: number, data: Partial<RoutineExercisePayload>) {
    return Api.patch(`/v1/routines/${routineId}/exercises/${routineExerciseId}`, data);
  },

  removeExercise(routineId: number, routineExerciseId: number) {
    return Api.delete(`/v1/routines/${routineId}/exercises/${routineExerciseId}`);
  },

  removeExerciseFromRoutine(routineId: number, routineExerciseId: number) {
    return Api.delete(`/v1/routines/${routineId}/exercises/${routineExerciseId}`);
  },
};
