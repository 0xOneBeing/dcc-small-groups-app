import "server-only";
import { prisma } from "@/lib/prisma";
import { subtreeUnitIds } from "@/lib/org/subtree";
import { lastClosedSundays } from "@/lib/dates";
import { classifyWeek, consecutiveMissedSundays, type ReportRowStatus } from "@/lib/rules/chronic";
import { cellComplianceCounts, sumComplianceCounts, type ComplianceCounts } from "@/lib/rules/compliance";
import type { OrgUnit } from "@prisma/client";

const HISTORY_WEEKS = 12; // current + 11 prior — enough margin to see a chronic (3-week) streak clearly

export interface CellComplianceRow {
  cellId: string;
  unitId: string;
  currentStatus: ReportRowStatus;
  counts: ComplianceCounts;
  missedStreak: number;
}

/** Computes each cell's current-week status and compliance counts from report history — never denormalised. */
export async function computeCellCompliance(
  cellIds: string[],
  now: Date = new Date(),
): Promise<Map<string, CellComplianceRow>> {
  if (cellIds.length === 0) return new Map();
  const sundays = lastClosedSundays(HISTORY_WEEKS, now); // most recent first

  const [reports, cells] = await Promise.all([
    prisma.sundayReport.findMany({
      where: { cellId: { in: cellIds }, serviceDate: { in: sundays } },
      select: { cellId: true, serviceDate: true, status: true },
    }),
    prisma.cell.findMany({ where: { id: { in: cellIds } }, select: { id: true, unitId: true } }),
  ]);

  const byCell = new Map<string, Map<number, ReportRowStatus>>();
  for (const r of reports) {
    if (!byCell.has(r.cellId)) byCell.set(r.cellId, new Map());
    byCell.get(r.cellId)!.set(r.serviceDate.getTime(), r.status);
  }

  const result = new Map<string, CellComplianceRow>();
  for (const cell of cells) {
    const statusByDate = byCell.get(cell.id) ?? new Map();
    const weeks: ReportRowStatus[] = sundays.map((d) => statusByDate.get(d.getTime()) ?? null);
    const [currentWeek, ...prior] = weeks;
    const counts = cellComplianceCounts({ currentWeek, priorWeeksMostRecentFirst: prior });
    const missedStreak = consecutiveMissedSundays(weeks.map(classifyWeek));
    result.set(cell.id, { cellId: cell.id, unitId: cell.unitId, currentStatus: currentWeek, counts, missedStreak });
  }
  return result;
}

export interface UnitCompliance extends ComplianceCounts {
  totalCells: number;
}

export async function complianceForUnit(unitId: string, now: Date = new Date()): Promise<UnitCompliance> {
  const ids = await subtreeUnitIds([unitId]);
  const cells = await prisma.cell.findMany({ where: { unitId: { in: ids } }, select: { id: true } });
  const byCell = await computeCellCompliance(
    cells.map((c) => c.id),
    now,
  );
  const counts = sumComplianceCounts([...byCell.values()].map((c) => c.counts));
  return { ...counts, totalCells: cells.length };
}

export interface ChildComplianceRow {
  unit: OrgUnit;
  compliance: UnitCompliance;
}

export async function complianceForChildren(
  unitId: string,
  now: Date = new Date(),
): Promise<{ unit: OrgUnit & { children: OrgUnit[] }; rows: ChildComplianceRow[] }> {
  const unit = await prisma.orgUnit.findUniqueOrThrow({
    where: { id: unitId },
    include: { children: { orderBy: { name: "asc" } } },
  });
  const rows = await Promise.all(
    unit.children.map(async (child) => ({ unit: child, compliance: await complianceForUnit(child.id, now) })),
  );
  return { unit, rows };
}

/** 8-week compliance-rate trend for a unit, most recent week last. */
export async function complianceTrend(unitId: string, weeks = 8, now: Date = new Date()): Promise<number[]> {
  const ids = await subtreeUnitIds([unitId]);
  const cells = await prisma.cell.findMany({ where: { unitId: { in: ids } }, select: { id: true } });
  const cellIds = cells.map((c) => c.id);
  if (cellIds.length === 0) return Array(weeks).fill(0);

  const sundays = lastClosedSundays(weeks, now); // most recent first
  const out: number[] = [];
  for (const sunday of [...sundays].reverse()) {
    const byCell = await computeCellCompliance(cellIds, new Date(sunday.getTime() + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000));
    const counts = sumComplianceCounts([...byCell.values()].map((c) => c.counts));
    const rate = cellIds.length ? Math.round(((counts.submitted + counts.pending) / cellIds.length) * 100) : 0;
    out.push(rate);
  }
  return out;
}
