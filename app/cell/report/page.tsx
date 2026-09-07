import { redirect } from "next/navigation";
import { requireRoleGroup } from "@/lib/auth/guard";
import { getLeaderCell } from "@/lib/cells/service";
import { getReport } from "@/lib/reports/service";
import { ALL_FIGURE_KEYS, type FigureKey } from "@/lib/reports/fields";
import { mostRecentSunday } from "@/lib/dates";
import { isReportingWindowClosed } from "@/lib/rules/reportingWindow";
import { PageHeader } from "@/components/ui";
import { ReportWizard } from "@/components/leader/ReportWizard";

export default async function ReportPage() {
  const { user } = await requireRoleGroup("leader");
  const leaderCell = await getLeaderCell(user.id);
  if (!leaderCell) redirect("/sign-in");
  const { cell, unit } = leaderCell;

  const now = new Date();
  const serviceDate = mostRecentSunday(now);
  const report = await getReport(cell.id, serviceDate);
  const windowClosed = isReportingWindowClosed(serviceDate, now);

  const figures: Partial<Record<FigureKey, number | null>> = {};
  for (const key of ALL_FIGURE_KEYS) {
    figures[key] = report ? (report[key] as number | null) : null;
  }

  return (
    <>
      <PageHeader eyebrow={unit.name} title="Sunday report" sub={`For ${serviceDate.toISOString().slice(0, 10)}`} />
      <ReportWizard
        cellId={cell.id}
        serviceDate={serviceDate.toISOString().slice(0, 10)}
        initialFigures={figures}
        initialComments={report?.comments ?? ""}
        status={report?.status ?? null}
        reviewNote={report?.reviewNote ?? null}
        windowClosed={windowClosed}
        canSubmitDirectly={true}
      />
    </>
  );
}
