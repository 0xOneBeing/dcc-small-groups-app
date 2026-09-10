import "server-only";

/**
 * Server-component / page guards for the API era — the replacement for the old
 * Prisma `lib/auth/guard.ts`.
 *
 * Strict role-group enforcement is intentionally *not* done here yet: the
 * `/coordinator` and `/admin` route groups don't exist, and the role claim
 * shape isn't confirmed, so enforcing a group could bounce a valid user into a
 * 404. For now every guard just requires a live session.
 */

import { redirect } from "next/navigation";
import { capabilitiesForSession, getServerSession, roleFor, type ServerSession } from "./session";
import type { AppArea, RoleCapabilities, RoleName } from "@/lib/auth/roles";
import type { ApiUser } from "./types";

export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session.authenticated) redirect("/sign-in");
  return session;
}

/** Human-friendly display name from whatever the API's user object carries. */
export function displayName(user: ApiUser | null): string {
  if (!user) return "Cell Leader";
  const full =
    (typeof user.name === "string" && user.name.trim()) ||
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    (typeof user.email === "string" ? user.email : "");
  return full || "Cell Leader";
}

export interface ShellContext {
  session: ServerSession;
  userName: string;
  role: RoleName;
  capabilities: RoleCapabilities;
  /** Route group the user belongs in. */
  area: AppArea;
  /** Display label — the API's `role_name` if present, else the capability label. */
  roleLabel: string;
}

/**
 * Everything an authenticated shell layout needs. Requires a live session.
 *
 * `expectedArea` is advisory for now: the `/coordinator`, `/msu`, and `/admin`
 * route groups don't exist yet, so bouncing a mismatched user to their real
 * home would land on a 404. Pass `{ enforce: true }` once those exist.
 */
export async function requireShellContext(
  expectedArea?: AppArea,
  opts: { enforce?: boolean } = {},
): Promise<ShellContext> {
  const session = await requireSession();
  const role = roleFor(session);
  const capabilities = capabilitiesForSession(session);

  if (opts.enforce && expectedArea && capabilities.area !== expectedArea) {
    redirect(capabilities.home);
  }

  return {
    session,
    userName: displayName(session.user),
    role,
    capabilities,
    area: capabilities.area,
    roleLabel:
      (typeof session.user?.role_name === "string" && session.user.role_name) ||
      capabilities.label,
  };
}
