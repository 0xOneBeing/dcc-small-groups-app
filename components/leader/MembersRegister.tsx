"use client";

import { useMemo, useState, useTransition } from "react";
import { colors, mono } from "@/lib/tokens";
import { Card, TextInput, Button } from "@/components/ui";
import { setMemberActiveAction } from "@/lib/cells/actions";
import { MISSED_LATELY_THRESHOLD } from "@/lib/cells/constants";

export interface MemberRow {
  id: string;
  name: string;
  phone: string | null;
  roleInCell: "member" | "assistant" | "host";
  active: boolean;
  presenceStrip: (boolean | null)[];
  missedStreak: number;
  lastSeenLabel: string | null;
}

type Filter = "All" | "Every Sunday" | "Missing lately" | "Team";

export function MembersRegister({ members, weekLabels }: { members: MemberRow[]; weekLabels: string[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (query && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "Every Sunday") return m.presenceStrip.every((p) => p === true || p === null) && m.presenceStrip.some((p) => p === true);
      if (filter === "Missing lately") return m.missedStreak >= MISSED_LATELY_THRESHOLD;
      if (filter === "Team") return m.roleInCell !== "member";
      return true;
    });
  }, [members, query, filter]);

  const missingLately = members.filter((m) => m.missedStreak >= MISSED_LATELY_THRESHOLD);

  return (
    <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }} className="dcc-wizard">
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <TextInput value={query} onChange={setQuery} placeholder="Search members…" />
          </div>
          {(["All", "Every Sunday", "Missing lately", "Team"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border: `1px solid ${filter === f ? colors.ink : colors.borderStrong}`,
                background: filter === f ? colors.ink : "#fff",
                color: filter === f ? "#fff" : colors.muted,
                fontSize: 12.5,
                fontWeight: 600,
                padding: "0 14px",
                minHeight: 44,
                borderRadius: 9,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="dcc-table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.hairline}` }}>
                  <Th>Member</Th>
                  <Th>Phone</Th>
                  <Th>Role</Th>
                  {weekLabels.map((w) => (
                    <Th key={w} center small>
                      {w}
                    </Th>
                  ))}
                  <Th center>Active</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <MemberRowLine key={m.id} member={m} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 18 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
          Missed {MISSED_LATELY_THRESHOLD}+ Sundays running
        </div>
        {missingLately.length === 0 ? (
          <div style={{ fontSize: 12.5, color: colors.faint }}>Nobody has a miss streak right now.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {missingLately.map((m) => (
              <div key={m.id}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: colors.faint }}>
                  {m.missedStreak} weeks · last seen {m.lastSeenLabel ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Th({ children, center, small }: { children: React.ReactNode; center?: boolean; small?: boolean }) {
  return (
    <th
      style={{
        textAlign: center ? "center" : "left",
        padding: small ? "10px 6px" : "10px 14px",
        fontSize: 11,
        fontWeight: 700,
        color: colors.faint,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </th>
  );
}

function MemberRowLine({ member }: { member: MemberRow }) {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(member.active);

  function toggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = await setMemberActiveAction({ memberId: member.id, active: next });
      if (!result.ok) setActive(!next);
    });
  }

  return (
    <tr style={{ borderBottom: `1px solid ${colors.hairline}`, opacity: active ? 1 : 0.5 }}>
      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{member.name}</td>
      <td style={{ padding: "10px 14px", fontSize: 12.5, fontFamily: mono, color: colors.muted }}>{member.phone ?? "—"}</td>
      <td style={{ padding: "10px 14px", fontSize: 12.5, color: colors.muted, textTransform: "capitalize" }}>{member.roleInCell}</td>
      {member.presenceStrip.map((p, i) => (
        <td key={i} style={{ padding: "10px 6px", textAlign: "center" }}>
          <span
            aria-label={p === true ? "Present" : p === false ? "Absent" : "No report"}
            title={p === true ? "Present" : p === false ? "Absent" : "No report"}
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 3,
              background: p === true ? colors.green : p === false ? colors.red : colors.hairline,
            }}
          />
        </td>
      ))}
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        <Button variant={active ? "secondary" : "dark"} onClick={toggle} disabled={pending} padding="6px 12px" fontSize={11.5}>
          {active ? "Mark inactive" : "Reactivate"}
        </Button>
      </td>
    </tr>
  );
}
