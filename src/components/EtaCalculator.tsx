import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { DatePicker, Field, TextInput, Button, Chips, ResultCard, Row, Panel, Notice, Stack } from "../ui/kit";
import { UNIT_MS, computeEta, formatDuration } from "../lib/eta";
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

/** "YYYY-MM-DD" and "HH:MM" as a local date; null when either is incomplete. */
function parseStart(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!d || !t || Number(t[1]) > 23 || Number(t[2]) > 59) return null;
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
}

const whenFormat = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const num = (v: string) => Number(v.replace(",", "."));

export default function EtaCalculator() {
  const [now] = useState(() => new Date());
  const [total, setTotal] = useState("500");
  const [done, setDone] = useState("5");
  const [span, setSpan] = useState("3");
  const [unit, setUnit] = useState<TimeUnit>("minutes");
  const [date, setDate] = useState(dateInput(now));
  const [time, setTime] = useState(timeInput(now));

  const start = parseStart(date, time);
  const eta = useMemo(() => (start ? computeEta(num(total), num(done), num(span), unit, start) : null), [total, done, span, unit, start?.getTime()]);
  const speed = num(done) > 0 && num(span) > 0 ? `${(num(done) / (num(span) * UNIT_MS[unit] / 60_000)).toLocaleString("it-IT", { maximumFractionDigits: 3 })} al minuto` : "—";

  return (
    <Stack>
      <div className="space-y-6">
        <div className="space-y-4">
          <Field label="Quantità totale da fare" hint="Per esempio 500 piatti, 2000 MB, 120 pagine.">
            <TextInput type="number" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Quantità fatta in un dato tempo">
            <div className="grid grid-cols-2 gap-3">
              <TextInput type="number" inputMode="decimal" value={done} onChange={(e) => setDone(e.target.value)} suffixText="fatti" />
              <TextInput type="number" inputMode="decimal" value={span} onChange={(e) => setSpan(e.target.value)} prefixText="in" />
            </div>
          </Field>
          <Chips value={unit} onChange={setUnit} options={UNITS} />
        </div>

        <div className="space-y-4">
          <Field label="Quando hai iniziato">
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <DatePicker value={date} onChange={setDate} />
              <TextInput value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" aria-label="Ora di inizio" />
            </div>
          </Field>
          <Button size="sm" icon={<Clock className="w-3.5 h-3.5" />} onClick={() => { const d = new Date(); setDate(dateInput(d)); setTime(timeInput(d)); }}>Parto adesso</Button>
          {eta ? (
            <>
              <ResultCard label="Durata totale" value={formatDuration(eta.durationMs)} copyText={formatDuration(eta.durationMs)} />
              <ResultCard label="Finirà" value={whenFormat.format(eta.end)} copyText={whenFormat.format(eta.end)} />
              <Panel inset className="space-y-1.5">
                <Row label="Velocità" value={speed} />
                {eta.end.getTime() > Date.now() && <Row label="Da adesso mancano" value={formatDuration(eta.end.getTime() - Date.now())} />}
              </Panel>
            </>
          ) : (
            <Notice>Inserisci quantità e tempo (tutti maggiori di zero) e un orario di inizio valido, come 14:30.</Notice>
          )}
        </div>
      </div>
    </Stack>
  );
}
