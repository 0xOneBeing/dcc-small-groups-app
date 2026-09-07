import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { mono } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { lastClosedSundays } from "@/lib/dates";
import { computeCellCompliance } from "@/lib/compliance/service";
import { sumComplianceCounts } from "@/lib/rules/compliance";

async function liveStats() {
  const cells = await prisma.cell.findMany({ select: { id: true } });
  const [lastSunday] = lastClosedSundays(1, new Date());
  const byCell = await computeCellCompliance(
    cells.map((c) => c.id),
    new Date(lastSunday.getTime() + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
  );
  const counts = sumComplianceCounts([...byCell.values()].map((c) => c.counts));
  const rate = cells.length ? Math.round(((counts.submitted + counts.pending) / cells.length) * 100) : 0;
  return { cellCount: cells.length, rate };
}

export default async function SignInPage() {
  const stats = await liveStats();

  return (
    <AuthShell
      subtitle="Alimosho Region"
      roleLabel="Small Groups"
      headline="One place for every cell report in Alimosho."
      blurb="Submit your Sunday report, approve the ones waiting on you, and see how compliance rolls up the whole region — all from one system of record."
      bottomLeft={
        <div style={{ display: "flex", gap: 34, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", fontFamily: mono }}>{stats.cellCount}</div>
            <div style={{ fontSize: 11, color: "#6C7683", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 3 }}>Cells</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", fontFamily: mono }}>{stats.rate}%</div>
            <div style={{ fontSize: 11, color: "#6C7683", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 3 }}>
              Reported last Sunday
            </div>
          </div>
        </div>
      }
      rightPane={<SignInForm />}
    />
  );
}
