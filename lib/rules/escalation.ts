/**
 * Rule 2 — a submitted report goes to the Cell Leader's Section Leader for
 * approval. If it is not acted on within 36 hours it escalates to the Area
 * Coordinator.
 */

import { MS_PER_HOUR } from "./reportingWindow";

export const ESCALATION_HOURS = 36;

export function escalatesAt(submittedAt: Date): Date {
  return new Date(submittedAt.getTime() + ESCALATION_HOURS * MS_PER_HOUR);
}

export interface EscalatableReport {
  status: "draft" | "pending" | "approved" | "sent_back";
  submittedAt: Date | null;
}

/**
 * True once a still-pending report has sat unreviewed past the 36-hour mark.
 * A report that has already been approved or sent back is never escalated —
 * escalation only routes an unreviewed report to the Area Coordinator.
 */
export function isReportEscalated(report: EscalatableReport, now: Date): boolean {
  if (report.status !== "pending" || !report.submittedAt) return false;
  return now.getTime() >= escalatesAt(report.submittedAt).getTime();
}
