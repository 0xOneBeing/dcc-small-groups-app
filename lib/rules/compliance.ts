/**
 * Rule 7 (continued) — roll-up. Every list a coordinator sees is scoped to
 * the subtree of the unit their role grants (rule 8); this module only does
 * the arithmetic once a caller has already resolved that scoped subtree.
 */

import type { WeekOutcome } from "./chronic";
import { classifyWeek, consecutiveMissedSundays, isChronicCell, type ReportRowStatus } from "./chronic";

export interface ComplianceCounts {
  submitted: number;
  pending: number;
  missing: number;
  chronic: number;
}

export const EMPTY_COMPLIANCE_COUNTS: ComplianceCounts = { submitted: 0, pending: 0, missing: 0, chronic: 0 };

/** One cell's current-week outcome, plus its status for enough prior weeks to derive a streak. */
export interface CellComplianceInput {
  currentWeek: ReportRowStatus;
  priorWeeksMostRecentFirst: ReportRowStatus[];
}

export function cellComplianceCounts(input: CellComplianceInput): ComplianceCounts {
  const currentOutcome = classifyWeek(input.currentWeek);
  const priorOutcomes: WeekOutcome[] = input.priorWeeksMostRecentFirst.map(classifyWeek);
  // A streak ending anywhere but "now" is no longer an active non-reporting
  // spell, so the sequence always starts from the current week: once a cell
  // reports again (even just pending review) the streak — and the chronic
  // flag — resets, regardless of how long the prior run of misses was.
  const streak = consecutiveMissedSundays([currentOutcome, ...priorOutcomes]);

  return {
    submitted: currentOutcome === "approved" ? 1 : 0,
    pending: currentOutcome === "pending" ? 1 : 0,
    missing: currentOutcome === "missing" ? 1 : 0,
    chronic: isChronicCell(streak) ? 1 : 0,
  };
}

/** Sums a unit's own children counts — never denormalised, always computed from the subtree. */
export function sumComplianceCounts(children: ComplianceCounts[]): ComplianceCounts {
  return children.reduce(
    (acc, c) => ({
      submitted: acc.submitted + c.submitted,
      pending: acc.pending + c.pending,
      missing: acc.missing + c.missing,
      chronic: acc.chronic + c.chronic,
    }),
    { ...EMPTY_COMPLIANCE_COUNTS },
  );
}

export function complianceRate(counts: ComplianceCounts, totalCells: number): number {
  if (totalCells === 0) return 0;
  return Math.round(((counts.submitted + counts.pending) / totalCells) * 100);
}
