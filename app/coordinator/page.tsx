"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { colors } from "@/lib/tokens";
import { formatServiceDate } from "@/lib/dates";
import { useOrgDashboard, useComplianceTrends, useNonSubmitters } from "@/hooks/api/dashboard";
import { useApprovalSettings } from "@/hooks/api/approvals";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { NonSubmitterRow } from "@/lib/api/types";
import {
  BarStrip,
  ErrorCard,
  SectionCard,
  ServiceDatePicker,
  StatTile,
  complianceColor,
  defaultServiceDate,
  deltaFromTrend,
  displayNameFrom,
  formatHours,
} from "@/components/coordinator/kit";

const TREND_WEEKS = 8;

export default function CompliancePage() {
  const [serviceDate, setServiceDate] = useState(defaultServiceDate);
  const [chronicOnly, setChronicOnly] = useState(false);

  const { user } = useAuth();
  const { capabilities } = useRole();
  const dash = useOrgDashboard(serviceDate);
  const trends = useComplianceTrends(TREND_WEEKS);
  const nonSubmitters = useNonSubmitters({ serviceDate, chronic: chronicOnly });
  // Best-effort: some roles may not have access to this endpoint; failing
  // silently just drops the escalation-hours line, no error UI.
  const approvalSettings = useApprovalSettings();

  const pct = Math.round(dash.data?.compliance_percentage ?? 0);
  const submitted = dash.data?.submitted_cells ?? 0;
  const total = dash.data?.total_cells ?? 0;
  const missing = dash.data?.missing_cells?.length ?? Math.max(0, total - submitted);

  const personName = displayNameFrom(user);
  const subtitle = [capabilities.label, personName].filter(Boolean).join(" ") + (
    dash.data ? ` · ${total} cell${total === 1 ? "" : "s"} in scope` : ""
  );

  const escalationHours =
    !approvalSettings.isError && approvalSettings.data?.approval_interval != null
      ? formatHours(approvalSettings.data.approval_interval)
      : null;

  const trendPoints = useMemo(
    () =>
      (trends.data ?? []).map((t) => ({
        value: Math.round(t.compliance_percentage ?? 0),
        label: t.service_date ? formatServiceDate(new Date(t.service_date)) : undefined,
      })),
    [trends.data],
  );
  const delta = deltaFromTrend(trendPoints);

  const rows = useMemo(() => {
    const list = nonSubmitters.data ?? [];
    return [...list].sort(
      (a, b) => (b.consecutive_misses ?? 0) - (a.consecutive_misses ?? 0),
    );
  }, [nonSubmitters.data]);

  return (
    <>
      <PageHeader
        eyebrow="Coordinator"
        title="Compliance"
        sub={subtitle}
        right={<ServiceDatePicker value={serviceDate} onChange={setServiceDate} />}
      />

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 }}>
        {dash.isError ? (
          <ErrorCard message={`Could not load the compliance summary: ${dash.error.message}`} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
            <StatTile
              label="Compliance"
              value={`${pct}%`}
              color={complianceColor(pct)}
              delta={delta}
              trend={<BarStrip points={trendPoints} colorFor={complianceColor} />}
              hint={`Last ${TREND_WEEKS} Sundays`}
              loading={dash.isLoading || trends.isLoading}
            />
            <StatTile
              label="Not submitted"
              value={missing}
              color={colors.red}
              hint="Cells with no report for this Sunday yet."
              loading={dash.isLoading}
            />
            <StatTile
              label="Pending approval"
              value={dash.data?.pending_approval ?? 0}
              color={colors.amber}
              hint={
                escalationHours
                  ? `Routes to the next approver if not acted on within ${escalationHours}.`
                  : "Waiting on an approver."
              }
              loading={dash.isLoading}
            />
            <StatTile
              label="Chronic non-reporters"
              value={rows.filter((r) => r.chronic ?? (r.consecutive_misses ?? 0) >= 3).length}
              color={colors.red}
              hint="Missed 3 or more consecutive Sundays."
              loading={nonSubmitters.isLoading}
            />
          </div>
        )}

        <SectionCard
          title="Non-reporting cells"
          sub={
            chronicOnly
              ? "Cells that have missed 3+ consecutive Sundays"
              : "Cells with no report for the selected Sunday"
          }
          right={
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { k: false, label: "All" },
                { k: true, label: "Chronic" },
              ].map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setChronicOnly(f.k)}
                  style={{
                    border: `1px solid ${f.k === chronicOnly ? colors.ink : colors.borderStrong}`,
                    background: f.k === chronicOnly ? colors.ink : "#fff",
                    color: f.k === chronicOnly ? "#fff" : colors.muted,
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        >
          {nonSubmitters.isError ? (
            <div style={{ padding: 20, fontSize: 12.5, color: colors.red }}>
              Could not load non-submitters: {nonSubmitters.error.message}
            </div>
          ) : nonSubmitters.isLoading ? (
            <NonSubmitterSkeleton />
          ) : rows.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: colors.green }}>
              {chronicOnly ? "No chronic non-reporters in scope." : "Every cell in scope reported."}
            </div>
          ) : (
            <NonSubmitterTable rows={rows} />
          )}
        </SectionCard>

        <div style={{ fontSize: 11, color: colors.faint2, lineHeight: 1.5 }}>
          Drill-down into individual districts, zones, areas and sections needs a child-unit listing
          the API does not expose yet — this view shows your whole scope rolled up into one list of
          non-reporting cells instead.
        </div>
      </div>
    </>
  );
}

const NS_COLUMNS = ["Cell", "Section", "Consecutive misses", "Status"] as const;

function NonSubmitterTable({ rows }: { rows: NonSubmitterRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {NS_COLUMNS.map((c) => (
            <TableHead key={c} className={c === "Consecutive misses" ? "text-right" : undefined}>
              {c}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => {
          const misses = r.consecutive_misses ?? 0;
          const chronic = r.chronic ?? misses >= 3;
          return (
            <TableRow key={(r.cell as string) ?? i}>
              <TableCell className="font-medium">{r.cell_name ?? r.cell ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {(r.section as string) ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{misses || "—"}</TableCell>
              <TableCell>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: chronic ? colors.redSoft : colors.amberSoft,
                    color: chronic ? colors.red : colors.amber,
                  }}
                >
                  {chronic ? "Chronic" : "Not submitted"}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function NonSubmitterSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {NS_COLUMNS.map((c) => (
            <TableHead key={c} className={c === "Consecutive misses" ? "text-right" : undefined}>
              {c}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
