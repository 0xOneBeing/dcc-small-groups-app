import { describe, expect, it } from "vitest";
import { classifyWeek, consecutiveMissedSundays, isChronicCell } from "./chronic";

describe("classifyWeek", () => {
  it("classifies approved as approved", () => {
    expect(classifyWeek("approved")).toBe("approved");
  });

  it("classifies pending and sent_back as pending — a sent-back report was still submitted", () => {
    expect(classifyWeek("pending")).toBe("pending");
    expect(classifyWeek("sent_back")).toBe("pending");
  });

  it("classifies draft or no row as missing", () => {
    expect(classifyWeek("draft")).toBe("missing");
    expect(classifyWeek(null)).toBe("missing");
  });
});

describe("consecutiveMissedSundays", () => {
  it("counts leading misses only, most recent first", () => {
    expect(consecutiveMissedSundays(["missing", "missing", "approved", "missing"])).toBe(2);
  });

  it("is 0 when the most recent week was not missed", () => {
    expect(consecutiveMissedSundays(["approved", "missing", "missing", "missing"])).toBe(0);
  });

  it("is 0 for an empty history", () => {
    expect(consecutiveMissedSundays([])).toBe(0);
  });

  it("counts a full run of misses", () => {
    expect(consecutiveMissedSundays(["missing", "missing", "missing"])).toBe(3);
  });
});

describe("isChronicCell", () => {
  it("is not chronic at exactly 2 consecutive misses (boundary)", () => {
    expect(isChronicCell(2)).toBe(false);
  });

  it("is chronic at exactly 3 consecutive misses (boundary)", () => {
    expect(isChronicCell(3)).toBe(true);
  });

  it("is chronic well past 3 consecutive misses", () => {
    expect(isChronicCell(6)).toBe(true);
  });

  it("is not chronic at 0 misses", () => {
    expect(isChronicCell(0)).toBe(false);
  });
});
