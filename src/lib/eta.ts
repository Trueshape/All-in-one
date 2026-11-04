/** ETA of a task from its speed so far: "done" units in "span" time, with "total" units to go through. */

export const UNIT_MS = { seconds: 1000, minutes: 60_000, hours: 3_600_000, days: 86_400_000 } as const;
export type TimeUnit = keyof typeof UNIT_MS;

export interface Eta {
  durationMs: number;
  end: Date;
}

export function computeEta(total: number, done: number, span: number, unit: TimeUnit, start: Date): Eta | null {
  if (!(total > 0) || !(done > 0) || !(span > 0) || Number.isNaN(start.getTime())) return null;
  const durationMs = (total / done) * span * UNIT_MS[unit];
  const end = new Date(start.getTime() + durationMs);
  return Number.isFinite(durationMs) && !Number.isNaN(end.getTime()) ? { durationMs, end } : null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 giorni 3 ore 10 minuti": the two or three largest non-zero units. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(Math.abs(ms) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    days && plural(days, "giorno", "giorni"),
    hours && plural(hours, "ora", "ore"),
    minutes && plural(minutes, "minuto", "minuti"),
    !days && !hours && seconds && plural(seconds, "secondo", "secondi"),
  ].filter(Boolean) as string[];
  return parts.length ? parts.slice(0, 3).join(" ") : "meno di un secondo";
}
