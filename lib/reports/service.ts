import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { ALL_FIGURE_KEYS, type FigureKey } from "./fields";
import { lastClosedSundays } from "@/lib/dates";
import { isReportingWindowClosed } from "@/lib/rules/reportingWindow";
import { classifyWeek, consecutiveMissedSundays, isChronicCell, type ReportRowStatus, type WeekOutcome } from "@/lib/rules/chronic";
import { trailingAverage, isFigureVarianceFlagged } from "@/lib/rules/varianceFlag";
import type { CellRole, ReportChannel, SundayReport } from "@prisma/client";
import type { ReportFiguresInput } from "@/lib/validation/report";

export function toDate(serviceDate: string): Date {
  return new Date(`${serviceDate}T00:00:00.000Z`);
}

export async function getReport(cellId: string, serviceDate: Date) {
  return prisma.sundayReport.findUnique({ where: { cellId_serviceDate: { cellId, serviceDate } } });
}

function figureData(figures: ReportFiguresInput): Partial<Record<FigureKey, number | null>> {
  const out: Partial<Record<FigureKey, number | null>> = {};
  for (const key of ALL_FIGURE_KEYS) {
    if (key in figures) out[key] = figures[key] ?? null;
  }
  return out;
}

export interface SaveDraftInput {
  cellId: string;
  serviceDate: Date;
  figures: ReportFiguresInput;
  comments?: string;
  actorUserId: string;
}

export async function saveDraft(input: SaveDraftInput): Promise<SundayReport> {
  const existing = await getReport(input.cellId, input.serviceDate);
  if (existing && (existing.status === "approved" || existing.status === "pending")) {
    throw new Error("This report is locked and cannot be edited as a draft");
  }
  const data = { ...figureData(input.figures), comments: input.comments };
  if (existing) {
    return prisma.sundayReport.update({ where: { id: existing.id }, data });
  }
  return prisma.sundayReport.create({
    data: { cellId: input.cellId, serviceDate: input.serviceDate, status: "draft", ...data },
  });
}

export interface SubmitReportInput extends SaveDraftInput {
  actorRole: CellRole;
  channel?: ReportChannel;
  now?: Date;
}

/**
 * Rule 1 — the reporting window closes 07:00 the Monday after `serviceDate`.
 * A Cell Leader is blocked from submitting past that instant; anyone with a
 * coordinator role above them may still file on the cell's behalf, and the
 * result is marked filed-by-proxy.
 */
export async function submitReport(input: SubmitReportInput): Promise<SundayReport> {
  const now = input.now ?? new Date();
  const windowClosed = isReportingWindowClosed(input.serviceDate, now);
  const isCellLeader = input.actorRole === "cell_leader";

  if (windowClosed && isCellLeader) {
    throw new Error("The reporting window for this Sunday has closed. Ask your Section Leader to file on your behalf.");
  }

  const existing = await getReport(input.cellId, input.serviceDate);
  if (existing && existing.status === "approved") {
    throw new Error("This report has already been approved and is locked");
  }
  if (existing && existing.status === "pending") {
    throw new Error("This report is already submitted and awaiting review");
  }

  const data = {
    ...figureData(input.figures),
    comments: input.comments,
    status: "pending" as const,
    submittedById: input.actorUserId,
    submittedAt: now,
    channel: input.channel ?? "web",
    filedByProxy: !isCellLeader,
    reviewedById: null,
    reviewedAt: null,
    reviewNote: null,
  };

  const report = existing
    ? await prisma.sundayReport.update({ where: { id: existing.id }, data })
    : await prisma.sundayReport.create({ data: { cellId: input.cellId, serviceDate: input.serviceDate, ...data } });

  await logAudit({
    actorId: input.actorUserId,
    action: "submit_report",
    entity: "SundayReport",
    entityId: report.id,
    after: { status: report.status, channel: report.channel, filedByProxy: report.filedByProxy },
  });

  return report;
}

export async function approveReport(reportId: string, actorUserId: string): Promise<SundayReport> {
  const before = await prisma.sundayReport.findUniqueOrThrow({ where: { id: reportId } });
  if (before.status !== "pending") throw new Error("Only a pending report can be approved");

  const report = await prisma.sundayReport.update({
    where: { id: reportId },
    data: { status: "approved", reviewedById: actorUserId, reviewedAt: new Date(), reviewNote: null },
  });

  await logAudit({
    actorId: actorUserId,
    action: "approve_report",
    entity: "SundayReport",
    entityId: reportId,
    before: { status: before.status },
    after: { status: report.status },
  });

  return report;
}

export async function sendBackReport(reportId: string, actorUserId: string, reviewNote: string): Promise<SundayReport> {
  const before = await prisma.sundayReport.findUniqueOrThrow({ where: { id: reportId } });
  if (before.status !== "pending") throw new Error("Only a pending report can be sent back");

  const report = await prisma.sundayReport.update({
    where: { id: reportId },
    data: { status: "sent_back", reviewedById: actorUserId, reviewedAt: new Date(), reviewNote },
  });

  await logAudit({
    actorId: actorUserId,
    action: "send_back_report",
    entity: "SundayReport",
    entityId: reportId,
    before: { status: before.status },
    after: { status: report.status, reviewNote },
  });

  return report;
}

// ---------------------------------------------------------------------------
// Trailing history / variance / streaks
// ---------------------------------------------------------------------------

export async function trailingPresentAverage(cellId: string, beforeServiceDate: Date): Promise<number | null> {
  const rows = await prisma.sundayReport.findMany({
    where: { cellId, serviceDate: { lt: beforeServiceDate }, status: { in: ["approved", "pending", "sent_back"] } },
    orderBy: { serviceDate: "desc" },
    take: 8,
    select: { membersPresent: true },
  });
  return trailingAverage(rows.map((r) => r.membersPresent));
}

export async function isReportFlagged(report: Pick<SundayReport, "cellId" | "serviceDate" | "membersPresent">): Promise<boolean> {
  const avg = await trailingPresentAverage(report.cellId, report.serviceDate);
  return isFigureVarianceFlagged(report.membersPresent, avg);
}

/** The last `count` closed Sundays' outcomes for a cell, most recent first — the single source for streaks/chronic/history everywhere. */
export async function cellWeekHistory(
  cellId: string,
  count: number,
  now: Date = new Date(),
): Promise<{ serviceDate: Date; status: ReportRowStatus; outcome: WeekOutcome; report: SundayReport | null }[]> {
  const sundays = lastClosedSundays(count, now);
  const reports = await prisma.sundayReport.findMany({
    where: { cellId, serviceDate: { in: sundays } },
  });
  const byDate = new Map(reports.map((r) => [r.serviceDate.toISOString(), r]));

  return sundays.map((serviceDate) => {
    const report = byDate.get(serviceDate.toISOString()) ?? null;
    const status: ReportRowStatus = report?.status ?? null;
    return { serviceDate, status, outcome: classifyWeek(status), report };
  });
}

export async function cellChronicStreak(cellId: string, now: Date = new Date()): Promise<{ streak: number; chronic: boolean }> {
  const history = await cellWeekHistory(cellId, 12, now);
  const streak = consecutiveMissedSundays(history.map((h) => h.outcome));
  return { streak, chronic: isChronicCell(streak) };
}

export function consecutiveReportedSundays(weeksMostRecentFirst: WeekOutcome[]): number {
  let streak = 0;
  for (const w of weeksMostRecentFirst) {
    if (w === "missing") break;
    streak++;
  }
  return streak;
}
