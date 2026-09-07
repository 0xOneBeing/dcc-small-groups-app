import "server-only";
import { prisma } from "@/lib/prisma";
import { lastClosedSundays } from "@/lib/dates";
import type { CellMemberRole } from "@prisma/client";
import { MISSED_LATELY_THRESHOLD } from "./constants";

export { MISSED_LATELY_THRESHOLD };

export interface MemberRegisterRow {
  id: string;
  name: string;
  phone: string | null;
  roleInCell: CellMemberRole;
  active: boolean;
  /** Most recent Sunday first. `null` = that Sunday has no report to attach attendance to. */
  presenceStrip: (boolean | null)[];
  missedStreak: number;
  lastSeen: Date | null;
}

export async function getMemberRegister(cellId: string, now: Date = new Date()): Promise<MemberRegisterRow[]> {
  const weeks = lastClosedSundays(8, now); // most recent first

  const [members, reports] = await Promise.all([
    prisma.cellMember.findMany({ where: { cellId }, orderBy: { name: "asc" } }),
    prisma.sundayReport.findMany({ where: { cellId, serviceDate: { in: weeks } }, select: { id: true, serviceDate: true } }),
  ]);

  const reportIdByWeek = new Map(weeks.map((w) => [w.getTime(), reports.find((r) => r.serviceDate.getTime() === w.getTime())?.id ?? null]));
  const reportIds = reports.map((r) => r.id);

  const attendance = reportIds.length
    ? await prisma.cellMemberAttendance.findMany({
        where: { sundayReportId: { in: reportIds }, cellMemberId: { in: members.map((m) => m.id) } },
        select: { cellMemberId: true, sundayReportId: true, present: true },
      })
    : [];
  const presentByKey = new Map(attendance.map((a) => [`${a.cellMemberId}:${a.sundayReportId}`, a.present]));

  return members.map((member) => {
    const presenceStrip = weeks.map((w) => {
      const reportId = reportIdByWeek.get(w.getTime());
      if (!reportId) return null;
      return presentByKey.get(`${member.id}:${reportId}`) ?? null;
    });

    let missedStreak = 0;
    for (const present of presenceStrip) {
      if (present === null) continue; // no report that week — doesn't break or extend a member's own streak
      if (present) break;
      missedStreak++;
    }

    const lastSeenIndex = presenceStrip.findIndex((p) => p === true);
    const lastSeen = lastSeenIndex === -1 ? null : weeks[lastSeenIndex];

    return {
      id: member.id,
      name: member.name,
      phone: member.phone,
      roleInCell: member.roleInCell,
      active: member.active,
      presenceStrip,
      missedStreak,
      lastSeen,
    };
  });
}

export async function setMemberActive(memberId: string, active: boolean, actorUserId: string) {
  const { logAudit } = await import("@/lib/audit");
  const before = await prisma.cellMember.findUniqueOrThrow({ where: { id: memberId } });
  const updated = await prisma.cellMember.update({ where: { id: memberId }, data: { active } });
  await logAudit({
    actorId: actorUserId,
    action: active ? "reactivate_member" : "deactivate_member",
    entity: "CellMember",
    entityId: memberId,
    before: { active: before.active },
    after: { active: updated.active },
  });
  return updated;
}
