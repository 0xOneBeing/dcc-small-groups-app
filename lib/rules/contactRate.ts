/**
 * Rule 6 — "contact rate within 7 days" is a separate reporting metric from
 * the 2-day overdue threshold (rule 5). Do not conflate the two: this file
 * owns the 7-day window, followUpOverdue.ts owns the 2-day one.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const CONTACT_RATE_WINDOW_DAYS = 7;

export interface ContactableFollowUp {
  assignedAt: Date;
  /** When the leader first logged an outcome (contacted / unable to reach / joined). */
  firstContactedAt: Date | null;
}

/** True when the follow-up received its first contact within 7 days of assignment. */
export function wasContactedWithinWindow(
  followUp: ContactableFollowUp,
  windowDays: number = CONTACT_RATE_WINDOW_DAYS,
): boolean {
  if (!followUp.firstContactedAt) return false;
  const ageMs = followUp.firstContactedAt.getTime() - followUp.assignedAt.getTime();
  return ageMs <= windowDays * MS_PER_DAY;
}

/** Percentage (0-100) of follow-ups contacted within the window, for a leader or cell. */
export function contactRate(followUps: ContactableFollowUp[], windowDays: number = CONTACT_RATE_WINDOW_DAYS): number {
  if (followUps.length === 0) return 0;
  const contacted = followUps.filter((f) => wasContactedWithinWindow(f, windowDays)).length;
  return Math.round((contacted / followUps.length) * 100);
}
