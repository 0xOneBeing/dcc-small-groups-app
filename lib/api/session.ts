import "server-only";

/**
 * Server-side session read for the API era. Server components and route guards
 * call this instead of the old Prisma `getCurrentSession()`.
 *
 * It reads the httpOnly cookies only — the JWT for liveness, `dcc_user` for
 * the profile. It refreshes the access token once if it has expired.
 */

import { decodeJwt, isJwtExpired, readTokens, readUser, refreshTokens } from "./tokens";
import {
  capabilitiesFor,
  resolveRole,
  type RoleCapabilities,
  type RoleName,
} from "@/lib/auth/roles";
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

/**
 * Resolve a session to exactly one of the API's nine roles. Trusts
 * `is_superuser`, then an exact (case-sensitive) match of `role_name` — which
 * the login route enriches from `/api/v1/roles/` — then any role hint in the
 * JWT claims. Cell Leaders get a 403 on the roles list, so they fall through
 * to `CELL_LEADER` by default.
 */
export function roleFor(session: Pick<ServerSession, "user" | "claims">): RoleName {
  return resolveRole({
    isSuperuser: session.user?.is_superuser ?? null,
    roleName: session.user?.role_name,
    claims: session.claims as Record<string, unknown> | null,
  });
}

export function capabilitiesForSession(
  session: Pick<ServerSession, "user" | "claims">,
): RoleCapabilities {
  return capabilitiesFor(roleFor(session));
}

export function homeForSession(session: Pick<ServerSession, "user" | "claims">): string {
  return capabilitiesForSession(session).home;
}
