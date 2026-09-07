/**
 * Rule 4 — flag a report for review before approval when a figure is more
 * than 30% below that cell's own trailing 8-week average. The check is
 * per-cell, never a regional constant: callers must supply that cell's own
 * trailing average, never a shared benchmark.
 *
 * The headline figure tracked for this flag is `membersPresent` (attendance)
 * — the one figure the product's attendance chart and coordinator review
 * screen both trend week over week. The predicate itself is figure-agnostic
 * so the same check can be applied to any other figure a screen wants to flag.
 */

export const VARIANCE_THRESHOLD = 0.3;
export const TRAILING_WEEKS = 8;

/**
 * True when `current` is strictly more than 30% below `trailingAverage`.
 * Exactly 30% below is not flagged — the rule says "more than 30%".
 * Returns false when there isn't enough history to compute a meaningful
 * average (null, or zero/negative).
 */
export function isFigureVarianceFlagged(
  current: number | null | undefined,
  trailingAverage: number | null | undefined,
): boolean {
  if (current == null || trailingAverage == null) return false;
  if (trailingAverage <= 0) return false;
  const threshold = trailingAverage * (1 - VARIANCE_THRESHOLD);
  return current < threshold;
}

/** The trailing average of up to the last 8 weeks of a figure, ignoring unanswered (null) weeks. */
export function trailingAverage(values: Array<number | null | undefined>): number | null {
  const recent = values.slice(-TRAILING_WEEKS).filter((v): v is number => v != null);
  if (recent.length === 0) return null;
  return recent.reduce((sum, v) => sum + v, 0) / recent.length;
}

export function isReportVarianceFlagged(
  currentPresent: number | null | undefined,
  priorWeeksPresent: Array<number | null | undefined>,
): boolean {
  return isFigureVarianceFlagged(currentPresent, trailingAverage(priorWeeksPresent));
}
