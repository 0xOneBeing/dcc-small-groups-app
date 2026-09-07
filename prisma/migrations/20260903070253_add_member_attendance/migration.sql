-- CreateTable
CREATE TABLE "CellMemberAttendance" (
    "id" TEXT NOT NULL,
    "cellMemberId" TEXT NOT NULL,
    "sundayReportId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CellMemberAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CellMemberAttendance_sundayReportId_idx" ON "CellMemberAttendance"("sundayReportId");

-- CreateIndex
CREATE UNIQUE INDEX "CellMemberAttendance_cellMemberId_sundayReportId_key" ON "CellMemberAttendance"("cellMemberId", "sundayReportId");

-- AddForeignKey
ALTER TABLE "CellMemberAttendance" ADD CONSTRAINT "CellMemberAttendance_cellMemberId_fkey" FOREIGN KEY ("cellMemberId") REFERENCES "CellMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellMemberAttendance" ADD CONSTRAINT "CellMemberAttendance_sundayReportId_fkey" FOREIGN KEY ("sundayReportId") REFERENCES "SundayReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
