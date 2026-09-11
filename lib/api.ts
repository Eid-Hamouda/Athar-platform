/**
 * Centralized HTTP client for the Athar Express backend.
 *
 * Response envelope (see backend/src/utils/ApiResponse.ts):
 *   success: { success: true,  message: string, data: T, meta?: {page,limit,total,totalPages} }
 *   error:   { success: false, message: string, errors?: {field,message}[] }
 *
 * Auth model (see backend/src/utils/jwt.ts, cookies.ts, auth.middleware.ts):
 *   - access token: short-lived JWT, sent as `Authorization: Bearer <token>`, held here in memory
 *     (persisted to localStorage only so a page refresh doesn't force a re-login).
 *   - refresh token: httpOnly cookie set by the backend, scoped to /api/v1/auth — the browser
 *     sends it automatically via `credentials: "include"`.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000/api/v1";

const ACCESS_TOKEN_STORAGE_KEY = "athar_access_token";
const REQUEST_TIMEOUT_MS = 15000;

export interface ApiError {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
}

interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: { field: string; message: string }[] | string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/* ------------------------------- Token store ------------------------------ */

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function loadStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (accessToken === null) accessToken = loadStoredToken();
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.) — in-memory token still works for this tab.
  }
}

/* --------------------------------- Fetch ---------------------------------- */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
  /** Skip the Bearer header and the 401→refresh→retry cycle (e.g. login/register/refresh itself). */
  skipAuth?: boolean;
  /** Internal: prevents infinite refresh loops. */
  _isRetry?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as ApiSuccessEnvelope<{ accessToken: string }>;
        const next = json.data?.accessToken ?? null;
        setAccessToken(next);
        return next;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function requestRaw<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  const { method = "GET", body, isFormData, skipAuth, _isRetry } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw { message: "انتهت مهلة الاتصال بالخادم. حاول مرة أخرى." } satisfies ApiError;
    }
    throw { message: "تعذّر الوصول إلى الخادم. تحقق من اتصالك بالإنترنت." } satisfies ApiError;
  }
  clearTimeout(timeout);

  // 401 on a protected request: try exactly one silent refresh, then retry once.
  if (res.status === 401 && !skipAuth && !_isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return requestRaw<T>(path, { ...options, _isRetry: true });
    setAccessToken(null);
  }

  let json: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    json = await res.json();
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok || !json || json.success === false) {
    const errEnvelope = json as ApiErrorEnvelope | null;
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(errEnvelope?.errors)) {
      for (const e of errEnvelope.errors) fieldErrors[e.field] = e.message;
    }
    throw {
      message:
        errEnvelope?.message ||
        (res.status >= 500 ? "حدث خطأ في الخادم. حاول لاحقاً." : "تعذّر إتمام الطلب."),
      status: res.status,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    } satisfies ApiError;
  }

  const success = json as ApiSuccessEnvelope<T>;
  return { data: success.data, meta: success.meta };
}

export const api = {
  get: async <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    (await requestRaw<T>(path, { ...options, method: "GET" })).data,
  post: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    (await requestRaw<T>(path, { ...options, method: "POST", body })).data,
  put: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    (await requestRaw<T>(path, { ...options, method: "PUT", body })).data,
  patch: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    (await requestRaw<T>(path, { ...options, method: "PATCH", body })).data,
  delete: async <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    (await requestRaw<T>(path, { ...options, method: "DELETE" })).data,
  /** For endpoints whose pagination `meta` the caller needs (e.g. donation lists). */
  getWithMeta: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    requestRaw<T>(path, { ...options, method: "GET" }),
};
