import "server-only";
import { prisma } from "@/lib/prisma";

export async function getLeaderCell(userId: string) {
  const assignment = await prisma.roleAssignment.findFirst({
    where: { userId, role: "cell_leader" },
    include: { unit: { include: { cell: true, parent: true } } },
  });
  if (!assignment?.unit.cell) return null;
  return { unit: assignment.unit, cell: assignment.unit.cell };
}

export async function listCellsInScope(unitIds: string[]) {
  return prisma.cell.findMany({
    where: { unitId: { in: unitIds } },
    include: { unit: { include: { leader: true, parent: true } } },
    orderBy: { unit: { name: "asc" } },
  });
}
