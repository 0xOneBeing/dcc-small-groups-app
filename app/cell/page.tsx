"use client";

import { useMemo } from "react";
import { PageHeader, Card, LinkButton } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { colors, mono } from "@/lib/tokens";
import { useMyReports } from "@/hooks/api/reports";
import { mostRecentSunday, formatServiceDate } from "@/lib/dates";
import type { ApprovalStatus, SundayReport } from "@/lib/api/types";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Pastoral follow-up touches logged for a week — the four "Visitation Among Members" channels. */
function followUpsOf(r: SundayReport): number {
  return (
    (r.physical_checkup ?? 0) +
    (r.phone_checkup ?? 0) +
    (r.text_checkup ?? 0) +
    (r.email_checkup ?? 0)
  );
}

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

  const stats = useMemo(() => {
    const approved = reports.filter((r) => r.approval_status === "APPROVED").length;
    const pending = reports.filter((r) => r.approval_status === "PENDING").length;
    const attended = reports.filter((r) => (r.members_present ?? 0) > 0);
    const avgAttendance = attended.length
      ? Math.round(attended.reduce((sum, r) => sum + (r.members_present ?? 0), 0) / attended.length)
      : 0;
    const totalOffering = reports.reduce((sum, r) => sum + (r.total_offering ?? 0), 0);
    const totalFollowUps = reports.reduce((sum, r) => sum + followUpsOf(r), 0);
    return { approved, pending, avgAttendance, totalOffering, totalFollowUps };
  }, [reports]);

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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 16 }}>
          <StatCard label="Total submitted" value={String(reports.length)} loading={mine.isLoading} />
          <StatCard label="Approved" value={String(stats.approved)} loading={mine.isLoading} />
          <StatCard label="Pending review" value={String(stats.pending)} loading={mine.isLoading} />
          <StatCard
            label="Reporting streak"
            value={`${streak} wk${streak === 1 ? "" : "s"}`}
            loading={mine.isLoading}
          />
          <StatCard label="Avg attendance" value={String(stats.avgAttendance)} loading={mine.isLoading} />
          <StatCard
            label="Follow-ups logged"
            value={String(stats.totalFollowUps)}
            loading={mine.isLoading}
          />
          <StatCard
            label="Offering recorded"
            value={naira.format(stats.totalOffering)}
            loading={mine.isLoading}
          />
        </div>

        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Submission record — most recent</div>
          {mine.isLoading ? (
            <SubmissionTableSkeleton />
          ) : reports.length === 0 ? (
            <div style={{ fontSize: 12.5, color: colors.faint }}>No reports submitted yet.</div>
          ) : (
            <SubmissionTable rows={reports.slice(0, 8)} />
          )}
        </Card>
      </div>
    </>
  );
}

type Align = "left" | "right";
const SUBMISSION_COLUMNS: { key: string; label: string; align: Align }[] = [
  { key: "date", label: "Service date", align: "left" },
  { key: "meeting", label: "Meeting", align: "left" },
  { key: "members", label: "Members", align: "right" },
  { key: "guests", label: "Guest cards", align: "right" },
  { key: "followups", label: "Follow-ups", align: "right" },
  { key: "offering", label: "Offering", align: "right" },
  { key: "status", label: "Status", align: "right" },
];

function alignClass(align: Align) {
  return align === "right" ? "text-right" : undefined;
}

function HeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {SUBMISSION_COLUMNS.map((c) => (
          <TableHead key={c.key} className={alignClass(c.align)}>
            {c.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function SubmissionTable({ rows }: { rows: SundayReport[] }) {
  return (
    <Table>
      <HeaderRow />
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {r.service_date ? formatServiceDate(new Date(r.service_date)) : "—"}
            </TableCell>
            <TableCell
              className={r.meeting_held === false ? "text-destructive" : "text-muted-foreground"}
            >
              {r.meeting_held === false ? "Not held" : r.meeting_held ? "Held" : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">{r.members_present ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{r.guests_cards ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{followUpsOf(r)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {r.total_offering != null ? naira.format(r.total_offering) : "—"}
            </TableCell>
            <TableCell className="text-right">
              <StatusPill status={r.approval_status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SubmissionTableSkeleton({ rows = 5 }: { rows?: number }) {
  const widths = ["w-20", "w-14", "w-8", "w-8", "w-8", "w-16", "w-16"];
  return (
    <Table>
      <HeaderRow />
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {SUBMISSION_COLUMNS.map((c, j) => (
              <TableCell key={c.key}>
                <Skeleton
                  className={`h-4 ${widths[j]} ${c.align === "right" ? "ml-auto" : ""} ${
                    c.key === "status" ? "h-5 rounded-full" : ""
                  }`}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatCard({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      {loading ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            fontFamily: mono,
            color: colors.ink,
          }}
        >
          {value}
        </div>
      )}
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
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-4 w-64" />
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
