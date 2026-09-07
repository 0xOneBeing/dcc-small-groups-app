import { prisma } from "@/lib/prisma";
import { subtreeUnitIds } from "@/lib/org/subtree";
import type { CellRole } from "@prisma/client";

export interface UserScope {
  userId: string;
  isSuperAdmin: boolean;
  roles: { role: CellRole; unitId: string }[];
  /** The units directly granted by a role assignment. */
  grantedUnitIds: string[];
  /** Every unit reachable from a granted unit — the actual authorization boundary. */
  subtreeUnitIds: string[];
}

/**
 * Resolves what a user can see and act on. Authorisation always derives from
 * this — the subtree of the units a role grants — never from a role name
 * alone, and never from a client-supplied unit id.
 */
export async function resolveUserScope(userId: string): Promise<UserScope> {
  const roles = await prisma.roleAssignment.findMany({ where: { userId } });
  const isSuperAdmin = roles.some((r) => r.role === "super_admin");

  if (isSuperAdmin) {
    const all = await prisma.orgUnit.findMany({ select: { id: true } });
    return {
      userId,
      isSuperAdmin: true,
      roles: roles.map((r) => ({ role: r.role, unitId: r.unitId })),
      grantedUnitIds: [],
      subtreeUnitIds: all.map((u) => u.id),
    };
  }

  const grantedUnitIds = roles.map((r) => r.unitId);
  const subtree = await subtreeUnitIds(grantedUnitIds);
  return {
    userId,
    isSuperAdmin: false,
    roles: roles.map((r) => ({ role: r.role, unitId: r.unitId })),
    grantedUnitIds,
    subtreeUnitIds: subtree,
  };
}

export function scopeIncludesUnit(scope: UserScope, unitId: string): boolean {
  return scope.isSuperAdmin || scope.subtreeUnitIds.includes(unitId);
}

/** Throws if the given unit isn't within the user's authorized subtree. */
export function assertScopeIncludesUnit(scope: UserScope, unitId: string): void {
  if (!scopeIncludesUnit(scope, unitId)) {
    throw new Error("Not authorized for this unit");
  }
}
