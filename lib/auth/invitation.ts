/**
 * Activation-flow rules: codes expire in 24 hours for Super Admin, 14 days
 * for everyone else (they never self-register — accounts are created by the
 * hierarchy upload, and this only activates one).
 */

export const SUPER_ADMIN_INVITATION_HOURS = 24;
export const STANDARD_INVITATION_DAYS = 14;

export function invitationExpiresAt(isSuperAdmin: boolean, now: Date = new Date()): Date {
  const ms = isSuperAdmin ? SUPER_ADMIN_INVITATION_HOURS * 3600_000 : STANDARD_INVITATION_DAYS * 86_400_000;
  return new Date(now.getTime() + ms);
}

export function isInvitationExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}
