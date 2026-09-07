import "server-only";
import { redirect } from "next/navigation";
import { getCurrentSession } from "./session";
import { resolveUserScope, type UserScope } from "./scope";
import { roleGroupFor, homePathFor, type RoleGroup } from "./roleHome";
import { titleForRole } from "@/lib/org/labels";
import type { User } from "@prisma/client";

export interface AuthedContext {
  user: User;
  scope: UserScope;
  group: RoleGroup;
  primaryRoleLabel: string;
}

/** Server-component/page guard: redirects to sign-in (or MFA) and enforces the role group a route requires. */
export async function requireRoleGroup(required: RoleGroup): Promise<AuthedContext> {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const scope = await resolveUserScope(session.userId);
  const group = roleGroupFor(scope.roles.map((r) => r.role));

  if (group === "super_admin" && !session.mfaVerifiedAt) {
    redirect("/sign-in/verify");
  }

  if (group !== required) {
    redirect(homePathFor(group));
  }

  const primaryRoleLabel = scope.roles[0] ? titleForRole(scope.roles[0].role) : titleForRole("cell_leader");

  return { user: session.user, scope, group, primaryRoleLabel };
}
