/**
 * Rule 1 — the reporting window for a given Sunday closes at 07:00 the
 * following Monday. All Date values here are treated as Africa/Lagos
 * wall-clock instants (UTC+1, no DST), so callers must construct `serviceDate`
 * and `now` consistently in that same wall-clock representation.
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export const REPORTING_WINDOW_CLOSE_HOUR = 7;

/** The exact instant the reporting window for `serviceDate` (a Sunday) closes. */
export function reportingWindowCloseAt(serviceDate: Date): Date {
  const close = new Date(
    Date.UTC(
      serviceDate.getUTCFullYear(),
      serviceDate.getUTCMonth(),
      serviceDate.getUTCDate() + 1, // the following Monday
      REPORTING_WINDOW_CLOSE_HOUR,
      0,
      0,
      0,
    ),
  );
  return close;
}

/** True once `now` has reached or passed the close instant. */
export function isReportingWindowClosed(serviceDate: Date, now: Date): boolean {
  return now.getTime() >= reportingWindowCloseAt(serviceDate).getTime();
}

/** Convenience inverse of {@link isReportingWindowClosed}. */
export function isReportingWindowOpen(serviceDate: Date, now: Date): boolean {
  return !isReportingWindowClosed(serviceDate, now);
}

export { MS_PER_HOUR, MS_PER_DAY };
