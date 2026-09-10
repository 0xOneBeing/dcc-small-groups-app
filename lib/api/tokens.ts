import "server-only";

/**
 * Server-side JWT handling: the access/refresh pair lives in httpOnly cookies
 * that browser JavaScript can never read. A third httpOnly cookie, `dcc_user`,
 * caches the profile object the API returns at login (used for role routing).
 * Everything here runs only in route handlers and server components.
 */

import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  API_ROUTES,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REMOTE_API_BASE_URL,
  USER_COOKIE,
} from "./config";
import { httpRequest } from "./http";
import { unwrapData } from "./normalize";
import type {
  AccessTokenClaims,
  ApiUser,
  LoginResponse,
  NormalisedLogin,
  Paginated,
  TokenPair,
  TokenRefreshResponse,
  UserRole,
} from "./types";

export function upstreamUrl(path: string): string {
  return `${REMOTE_API_BASE_URL}/api/${path.replace(/^\/+/, "")}`;
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

type CookieSetter = { cookies: { set: (name: string, value: string, opts?: object) => void } };

/** Decode (not verify) a JWT payload. Trusted only because it came from our own httpOnly cookie. */
export function decodeJwt<T = AccessTokenClaims>(token: string): T | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const claims = decodeJwt<AccessTokenClaims>(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export async function readTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value ?? null,
    refresh: store.get(REFRESH_COOKIE)?.value ?? null,
  };
}

export async function readUser(): Promise<ApiUser | null> {
  const raw = (await cookies()).get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

/**
 * Write the JWT pair (and optionally the user profile) onto a response's
 * cookies. Pass the `NextResponse` you are about to return.
 */
export function writeTokensOnResponse(
  res: CookieSetter,
  tokens: { access: string; refresh?: string; user?: ApiUser | null },
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.access, { ...cookieBase, maxAge: ACCESS_COOKIE_MAX_AGE });
  if (tokens.refresh) {
    res.cookies.set(REFRESH_COOKIE, tokens.refresh, { ...cookieBase, maxAge: REFRESH_COOKIE_MAX_AGE });
  }
  if (tokens.user) {
    res.cookies.set(USER_COOKIE, JSON.stringify(tokens.user), {
      ...cookieBase,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
}

export function clearTokensOnResponse(res: CookieSetter): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) {
    res.cookies.set(name, "", { ...cookieBase, maxAge: 0 });
  }
}

/** Same as {@link writeTokensOnResponse} but through the ambient store (Server Actions). */
export async function persistTokens(tokens: {
  access: string;
  refresh?: string;
  user?: ApiUser | null;
}): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.access, { ...cookieBase, maxAge: ACCESS_COOKIE_MAX_AGE });
  if (tokens.refresh) {
    store.set(REFRESH_COOKIE, tokens.refresh, { ...cookieBase, maxAge: REFRESH_COOKIE_MAX_AGE });
  }
  if (tokens.user) {
    store.set(USER_COOKIE, JSON.stringify(tokens.user), { ...cookieBase, maxAge: REFRESH_COOKIE_MAX_AGE });
  }
}

export async function clearTokens(): Promise<void> {
  const store = await cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) {
    store.set(name, "", { ...cookieBase, maxAge: 0 });
  }
}

// ---------------------------------------------------------------------------
// Upstream auth calls
// ---------------------------------------------------------------------------

/**
 * `POST /api/v1/user/login/` — accepts `email` **or** `cell_code` plus a
 * password; returns `{ message, data: { ...profile, tokens } }`. We normalise
 * it to `{ access, refresh, user }` and best-effort enrich the user's `role`
 * UUID into a `role_name` from the roles list.
 */
export async function loginWithPassword(credentials: {
  email?: string;
  cell_code?: string;
  password: string;
}): Promise<NormalisedLogin> {
  const body = await httpRequest<LoginResponse>(upstreamUrl(API_ROUTES.login), {
    method: "POST",
    body: {
      ...(credentials.email ? { email: credentials.email } : {}),
      ...(credentials.cell_code ? { cell_code: credentials.cell_code } : {}),
      password: credentials.password,
    },
  });

  const data = unwrapData<LoginResponse["data"]>(body);
  const { tokens, ...user } = data ?? ({} as LoginResponse["data"]);
  if (!tokens?.access || !tokens?.refresh) {
    throw new Error("Login response did not include an access/refresh token pair.");
  }

  const roleName = await resolveRoleName(user.role, tokens.access);
  return {
    access: tokens.access,
    refresh: tokens.refresh,
    user: roleName ? { ...user, role_name: roleName } : user,
  };
}

/**
 * Look up a role UUID's name from `/api/v1/roles/`. Never throws — routing
 * falls back without it. Note: cell leaders get 403 on that endpoint, so
 * `role_name` only enriches for privileged users; leaf users route via the
 * `is_superuser` flag + the `CELL_LEADER` default in `resolveRole`
 * (`lib/auth/roles.ts`).
 */
async function resolveRoleName(roleId: string | undefined, access: string): Promise<string | null> {
  if (!roleId) return null;
  try {
    const page = await httpRequest<Paginated<UserRole> | UserRole[]>(upstreamUrl(API_ROUTES.roles), {
      headers: { Authorization: `Bearer ${access}` },
      timeoutMs: 8_000,
    });
    const list = Array.isArray(page) ? page : page.results;
    return list.find((r) => r.id === roleId)?.name ?? null;
  } catch {
    return null;
  }
}

/** `POST /api/token/` — bare SimpleJWT pair, no profile. */
export function obtainTokens(email: string, password: string): Promise<TokenPair> {
  return httpRequest<TokenPair>(upstreamUrl(API_ROUTES.tokenObtain), {
    method: "POST",
    body: { email, password },
  });
}

/** Trade a refresh token for a new access token (and rotated refresh, when enabled). */
export function refreshTokens(refresh: string): Promise<TokenRefreshResponse> {
  return httpRequest<TokenRefreshResponse>(upstreamUrl(API_ROUTES.tokenRefresh), {
    method: "POST",
    body: { refresh },
  });
}
