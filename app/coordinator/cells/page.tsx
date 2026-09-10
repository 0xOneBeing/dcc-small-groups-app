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
import { useNonSubmitters } from "@/hooks/api/dashboard";
import type { NonSubmitterRow } from "@/lib/api/types";
import {
  ErrorCard,
  SectionCard,
  ServiceDatePicker,
  defaultServiceDate,
} from "@/components/coordinator/kit";

/**
 * Cells register — scoped to what the API exposes at cell granularity today:
 * the non-reporting / chronic cells for a given Sunday. A full register with
 * per-cell submission rates needs an endpoint the API does not offer yet.
 */
export default function CellsPage() {
  const [serviceDate, setServiceDate] = useState(defaultServiceDate);
  const [chronicOnly, setChronicOnly] = useState(false);
  const [query, setQuery] = useState("");

  const nonSubmitters = useNonSubmitters({ serviceDate, chronic: chronicOnly });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(nonSubmitters.data ?? [])]
      .filter((r) => {
        if (!q) return true;
        return `${r.cell_name ?? ""} ${r.cell ?? ""} ${r.section ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.consecutive_misses ?? 0) - (a.consecutive_misses ?? 0));
  }, [nonSubmitters.data, query]);

  return (
    <>
      <PageHeader
        eyebrow="Coordinator"
        title="Cells"
        sub="Non-reporting and chronic cells in your scope"
        right={<ServiceDatePicker value={serviceDate} onChange={setServiceDate} />}
      />

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, maxWidth: 1000 }}>
        {nonSubmitters.isError ? (
          <ErrorCard message={`Could not load cells: ${nonSubmitters.error.message}`} />
        ) : (
          <SectionCard
            title={chronicOnly ? "Chronic non-reporters" : "Did not report"}
            sub={
              nonSubmitters.isLoading
                ? "Loading…"
                : `${rows.length} cell${rows.length === 1 ? "" : "s"}`
            }
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cell, code or section"
                  style={{
                    minHeight: 34,
                    width: 200,
                    border: `1px solid ${colors.borderStrong}`,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12.5,
                    outline: "none",
                    background: "#fff",
                  }}
                />
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
                      padding: "6px 10px",
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
            {nonSubmitters.isLoading ? (
              <CellsSkeleton />
            ) : rows.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: colors.green }}>
                {query
                  ? "No cells match that search."
                  : chronicOnly
                    ? "No chronic non-reporters in scope."
                    : "Every cell in scope reported for this Sunday."}
              </div>
            ) : (
              <CellsTable rows={rows} />
            )}
          </SectionCard>
        )}
      </div>
    </>
  );
}

const COLUMNS = ["Cell", "Code", "Section", "Consecutive misses", "Status"] as const;

function CellsTable({ rows }: { rows: NonSubmitterRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
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
          const code = (r.cell_code as string) ?? (r.code as string) ?? "—";
          return (
            <TableRow key={(r.cell as string) ?? i}>
              <TableCell className="font-medium">{r.cell_name ?? r.cell ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{code}</TableCell>
              <TableCell className="text-muted-foreground">{(r.section as string) ?? "—"}</TableCell>
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

function CellsSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableHead key={c} className={c === "Consecutive misses" ? "text-right" : undefined}>
              {c}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
