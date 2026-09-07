"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveUserScope, assertScopeIncludesUnit } from "@/lib/auth/scope";
import { setMemberActive } from "./members";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const setActiveSchema = z.object({ memberId: z.string().min(1), active: z.boolean() });

export async function setMemberActiveAction(input: unknown): Promise<ActionResult> {
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("Not signed in");
    const member = await prisma.cellMember.findUniqueOrThrow({ where: { id: parsed.data.memberId }, include: { cell: true } });
    const scope = await resolveUserScope(session.userId);
    assertScopeIncludesUnit(scope, member.cell.unitId);

    await setMemberActive(member.id, parsed.data.active, session.userId);
    revalidatePath("/cell/members");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update member" };
  }
}
