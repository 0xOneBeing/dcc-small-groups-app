import "server-only";

/**
 * Server-side session read for the API era. Server components and route guards
 * call this instead of the old Prisma `getCurrentSession()`.
 *
 * It reads the httpOnly cookies only — the JWT for liveness, `dcc_user` for
 * the profile. It refreshes the access token once if it has expired.
 */

import { decodeJwt, isJwtExpired, readTokens, readUser, refreshTokens } from "./tokens";
import { homePathFor, type RoleGroup } from "@/lib/auth/roleHome";
import type { AccessTokenClaims, ApiUser } from "./types";

export interface ServerSession {
  authenticated: boolean;
  user: ApiUser | null;
  claims: AccessTokenClaims | null;
}

export async function getServerSession(): Promise<ServerSession> {
  const { access, refresh } = await readTokens();
  const user = await readUser();

  if (access && !isJwtExpired(access)) {
    return { authenticated: true, user, claims: decodeJwt<AccessTokenClaims>(access) };
  }

  if (refresh) {
    try {
      const next = await refreshTokens(refresh);
      return { authenticated: true, user, claims: decodeJwt<AccessTokenClaims>(next.access) };
    } catch {
      return { authenticated: false, user: null, claims: null };
    }
  }

  return { authenticated: false, user: null, claims: null };
}

const COORDINATOR_TOKENS = [
  "section",
  "area",
  "zone",
  "zonal",
  "district",
  "region",
  "regional",
  "coordinator",
];

/**
 * Best-effort role-group resolution. Trusts the API's `is_superuser` flag
 * first, then matches on `role_name` (the login route enriches the `role`
 * UUID into a name). Anything unrecognised routes to the Cell Leader home.
 */
export function roleGroupFor(session: Pick<ServerSession, "user" | "claims">): RoleGroup {
  const u = session.user;

  if (u?.is_superuser === true) return "super_admin";

  const raw: unknown[] = [];
  if (u) raw.push(u.role_name, u.role);
  const c = session.claims as Record<string, unknown> | null;
  if (c) raw.push(c.role, c.role_name, c.roles, c.user_role, c.groups, c.scope);

  const values = raw
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.toLowerCase());

  if (values.some((v) => v.includes("super") || v.includes("admin"))) return "super_admin";
  if (values.some((v) => v.includes("cell") && v.includes("leader"))) return "leader";
  if (values.some((v) => v === "cell" || v === "leader" || v === "cell_leader")) return "leader";
  if (values.some((v) => COORDINATOR_TOKENS.some((t) => v.includes(t)))) return "coordinator";
  return "leader";
}

export function homeForSession(session: Pick<ServerSession, "user" | "claims">): string {
  return homePathFor(roleGroupFor(session));
}
