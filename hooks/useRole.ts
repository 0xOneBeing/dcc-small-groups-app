"use client";

/**
 * Client-side view of the signed-in user's role + capabilities.
 *
 * Server code should use `roleFor` / `capabilitiesForSession` from
 * `lib/api/session.ts`; this is the same resolution against the profile the
 * `/api/auth/session` endpoint returns (the `dcc_user` cookie), for gating UI.
 */

import { useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  capabilitiesFor,
  resolveRole,
  type RoleCapabilities,
  type RoleName,
} from "@/lib/auth/roles";

export interface UseRoleResult {
  role: RoleName;
  capabilities: RoleCapabilities;
  isLoading: boolean;
}

export function useRole(): UseRoleResult {
  const { user, isLoading } = useAuth();

  const role = useMemo(
    () =>
      resolveRole({
        isSuperuser: (user?.is_superuser as boolean | undefined) ?? null,
        roleName: user?.role_name,
        claims: (user as Record<string, unknown> | null) ?? null,
      }),
    [user],
  );

  return { role, capabilities: capabilitiesFor(role), isLoading };
}
