"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { createSession, setSessionCookie, getCurrentSession, destroyCurrentSession, markSessionMfaVerified } from "./session";
import { issueMagicLink, consumeMagicLink } from "./magicLink";
import { isInvitationExpired } from "./invitation";
import { generateTotpSecret, totpProvisioningUri, verifyTotpToken } from "./totp";
import { roleGroupFor, homePathFor } from "./roleHome";
import { logAudit } from "@/lib/audit";
import {
  signInSchema,
  magicLinkRequestSchema,
  verifyInvitationSchema,
  setPasswordSchema,
  totpVerifySchema,
} from "@/lib/validation/auth";
import { titleForRole } from "@/lib/org/labels";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function loadRolesAndScope(userId: string) {
  return prisma.roleAssignment.findMany({
    where: { userId },
    include: { unit: { include: { parent: { include: { parent: true } } } } },
  });
}

export async function signInAction(input: unknown): Promise<ActionResult<{ redirectTo: string; needsMfa: boolean }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "active" || !user.passwordHash) {
    return { ok: false, error: "Incorrect email or password" };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Incorrect email or password" };

  const roles = await loadRolesAndScope(user.id);
  const group = roleGroupFor(roles.map((r) => r.role));
  const needsMfa = group === "super_admin";

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  await logAudit({ actorId: user.id, action: "sign_in", entity: "User", entityId: user.id, after: { channel: "password" } });

  return { ok: true, data: { redirectTo: needsMfa ? "/sign-in/verify" : homePathFor(group), needsMfa } };
}

export async function requestMagicLinkAction(input: unknown): Promise<ActionResult<{ sent: boolean }>> {
  const parsed = magicLinkRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always report success — never reveal whether an email is registered.
  if (user && user.status === "active") {
    await issueMagicLink(user.id, user.email);
  }
  return { ok: true, data: { sent: true } };
}

export async function consumeMagicLinkAction(token: string): Promise<ActionResult<{ redirectTo: string }>> {
  const userId = await consumeMagicLink(token);
  if (!userId) return { ok: false, error: "This link has expired or was already used" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "active") return { ok: false, error: "This account is not active" };

  const roles = await loadRolesAndScope(userId);
  const group = roleGroupFor(roles.map((r) => r.role));
  const needsMfa = group === "super_admin";

  const { token: sessionToken, expiresAt } = await createSession(userId);
  await setSessionCookie(sessionToken, expiresAt);

  await logAudit({ actorId: userId, action: "sign_in", entity: "User", entityId: userId, after: { channel: "magic_link" } });

  return { ok: true, data: { redirectTo: needsMfa ? "/sign-in/verify" : homePathFor(group) } };
}

export interface InvitationPreview {
  name: string;
  email: string;
  roleLabel: string;
  scopeLabel: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export async function verifyInvitationAction(input: unknown): Promise<ActionResult<InvitationPreview>> {
  const parsed = verifyInvitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, invitationCode } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "invited" || user.invitationCode !== invitationCode) {
    return { ok: false, error: "That email and code don't match an invitation" };
  }
  if (!user.invitationExpiresAt || isInvitationExpired(user.invitationExpiresAt)) {
    return { ok: false, error: "This invitation code has expired. Ask your coordinator to reissue it." };
  }

  const roles = await loadRolesAndScope(user.id);
  const isSuperAdmin = roles.some((r) => r.role === "super_admin");
  const primary = roles[0];
  const scopeLabel = primary ? `${primary.unit.name} (${primary.unit.code})` : "Not yet assigned";
  const roleLabel = primary ? titleForRole(primary.role) : "Not yet assigned";

  const permissions = permissionsForRoles(roles.map((r) => r.role));

  return {
    ok: true,
    data: { name: user.name, email: user.email, roleLabel, scopeLabel, permissions, isSuperAdmin },
  };
}

function permissionsForRoles(roles: string[]): string[] {
  if (roles.includes("cell_leader")) {
    return [
      "Submit and edit the Sunday report for your cell.",
      "See and close follow-ups assigned to your cell.",
      "View your own attendance and submission history.",
    ];
  }
  if (roles.includes("super_admin")) {
    return [
      "Upload and manage the full organisation hierarchy.",
      "Issue and reissue invitation codes.",
      "View compliance across every region.",
    ];
  }
  return [
    "Approve or send back reports from cells in your scope.",
    "Drill from your scope down to any single cell.",
    "Export compliance and report figures for your scope.",
  ];
}

export interface ActivationResult {
  redirectTo: string;
  totpProvisioningUri?: string;
  totpSecret?: string;
}

export async function activateAccountAction(input: unknown): Promise<ActionResult<ActivationResult>> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, invitationCode, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "invited" || user.invitationCode !== invitationCode) {
    return { ok: false, error: "That email and code don't match an invitation" };
  }
  if (!user.invitationExpiresAt || isInvitationExpired(user.invitationExpiresAt)) {
    return { ok: false, error: "This invitation code has expired. Ask your coordinator to reissue it." };
  }

  const roles = await loadRolesAndScope(user.id);
  const group = roleGroupFor(roles.map((r) => r.role));
  const isSuperAdmin = group === "super_admin";
  const passwordHash = await hashPassword(password);
  const totpSecret = isSuperAdmin ? generateTotpSecret() : null;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: "active",
      invitationCode: null,
      invitationExpiresAt: null,
      totpSecret,
    },
  });

  await logAudit({ actorId: updated.id, action: "activate_account", entity: "User", entityId: updated.id, after: { status: "active" } });

  const { token, expiresAt } = await createSession(updated.id);
  await setSessionCookie(token, expiresAt);

  if (isSuperAdmin && totpSecret) {
    return {
      ok: true,
      data: {
        redirectTo: "/sign-in/verify",
        totpProvisioningUri: totpProvisioningUri(totpSecret, updated.email),
        totpSecret,
      },
    };
  }

  return { ok: true, data: { redirectTo: homePathFor(group) } };
}

export async function verifyTotpAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = totpVerifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };
  if (!session.user.totpSecret) return { ok: false, error: "No authenticator app is set up for this account" };

  const valid = verifyTotpToken(session.user.totpSecret, parsed.data.token);
  if (!valid) return { ok: false, error: "That code is incorrect or has expired" };

  await markSessionMfaVerified(session.id);
  await logAudit({ actorId: session.userId, action: "mfa_verified", entity: "User", entityId: session.userId });

  return { ok: true, data: { redirectTo: "/admin" } };
}

export async function signOutAction(): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    await logAudit({ actorId: session.userId, action: "sign_out", entity: "User", entityId: session.userId });
  }
  await destroyCurrentSession();
  redirect("/sign-in");
}
