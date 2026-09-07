/**
 * Calendar-date helpers, consistent with lib/rules' Africa/Lagos wall-clock
 * assumption (all Date objects here are UTC-constructed but represent Lagos
 * wall-clock instants — Lagos has no DST, so this is a stable fixed offset).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** The most recent Sunday on/before `now` (today, if today is Sunday). */
export function mostRecentSunday(now: Date): Date {
  const d = dateOnly(now);
  const day = d.getUTCDay(); // 0 = Sunday
  return new Date(d.getTime() - day * MS_PER_DAY);
}

/** The last `count` Sundays whose reporting window has already closed, most recent first. */
export function lastClosedSundays(count: number, now: Date): Date[] {
  const latest = mostRecentSunday(now);
  const closedLatest =
    now.getTime() >= new Date(latest.getTime() + MS_PER_DAY + 7 * 60 * 60 * 1000).getTime()
      ? latest
      : new Date(latest.getTime() - 7 * MS_PER_DAY);
  return Array.from({ length: count }, (_, i) => new Date(closedLatest.getTime() - i * 7 * MS_PER_DAY));
}

export function isSameDate(a: Date, b: Date): boolean {
  return dateOnly(a).getTime() === dateOnly(b).getTime();
}

export function formatServiceDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}
