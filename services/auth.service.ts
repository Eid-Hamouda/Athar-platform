import { api, setAccessToken } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest, ExpressUser } from "@/types/api";

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const result = await api.post<AuthResponse>("/auth/login", payload, {
      skipAuth: true,
    });
    setAccessToken(result.accessToken);
    return result;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const result = await api.post<AuthResponse>("/auth/register", payload, {
      skipAuth: true,
    });
    setAccessToken(result.accessToken);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await api.post<null>("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  getCurrentUser(): Promise<ExpressUser> {
    return api.get<ExpressUser>("/users/me");
  },
};
