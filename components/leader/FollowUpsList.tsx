"use client";

import { useState, useTransition } from "react";
import { colors, mono } from "@/lib/tokens";
import { Card, Button, TextArea } from "@/components/ui";
import { logFollowUpOutcomeAction } from "@/lib/followups/actions";

export interface FollowUpRow {
  id: string;
  personName: string;
  phone: string;
  type: "new_guest" | "new_convert";
  address: string | null;
  assignedByName: string;
  assignedAt: string;
  status: "not_contacted" | "contacted" | "joined_cell" | "unable_to_reach";
  outcomeNote: string | null;
  overdue: boolean;
}

const STATUS_LABEL: Record<FollowUpRow["status"], string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  joined_cell: "Joined cell",
  unable_to_reach: "Unable to reach",
};

export function FollowUpsList({ followUps }: { followUps: FollowUpRow[] }) {
  const [filter, setFilter] = useState<"All" | "Awaiting contact" | "Done">("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = followUps.filter((f) => {
    if (filter === "Awaiting contact") return f.status === "not_contacted";
    if (filter === "Done") return f.status !== "not_contacted";
    return true;
  });

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["All", "Awaiting contact", "Done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              border: `1px solid ${filter === f ? colors.ink : colors.borderStrong}`,
              background: filter === f ? colors.ink : "#fff",
              color: filter === f ? "#fff" : colors.muted,
              fontSize: 12.5,
              fontWeight: 600,
              padding: "8px 14px",
              minHeight: 40,
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <Card style={{ padding: 24, fontSize: 13, color: colors.faint }}>No follow-ups here.</Card>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((f) => (
          <FollowUpRowCard key={f.id} row={f} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
        ))}
      </div>
    </div>
  );
}

function FollowUpRowCard({ row, open, onToggle }: { row: FollowUpRow; open: boolean; onToggle: () => void }) {
  const [note, setNote] = useState(row.outcomeNote ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function log(status: "contacted" | "unable_to_reach") {
    setError(null);
    startTransition(async () => {
      const result = await logFollowUpOutcomeAction({ followUpId: row.id, status, note });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          border: "none",
          background: "transparent",
          padding: "14px 18px",
          minHeight: 44,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.personName}</div>
          <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>
            {row.type === "new_guest" ? "New guest" : "New convert"} · {row.assignedAt}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {row.overdue && <Pill label="Overdue" tone="red" />}
          <Pill label={STATUS_LABEL[row.status]} tone={row.status === "not_contacted" ? "grey" : row.status === "unable_to_reach" ? "amber" : "green"} />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${colors.hairline}`, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12.5 }}>
            <div>
              <div style={{ color: colors.faint, marginBottom: 2 }}>Phone</div>
              <div style={{ fontFamily: mono }}>{row.phone}</div>
            </div>
            <div>
              <div style={{ color: colors.faint, marginBottom: 2 }}>Area</div>
              <div>{row.address ?? "—"}</div>
            </div>
            <div>
              <div style={{ color: colors.faint, marginBottom: 2 }}>Assigned by</div>
              <div>{row.assignedByName}</div>
            </div>
          </div>

          {row.status === "not_contacted" ? (
            <>
              <TextArea value={note} onChange={setNote} placeholder="Note about this contact attempt…" minHeight={70} />
              {error && <div style={{ fontSize: 12, color: colors.red }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" onClick={() => log("contacted")} disabled={pending}>
                  Contacted
                </Button>
                <Button variant="danger-outline" onClick={() => log("unable_to_reach")} disabled={pending}>
                  Unable to reach
                </Button>
              </div>
            </>
          ) : (
            row.outcomeNote && <div style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.5 }}>{row.outcomeNote}</div>
          )}
        </div>
      )}
    </Card>
  );
}

function Pill({ label, tone }: { label: string; tone: "red" | "green" | "amber" | "grey" }) {
  const tones = {
    red: { bg: colors.redSoft, fg: colors.red },
    green: { bg: colors.greenSoft, fg: colors.green },
    amber: { bg: colors.amberSoft, fg: colors.amber },
    grey: { bg: colors.chipGrey, fg: colors.muted },
  }[tone];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: tones.bg, color: tones.fg }}>
      {label}
    </span>
  );
}
