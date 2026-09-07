/**
 * Rule 5 — a follow-up is overdue when status = not_contacted AND it was
 * assigned more than 2 days ago. This is the single predicate every list,
 * badge, count and export must call — never re-derive it per screen.
 *
 * The PRD contradicts itself (7 days in FR-6.3, 2 days in FR-7.4); we use 2
 * days and keep the threshold configurable via AppSetting
 * (see lib/settings.ts), not hardcoded.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_FOLLOWUP_OVERDUE_DAYS = 2;

export interface OverdueCheckableFollowUp {
  status: "not_contacted" | "contacted" | "joined_cell" | "unable_to_reach";
  assignedAt: Date;
}

/**
 * True when `assignedAt` is strictly more than `thresholdDays` in the past
 * and the follow-up is still not_contacted. Exactly `thresholdDays` ago is
 * not yet overdue — the rule says "more than".
 */
export function isFollowUpOverdue(
  followUp: OverdueCheckableFollowUp,
  now: Date,
  thresholdDays: number = DEFAULT_FOLLOWUP_OVERDUE_DAYS,
): boolean {
  if (followUp.status !== "not_contacted") return false;
  const ageMs = now.getTime() - followUp.assignedAt.getTime();
  return ageMs > thresholdDays * MS_PER_DAY;
}
