"use client";

import { useState } from "react";
import { PageHeader, Button } from "@/components/ui";
import { colors, mono } from "@/lib/tokens";
import { lastClosedSundays } from "@/lib/dates";
import { useDashboardExport } from "@/hooks/api/dashboard";
import { notify } from "@/lib/toast";
import { SectionCard } from "@/components/coordinator/kit";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(key: string): { start: string; end: string } {
  const now = new Date();
  const sundays = lastClosedSundays(4, now);
  switch (key) {
    case "last-sunday":
      return { start: iso(sundays[0]), end: iso(sundays[0]) };
    case "last-4":
      return { start: iso(sundays[3]), end: iso(sundays[0]) };
    case "quarter": {
      const q = Math.floor(now.getUTCMonth() / 3) * 3;
      return { start: iso(new Date(Date.UTC(now.getUTCFullYear(), q, 1))), end: iso(now) };
    }
    case "ytd":
      return { start: iso(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), end: iso(now) };
    default:
      return { start: iso(sundays[0]), end: iso(sundays[0]) };
  }
}

const PRESETS = [
  { key: "last-sunday", label: "Last Sunday" },
  { key: "last-4", label: "Last 4 Sundays" },
  { key: "quarter", label: "Quarter to date" },
  { key: "ytd", label: "Year to date" },
];

export default function ExportsPage() {
  const initial = presetRange("last-4");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [running, setRunning] = useState(false);
  const { download } = useDashboardExport();

  function applyPreset(key: string) {
    const r = presetRange(key);
    setStart(r.start);
    setEnd(r.end);
  }

  async function run() {
    if (!start || !end) {
      notify.error("Pick a start and end date");
      return;
    }
    if (start > end) {
      notify.error("The start date is after the end date");
      return;
    }
    setRunning(true);
    try {
      const { blob, filename } = await download(start, end);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? `dcc-compliance-${start}_${end}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify.success("Export downloaded");
    } catch (err) {
      notify.error(err, "Could not generate the export");
    } finally {
      setRunning(false);
    }
  }

  const field: React.CSSProperties = {
    minHeight: 40,
    border: `1.5px solid ${colors.borderStrong}`,
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 14,
    fontFamily: mono,
    outline: "none",
    background: colors.fieldBg,
  };

  return (
    <>
      <PageHeader
        eyebrow="Coordinator"
        title="Exports"
        sub="Download compliance data for a date range"
      />

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
        <SectionCard title="Compliance export" sub="Scoped to your hierarchy level. CSV.">
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  style={{
                    border: `1px solid ${colors.borderStrong}`,
                    background: "#fff",
                    color: colors.muted,
                    borderRadius: 8,
                    padding: "6px 11px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.muted }}>Start date</span>
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={field} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.muted }}>End date</span>
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={field} />
              </label>
            </div>

            <div>
              <Button variant="primary" onClick={run} disabled={running}>
                {running ? "Preparing…" : "Generate CSV"}
              </Button>
            </div>
          </div>
        </SectionCard>

        <div style={{ fontSize: 11, color: colors.faint2, lineHeight: 1.5 }}>
          PDF export and the per-dataset picker (follow-ups, approvals) are not available yet — the
          API exposes a single scoped compliance CSV.
        </div>
      </div>
    </>
  );
}
