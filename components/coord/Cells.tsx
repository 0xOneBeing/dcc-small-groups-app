"use client";

import { useApp } from "@/lib/state";
import { colors, mono } from "@/lib/tokens";
import { Button, TextInput, Card } from "@/components/ui";
import { allCells, current, rnd } from "@/lib/tree";

export function Cells() {
  const { state, set } = useApp();

  const { node } = current(state.scope, state.path);
  const q = state.cellQuery.trim().toLowerCase();
  const cellsAll = allCells(state.scope);
  const cellRows = cellsAll
    .filter((c) => !q || `${c.name} ${c.code} ${c.leader}`.toLowerCase().includes(q))
    .slice(0, 24)
    .map((c) => {
      const rr = rnd(c.name.length * 71 + c.code.length * 13);
      const rate = 60 + Math.round(rr() * 40);
      const stt =
        c.status === "approved"
          ? { l: "Approved", bg: colors.greenSoft, fg: colors.green }
          : c.status === "pending"
          ? { l: "Pending", bg: colors.amberSoft, fg: colors.amber }
          : { l: "Not submitted", bg: colors.redSoft, fg: colors.red };
      return {
        name: c.name,
        code: c.code,
        leader: c.leader,
        section: c.section,
        type: c.cellType,
        rate: `${rate}%`,
        rateFg: rate >= 90 ? colors.green : rate >= 75 ? colors.amber : colors.red,
        status: stt.l,
        stBg: stt.bg,
        stFg: stt.fg,
      };
    });

  const cellStats = [
    { label: "Cells in scope", value: node.cells, color: colors.ink },
    { label: "Reported", value: node.ok + node.pend, color: colors.green },
    { label: "Not submitted", value: node.miss, color: node.miss ? colors.red : colors.green },
    { label: "Chronic", value: node.chronic, color: node.chronic ? colors.red : colors.green },
  ];

  const cellHeaders = [
    { label: "Cell", align: "left" as const },
    { label: "Cell Leader", align: "left" as const },
    { label: "Section", align: "left" as const },
    { label: "Type", align: "left" as const },
    { label: "8-wk rate", align: "center" as const },
    { label: "This week", align: "right" as const },
  ];

  return (
    <div>
      <div style={{ background: "#fff", borderBottom: `1px solid ${colors.border}`, padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.035em" }}>Cells</div>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 5 }}>Every cell in {node.name}, with its leader and reporting record.</div>
          </div>
          <div style={{ display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
            <div style={{ width: 240 }}>
              <TextInput value={state.cellQuery} onChange={(v) => set({ cellQuery: v })} placeholder="Search cell, code or leader" padding="9px 13px" fontSize={12.5} radius={10} />
            </div>
            <Button variant="dark" padding="9px 13px" fontSize={12.5}>Add cell</Button>
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 28px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 14 }}>
          {cellStats.map((s) => (
            <Card key={s.label} style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint, marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, color: s.color }}>{s.value}</div>
            </Card>
          ))}
        </div>

        <Card style={{ overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr 1fr 0.9fr 90px 96px", padding: "11px 20px", minWidth: 880, background: colors.fieldBg, borderBottom: `1px solid ${colors.hairline}` }}>
            {cellHeaders.map((h, i) => (
              <div key={i} style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: colors.faint2, textAlign: h.align }}>{h.label}</div>
            ))}
          </div>
          {cellRows.map((c) => (
            <div key={c.code} style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr 1fr 0.9fr 90px 96px", padding: "13px 20px", minWidth: 880, borderBottom: `1px solid ${colors.hairline2}`, alignItems: "center" }}>
              <div style={{ minWidth: 0, paddingRight: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.015em" }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: colors.faint, fontFamily: mono }}>{c.code}</div>
              </div>
              <div style={{ minWidth: 0, paddingRight: 12, fontSize: 12.5, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.leader}</div>
              <div style={{ minWidth: 0, paddingRight: 12, fontSize: 12.5, color: colors.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.section}</div>
              <div style={{ fontSize: 12.5, color: colors.muted }}>{c.type}</div>
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 600, fontFamily: mono, color: c.rateFg }}>{c.rate}</div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 6, whiteSpace: "nowrap", background: c.stBg, color: c.stFg }}>{c.status}</span>
              </div>
            </div>
          ))}
          {cellRows.length === 0 && (
            <div style={{ padding: "44px 20px", textAlign: "center", fontSize: 13, color: colors.faint }}>No cell matches that search.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
