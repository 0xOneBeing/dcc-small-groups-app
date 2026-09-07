import { redirect } from "next/navigation";
import { requireRoleGroup } from "@/lib/auth/guard";
import { getLeaderCell } from "@/lib/cells/service";
import { listFollowUpsForCell } from "@/lib/followups/service";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { FollowUpsList, type FollowUpRow } from "@/components/leader/FollowUpsList";
import { formatServiceDate } from "@/lib/dates";

export default async function CellFollowUpsPage() {
  const { user } = await requireRoleGroup("leader");
  const leaderCell = await getLeaderCell(user.id);
  if (!leaderCell) redirect("/sign-in");

  const followUps = await listFollowUpsForCell(leaderCell.cell.id);
  const assignedByIds = [...new Set(followUps.map((f) => f.assignedById))];
  const assigners = await prisma.user.findMany({ where: { id: { in: assignedByIds } }, select: { id: true, name: true } });
  const nameById = new Map(assigners.map((a) => [a.id, a.name]));

  const rows: FollowUpRow[] = followUps.map((f) => ({
    id: f.id,
    personName: f.personName,
    phone: f.phone,
    type: f.type,
    address: f.address,
    assignedByName: nameById.get(f.assignedById) ?? "—",
    assignedAt: formatServiceDate(f.assignedAt),
    status: f.status,
    outcomeNote: f.outcomeNote,
    overdue: f.overdue,
  }));

  return (
    <>
      <PageHeader eyebrow={leaderCell.unit.name} title="Follow-ups" sub="New guests and converts assigned to your cell" />
      <FollowUpsList followUps={rows} />
    </>
  );
}
