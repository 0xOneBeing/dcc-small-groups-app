import { redirect } from "next/navigation";
import { requireRoleGroup } from "@/lib/auth/guard";
import { Shell } from "@/components/shell/Shell";
import { getLeaderCell } from "@/lib/cells/service";
import { listFollowUpsForCell } from "@/lib/followups/service";
import { getReport } from "@/lib/reports/service";
import { mostRecentSunday } from "@/lib/dates";

export default async function CellLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRoleGroup("leader");
  const leaderCell = await getLeaderCell(user.id);
  if (!leaderCell) redirect("/sign-in");

  const followUps = await listFollowUpsForCell(leaderCell.cell.id);
  const overdueCount = followUps.filter((f) => f.overdue).length;
  const thisSunday = mostRecentSunday(new Date());
  const report = await getReport(leaderCell.cell.id, thisSunday);
  const reportDue = !report || report.status === "draft" || report.status === "sent_back";

  return (
    <Shell
      group="leader"
      userName={user.name}
      userRoleLabel={`Cell Leader · ${leaderCell.unit.name}`}
      badges={{
        "/cell/report": reportDue ? 1 : 0,
        "/cell/follow-ups": overdueCount,
      }}
    >
      {children}
    </Shell>
  );
}
