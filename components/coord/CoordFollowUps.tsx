"use client";

import { useApp } from "@/lib/state";
import { colors, mono } from "@/lib/tokens";
import { Button, Card } from "@/components/ui";
import { current } from "@/lib/tree";
import { CF_OVERDUE, CF_LEADERS } from "@/lib/data";

export function CoordFollowUps() {
  const { state } = useApp();
  const { node } = current(state.scope, state.path);

  const cfStats = [
    { label: "Open assignments", value: 148, color: colors.ink, note: `Across ${node.cells} cells in scope.` },
    { label: "Overdue past 7 days", value: 23, color: colors.red, note: "No outcome logged. Escalates to Section Leader." },
    { label: "Contacted in 30 days", value: "71%", color: colors.green, note: "Up 6 points on last month." },
  ];

  const cfOverdue = CF_OVERDUE.map((p) => ({ ...p, initials: p.name.split(" ").map((x) => x[0]).join("") }));
  const cfLeaders = CF_LEADERS.map((l) => ({
    ...l,
    fg: l.pct >= 90 ? colors.green : l.pct >= 60 ? colors.amber : colors.red,
  }));

  return (
    <div>
      <div style={{ background: "#fff", borderBottom: `1px solid ${colors.border}`, padding: "22px 28px" }}>
        <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.035em" }}>Follow-ups</div>
        <div style={{ fontSize: 13, color: colors.muted, marginTop: 5 }}>
          First-timers and new converts assigned to cells in {node.name}. Overdue means no outcome logged within 7 days.
        </div>
      </div>

      <div style={{ padding: "22px 28px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(336px,1fr))", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            {cfStats.map((s) => (
              <Card key={s.label} style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint, marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 9, lineHeight: 1.45 }}>{s.note}</div>
              </Card>
            ))}
          </div>
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.hairline}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.015em" }}>Overdue, oldest first</div>
              <Button variant="secondary" padding="7px 11px" fontSize={11.5}>Nudge all leaders</Button>
            </div>
            {cfOverdue.map((p) => (
              <div key={p.name} style={{ padding: "14px 20px", borderBottom: `1px solid ${colors.hairline2}`, display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: colors.redSoft, color: colors.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{p.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.015em" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: colors.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.meta}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: mono, color: colors.red, flexShrink: 0 }}>{p.days}d</span>
                <Button variant="secondary" padding="6px 10px" fontSize={11.5}>Reassign</Button>
              </div>
            ))}
          </Card>
        </div>

        <Card>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.hairline}` }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.015em" }}>By cell leader</div>
            <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>Contact rate over the last 30 days</div>
          </div>
          {cfLeaders.map((l) => (
            <div key={l.name} style={{ padding: "13px 20px", borderBottom: `1px solid ${colors.hairline2}`, display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                <div style={{ fontSize: 11.5, color: colors.faint }}>{l.cell} · {l.assigned} assigned</div>
              </div>
              <div style={{ width: 84, height: 6, background: "#EDEFF3", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${l.pct}%`, background: l.fg }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: mono, minWidth: 40, textAlign: "right", flexShrink: 0, color: l.fg }}>{l.pct}%</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
