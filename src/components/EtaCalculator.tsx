import { useEffect, useMemo, useState } from "react";
import { DatePicker, Field, TextInput, Chips, ResultCard, Row, Panel, Notice, Stack } from "../ui/kit";
import { UNIT_MS, computeEta, formatDuration } from "../lib/eta";
import { usePersisted } from "../lib/persist";
import type { TimeUnit } from "../lib/eta";

const UNITS: Array<{ value: TimeUnit; label: string }> = [
  { value: "seconds", label: "secondi" },
  { value: "minutes", label: "minuti" },
  { value: "hours", label: "ore" },
  { value: "days", label: "giorni" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const dateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "YYYY-MM-DD" and "H:MM" or "HH:MM" as a local date; null when either is incomplete or out of range. */
function parseStart(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{1,2})$/.exec(time);
  if (!d || !t || Number(t[1]) > 23 || Number(t[2]) > 59) return null;
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
}

/** Whether a typed time can still become a valid HH:MM: no hour above 23 and no minute above 59, at most 5 characters. */
function timeAllowed(s: string): boolean {
  const m = /^(\d{0,2})(?::(\d{0,2}))?$/.exec(s);
  if (!m) return false;
  if (m[1].length === 2 && Number(m[1]) > 23) return false;
  if (m[2] !== undefined && m[2].length === 2 && Number(m[2]) > 59) return false;
  return true;
}

const whenFormat = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const num = (v: string) => Number(v.replace(",", "."));

export default function EtaCalculator() {
  const [now] = useState(() => new Date());
  const [total, setTotal] = usePersisted("eta:total", "500");
  const [done, setDone] = usePersisted("eta:done", "5");
  const [span, setSpan] = usePersisted("eta:span", "3");
  const [unit, setUnit] = usePersisted<TimeUnit>("eta:unit", "minutes");
  const [date, setDate] = useState(dateInput(now));
  const [time, setTime] = useState(timeInput(now));

  // While the time is half typed (e.g. "14:" after deleting a digit), keep the last valid start instead of hiding the result.
  const [lastStart, setLastStart] = useState<Date | null>(() => parseStart(date, time));
  useEffect(() => {
    const p = parseStart(date, time);
    if (p) setLastStart(p);
  }, [date, time]);
  const start = parseStart(date, time) ?? lastStart;
  const eta = useMemo(() => (start ? computeEta(num(total), num(done), num(span), unit, start) : null), [total, done, span, unit, start?.getTime()]);
  const speed = num(done) > 0 && num(span) > 0 ? `${(num(done) / (num(span) * UNIT_MS[unit] / 60_000)).toLocaleString("it-IT", { maximumFractionDigits: 3 })} al minuto` : "—";

  return (
    <Stack>
      <div className="space-y-6">
        <div className="space-y-4">
          <Field label="Totale">
            <TextInput type="number" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Ritmo">
            <div className="grid grid-cols-2 items-start gap-3">
              <div className="space-y-2">
                <TextInput type="number" inputMode="decimal" value={done} onChange={(e) => setDone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <TextInput type="number" inputMode="decimal" value={span} onChange={(e) => setSpan(e.target.value)} prefixText="ogni" />
                <Chips value={unit} onChange={setUnit} options={UNITS} />
              </div>
            </div>
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="Inizio">
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <DatePicker value={date} onChange={setDate} />
              <TextInput
                value={time}
                onChange={(e) => { if (timeAllowed(e.target.value.trim())) setTime(e.target.value.trim()); }}
                onBlur={() => { const p = parseStart(date, time); if (p) setTime(timeInput(p)); }}
                placeholder="HH:MM"
                aria-label="Ora di inizio"
              />
            </div>
          </Field>
          {eta ? (
            <>
              <ResultCard label="Durata totale" value={formatDuration(eta.durationMs)} copyText={formatDuration(eta.durationMs)} />
              <ResultCard label="Finirà" value={whenFormat.format(eta.end)} copyText={whenFormat.format(eta.end)} />
              <Panel inset className="space-y-1.5">
                <Row label="Velocità" value={speed} />
              </Panel>
            </>
          ) : (
            <Notice tone="empty">Inserisci quantità e tempo (tutti maggiori di zero) e un orario di inizio valido, come 14:30.</Notice>
          )}
        </div>
      </div>
      <Notice>Dato il totale e quante unità completi in ogni intervallo di tempo, calcola quanto dura il lavoro e a che ora finisce.</Notice>
    </Stack>
  );
}
