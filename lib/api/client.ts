/**
 * Browser-side API client. Talks only to the same-origin BFF proxy
 * (`/api/proxy/...`), which owns the JWT. No token handling here.
 *
 * Framework-agnostic on purpose — the React hooks in `hooks/useApi.ts` build
 * on this, but it can be called from anywhere (event handlers, plain modules).
 */

import { PROXY_BASE_PATH } from "./config";
import { ApiError } from "./errors";
import { httpRequest, withQuery, type QueryParams, type RequestOptions } from "./http";

export type { QueryParams } from "./http";

/** Normalize `"v1/reports/"`, `"/v1/reports/"`, or a full `"/api/proxy/..."` to a proxied URL. */
function toProxyUrl(path: string): string {
  if (path.startsWith(PROXY_BASE_PATH)) return path;
  const clean = path.replace(/^\/+/, "");
  const stripped = clean.startsWith("api/proxy/") ? clean.slice("api/proxy/".length) : clean;
  return `${PROXY_BASE_PATH}/${stripped}`;
}

// A single place for the app to react to an unrecoverable 401 (proxy already
// tried to refresh). Register from a client component near the app root.
type AuthExpiredHandler = () => void;
let onAuthExpired: AuthExpiredHandler | null = null;
export function setAuthExpiredHandler(fn: AuthExpiredHandler | null): void {
  onAuthExpired = fn;
}

export interface ApiCallOptions extends Omit<RequestOptions, "method" | "body"> {
  query?: QueryParams;
}

async function call<T>(
  method: NonNullable<RequestOptions["method"]>,
  path: string,
  body?: unknown,
  options: ApiCallOptions = {},
): Promise<T> {
  try {
    return await httpRequest<T>(toProxyUrl(path), {
      ...options,
      method,
      body,
      fetchOptions: { credentials: "same-origin", ...options.fetchOptions },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      onAuthExpired?.();
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string, options?: ApiCallOptions) => call<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: ApiCallOptions) => call<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: ApiCallOptions) => call<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: ApiCallOptions) => call<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: ApiCallOptions) => call<T>("DELETE", path, undefined, options),

  /** Fetch a file (e.g. the CSV export) as a Blob, honoring the proxied auth. */
  async download(path: string, options: ApiCallOptions = {}): Promise<{ blob: Blob; filename: string | null }> {
    const url = withQuery(toProxyUrl(path), options.query);
    const res = await fetch(url, { credentials: "same-origin", signal: options.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401) onAuthExpired?.();
      throw new ApiError({ status: res.status, message: text || `Download failed (${res.status}).` });
    }
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: await res.blob(), filename: match ? decodeURIComponent(match[1]) : null };
  },
};

/** Auth endpoints live at `/api/auth/*` (not under the proxy — they mint the cookies). */
export const authApi = {
  login: (email: string, password: string) =>
    httpRequest<{ authenticated: true; user: Record<string, unknown> | null }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      fetchOptions: { credentials: "same-origin" },
    }),
  logout: () =>
    httpRequest<{ authenticated: false }>("/api/auth/logout", {
      method: "POST",
      fetchOptions: { credentials: "same-origin" },
    }),
  session: () =>
    httpRequest<{ authenticated: boolean; user: Record<string, unknown> | null }>("/api/auth/session", {
      fetchOptions: { credentials: "same-origin", cache: "no-store" },
    }),
  refresh: () =>
    httpRequest<{ authenticated: boolean; user: Record<string, unknown> | null }>("/api/auth/refresh", {
      method: "POST",
      fetchOptions: { credentials: "same-origin" },
    }),
};

export { ApiError };
