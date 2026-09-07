import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isFollowUpOverdue } from "@/lib/rules/followUpOverdue";
import { getFollowUpOverdueDays } from "@/lib/settings";
import type { FollowUp } from "@prisma/client";

export interface FollowUpWithOverdue extends FollowUp {
  overdue: boolean;
}

export async function annotateOverdue(followUps: FollowUp[], now: Date = new Date()): Promise<FollowUpWithOverdue[]> {
  const thresholdDays = await getFollowUpOverdueDays();
  return followUps.map((f) => ({
    ...f,
    overdue: isFollowUpOverdue({ status: f.status, assignedAt: f.assignedAt }, now, thresholdDays),
  }));
}

export async function listFollowUpsForCell(cellId: string): Promise<FollowUpWithOverdue[]> {
  const rows = await prisma.followUp.findMany({ where: { assignedCellId: cellId }, orderBy: { assignedAt: "desc" } });
  return annotateOverdue(rows);
}

export async function listFollowUpsForCells(cellIds: string[]): Promise<FollowUpWithOverdue[]> {
  const rows = await prisma.followUp.findMany({ where: { assignedCellId: { in: cellIds } }, orderBy: { assignedAt: "asc" } });
  return annotateOverdue(rows);
}

export async function logFollowUpOutcome(
  followUpId: string,
  status: "contacted" | "unable_to_reach" | "joined_cell",
  note: string | undefined,
  actorUserId: string,
): Promise<FollowUp> {
  const before = await prisma.followUp.findUniqueOrThrow({ where: { id: followUpId } });
  const updated = await prisma.followUp.update({
    where: { id: followUpId },
    data: { status, outcomeNote: note, outcomeLoggedAt: new Date() },
  });
  await logAudit({
    actorId: actorUserId,
    action: "log_followup_outcome",
    entity: "FollowUp",
    entityId: followUpId,
    before: { status: before.status },
    after: { status: updated.status, note },
  });
  return updated;
}

/** Reassigning restarts the clock and notifies both leaders. */
export async function reassignFollowUp(followUpId: string, newCellId: string, actorUserId: string): Promise<FollowUp> {
  const before = await prisma.followUp.findUniqueOrThrow({ where: { id: followUpId } });
  const updated = await prisma.followUp.update({
    where: { id: followUpId },
    data: {
      assignedCellId: newCellId,
      assignedById: actorUserId,
      assignedAt: new Date(),
      status: "not_contacted",
      outcomeNote: null,
      outcomeLoggedAt: null,
    },
  });
  await logAudit({
    actorId: actorUserId,
    action: "reassign_followup",
    entity: "FollowUp",
    entityId: followUpId,
    before: { assignedCellId: before.assignedCellId },
    after: { assignedCellId: updated.assignedCellId },
  });
  return updated;
}
