import { describe, expect, it } from "vitest";
import { isFigureVarianceFlagged, isReportVarianceFlagged, trailingAverage } from "./varianceFlag";

describe("isFigureVarianceFlagged", () => {
  it("is not flagged exactly at 30% below average (boundary)", () => {
    // average 20, 30% below = 14 exactly
    expect(isFigureVarianceFlagged(14, 20)).toBe(false);
  });

  it("is flagged one unit below the 30% boundary", () => {
    expect(isFigureVarianceFlagged(13, 20)).toBe(true);
  });

  it("is not flagged just above the 30% boundary", () => {
    expect(isFigureVarianceFlagged(14.01, 20)).toBe(false);
  });

  it("is not flagged when current is at or above average", () => {
    expect(isFigureVarianceFlagged(20, 20)).toBe(false);
    expect(isFigureVarianceFlagged(25, 20)).toBe(false);
  });

  it("is never flagged with no trailing average (insufficient history)", () => {
    expect(isFigureVarianceFlagged(1, null)).toBe(false);
  });

  it("is never flagged with a null current figure (unanswered, not zero)", () => {
    expect(isFigureVarianceFlagged(null, 20)).toBe(false);
  });

  it("is never flagged against a zero average", () => {
    expect(isFigureVarianceFlagged(0, 0)).toBe(false);
  });
});

describe("trailingAverage", () => {
  it("averages only the trailing 8 weeks, most recent last", () => {
    const tenWeeks = [1, 1, 10, 10, 10, 10, 10, 10, 10, 10];
    // drops the two leading 1s
    expect(trailingAverage(tenWeeks)).toBe(10);
  });

  it("ignores unanswered (null) weeks", () => {
    expect(trailingAverage([10, null, 20])).toBe(15);
  });

  it("returns null when there is no history at all", () => {
    expect(trailingAverage([])).toBeNull();
    expect(trailingAverage([null, null])).toBeNull();
  });
});

describe("isReportVarianceFlagged", () => {
  it("flags a cell whose own history says this week is a big drop", () => {
    const priorWeeks = [18, 20, 19, 21, 20, 19, 20, 21]; // avg 19.75
    expect(isReportVarianceFlagged(10, priorWeeks)).toBe(true);
  });

  it("does not flag a different cell with a naturally smaller trailing average", () => {
    // this cell's own average is small, so its current figure is not a
    // regional-constant violation — the check is per cell, never a shared bar
    const priorWeeks = [4, 5, 4, 5, 4, 5, 4, 5]; // avg 4.5
    expect(isReportVarianceFlagged(4, priorWeeks)).toBe(false);
  });
});
