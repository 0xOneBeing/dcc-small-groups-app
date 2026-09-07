import { describe, expect, it } from "vitest";
import { contactRate, wasContactedWithinWindow } from "./contactRate";

const ASSIGNED = new Date(Date.UTC(2026, 7, 1, 9, 0, 0));

describe("wasContactedWithinWindow", () => {
  it("is within window at exactly 7 days (boundary, inclusive)", () => {
    const exact = new Date(Date.UTC(2026, 7, 8, 9, 0, 0));
    expect(wasContactedWithinWindow({ assignedAt: ASSIGNED, firstContactedAt: exact })).toBe(true);
  });

  it("is outside the window one millisecond past 7 days", () => {
    const justAfter = new Date(Date.UTC(2026, 7, 8, 9, 0, 0, 1));
    expect(wasContactedWithinWindow({ assignedAt: ASSIGNED, firstContactedAt: justAfter })).toBe(false);
  });

  it("is false when never contacted", () => {
    expect(wasContactedWithinWindow({ assignedAt: ASSIGNED, firstContactedAt: null })).toBe(false);
  });

  it("does not use the 2-day overdue threshold", () => {
    const fiveDaysLater = new Date(Date.UTC(2026, 7, 6, 9, 0, 0));
    expect(wasContactedWithinWindow({ assignedAt: ASSIGNED, firstContactedAt: fiveDaysLater })).toBe(true);
  });
});

describe("contactRate", () => {
  it("computes a percentage across a leader's follow-ups", () => {
    const within = new Date(Date.UTC(2026, 7, 3, 9, 0, 0));
    const followUps = [
      { assignedAt: ASSIGNED, firstContactedAt: within },
      { assignedAt: ASSIGNED, firstContactedAt: within },
      { assignedAt: ASSIGNED, firstContactedAt: null },
      { assignedAt: ASSIGNED, firstContactedAt: null },
    ];
    expect(contactRate(followUps)).toBe(50);
  });

  it("is 0 for an empty list", () => {
    expect(contactRate([])).toBe(0);
  });
});
