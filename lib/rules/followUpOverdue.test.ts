import { describe, expect, it } from "vitest";
import { isFollowUpOverdue } from "./followUpOverdue";

const ASSIGNED = new Date(Date.UTC(2026, 7, 20, 9, 0, 0));

describe("isFollowUpOverdue", () => {
  it("is not overdue at exactly 2 days (boundary)", () => {
    const exact = new Date(Date.UTC(2026, 7, 22, 9, 0, 0));
    expect(isFollowUpOverdue({ status: "not_contacted", assignedAt: ASSIGNED }, exact)).toBe(false);
  });

  it("is overdue one millisecond past 2 days", () => {
    const justAfter = new Date(Date.UTC(2026, 7, 22, 9, 0, 0, 1));
    expect(isFollowUpOverdue({ status: "not_contacted", assignedAt: ASSIGNED }, justAfter)).toBe(true);
  });

  it("is not overdue before 2 days", () => {
    const before = new Date(Date.UTC(2026, 7, 21, 9, 0, 0));
    expect(isFollowUpOverdue({ status: "not_contacted", assignedAt: ASSIGNED }, before)).toBe(false);
  });

  it("is never overdue once contacted", () => {
    const later = new Date(Date.UTC(2026, 7, 30, 9, 0, 0));
    expect(isFollowUpOverdue({ status: "contacted", assignedAt: ASSIGNED }, later)).toBe(false);
  });

  it("is never overdue once joined_cell or unable_to_reach", () => {
    const later = new Date(Date.UTC(2026, 7, 30, 9, 0, 0));
    expect(isFollowUpOverdue({ status: "joined_cell", assignedAt: ASSIGNED }, later)).toBe(false);
    expect(isFollowUpOverdue({ status: "unable_to_reach", assignedAt: ASSIGNED }, later)).toBe(false);
  });

  it("respects a configurable threshold", () => {
    const fourDaysLater = new Date(Date.UTC(2026, 7, 24, 9, 0, 0, 1));
    expect(isFollowUpOverdue({ status: "not_contacted", assignedAt: ASSIGNED }, fourDaysLater, 4)).toBe(true);
    expect(isFollowUpOverdue({ status: "not_contacted", assignedAt: ASSIGNED }, fourDaysLater, 5)).toBe(false);
  });
});
