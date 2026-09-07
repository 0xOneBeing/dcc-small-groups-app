import { describe, expect, it } from "vitest";
import { escalatesAt, isReportEscalated } from "./escalation";

const SUBMITTED = new Date(Date.UTC(2026, 7, 24, 8, 0, 0));

describe("escalatesAt", () => {
  it("is 36 hours after submission", () => {
    expect(escalatesAt(SUBMITTED).toISOString()).toBe("2026-08-25T20:00:00.000Z");
  });
});

describe("isReportEscalated", () => {
  it("is not escalated one millisecond before 36 hours", () => {
    const almost = new Date(Date.UTC(2026, 7, 25, 19, 59, 59, 999));
    expect(isReportEscalated({ status: "pending", submittedAt: SUBMITTED }, almost)).toBe(false);
  });

  it("is escalated at exactly 36 hours", () => {
    const exact = new Date(Date.UTC(2026, 7, 25, 20, 0, 0, 0));
    expect(isReportEscalated({ status: "pending", submittedAt: SUBMITTED }, exact)).toBe(true);
  });

  it("is escalated well after 36 hours", () => {
    const later = new Date(Date.UTC(2026, 7, 27, 0, 0, 0));
    expect(isReportEscalated({ status: "pending", submittedAt: SUBMITTED }, later)).toBe(true);
  });

  it("never escalates an approved report", () => {
    const later = new Date(Date.UTC(2026, 7, 27, 0, 0, 0));
    expect(isReportEscalated({ status: "approved", submittedAt: SUBMITTED }, later)).toBe(false);
  });

  it("never escalates a sent-back report", () => {
    const later = new Date(Date.UTC(2026, 7, 27, 0, 0, 0));
    expect(isReportEscalated({ status: "sent_back", submittedAt: SUBMITTED }, later)).toBe(false);
  });

  it("never escalates a report that was never submitted", () => {
    const later = new Date(Date.UTC(2026, 7, 27, 0, 0, 0));
    expect(isReportEscalated({ status: "pending", submittedAt: null }, later)).toBe(false);
  });
});
