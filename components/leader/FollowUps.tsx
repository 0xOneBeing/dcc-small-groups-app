"use client";

import { useApp } from "@/lib/state";
import { colors } from "@/lib/tokens";
import { Button, Card, Chip, TextArea } from "@/components/ui";

const FILTERS = ["All", "Awaiting contact", "Done"] as const;

function tone(status: string) {
  if (status === "Contacted") return { bg: colors.greenSoft, fg: colors.green };
  if (status === "Unable to Reach") return { bg: colors.chipGrey, fg: colors.muted };
  return { bg: colors.amberSoft, fg: colors.amber };
}

export function FollowUps() {
  const { state, set } = useApp();

  const visible = state.people.filter((p) => {
    if (state.followFilter === "All") return true;
    if (state.followFilter === "Awaiting contact") return p.status === "Not contacted";
    return p.status !== "Not contacted";
  });

  const updatePerson = (id: number, patch: Partial<(typeof state.people)[number]>) => {
    set((s) => ({ people: s.people.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };

  return (
    <div>
      <div style={{ background: "#fff", borderBottom: `1px solid ${colors.border}`, padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.035em" }}>Follow-ups</div>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 5 }}>First-timers and new converts assigned to Grace Cell by MSU. Log an outcome within 7 days.</div>
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {FILTERS.map((f) => (
              <Chip key={f} label={f} active={state.followFilter === f} onClick={() => set({ followFilter: f })} activeBg={colors.ink} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 28px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((p) => {
          const t = tone(p.status);
          const open = state.openPerson === p.id;
          const overdue = p.status === "Not contacted" && p.days > 7;
          const initials = p.name.split(" ").map((x) => x[0]).join("");
          return (
            <Card key={p.id} style={{ overflow: "hidden" }}>
              <div
                onClick={() => set({ openPerson: open ? null : p.id })}
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0, background: overdue ? colors.redSoft : colors.chipGrey, color: overdue ? colors.red : colors.muted }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.015em" }}>{p.name}</span>
                    {overdue && <span style={{ fontSize: 10, fontWeight: 700, padding: "2.5px 6px", borderRadius: 5, background: colors.redSoft, color: colors.red, letterSpacing: "0.02em" }}>OVERDUE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>{p.area} · assigned {p.ago} by {p.by}</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 7, whiteSpace: "nowrap", flexShrink: 0, background: t.bg, color: t.fg }}>{p.status}</span>
                <span style={{ fontSize: 15, color: colors.neutral, flexShrink: 0, transform: open ? "rotate(90deg)" : "none", display: "inline-block" }}>›</span>
              </div>

              {open && (
                <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${colors.hairline}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, padding: "16px 0" }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint2, marginBottom: 5 }}>Phone</div>
                      <div style={{ fontSize: 13.5, fontFamily: "var(--font-plex-mono), monospace" }}>{p.phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint2, marginBottom: 5 }}>Area</div>
                      <div style={{ fontSize: 13.5 }}>{p.area}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint2, marginBottom: 5 }}>Assigned by</div>
                      <div style={{ fontSize: 13.5 }}>{p.by}</div>
                    </div>
                  </div>
                  <TextArea value={p.note} onChange={(v) => updatePerson(p.id, { note: v })} placeholder="What happened when you reached out?" minHeight={76} fontSize={13.5} />
                  <div style={{ display: "flex", gap: 9, marginTop: 12, flexWrap: "wrap" }}>
                    <Button
                      variant="dark"
                      padding="11px 16px"
                      fontSize={13}
                      onClick={() => updatePerson(p.id, { status: "Contacted", logged: "Logged as Contacted on 25 Aug, 8:14pm by Boluwatife Sodipo. Visible to MSU and Ijegun Section 1." })}
                    >
                      Mark contacted
                    </Button>
                    <Button
                      variant="secondary"
                      padding="11px 16px"
                      fontSize={13}
                      onClick={() => updatePerson(p.id, { status: "Unable to Reach", logged: "Logged as Unable to Reach on 25 Aug, 8:14pm. MSU can reassign this follow-up." })}
                    >
                      Unable to reach
                    </Button>
                    <Button variant="secondary" padding="11px 16px" fontSize={13}>Call on WhatsApp</Button>
                  </div>
                  {p.logged && (
                    <div style={{ marginTop: 12, fontSize: 12, color: colors.green, lineHeight: 1.5, background: colors.greenSoft, borderRadius: 10, padding: "11px 13px" }}>
                      {p.logged}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
