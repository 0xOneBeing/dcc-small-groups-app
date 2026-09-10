"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, LinkButton } from "@/components/ui";
import { colors, mono } from "@/lib/tokens";
import { useMyReports } from "@/hooks/api/reports";
import { mostRecentSunday, formatServiceDate } from "@/lib/dates";
import type { ApprovalStatus, SundayReport } from "@/lib/api/types";

export default function MyCellPage() {
  const serviceDate = useMemo(() => mostRecentSunday(new Date()).toISOString().slice(0, 10), []);
  const mine = useMyReports();

  const reports = useMemo(
    () =>
      [...(mine.data ?? [])].sort((a, b) =>
        (b.service_date ?? "").localeCompare(a.service_date ?? ""),
      ),
    [mine.data],
  );
  const current = reports.find((r) => r.service_date === serviceDate) ?? null;

  // Consecutive most-recent weeks that were reported (any status other than a miss).
  const streak = useMemo(() => {
    let n = 0;
    for (const r of reports) {
      if (r.approval_status === "DELETED") break;
      n++;
    }
    return n;
  }, [reports]);

  const approvedCount = reports.filter((r) => r.approval_status === "APPROVED").length;

  return (
    <>
      <PageHeader eyebrow="My cell" title="Cell Leader" sub="Your Sunday reporting at a glance" />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>
        {mine.isError ? (
          <Card style={{ padding: 20, background: colors.redSoft, borderColor: colors.redSoftBorder }}>
            <div style={{ fontSize: 13.5, color: colors.red }}>Could not load your reports: {mine.error.message}</div>
          </Card>
        ) : (
          <NextActionCard report={current} serviceDate={serviceDate} loading={mine.isLoading} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          <StatCard label="Reporting streak" value={mine.isLoading ? "—" : `${streak} wk${streak === 1 ? "" : "s"}`} />
          <StatCard label="Approved reports" value={mine.isLoading ? "—" : String(approvedCount)} />
          <StatCard label="Total submitted" value={mine.isLoading ? "—" : String(reports.length)} />
        </div>

        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Submission record — most recent</div>
          {mine.isLoading ? (
            <div style={{ fontSize: 12.5, color: colors.muted }}>Loading…</div>
          ) : reports.length === 0 ? (
            <div style={{ fontSize: 12.5, color: colors.faint }}>No reports submitted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reports.slice(0, 8).map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: colors.muted }}>
                    {r.service_date ? formatServiceDate(new Date(r.service_date)) : "—"}
                  </span>
                  <StatusPill status={r.approval_status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", fontFamily: mono, color: colors.ink }}>{value}</div>
      <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 4 }}>{label}</div>
    </Card>
  );
}

function StatusPill({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, { label: string; bg: string; fg: string }> = {
    APPROVED: { label: "Approved", bg: colors.greenSoft, fg: colors.green },
    PENDING: { label: "Pending", bg: colors.amberSoft, fg: colors.amber },
    REJECTED: { label: "Sent back", bg: colors.redSoft, fg: colors.red },
    DELETED: { label: "Deleted", bg: colors.chipGrey, fg: colors.muted },
  };
  const t = map[status];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: t.bg, color: t.fg }}>
      {t.label}
    </span>
  );
}

function NextActionCard({
  report,
  serviceDate,
  loading,
}: {
  report: SundayReport | null;
  serviceDate: string;
  loading: boolean;
}) {
  const dueLabel = `${formatServiceDate(new Date(serviceDate))} report`;

  if (loading) {
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 14, color: colors.muted }}>Checking this week&apos;s report…</div>
      </Card>
    );
  }

  if (report?.approval_status === "REJECTED") {
    return (
      <Card style={{ padding: 20, borderColor: colors.redSoftBorder, background: colors.redSoft }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.red, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Sent back
        </div>
        <div style={{ fontSize: 14, marginTop: 6, marginBottom: 10 }}>{report.comment || "Your approver asked for a correction."}</div>
        <LinkButton href="/cell/report" variant="primary">
          Edit and resubmit
        </LinkButton>
      </Card>
    );
  }

  if (report?.approval_status === "PENDING") {
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.amber, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Submitted
        </div>
        <div style={{ fontSize: 14, marginTop: 6 }}>{dueLabel} is waiting on your Section Leader for approval.</div>
      </Card>
    );
  }

  if (report?.approval_status === "APPROVED") {
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.green, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Approved
        </div>
        <div style={{ fontSize: 14, marginTop: 6 }}>{dueLabel} was approved. Nothing due right now.</div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 20, borderColor: colors.border }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Due</div>
      <div style={{ fontSize: 14, marginTop: 6, marginBottom: 10 }}>{dueLabel} is outstanding.</div>
      <LinkButton href="/cell/report" variant="primary">
        Start report
      </LinkButton>
    </Card>
  );
}
