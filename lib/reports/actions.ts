"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveUserScope, assertScopeIncludesUnit } from "@/lib/auth/scope";
import { saveDraftSchema, submitReportSchema, sendBackSchema, approveReportSchema } from "@/lib/validation/report";
import * as reportService from "./service";
import { toDate } from "./service";
import type { CellRole } from "@prisma/client";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function requireSessionAndCellScope(cellId: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error("Not signed in");
  const cell = await prisma.cell.findUniqueOrThrow({ where: { id: cellId } });
  const scope = await resolveUserScope(session.userId);
  assertScopeIncludesUnit(scope, cell.unitId);
  return { session, scope, cell };
}

function actorRoleForCell(scope: Awaited<ReturnType<typeof resolveUserScope>>, cellUnitId: string): CellRole {
  const direct = scope.roles.find((r) => r.unitId === cellUnitId && r.role === "cell_leader");
  if (direct) return "cell_leader";
  return scope.roles[0]?.role ?? "section_leader";
}

export async function saveDraftAction(input: unknown): Promise<ActionResult<{ reportId: string }>> {
  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { session, cell } = await requireSessionAndCellScope(parsed.data.cellId);
    const report = await reportService.saveDraft({
      cellId: cell.id,
      serviceDate: toDate(parsed.data.serviceDate),
      figures: parsed.data.figures,
      comments: parsed.data.comments,
      actorUserId: session.userId,
    });
    return { ok: true, data: { reportId: report.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save draft" };
  }
}

export async function submitReportAction(input: unknown): Promise<ActionResult<{ reportId: string }>> {
  const parsed = submitReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { session, scope, cell } = await requireSessionAndCellScope(parsed.data.cellId);
    const report = await reportService.submitReport({
      cellId: cell.id,
      serviceDate: toDate(parsed.data.serviceDate),
      figures: parsed.data.figures,
      comments: parsed.data.comments,
      actorUserId: session.userId,
      actorRole: actorRoleForCell(scope, cell.unitId),
    });
    revalidatePath("/cell");
    revalidatePath("/coordinator/approvals");
    return { ok: true, data: { reportId: report.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not submit report" };
  }
}

export async function approveReportAction(input: unknown): Promise<ActionResult> {
  const parsed = approveReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("Not signed in");
    const report = await prisma.sundayReport.findUniqueOrThrow({ where: { id: parsed.data.reportId }, include: { cell: true } });
    const scope = await resolveUserScope(session.userId);
    assertScopeIncludesUnit(scope, report.cell.unitId);

    await reportService.approveReport(report.id, session.userId);
    revalidatePath("/coordinator/approvals");
    revalidatePath("/coordinator");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not approve report" };
  }
}

export async function sendBackReportAction(input: unknown): Promise<ActionResult> {
  const parsed = sendBackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("Not signed in");
    const report = await prisma.sundayReport.findUniqueOrThrow({ where: { id: parsed.data.reportId }, include: { cell: true } });
    const scope = await resolveUserScope(session.userId);
    assertScopeIncludesUnit(scope, report.cell.unitId);

    await reportService.sendBackReport(report.id, session.userId, parsed.data.reviewNote);
    revalidatePath("/coordinator/approvals");
    revalidatePath("/coordinator");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not send back report" };
  }
}
