import Link from "next/link";
import { requireRoleGroup } from "@/lib/auth/guard";
import { getLeaderCell } from "@/lib/cells/service";
import { cellWeekHistory, consecutiveReportedSundays } from "@/lib/reports/service";
import { listFollowUpsForCell } from "@/lib/followups/service";
import { prisma } from "@/lib/prisma";
import { mostRecentSunday, formatServiceDate } from "@/lib/dates";
import { PageHeader, Card, LinkButton } from "@/components/ui";
import { colors, mono } from "@/lib/tokens";
import { redirect } from "next/navigation";

export default async function MyCellPage() {
  const { user } = await requireRoleGroup("leader");
  const leaderCell = await getLeaderCell(user.id);
  if (!leaderCell) redirect("/sign-in");
  const { cell, unit } = leaderCell;

  const now = new Date();
  const thisSunday = mostRecentSunday(now);
  const history = await cellWeekHistory(cell.id, 8, now);
  const [current, ...prior] = history;
  const streak = consecutiveReportedSundays(history.map((h) => h.outcome));

  const [memberCount, followUps] = await Promise.all([
    prisma.cellMember.count({ where: { cellId: cell.id, active: true } }),
    listFollowUpsForCell(cell.id),
  ]);
  const openFollowUps = followUps.filter((f) => f.status === "not_contacted");

  const maxPresent = Math.max(1, ...history.map((h) => h.report?.membersPresent ?? 0));

  return (
    <>
      <PageHeader eyebrow={unit.code} title={unit.name} sub={`${cell.cellType.replace("_", " ")} cell · ${cell.address}`} />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>
        <NextActionCard current={current} thisSunday={thisSunday} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          <StatCard label="Members" value={String(memberCount)} />
          <StatCard label="Reporting streak" value={`${streak} wk${streak === 1 ? "" : "s"}`} />
          <StatCard label="Open follow-ups" value={String(openFollowUps.length)} accent={openFollowUps.length > 0} />
        </div>

        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Attendance — last 8 Sundays</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {[...history].reverse().map((h) => {
              const present = h.report?.membersPresent ?? null;
              const barMaxPx = 64;
              const heightPx = present != null ? Math.max(4, Math.round((present / maxPresent) * barMaxPx)) : 4;
              return (
                <div
                  key={h.serviceDate.toISOString()}
                  style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: heightPx,
                      borderRadius: 4,
                      background: present != null ? colors.red : colors.neutral,
                    }}
                    title={present != null ? `${present} present` : "No report"}
                  />
                  <div style={{ fontSize: 9.5, color: colors.faint2 }}>{formatServiceDate(h.serviceDate)}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Follow-ups waiting on you</div>
            {openFollowUps.length === 0 ? (
              <div style={{ fontSize: 12.5, color: colors.faint }}>Nothing waiting — you&apos;re caught up.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {openFollowUps.slice(0, 5).map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, gap: 10 }}>
                    <span>{f.personName}</span>
                    {f.overdue && <Pill label="Overdue" tone="red" />}
                  </div>
                ))}
              </div>
            )}
            <Link href="/cell/follow-ups" style={{ display: "inline-block", marginTop: 14, fontSize: 12.5, fontWeight: 600 }}>
              View all follow-ups →
            </Link>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Submission record — last 5 Sundays</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {prior.slice(0, 5).map((h) => (
                <div key={h.serviceDate.toISOString()} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: colors.muted }}>{formatServiceDate(h.serviceDate)}</span>
                  <SubmissionPill outcome={h.outcome} channel={h.report?.channel} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", fontFamily: mono, color: accent ? colors.red : colors.ink }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 4 }}>{label}</div>
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

function SubmissionPill({ outcome, channel }: { outcome: string; channel?: string }) {
  if (outcome === "approved") return <Pill label={`Approved${channel ? ` · ${channel}` : ""}`} tone="green" />;
  if (outcome === "pending") return <Pill label="Pending" tone="amber" />;
  return <Pill label="Not submitted" tone="red" />;
}

async function NextActionCard({
  current,
  thisSunday,
}: {
  current: { status: string | null; outcome: string; report: { reviewNote: string | null } | null };
  thisSunday: Date;
}) {
  const dueLabel = `${formatServiceDate(thisSunday)} report`;

  if (current.status === "sent_back") {
    return (
      <Card style={{ padding: 20, borderColor: colors.redSoftBorder, background: colors.redSoft }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.red, textTransform: "uppercase", letterSpacing: "0.04em" }}>Sent back</div>
        <div style={{ fontSize: 14, marginTop: 6, marginBottom: 10 }}>{current.report?.reviewNote}</div>
        <LinkButton href="/cell/report" variant="primary">Edit and resubmit</LinkButton>
      </Card>
    );
  }

  if (current.status === "pending") {
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.amber, textTransform: "uppercase", letterSpacing: "0.04em" }}>Submitted</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>{dueLabel} is waiting on your Section Leader for approval.</div>
      </Card>
    );
  }

  if (current.status === "approved") {
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.green, textTransform: "uppercase", letterSpacing: "0.04em" }}>Approved</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>{dueLabel} was approved. Nothing due right now.</div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 20, borderColor: colors.border }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Due</div>
      <div style={{ fontSize: 14, marginTop: 6, marginBottom: 10 }}>{dueLabel} is outstanding. Closes Monday 7:00am.</div>
      <LinkButton href="/cell/report" variant="primary">Start report</LinkButton>
    </Card>
  );
}
