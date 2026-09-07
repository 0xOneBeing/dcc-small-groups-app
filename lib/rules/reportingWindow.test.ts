import { describe, expect, it } from "vitest";
import { isReportingWindowClosed, isReportingWindowOpen, reportingWindowCloseAt } from "./reportingWindow";

// 23 August 2026 is a Sunday.
const SUNDAY = new Date(Date.UTC(2026, 7, 23, 12, 0, 0));

describe("reportingWindowCloseAt", () => {
  it("is 07:00 the following Monday", () => {
    const close = reportingWindowCloseAt(SUNDAY);
    expect(close.toISOString()).toBe("2026-08-24T07:00:00.000Z");
  });
});

describe("isReportingWindowClosed", () => {
  it("is open one millisecond before the close instant", () => {
    const justBefore = new Date(Date.UTC(2026, 7, 24, 6, 59, 59, 999));
    expect(isReportingWindowClosed(SUNDAY, justBefore)).toBe(false);
    expect(isReportingWindowOpen(SUNDAY, justBefore)).toBe(true);
  });

  it("is closed at exactly 07:00 Monday", () => {
    const exact = new Date(Date.UTC(2026, 7, 24, 7, 0, 0, 0));
    expect(isReportingWindowClosed(SUNDAY, exact)).toBe(true);
    expect(isReportingWindowOpen(SUNDAY, exact)).toBe(false);
  });

  it("is closed well after the close instant", () => {
    const later = new Date(Date.UTC(2026, 7, 25, 12, 0, 0));
    expect(isReportingWindowClosed(SUNDAY, later)).toBe(true);
  });

  it("is open during the Sunday service itself", () => {
    expect(isReportingWindowClosed(SUNDAY, SUNDAY)).toBe(false);
  });
});
