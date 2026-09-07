import "server-only";

/**
 * Server-side JWT handling: the access/refresh pair lives in httpOnly cookies
 * that browser JavaScript can never read. Everything here runs only in route
 * handlers and server components.
 */

import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  API_ROUTES,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REMOTE_API_BASE_URL,
} from "./config";
import { httpRequest } from "./http";
import type { AccessTokenClaims, TokenPair, TokenRefreshResponse } from "./types";

export function upstreamUrl(path: string): string {
  return `${REMOTE_API_BASE_URL}/api/${path.replace(/^\/+/, "")}`;
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Decode (not verify) a JWT payload. Signature is trusted only because it came from our own httpOnly cookie. */
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

/**
 * Write the JWT pair onto a response's cookies. Pass the `NextResponse` (or any
 * object with a `cookies.set`) you are about to return so the `Set-Cookie`
 * headers actually reach the browser.
 */
export function writeTokensOnResponse(
  res: { cookies: { set: (name: string, value: string, opts?: object) => void } },
  tokens: { access: string; refresh?: string },
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.access, { ...cookieBase, maxAge: ACCESS_COOKIE_MAX_AGE });
  if (tokens.refresh) {
    res.cookies.set(REFRESH_COOKIE, tokens.refresh, { ...cookieBase, maxAge: REFRESH_COOKIE_MAX_AGE });
  }
}

export function clearTokensOnResponse(res: {
  cookies: { set: (name: string, value: string, opts?: object) => void };
}): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/** Also write the pair through the ambient cookie store (for use in Server Actions). */
export async function persistTokens(tokens: { access: string; refresh?: string }): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.access, { ...cookieBase, maxAge: ACCESS_COOKIE_MAX_AGE });
  if (tokens.refresh) {
    store.set(REFRESH_COOKIE, tokens.refresh, { ...cookieBase, maxAge: REFRESH_COOKIE_MAX_AGE });
  }
}

export async function clearTokens(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/** Exchange email/password for a JWT pair upstream. Throws {@link ApiError} on bad credentials. */
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
