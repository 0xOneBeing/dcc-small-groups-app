/**
 * Rule 7 — compliance figures roll up the hierarchy: a unit's submitted /
 * pending / missing / chronic counts are the sums of its children, computed
 * from reports, never stored denormalised. "Chronic" means a cell missed 3
 * or more consecutive Sundays.
 *
 * This module only owns the per-cell classification and streak math; the
 * roll-up sum itself lives in compliance.ts.
 */

export const CHRONIC_THRESHOLD_CONSECUTIVE_MISSES = 3;

export type ReportRowStatus = "draft" | "pending" | "approved" | "sent_back" | null;
export type WeekOutcome = "approved" | "pending" | "missing";

/**
 * Classifies one already-closed Sunday for a cell. `null` means no report
 * row exists at all. A sent-back report is still "pending" here — it counts
 * as reported once approved (rule 3), but until then it is neither missing
 * (something was submitted) nor approved.
 */
export function classifyWeek(status: ReportRowStatus): WeekOutcome {
  if (status === "approved") return "approved";
  if (status === "pending" || status === "sent_back") return "pending";
  return "missing"; // draft or no row at all, after the window closed
}

/**
 * Counts consecutive "missing" weeks starting from the most recent Sunday,
 * stopping at the first week that isn't missing. `weeksMostRecentFirst` must
 * only include Sundays whose reporting window has already closed.
 */
export function consecutiveMissedSundays(weeksMostRecentFirst: WeekOutcome[]): number {
  let streak = 0;
  for (const week of weeksMostRecentFirst) {
    if (week !== "missing") break;
    streak++;
  }
  return streak;
}

/** A cell is chronic once it has missed 3 or more consecutive Sundays. */
export function isChronicCell(consecutiveMisses: number): boolean {
  return consecutiveMisses >= CHRONIC_THRESHOLD_CONSECUTIVE_MISSES;
}
