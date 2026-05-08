import axios from "axios";
import { StorageService } from "./StorageService";

export const Api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

Api.interceptors.request.use((config) => {
  const token = StorageService.getAccessToken();

  if (token) {
    config.headers.Authorization = token;
  }

  return config;
});

Api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (typeof window !== "undefined") {
      const isAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register" || window.location.pathname === "/verify-otp";

      if ((status === 401 || status === 403) && !isAuthPage) {
        StorageService.removeAccessToken();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
