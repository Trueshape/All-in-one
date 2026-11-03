/** "12:30" is 12 min 30 s, a bare "12" is 12 minutes. Returns seconds, or null when it is not a usable time (1 s to 999 min). */
export function parseTime(text: string): number | null {
  const t = text.trim();
  const m = /^(\d{1,3}):([0-5]?\d)$/.exec(t);
  const seconds = m ? Number(m[1]) * 60 + Number(m[2]) : /^\d{1,3}$/.test(t) ? Number(t) * 60 : NaN;
  return Number.isFinite(seconds) && seconds >= 1 && seconds <= 999 * 60 ? seconds : null;
}
