import { redirect } from "next/navigation";
import { requireRoleGroup } from "@/lib/auth/guard";
import { getLeaderCell } from "@/lib/cells/service";
import { getMemberRegister } from "@/lib/cells/members";
import { lastClosedSundays, formatServiceDate } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { MembersRegister, type MemberRow } from "@/components/leader/MembersRegister";

export default async function CellMembersPage() {
  const { user } = await requireRoleGroup("leader");
  const leaderCell = await getLeaderCell(user.id);
  if (!leaderCell) redirect("/sign-in");

  const now = new Date();
  const register = await getMemberRegister(leaderCell.cell.id, now);
  const weekLabels = lastClosedSundays(8, now).map((d) => formatServiceDate(d));

  const rows: MemberRow[] = register.map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    roleInCell: m.roleInCell,
    active: m.active,
    presenceStrip: m.presenceStrip,
    missedStreak: m.missedStreak,
    lastSeenLabel: m.lastSeen ? formatServiceDate(m.lastSeen) : null,
  }));

  return (
    <>
      <PageHeader eyebrow={leaderCell.unit.name} title="Cell members" sub={`${rows.filter((r) => r.active).length} active members`} />
      <MembersRegister members={rows} weekLabels={weekLabels} />
    </>
  );
}
