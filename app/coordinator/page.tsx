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
import type { NonSubmitterRow } from "@/lib/api/types";
import {
  BarStrip,
  ErrorCard,
  SectionCard,
  ServiceDatePicker,
  StatTile,
  complianceColor,
  defaultServiceDate,
} from "@/components/coordinator/kit";

type TrendWeeks = 4 | 8 | 12;

export default function CompliancePage() {
  const [serviceDate, setServiceDate] = useState(defaultServiceDate);
  const [weeks, setWeeks] = useState<TrendWeeks>(8);
  const [chronicOnly, setChronicOnly] = useState(false);

  const dash = useOrgDashboard(serviceDate);
  const trends = useComplianceTrends(weeks);
  const nonSubmitters = useNonSubmitters({ serviceDate, chronic: chronicOnly });

  const pct = Math.round(dash.data?.compliance_percentage ?? 0);
  const submitted = dash.data?.submitted_cells ?? 0;
  const total = dash.data?.total_cells ?? 0;

  const trendPoints = useMemo(
    () =>
      (trends.data ?? []).map((t) => ({
        value: Math.round(t.compliance_percentage ?? 0),
        label: t.service_date ? formatServiceDate(new Date(t.service_date)) : undefined,
      })),
    [trends.data],
  );

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
        sub="Sunday report submission across everything in your scope"
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
              hint={`${submitted} of ${total} cells submitted`}
              loading={dash.isLoading}
            />
            <StatTile
              label="Submitted"
              value={submitted}
              color={colors.green}
              hint="Reports received for this Sunday"
              loading={dash.isLoading}
            />
            <StatTile
              label="Pending approval"
              value={dash.data?.pending_approval ?? 0}
              color={colors.amber}
              hint="Waiting on an approver"
              loading={dash.isLoading}
            />
            <StatTile
              label="Approved"
              value={dash.data?.approved ?? 0}
              color={colors.ink}
              hint="Signed off for this Sunday"
              loading={dash.isLoading}
            />
          </div>
        )}

        <SectionCard
          title="Compliance trend"
          sub={`Submission rate over the last ${weeks} Sundays`}
          right={
            <div style={{ display: "flex", gap: 6 }}>
              {([4, 8, 12] as TrendWeeks[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeeks(w)}
                  style={{
                    border: `1px solid ${w === weeks ? colors.ink : colors.borderStrong}`,
                    background: w === weeks ? colors.ink : "#fff",
                    color: w === weeks ? "#fff" : colors.muted,
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          }
        >
          <div style={{ padding: 20 }}>
            {trends.isError ? (
              <div style={{ fontSize: 12.5, color: colors.red }}>
                Could not load trends: {trends.error.message}
              </div>
            ) : trends.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <BarStrip points={trendPoints} colorFor={complianceColor} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: colors.faint2 }}>
                  <span>{trendPoints[0]?.label ?? ""}</span>
                  <span>{trendPoints[trendPoints.length - 1]?.label ?? ""}</span>
                </div>
              </>
            )}
          </div>
        </SectionCard>

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
          Cell-by-cell drill-down through Region → District → Zone → Area → Section needs a
          child-unit listing the API does not expose yet; this view shows your whole scope rolled up.
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
