"use client";

import { useApp } from "@/lib/state";
import { colors, mono } from "@/lib/tokens";
import { Button, Card } from "@/components/ui";
import { pendingCells } from "@/lib/tree";
import { figFor, APPROVAL_COMMENTS } from "@/lib/data";

export function Approvals() {
  const { state, set } = useApp();

  const pend = pendingCells();
  const apprOpen = pend.filter((p) => state.apprDone.indexOf(p.code) === -1);
  const apprSelIdx = Math.min(state.apprSel, Math.max(0, apprOpen.length - 1));
  const selNode = apprOpen[apprSelIdx];
  const fig = selNode ? figFor(selNode) : null;

  const apprList = apprOpen.map((p, i) => {
    const f = figFor(p);
    const flagged = f.present < 12;
    return {
      code: p.code,
      cell: p.name,
      meta: `Cell Leader ${p.leader} · ${p.channel} · ${p.time}`,
      tag: flagged ? "Check" : "Clean",
      tagBg: flagged ? colors.amberSoft : colors.greenSoft,
      tagFg: flagged ? colors.amber : colors.green,
      on: i === apprSelIdx,
    };
  });

  const selGroups = fig
    ? [
        {
          label: "Membership",
          items: [
            { label: "Members present", value: fig.present, fg: fig.present < 12 ? colors.red : colors.ink },
            { label: "Guest cards received", value: fig.guestCards },
            { label: "Decision cards received", value: fig.decisionCards },
            { label: "Visitation — physical", value: fig.vPhysical },
            { label: "Visitation — phone", value: fig.vPhone },
            { label: "Visitation — text", value: fig.vText },
          ],
        },
        { label: "Maturity", items: [{ label: "100% paid in", value: fig.paidIn }, { label: "Baptism in the Holy Ghost", value: fig.baptism }] },
        {
          label: "Ministry",
          items: [
            { label: "Communion service", value: fig.communion },
            { label: "Community project", value: fig.community },
            { label: "Less privileged visitation", value: fig.lessPriv },
            { label: "Cell leader visitation", value: fig.clVisit },
          ],
        },
        {
          label: "Mission",
          items: [
            { label: "New cells", value: fig.newCells },
            { label: "Converts", value: fig.converts },
            { label: "Guests", value: fig.guests },
            { label: "Programme outreach", value: fig.outreach },
          ],
        },
      ]
    : [];

  const apprApprove = () => {
    if (!selNode) return;
    set((s) => ({ apprDone: [...s.apprDone, selNode.code], apprLog: { ...s.apprLog, [selNode.code]: "approved" }, apprSel: 0 }));
  };
  const apprReject = () => {
    if (!selNode) return;
    set((s) => ({ apprDone: [...s.apprDone, selNode.code], apprLog: { ...s.apprLog, [selNode.code]: "sent-back" }, apprSel: 0 }));
  };
  const apprCleanCodes = pend.filter((p) => figFor(p).present >= 12).map((p) => p.code);
  const apprAll = () => {
    set((s) => ({
      apprDone: [...s.apprDone, ...apprCleanCodes.filter((c) => s.apprDone.indexOf(c) === -1)],
      apprLog: apprCleanCodes.reduce((acc, c) => ({ ...acc, [c]: "approved" as const }), { ...state.apprLog }),
      apprSel: 0,
    }));
  };

  const selComment = selNode ? APPROVAL_COMMENTS[pend.indexOf(selNode) % APPROVAL_COMMENTS.length] : "";
  const selFlagged = fig ? fig.present < 12 : false;

  return (
    <div>
      <div style={{ background: "#fff", borderBottom: `1px solid ${colors.border}`, padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.035em" }}>Approvals</div>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 5 }}>
              {apprOpen.length} report{apprOpen.length === 1 ? "" : "s"} waiting on you. Anything not acted on in 36 hours escalates to the Area Coordinator.
            </div>
          </div>
          <Button variant="secondary" padding="9px 13px" fontSize={12.5} onClick={apprAll}>Approve all clean reports</Button>
        </div>
      </div>

      <div style={{ padding: "22px 28px 40px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <Card style={{ flex: "1 1 290px", maxWidth: 360, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${colors.hairline}`, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint2 }}>
            Queue · {apprOpen.length}
          </div>
          {apprList.map((a, i) => (
            <div
              key={a.code}
              onClick={() => set({ apprSel: i })}
              style={{ padding: "14px 18px", borderBottom: `1px solid ${colors.hairline2}`, cursor: "pointer", display: "flex", gap: 12, alignItems: "center", borderLeft: `3px solid ${a.on ? colors.red : "transparent"}`, background: a.on ? colors.fieldBg : "#fff" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.cell}</div>
                <div style={{ fontSize: 11.5, color: colors.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.meta}</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 7px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0, background: a.tagBg, color: a.tagFg }}>{a.tag}</span>
            </div>
          ))}
          {apprOpen.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: colors.faint, lineHeight: 1.55 }}>Queue cleared. Nothing is waiting on you.</div>
          )}
        </Card>

        {selNode && (
          <Card style={{ flex: "2 1 400px", minWidth: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.hairline}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em" }}>{selNode.name}</div>
                <div style={{ fontSize: 12.5, color: colors.faint, marginTop: 3 }}>
                  Cell Leader {selNode.leader} · {selNode.code} · submitted via {selNode.channel} at {selNode.time}
                </div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 7, background: colors.amberSoft, color: colors.amber, whiteSpace: "nowrap" }}>Pending approval</span>
            </div>
            {selFlagged && (
              <div style={{ margin: "18px 24px 0", padding: "13px 15px", background: colors.redSoft, border: `1px solid ${colors.redSoftBorder}`, borderRadius: 12, fontSize: 12.5, color: colors.redSoftText, lineHeight: 1.55 }}>
                Attendance of {fig!.present} is more than 30% below this cell&rsquo;s 8-week average. Confirm with the leader before approving.
              </div>
            )}
            <div style={{ padding: "20px 24px 24px" }}>
              {selGroups.map((g) => (
                <div key={g.label} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint2, marginBottom: 10 }}>{g.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                    {g.items.map((it) => (
                      <div key={it.label} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: "12px 14px", background: colors.fieldBg }}>
                        <div style={{ fontSize: 11.5, color: colors.faint, lineHeight: 1.35, minHeight: 32 }}>{it.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", fontFamily: mono, marginTop: 6, color: "fg" in it ? it.fg : colors.ink }}>{it.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: "14px 16px", background: colors.fieldBg }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: colors.faint2, marginBottom: 7 }}>Cell leader comments</div>
                <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6 }}>{selComment}</div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22, paddingTop: 20, borderTop: `1px solid ${colors.hairline}`, flexWrap: "wrap" }}>
                <Button variant="dark" onClick={apprApprove} padding="13px 22px" fontSize={14} style={{ background: colors.green }}>Approve</Button>
                <Button variant="danger-outline" onClick={apprReject} padding="13px 20px" fontSize={14}>Send back for correction</Button>
                <Button variant="ghost" padding="13px 12px" fontSize={14}>Message leader</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
