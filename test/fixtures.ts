import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import type { CellRole } from "@prisma/client";

/**
 * Builds a small, self-contained hierarchy for integration tests:
 *
 *   Region -> District -> Zone -> Area -> Section A -> Cell A
 *                                       -> Section B -> Cell B
 *
 * Two sibling sections (each with their own leader and cell) so tests can
 * assert scope isolation: a Section A leader must never see Section B's data.
 * Every id/email is suffixed with a random run id so parallel/rerun test
 * invocations never collide on unique constraints.
 */
export async function buildFixtureHierarchy() {
  const run = randomUUID().slice(0, 8);
  const passwordHash = await hashPassword("Password123!");

  async function makeUser(name: string, roleUnitId: string, role: CellRole) {
    const user = await prisma.user.create({
      data: { name, email: `${name.toLowerCase().replace(/\s+/g, ".")}.${run}@test.local`, passwordHash, status: "active" },
    });
    await prisma.roleAssignment.create({ data: { userId: user.id, unitId: roleUnitId, role } });
    return user;
  }

  // OrgUnit rows must be created top-down so the parent-level trigger can validate each insert.
  const placeholderLeader = await prisma.user.create({
    data: { name: `Placeholder ${run}`, email: `placeholder.${run}@test.local`, status: "invited" },
  });

  const region = await prisma.orgUnit.create({
    data: { level: "region", name: `Test Region ${run}`, code: `TR-${run}`, leaderId: placeholderLeader.id },
  });
  const district = await prisma.orgUnit.create({
    data: { level: "district", name: `Test District ${run}`, code: `TD-${run}`, parentId: region.id, leaderId: placeholderLeader.id },
  });
  const zone = await prisma.orgUnit.create({
    data: { level: "zone", name: `Test Zone ${run}`, code: `TZ-${run}`, parentId: district.id, leaderId: placeholderLeader.id },
  });
  const area = await prisma.orgUnit.create({
    data: { level: "area", name: `Test Area ${run}`, code: `TA-${run}`, parentId: zone.id, leaderId: placeholderLeader.id },
  });

  const sectionA = await prisma.orgUnit.create({
    data: { level: "section", name: `Test Section A ${run}`, code: `TSA-${run}`, parentId: area.id, leaderId: placeholderLeader.id },
  });
  const cellUnitA = await prisma.orgUnit.create({
    data: { level: "cell", name: `Test Cell A ${run}`, code: `TCA-${run}`, parentId: sectionA.id, leaderId: placeholderLeader.id },
  });
  const cellA = await prisma.cell.create({
    data: { unitId: cellUnitA.id, cellType: "adult", address: "1 Test Street", latitude: 6.58, longitude: 3.28 },
  });

  const sectionB = await prisma.orgUnit.create({
    data: { level: "section", name: `Test Section B ${run}`, code: `TSB-${run}`, parentId: area.id, leaderId: placeholderLeader.id },
  });
  const cellUnitB = await prisma.orgUnit.create({
    data: { level: "cell", name: `Test Cell B ${run}`, code: `TCB-${run}`, parentId: sectionB.id, leaderId: placeholderLeader.id },
  });
  const cellB = await prisma.cell.create({
    data: { unitId: cellUnitB.id, cellType: "adult", address: "2 Test Street", latitude: 6.59, longitude: 3.29 },
  });

  const sectionLeaderA = await makeUser(`Section Leader A ${run}`, sectionA.id, "section_leader");
  const cellLeaderA = await makeUser(`Cell Leader A ${run}`, cellUnitA.id, "cell_leader");
  const sectionLeaderB = await makeUser(`Section Leader B ${run}`, sectionB.id, "section_leader");
  const cellLeaderB = await makeUser(`Cell Leader B ${run}`, cellUnitB.id, "cell_leader");

  return {
    run,
    region, district, zone, area,
    sectionA, cellUnitA, cellA, sectionLeaderA, cellLeaderA,
    sectionB, cellUnitB, cellB, sectionLeaderB, cellLeaderB,
  };
}

export async function cleanupFixtureHierarchy(run: string) {
  // Cascades handle children (RoleAssignment, Cell, SundayReport, etc.) once
  // the OrgUnit rows go; delete leaf-first to satisfy plain FK order too.
  await prisma.orgUnit.deleteMany({ where: { code: { in: [`TCA-${run}`, `TCB-${run}`] } } });
  await prisma.orgUnit.deleteMany({ where: { code: { in: [`TSA-${run}`, `TSB-${run}`] } } });
  await prisma.orgUnit.deleteMany({ where: { code: `TA-${run}` } });
  await prisma.orgUnit.deleteMany({ where: { code: `TZ-${run}` } });
  await prisma.orgUnit.deleteMany({ where: { code: `TD-${run}` } });
  await prisma.orgUnit.deleteMany({ where: { code: `TR-${run}` } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `${run}@test.local` } } });
}
