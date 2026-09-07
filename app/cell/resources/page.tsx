import { redirect } from "next/navigation";
import { requireRoleGroup } from "@/lib/auth/guard";
import { getLeaderCell } from "@/lib/cells/service";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { colors, mono } from "@/lib/tokens";
import { RESOURCES, THIS_WEEKS_GUIDE, TRAINING_PROGRESS } from "@/lib/resources/data";

export default async function ResourcesPage() {
  const { user } = await requireRoleGroup("leader");
  const leaderCell = await getLeaderCell(user.id);
  if (!leaderCell) redirect("/sign-in");

  const section = await prisma.orgUnit.findUnique({
    where: { id: leaderCell.unit.parentId ?? "" },
    include: { leader: true },
  });

  const groups: Record<string, typeof RESOURCES> = {};
  for (const item of RESOURCES) {
    (groups[item.category] ??= []).push(item);
  }

  return (
    <>
      <PageHeader eyebrow={leaderCell.unit.name} title="Resources" sub="Cell guides, training and forms" />
      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }} className="dcc-wizard">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 20, background: colors.ink, color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9AA3AE", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              This week&apos;s guide
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{THIS_WEEKS_GUIDE.title}</div>
            <div style={{ fontSize: 13, color: "#9AA3AE" }}>{THIS_WEEKS_GUIDE.sub}</div>
          </Card>

          {Object.entries(groups).map(([category, items]) => (
            <div key={category}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{category}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item) => (
                  <Card key={item.title} style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: colors.faint }}>{item.sub}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: colors.chipGrey,
                        color: colors.muted,
                        fontFamily: mono,
                      }}
                    >
                      {item.kind}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
              Training progress
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: mono, marginBottom: 6 }}>
              {TRAINING_PROGRESS.completed}/{TRAINING_PROGRESS.total}
            </div>
            <div style={{ height: 6, background: colors.hairline, borderRadius: 4 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(TRAINING_PROGRESS.completed / TRAINING_PROGRESS.total) * 100}%`,
                  background: colors.green,
                  borderRadius: 4,
                }}
              />
            </div>
          </Card>

          {section?.leader && (
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                Section Leader
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{section.leader.name}</div>
              <div style={{ fontSize: 12.5, color: colors.muted }}>{section.leader.email}</div>
              {section.leader.phone && <div style={{ fontSize: 12.5, color: colors.muted, fontFamily: mono }}>{section.leader.phone}</div>}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
