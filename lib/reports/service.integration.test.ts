import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { buildFixtureHierarchy, cleanupFixtureHierarchy } from "@/test/fixtures";
import { getReport, saveDraft, submitReport, approveReport, sendBackReport } from "./service";

describe("approval and send-back cycle (integration)", () => {
  let fixture: Awaited<ReturnType<typeof buildFixtureHierarchy>>;
  // A Sunday safely in the past relative to "now" used in these tests, but
  // whose window is still open relative to the fixed `now` we pass in below.
  const serviceDate = new Date("2026-08-23T00:00:00.000Z");
  const withinWindow = new Date("2026-08-24T06:00:00.000Z"); // before Mon 07:00 close

  beforeAll(async () => {
    fixture = await buildFixtureHierarchy();
  });

  afterAll(async () => {
    await cleanupFixtureHierarchy(fixture.run);
    await prisma.$disconnect();
  });

  it("takes a report from draft -> submitted -> approved, locking it", async () => {
    await saveDraft({
      cellId: fixture.cellA.id,
      serviceDate,
      figures: { membersPresent: 14, converts: 1 },
      comments: "First draft",
      actorUserId: fixture.cellLeaderA.id,
    });

    let report = await getReport(fixture.cellA.id, serviceDate);
    expect(report?.status).toBe("draft");
    expect(report?.membersPresent).toBe(14);

    const submitted = await submitReport({
      cellId: fixture.cellA.id,
      serviceDate,
      figures: { membersPresent: 14, converts: 1 },
      comments: "First draft",
      actorUserId: fixture.cellLeaderA.id,
      actorRole: "cell_leader",
      now: withinWindow,
    });
    expect(submitted.status).toBe("pending");
    expect(submitted.filedByProxy).toBe(false);
    expect(submitted.channel).toBe("web");

    const approved = await approveReport(submitted.id, fixture.sectionLeaderA.id);
    expect(approved.status).toBe("approved");
    expect(approved.reviewedById).toBe(fixture.sectionLeaderA.id);

    // Locked: neither a draft save nor a re-submit should be allowed once approved.
    await expect(
      saveDraft({
        cellId: fixture.cellA.id,
        serviceDate,
        figures: { membersPresent: 99 },
        actorUserId: fixture.cellLeaderA.id,
      }),
    ).rejects.toThrow(/locked/i);

    await expect(
      submitReport({
        cellId: fixture.cellA.id,
        serviceDate,
        figures: { membersPresent: 99 },
        actorUserId: fixture.cellLeaderA.id,
        actorRole: "cell_leader",
        now: withinWindow,
      }),
    ).rejects.toThrow(/already been approved/i);

    report = await getReport(fixture.cellA.id, serviceDate);
    expect(report?.membersPresent).toBe(14); // untouched by the rejected edits
  });

  it("sends a report back with a note, and the leader can edit and resubmit — it still counts as reported once approved (rule 3)", async () => {
    const otherSunday = new Date("2026-08-16T00:00:00.000Z");
    const otherWindow = new Date("2026-08-17T06:00:00.000Z");

    const submitted = await submitReport({
      cellId: fixture.cellB.id,
      serviceDate: otherSunday,
      figures: { membersPresent: 8 },
      actorUserId: fixture.cellLeaderB.id,
      actorRole: "cell_leader",
      now: otherWindow,
    });
    expect(submitted.status).toBe("pending");

    const sentBack = await sendBackReport(submitted.id, fixture.sectionLeaderB.id, "Please recount attendance");
    expect(sentBack.status).toBe("sent_back");
    expect(sentBack.reviewNote).toBe("Please recount attendance");

    // Sent-back is editable — not locked.
    await saveDraft({
      cellId: fixture.cellB.id,
      serviceDate: otherSunday,
      figures: { membersPresent: 11 },
      actorUserId: fixture.cellLeaderB.id,
    });

    const resubmitted = await submitReport({
      cellId: fixture.cellB.id,
      serviceDate: otherSunday,
      figures: { membersPresent: 11 },
      actorUserId: fixture.cellLeaderB.id,
      actorRole: "cell_leader",
      now: otherWindow,
    });
    expect(resubmitted.status).toBe("pending");
    expect(resubmitted.reviewNote).toBeNull(); // cleared on resubmit
    expect(resubmitted.membersPresent).toBe(11);

    const approved = await approveReport(resubmitted.id, fixture.sectionLeaderB.id);
    expect(approved.status).toBe("approved");
  });

  it("blocks a Cell Leader from submitting after the window closes, but allows a proxy submission", async () => {
    const sunday = new Date("2026-07-05T00:00:00.000Z");
    const afterClose = new Date("2026-07-07T08:00:00.000Z"); // Tuesday — well past Monday 07:00

    await expect(
      submitReport({
        cellId: fixture.cellA.id,
        serviceDate: sunday,
        figures: { membersPresent: 5 },
        actorUserId: fixture.cellLeaderA.id,
        actorRole: "cell_leader",
        now: afterClose,
      }),
    ).rejects.toThrow(/window.*closed/i);

    const proxied = await submitReport({
      cellId: fixture.cellA.id,
      serviceDate: sunday,
      figures: { membersPresent: 5 },
      actorUserId: fixture.sectionLeaderA.id,
      actorRole: "section_leader",
      now: afterClose,
    });
    expect(proxied.status).toBe("pending");
    expect(proxied.filedByProxy).toBe(true);
  });
});
