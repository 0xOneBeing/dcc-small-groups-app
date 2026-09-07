"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveUserScope, assertScopeIncludesUnit } from "@/lib/auth/scope";
import * as followUpService from "./service";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const logOutcomeSchema = z.object({
  followUpId: z.string().min(1),
  status: z.enum(["contacted", "unable_to_reach", "joined_cell"]),
  note: z.string().max(2000).optional(),
});

export async function logFollowUpOutcomeAction(input: unknown): Promise<ActionResult> {
  const parsed = logOutcomeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("Not signed in");
    const followUp = await prisma.followUp.findUniqueOrThrow({
      where: { id: parsed.data.followUpId },
      include: { assignedCell: true },
    });
    const scope = await resolveUserScope(session.userId);
    assertScopeIncludesUnit(scope, followUp.assignedCell.unitId);

    await followUpService.logFollowUpOutcome(followUp.id, parsed.data.status, parsed.data.note, session.userId);
    revalidatePath("/cell/follow-ups");
    revalidatePath("/coordinator/follow-ups");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not log outcome" };
  }
}

const reassignSchema = z.object({
  followUpId: z.string().min(1),
  newCellId: z.string().min(1),
});

export async function reassignFollowUpAction(input: unknown): Promise<ActionResult> {
  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("Not signed in");
    const [followUp, newCell] = await Promise.all([
      prisma.followUp.findUniqueOrThrow({ where: { id: parsed.data.followUpId }, include: { assignedCell: true } }),
      prisma.cell.findUniqueOrThrow({ where: { id: parsed.data.newCellId } }),
    ]);
    const scope = await resolveUserScope(session.userId);
    assertScopeIncludesUnit(scope, followUp.assignedCell.unitId);
    assertScopeIncludesUnit(scope, newCell.unitId);

    await followUpService.reassignFollowUp(followUp.id, newCell.id, session.userId);
    revalidatePath("/coordinator/follow-ups");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reassign follow-up" };
  }
}
