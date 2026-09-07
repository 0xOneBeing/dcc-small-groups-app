import { prisma } from "@/lib/prisma";

/**
 * Every list a coordinator sees is scoped to the subtree of the unit their
 * role grants (rule 8). This is the one place that subtree is resolved, via
 * a recursive CTE, so no endpoint can leak another region by re-deriving it
 * differently.
 */
export async function subtreeUnitIds(rootUnitIds: string[]): Promise<string[]> {
  if (rootUnitIds.length === 0) return [];
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE subtree AS (
      SELECT id FROM "OrgUnit" WHERE id = ANY(${rootUnitIds})
      UNION ALL
      SELECT o.id FROM "OrgUnit" o JOIN subtree s ON o."parentId" = s.id
    )
    SELECT id FROM subtree;
  `;
  return rows.map((r) => r.id);
}

export async function ancestorUnitIds(unitId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE ancestors AS (
      SELECT id, "parentId" FROM "OrgUnit" WHERE id = ${unitId}
      UNION ALL
      SELECT o.id, o."parentId" FROM "OrgUnit" o JOIN ancestors a ON o.id = a."parentId"
    )
    SELECT id FROM ancestors;
  `;
  return rows.map((r) => r.id);
}
