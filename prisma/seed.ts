/**
 * Seeds a realistic Alimosho hierarchy: 1 region, 3 districts, 9 zones,
 * 27 areas, 81 sections, ~243 cells. Every generator is keyed on a cell's
 * (or unit's) sequential index — never on name length — so distinct cells
 * always get distinct addresses and coordinates.
 */
import { PrismaClient, type OrgLevel, type CellRole, type CellType, type CellMemberRole } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function rand() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLACES = [
  "Ijegun", "Ikotun", "Igando", "Egbeda", "Akowonjo", "Idimu", "Ayobo", "Iyana Ipaja",
  "Abule Egba", "Dopemu", "Shasha", "Baruwa", "Command", "Isheri", "Aboru", "Abesan",
  "Ekoro", "Alagbado", "Meiran", "Oke Odo", "Pleasure", "Governor Road", "Ile Epo",
  "Alakuko", "Amikanle", "Elere", "Orisunbare", "Agbelekale",
];
const CELL_NAMES = [
  "Grace", "Faith", "Zion", "Bethel", "Hebron", "Eden", "Shiloh", "Rehoboth", "Peniel",
  "Gilgal", "Carmel", "Salem", "Antioch", "Berea", "Cana", "Bethany", "Jabez", "Elim",
  "Horeb", "Tabor", "Emmaus", "Mizpah", "Bethesda", "Kidron", "Zoar", "Succoth", "Ophir", "Sychar",
];
const FIRST = [
  "Tunde", "Bola", "Chidi", "Ngozi", "Femi", "Aisha", "Emeka", "Folake", "Segun", "Adaeze",
  "Kunle", "Ifeoma", "Yemi", "Uche", "Dare", "Blessing", "Sola", "Nneka", "Gbenga", "Halima",
  "Tayo", "Chinedu", "Bisi", "Kelechi", "Wale", "Amaka", "Seyi", "Obinna", "Toyin", "Ezinne",
];
const LAST = [
  "Bakare", "Adeyemi", "Okonkwo", "Balogun", "Eze", "Ogunleye", "Nwosu", "Adebayo", "Ilesanmi",
  "Okafor", "Sodipo", "Ajayi", "Umeh", "Oladipo", "Anyanwu", "Fasasi", "Obi", "Alabi", "Nnaji",
  "Salami", "Oyelaran", "Ibe", "Akinola", "Chukwu", "Odunsi",
];
const CELL_TYPES: CellType[] = ["adult", "young_adult", "youth", "children", "mixed"];
const MEMBER_ROLES: CellMemberRole[] = ["member", "member", "member", "member", "assistant", "host"];

const STANDARD_PASSWORD = "Password123!";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

let globalIndex = 0;

function personFor(kind: string, index: number): PendingUser {
  const r = mulberry32(index * 2654435761 + kind.length);
  const first = FIRST[Math.floor(r() * FIRST.length)];
  const last = LAST[Math.floor(r() * LAST.length)];
  const uid = globalIndex++;
  return {
    id: randomUUID(),
    name: `${first} ${last}`,
    email: `${first}.${last}.${uid}@daystarng.org`.toLowerCase(),
    phone: `+234${700000000 + Math.floor(r() * 99999999)}`,
  };
}

async function main() {
  console.log("Seeding Alimosho hierarchy…");
  const passwordHash = await hashPassword(STANDARD_PASSWORD);

  const allUsers: {
    id: string; name: string; email: string; phone: string; passwordHash: string; status: "active";
  }[] = [];
  const roleAssignments: { id: string; userId: string; unitId: string; role: CellRole }[] = [];
  const orgUnits: {
    id: string; level: OrgLevel; name: string; code: string; parentId: string | null; leaderId: string;
  }[] = [];
  const cells: { id: string; unitId: string; cellType: CellType; address: string; latitude: number; longitude: number }[] = [];
  const reviewerByCellUnit = new Map<string, string>(); // cell unitId -> that cell's Section Leader userId
  const cellMembers: {
    id: string; cellId: string; name: string; phone: string; roleInCell: CellMemberRole; joinedOn: Date; active: boolean;
  }[] = [];

  function addLeader(kind: string, index: number, unitId: string, role: CellRole) {
    const person = personFor(kind, index);
    allUsers.push({ ...person, passwordHash, status: "active" });
    roleAssignments.push({ id: randomUUID(), userId: person.id, unitId, role });
    return person;
  }

  // Region
  const regionId = randomUUID();
  const regionLeader = personFor("region", 0);
  orgUnits.push({ id: regionId, level: "region", name: "Alimosho Region", code: "R-1", parentId: null, leaderId: regionLeader.id });
  allUsers.push({ ...regionLeader, passwordHash, status: "active" });
  roleAssignments.push({ id: randomUUID(), userId: regionLeader.id, unitId: regionId, role: "regional_coordinator" });

  let districtCode = 0, zoneCode = 0, areaCode = 0, sectionCode = 0, cellCode = 0, placeCursor = 0;
  const nextPlace = () => PLACES[placeCursor++ % PLACES.length];

  for (let di = 0; di < 3; di++) {
    const districtId = randomUUID();
    const districtLeader = addLeader("district", districtCode, districtId, "district_coordinator");
    orgUnits.push({
      id: districtId, level: "district", name: `${nextPlace()} District`, code: `D-${++districtCode}`,
      parentId: regionId, leaderId: districtLeader.id,
    });

    for (let zi = 0; zi < 3; zi++) {
      const zoneId = randomUUID();
      const zoneLeader = addLeader("zone", zoneCode, zoneId, "zonal_coordinator");
      orgUnits.push({
        id: zoneId, level: "zone", name: `${nextPlace()} Zone`, code: `Z-${++zoneCode}`,
        parentId: districtId, leaderId: zoneLeader.id,
      });

      for (let ai = 0; ai < 3; ai++) {
        const areaId = randomUUID();
        const areaLeader = addLeader("area", areaCode, areaId, "area_coordinator");
        orgUnits.push({
          id: areaId, level: "area", name: `${nextPlace()} Area`, code: `A-${++areaCode}`,
          parentId: zoneId, leaderId: areaLeader.id,
        });

        for (let si = 0; si < 3; si++) {
          const sectionId = randomUUID();
          const sectionLeader = addLeader("section", sectionCode, sectionId, "section_leader");
          const sectionPlace = nextPlace();
          orgUnits.push({
            id: sectionId, level: "section", name: `${sectionPlace} Section ${si + 1}`, code: `S-${++sectionCode}`,
            parentId: areaId, leaderId: sectionLeader.id,
          });

          for (let ci = 0; ci < 3; ci++) {
            const idx = cellCode; // unique identity for this cell's generators — never string length
            const cellUnitId = randomUUID();
            const cellLeader = addLeader("cell", idx, cellUnitId, "cell_leader");
            const cellName = `${CELL_NAMES[idx % CELL_NAMES.length]} Cell`;
            orgUnits.push({
              id: cellUnitId, level: "cell", name: cellName, code: `C-${++cellCode}`,
              parentId: sectionId, leaderId: cellLeader.id,
            });

            const r = mulberry32(idx * 40503 + 17);
            const lat = 6.55 + r() * 0.09;
            const lng = 3.24 + r() * 0.09;
            const cellId = randomUUID();
            reviewerByCellUnit.set(cellUnitId, sectionLeader.id);
            cells.push({
              id: cellId,
              unitId: cellUnitId,
              cellType: CELL_TYPES[Math.floor(r() * CELL_TYPES.length)],
              address: `${Math.floor(1 + r() * 40)} ${sectionPlace} Street, ${sectionPlace}, Lagos`,
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
            });

            const memberCount = 6 + Math.floor(r() * 10);
            for (let mi = 0; mi < memberCount; mi++) {
              const member = personFor(`member-${idx}`, mi);
              cellMembers.push({
                id: randomUUID(),
                cellId,
                name: member.name,
                phone: member.phone,
                roleInCell: MEMBER_ROLES[Math.floor(r() * MEMBER_ROLES.length)],
                joinedOn: new Date(Date.UTC(2024, Math.floor(r() * 12), 1 + Math.floor(r() * 27))),
                active: r() > 0.08,
              });
            }

          }
        }
      }
    }
  }

  console.log(`Prepared ${orgUnits.length} org units, ${allUsers.length} users, ${cells.length} cells, ${cellMembers.length} members.`);

  await prisma.user.createMany({ data: allUsers });
  // OrgUnit rows must be inserted level-by-level, parents before children,
  // so the parent-level trigger can validate each row as it lands.
  for (const level of ["region", "district", "zone", "area", "section", "cell"] as OrgLevel[]) {
    const rows = orgUnits.filter((u) => u.level === level);
    if (rows.length) await prisma.orgUnit.createMany({ data: rows });
  }
  await prisma.roleAssignment.createMany({ data: roleAssignments });
  await prisma.cell.createMany({ data: cells });
  await prisma.cellMember.createMany({ data: cellMembers });

  await seedReportsAndFollowUps(cells, reviewerByCellUnit, cellMembers);

  await prisma.appSetting.upsert({
    where: { key: "followUpOverdueDays" },
    create: { key: "followUpOverdueDays", value: "2" },
    update: {},
  });

  console.log("Seed complete.");
  console.log(`All seeded users share the password: ${STANDARD_PASSWORD}`);

  await seedSuperAdminAndDemoInvites();
}

function mostRecentSundayUTC(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(d.getTime() - d.getUTCDay() * 86_400_000);
}

async function seedReportsAndFollowUps(
  cells: { id: string; unitId: string }[],
  reviewerByCellUnit: Map<string, string>,
  cellMembers: { id: string; cellId: string; active: boolean }[],
) {
  const now = new Date();
  const lastSunday = mostRecentSundayUTC(now);
  const weeks = Array.from({ length: 10 }, (_, i) => new Date(lastSunday.getTime() - (i + 1) * 7 * 86_400_000));

  // Fetch the cell_leader RoleAssignment for each cell's unit to attribute submissions.
  const leaderRoles = await prisma.roleAssignment.findMany({
    where: { role: "cell_leader", unitId: { in: cells.map((c) => c.unitId) } },
    select: { unitId: true, userId: true },
  });
  const leaderByUnit = new Map(leaderRoles.map((r) => [r.unitId, r.userId]));

  const reports: {
    id: string; cellId: string; serviceDate: Date; status: "approved" | "pending" | "sent_back";
    submittedById: string; submittedAt: Date; channel: "web" | "whatsapp"; membersPresent: number;
    reviewedById?: string; reviewedAt?: Date;
  }[] = [];

  cells.forEach((cell, i) => {
    const r = mulberry32(i * 91103 + 3);
    const basePresent = 10 + Math.floor(r() * 14);
    const isChronic = r() < 0.08; // ~8% of cells are chronic non-reporters
    const isFlaky = !isChronic && r() < 0.25; // occasional misses

    weeks.forEach((serviceDate, weekIdx) => {
      const isMostRecentThree = weekIdx < 3;
      const missThisWeek = isChronic && isMostRecentThree ? true : isFlaky && r() < 0.3;
      if (missThisWeek) return; // no report row at all — "missing"

      const present = Math.max(0, Math.round(basePresent + (r() - 0.5) * 6));
      const submittedAt = new Date(serviceDate.getTime() + 20 * 3600_000 + Math.floor(r() * 30) * 60_000);
      const leaderId = leaderByUnit.get(cell.unitId)!;
      const reviewerId = reviewerByCellUnit.get(cell.unitId)!;
      const stillPending = weekIdx === 0 && r() < 0.3;
      const sentBack = !stillPending && weekIdx < 2 && r() < 0.1;

      reports.push({
        id: randomUUID(),
        cellId: cell.id,
        serviceDate,
        status: stillPending ? "pending" : sentBack ? "sent_back" : "approved",
        submittedById: leaderId,
        submittedAt,
        channel: r() < 0.3 ? "whatsapp" : "web",
        membersPresent: present,
        reviewedById: stillPending ? undefined : reviewerId,
        reviewedAt: stillPending ? undefined : new Date(submittedAt.getTime() + 10 * 3600_000),
      });
    });
  });

  // Insert in chunks — SQL Server/Postgres param limits, keep it simple and safe.
  const chunkSize = 500;
  for (let i = 0; i < reports.length; i += chunkSize) {
    await prisma.sundayReport.createMany({ data: reports.slice(i, i + chunkSize) });
  }
  console.log(`Seeded ${reports.length} Sunday reports.`);

  await seedMemberAttendance(reports, cellMembers);

  // Follow-ups: a handful of new guests/converts per section, some overdue.
  const followUps: {
    id: string; personName: string; phone: string; type: "new_guest" | "new_convert";
    address: string; assignedCellId: string; assignedById: string; assignedAt: Date; status: "not_contacted" | "contacted" | "unable_to_reach" | "joined_cell";
  }[] = [];
  const sample = cells.filter((_, i) => i % 3 === 0);
  sample.forEach((cell, i) => {
    const r = mulberry32(i * 613 + 91);
    const count = Math.floor(r() * 3);
    for (let j = 0; j < count; j++) {
      const person = personFor(`followup-${i}`, j);
      const ageDays = Math.floor(r() * 14);
      const status = r() < 0.5 ? "not_contacted" : r() < 0.8 ? "contacted" : "unable_to_reach";
      followUps.push({
        id: randomUUID(),
        personName: person.name,
        phone: person.phone,
        type: r() < 0.5 ? "new_guest" : "new_convert",
        address: `${PLACES[(i + j) % PLACES.length]}, Lagos`,
        assignedCellId: cell.id,
        assignedById: leaderByUnit.get(cell.unitId)!,
        assignedAt: new Date(Date.now() - ageDays * 86_400_000),
        status,
      });
    }
  });
  if (followUps.length) await prisma.followUp.createMany({ data: followUps });
  console.log(`Seeded ${followUps.length} follow-ups.`);
}

/**
 * One attendance row per (active member, report). Presence follows a
 * Markov-ish walk per member (streaky, not independent draws each week) so
 * some members genuinely show a 3+ week absence streak for the "missed
 * lately" rail to surface — keyed on the member's own index, never on name.
 */
async function seedMemberAttendance(
  reports: { id: string; cellId: string; serviceDate: Date }[],
  cellMembers: { id: string; cellId: string; active: boolean }[],
) {
  const reportsByCell = new Map<string, { id: string; serviceDate: Date }[]>();
  for (const r of reports) {
    if (!reportsByCell.has(r.cellId)) reportsByCell.set(r.cellId, []);
    reportsByCell.get(r.cellId)!.push({ id: r.id, serviceDate: r.serviceDate });
  }
  for (const list of reportsByCell.values()) list.sort((a, b) => a.serviceDate.getTime() - b.serviceDate.getTime());

  const membersByCell = new Map<string, { id: string; active: boolean }[]>();
  for (const m of cellMembers) {
    if (!m.active) continue;
    if (!membersByCell.has(m.cellId)) membersByCell.set(m.cellId, []);
    membersByCell.get(m.cellId)!.push(m);
  }

  const rows: { id: string; cellMemberId: string; sundayReportId: string; present: boolean }[] = [];
  let memberIndex = 0;
  for (const [cellId, members] of membersByCell) {
    const cellReports = reportsByCell.get(cellId) ?? [];
    for (const member of members) {
      const r = mulberry32(memberIndex++ * 486187739 + 11);
      const baseRate = 0.55 + r() * 0.4;
      let present = r() < baseRate;
      for (const report of cellReports) {
        present = r() < 0.25 ? !present : r() < baseRate; // streaky, not independent
        rows.push({ id: randomUUID(), cellMemberId: member.id, sundayReportId: report.id, present });
      }
    }
  }

  const chunkSize = 1000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await prisma.cellMemberAttendance.createMany({ data: rows.slice(i, i + chunkSize) });
  }
  console.log(`Seeded ${rows.length} member attendance rows.`);
}

async function seedSuperAdminAndDemoInvites() {
  const { generateInvitationCode } = await import("../lib/auth/tokens");
  const { invitationExpiresAt } = await import("../lib/auth/invitation");

  const superAdminCode = generateInvitationCode();
  await prisma.user.create({
    data: {
      name: "Grace Adewale",
      email: "superadmin@daystarng.org",
      status: "invited",
      invitationCode: superAdminCode,
      invitationExpiresAt: invitationExpiresAt(true),
    },
  });
  const regionUnit = await prisma.orgUnit.findFirstOrThrow({ where: { level: "region" } });
  const superAdminUser = await prisma.user.findUniqueOrThrow({ where: { email: "superadmin@daystarng.org" } });
  await prisma.roleAssignment.create({
    data: { userId: superAdminUser.id, unitId: regionUnit.id, role: "super_admin" },
  });

  console.log("---");
  console.log(`Super Admin activation: superadmin@daystarng.org / code ${superAdminCode}`);

  const demoLeader = await prisma.user.findFirst({
    where: { roleAssignments: { some: { role: "cell_leader" } } },
    orderBy: { createdAt: "asc" },
  });
  if (demoLeader) {
    console.log(`Demo Cell Leader sign-in: ${demoLeader.email} / Password123!`);
  }
  const demoCoordinator = await prisma.user.findFirst({
    where: { roleAssignments: { some: { role: "section_leader" } } },
    orderBy: { createdAt: "asc" },
  });
  if (demoCoordinator) {
    console.log(`Demo Section Leader sign-in: ${demoCoordinator.email} / Password123!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
