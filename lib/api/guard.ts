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
import { getServerSession, type ServerSession } from "./session";
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

export interface LeaderContext {
  session: ServerSession;
  userName: string;
  roleLabel: string;
}

export async function requireLeader(): Promise<LeaderContext> {
  const session = await requireSession();
  return {
    session,
    userName: displayName(session.user),
    roleLabel:
      (typeof session.user?.role_name === "string" && session.user.role_name) ||
      (typeof session.user?.role === "string" && session.user.role) ||
      "Cell Leader",
  };
}
