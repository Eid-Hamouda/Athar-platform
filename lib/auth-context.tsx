"use client";

import * as React from "react";
import { authService } from "@/services/auth.service";
import { getAccessToken } from "@/lib/api";
import type { ExpressUser, LoginRequest, RegisterRequest } from "@/types/api";

interface ExpressAuthContextValue {
  user: ExpressUser | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<ExpressUser>;
  register: (payload: RegisterRequest) => Promise<ExpressUser>;
  logout: () => Promise<void>;
}

const ExpressAuthContext = React.createContext<ExpressAuthContextValue | null>(null);

export function ExpressAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<ExpressUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    // Always attempt this: even with no locally stored access token, the
    // backend may still have a valid httpOnly refresh-token cookie, and the
    // API client (lib/api.ts) transparently retries once via /auth/refresh-token
    // on a 401 — so this also restores the session after a token expiry.
    authService
      .getCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = React.useCallback(async (payload: LoginRequest) => {
    const { user: loggedInUser } = await authService.login(payload);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = React.useCallback(async (payload: RegisterRequest) => {
    const { user: registeredUser } = await authService.register(payload);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = React.useCallback(async () => {
    await authService.logout().catch(() => {
      // Already logged out server-side or unreachable — clear local state regardless.
    });
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <ExpressAuthContext.Provider value={value}>{children}</ExpressAuthContext.Provider>;
}

export function useExpressAuth() {
  const ctx = React.useContext(ExpressAuthContext);
  if (!ctx) throw new Error("useExpressAuth must be used within an ExpressAuthProvider");
  return ctx;
}

/** True once the initial session check has settled and there is no token at all. */
export function hasStoredExpressSession() {
  return typeof window !== "undefined" && Boolean(getAccessToken());
}

const EXPRESS_ROLE_LABELS: Record<ExpressUser["role"], string> = {
  donor: "donor",
  charity: "organization",
  volunteer: "volunteer",
  admin: "admin",
};

/**
 * Maps an Express-backend user onto the shape the (Supabase-era) dashboard
 * UI expects, so donor/volunteer/organization/admin accounts created via the
 * real backend can render in the existing role-switched dashboard without
 * changing its components. `charity` → `organization` to match the UI's
 * existing role labels/nav groups (backend has no "organization" role, only
 * "charity" — see ATHAR_FRONTEND_BACKEND_INTEGRATION_PROMPT.md decisions).
 */
export function toLegacyProfile(user: ExpressUser) {
  return {
    id: user._id,
    full_name: user.fullName,
    role: EXPRESS_ROLE_LABELS[user.role],
    is_approved: true,
    email: user.email,
  };
}
