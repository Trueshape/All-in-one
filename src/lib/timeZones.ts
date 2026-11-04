/** Offset of a zone from UTC at a given instant, in minutes (Rome in summer is +120). */
export function zoneOffsetMinutes(instant: number, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / 60_000);
}

/**
 * The instant at which the wall clock of `zone` shows the given date and time.
 * Around a clock change the result is the nearest valid instant.
 */
export function zonedTimeToInstant(date: string, time: string, zone: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const wall = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  if (Number.isNaN(wall)) return null;
  // The offset at the first guess can differ from the offset at the real instant around a clock change, so it is looked up again.
  const instant = wall - zoneOffsetMinutes(wall - zoneOffsetMinutes(wall, zone) * 60_000, zone) * 60_000;
  return instant;
}

/** Difference between two zones at an instant, in minutes: positive when `to` is ahead of `from`. */
export const offsetDifference = (instant: number, from: string, to: string) => zoneOffsetMinutes(instant, to) - zoneOffsetMinutes(instant, from);
