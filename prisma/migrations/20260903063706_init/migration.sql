-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('region', 'district', 'zone', 'area', 'section', 'cell');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('invited', 'active', 'deactivated');

-- CreateEnum
CREATE TYPE "CellRole" AS ENUM ('cell_leader', 'section_leader', 'area_coordinator', 'zonal_coordinator', 'district_coordinator', 'regional_coordinator', 'super_admin');

-- CreateEnum
CREATE TYPE "CellType" AS ENUM ('adult', 'young_adult', 'youth', 'children', 'mixed');

-- CreateEnum
CREATE TYPE "CellMemberRole" AS ENUM ('member', 'assistant', 'host');

-- CreateEnum
CREATE TYPE "ReportChannel" AS ENUM ('web', 'whatsapp');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'pending', 'approved', 'sent_back');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('new_guest', 'new_convert');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('not_contacted', 'contacted', 'joined_cell', 'unable_to_reach');

-- CreateTable
CREATE TABLE "OrgUnit" (
    "id" TEXT NOT NULL,
    "level" "OrgLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "leaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "invitationCode" TEXT,
    "invitationExpiresAt" TIMESTAMP(3),
    "totpSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "role" "CellRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "mfaVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "cellType" "CellType" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellMember" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "roleInCell" "CellMemberRole" NOT NULL DEFAULT 'member',
    "joinedOn" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CellMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SundayReport" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "serviceDate" DATE NOT NULL,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "channel" "ReportChannel" NOT NULL DEFAULT 'web',
    "filedByProxy" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReportStatus" NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "membersPresent" INTEGER,
    "guestCardsReceived" INTEGER,
    "decisionCardsReceived" INTEGER,
    "guestsTotalVisitation" INTEGER,
    "decisionsTotalVisitation" INTEGER,
    "visitationPhysical" INTEGER,
    "visitationPhone" INTEGER,
    "visitationText" INTEGER,
    "visitationEmail" INTEGER,
    "membersPaidInFull" INTEGER,
    "baptismHolyGhost" INTEGER,
    "waterBaptism" INTEGER,
    "membershipClassGraduates" INTEGER,
    "communionServiceHeld" INTEGER,
    "communityProjectsHeld" INTEGER,
    "lessPrivilegedVisitation" INTEGER,
    "cellLeaderVisitation" INTEGER,
    "cellMemberVisitation" INTEGER,
    "prayerMeetingsHeld" INTEGER,
    "newCellsBirthed" INTEGER,
    "converts" INTEGER,
    "guests" INTEGER,
    "outreachProgrammes" INTEGER,
    "testimoniesShared" INTEGER,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SundayReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "FollowUpType" NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "assignedCellId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'not_contacted',
    "outcomeNote" TEXT,
    "outcomeLoggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgUnit_code_key" ON "OrgUnit"("code");

-- CreateIndex
CREATE INDEX "OrgUnit_parentId_idx" ON "OrgUnit"("parentId");

-- CreateIndex
CREATE INDEX "OrgUnit_level_idx" ON "OrgUnit"("level");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_invitationCode_key" ON "User"("invitationCode");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "RoleAssignment_unitId_idx" ON "RoleAssignment"("unitId");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_idx" ON "RoleAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_unitId_role_key" ON "RoleAssignment"("userId", "unitId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_tokenHash_key" ON "MagicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLink_userId_idx" ON "MagicLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_unitId_key" ON "Cell"("unitId");

-- CreateIndex
CREATE INDEX "CellMember_cellId_idx" ON "CellMember"("cellId");

-- CreateIndex
CREATE INDEX "SundayReport_cellId_serviceDate_idx" ON "SundayReport"("cellId", "serviceDate");

-- CreateIndex
CREATE INDEX "SundayReport_status_idx" ON "SundayReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SundayReport_cellId_serviceDate_key" ON "SundayReport"("cellId", "serviceDate");

-- CreateIndex
CREATE INDEX "FollowUp_assignedCellId_idx" ON "FollowUp"("assignedCellId");

-- CreateIndex
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellMember" ADD CONSTRAINT "CellMember_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SundayReport" ADD CONSTRAINT "SundayReport_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SundayReport" ADD CONSTRAINT "SundayReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SundayReport" ADD CONSTRAINT "SundayReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedCellId_fkey" FOREIGN KEY ("assignedCellId") REFERENCES "Cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Enforce the strict 3-by-3 hierarchy: a unit's parent must be exactly one
-- level above it (region has no parent; every other level requires the
-- immediately preceding level). Prisma's schema language cannot express
-- this, so it is enforced with a trigger.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_org_unit_parent_level() RETURNS TRIGGER AS $$
DECLARE
  parent_level "OrgLevel";
  expected_parent_level "OrgLevel";
BEGIN
  IF NEW."level" = 'region' THEN
    IF NEW."parentId" IS NOT NULL THEN
      RAISE EXCEPTION 'A region unit must not have a parent';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."parentId" IS NULL THEN
    RAISE EXCEPTION 'A % unit must have a parent', NEW."level";
  END IF;

  expected_parent_level := CASE NEW."level"
    WHEN 'district' THEN 'region'
    WHEN 'zone' THEN 'district'
    WHEN 'area' THEN 'zone'
    WHEN 'section' THEN 'area'
    WHEN 'cell' THEN 'section'
  END::"OrgLevel";

  SELECT "level" INTO parent_level FROM "OrgUnit" WHERE "id" = NEW."parentId";

  IF parent_level IS DISTINCT FROM expected_parent_level THEN
    RAISE EXCEPTION 'A % unit''s parent must be a % unit (got %)', NEW."level", expected_parent_level, parent_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_unit_parent_level_check
  BEFORE INSERT OR UPDATE OF "level", "parentId" ON "OrgUnit"
  FOR EACH ROW EXECUTE FUNCTION enforce_org_unit_parent_level();

-- A unit at level `cell` must have exactly one Cell row, and vice versa; that
-- 1-to-1 is already enforced by Cell.unitId being unique + not null.

-- Chronic-reporter and roll-up math read SundayReport at the (cellId,
-- serviceDate) grain, so the composite index doubles as the query path for
-- trailing-N-week averages.
