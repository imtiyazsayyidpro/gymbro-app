import { Api } from "./Api";
import { StorageService } from "./StorageService";

export const AuthService = {
  login(payload: { email: string; password: string }) {
    return Api.post("/v1/auth/login", payload);
  },

  verifyOtp(payload: { userId: number; code: string }) {
    return Api.post("/v1/auth/verify-otp", payload);
  },

  async logout() {
    const token = StorageService.getAccessToken();

    try {
      if (token) {
        await Api.post("/v1/auth/logout");
      }
    } finally {
      StorageService.removeAccessToken();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },
};
