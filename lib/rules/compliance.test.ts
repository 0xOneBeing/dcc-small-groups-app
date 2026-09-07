import { describe, expect, it } from "vitest";
import { cellComplianceCounts, complianceRate, sumComplianceCounts } from "./compliance";

describe("cellComplianceCounts", () => {
  it("counts an approved current week as submitted", () => {
    expect(cellComplianceCounts({ currentWeek: "approved", priorWeeksMostRecentFirst: [] })).toEqual({
      submitted: 1,
      pending: 0,
      missing: 0,
      chronic: 0,
    });
  });

  it("counts a pending current week as pending, not missing", () => {
    expect(cellComplianceCounts({ currentWeek: "pending", priorWeeksMostRecentFirst: [] })).toEqual({
      submitted: 0,
      pending: 1,
      missing: 0,
      chronic: 0,
    });
  });

  it("counts a missing current week and flags chronic once the streak (including this week) reaches 3", () => {
    const result = cellComplianceCounts({
      currentWeek: null,
      priorWeeksMostRecentFirst: ["draft", "draft", "approved"],
    });
    expect(result).toEqual({ submitted: 0, pending: 0, missing: 1, chronic: 1 });
  });

  it("does not flag chronic at only 2 consecutive misses", () => {
    const result = cellComplianceCounts({
      currentWeek: null,
      priorWeeksMostRecentFirst: ["draft", "approved"],
    });
    expect(result.chronic).toBe(0);
  });

  it("a submitted-but-pending current week does not itself break or extend a missing streak", () => {
    const result = cellComplianceCounts({
      currentWeek: "pending",
      priorWeeksMostRecentFirst: ["draft", "draft", "draft"],
    });
    // this week is pending (submitted), so the streak calc doesn't include it —
    // prior 3-week miss streak doesn't count this cell as currently missing
    expect(result).toEqual({ submitted: 0, pending: 1, missing: 0, chronic: 0 });
  });
});

describe("sumComplianceCounts", () => {
  it("sums children counts rather than storing an aggregate", () => {
    const children = [
      { submitted: 5, pending: 1, missing: 0, chronic: 0 },
      { submitted: 3, pending: 0, missing: 2, chronic: 1 },
    ];
    expect(sumComplianceCounts(children)).toEqual({ submitted: 8, pending: 1, missing: 2, chronic: 1 });
  });

  it("sums an empty subtree to all zeros", () => {
    expect(sumComplianceCounts([])).toEqual({ submitted: 0, pending: 0, missing: 0, chronic: 0 });
  });
});

describe("complianceRate", () => {
  it("counts submitted and pending as reported, missing as not", () => {
    expect(complianceRate({ submitted: 80, pending: 10, missing: 10, chronic: 3 }, 100)).toBe(90);
  });

  it("is 0 for a scope with no cells", () => {
    expect(complianceRate({ submitted: 0, pending: 0, missing: 0, chronic: 0 }, 0)).toBe(0);
  });
});
