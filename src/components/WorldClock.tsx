import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Globe, Moon, Sun } from "lucide-react";
import { DatePicker, Field, IconButton, Notice, Panel, Select, Slider, Button, Stack, TextInput, cx } from "../ui/kit";
import { offsetDifference, zonedTimeToInstant } from "../lib/timeZones";
import { useUi } from "../ui/tokens";

const CITIES = [
  { name: "Roma", country: "Italia", zone: "Europe/Rome" },
  { name: "Londra", country: "Regno Unito", zone: "Europe/London" },
  { name: "New York", country: "USA", zone: "America/New_York" },
  { name: "Los Angeles", country: "USA", zone: "America/Los_Angeles" },
  { name: "Tokyo", country: "Giappone", zone: "Asia/Tokyo" },
  { name: "Sydney", country: "Australia", zone: "Australia/Sydney" },
  { name: "Dubai", country: "Emirati Arabi", zone: "Asia/Dubai" },
  { name: "San Paolo", country: "Brasile", zone: "America/Sao_Paulo" },
];

/** "GMT+05:30" becomes "UTC+5:30", "GMT-03:00" becomes "UTC-3" and plain "GMT" becomes "UTC". */
const utcLabel = (raw: string) => {
  const m = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(raw);
  if (!m) return raw;
  if (!m[1] || (m[2] === "00" && m[3] === "00")) return "UTC";
  return `UTC${m[1]}${Number(m[2])}${m[3] === "00" ? "" : `:${m[3]}`}`;
};

const ZONE_NAMES = Object.fromEntries(CITIES.map((c) => [c.zone, `${c.name} (${c.country})`]));
/** The cities above first, then every other zone the browser knows. */
const ZONES = [...CITIES.map((c) => c.zone), ...((Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? []).filter((z) => !ZONE_NAMES[z])];

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const diffLabel = (minutes: number) => {
  if (minutes === 0) return "stessa ora";
  const abs = Math.abs(minutes);
  const text = `${Math.floor(abs / 60)}${abs % 60 ? `:${String(abs % 60).padStart(2, "0")}` : ""} h`;
  return `${minutes > 0 ? "+" : "-"}${text}`;
};

export default function WorldClock() {
  const u = useUi();
  const [now, setNow] = useState(() => new Date());
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Converter: a date and time in one zone, shown in another.
  const [from, setFrom] = useState("Europe/Rome");
  const [to, setTo] = useState("America/New_York");
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState("12:00");
  const converted = useMemo(() => {
    const instant = zonedTimeToInstant(date, time, from);
    if (instant === null) return null;
    const text = new Intl.DateTimeFormat("it-IT", { timeZone: to, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(instant));
    return { text, diff: offsetDifference(instant, from, to) };
  }, [date, time, from, to]);
  const zoneName = (zone: string) => ZONE_NAMES[zone] ?? zone.replace(/_/g, " ");

  const shifted = useMemo(() => new Date(now.getTime() + offset * 3_600_000), [now, offset]);

  const formatters = useMemo(
    () =>
      Object.fromEntries(
        CITIES.map((c) => [
          c.zone,
          {
            time: new Intl.DateTimeFormat("it-IT", { timeZone: c.zone, hour: "2-digit", minute: "2-digit", ...(offset === 0 && { second: "2-digit" }), hourCycle: "h23" }),
            date: new Intl.DateTimeFormat("it-IT", { timeZone: c.zone, weekday: "short", day: "numeric", month: "short" }),
            hour: new Intl.DateTimeFormat("en-GB", { timeZone: c.zone, hour: "numeric", hourCycle: "h23" }),
            zone: new Intl.DateTimeFormat("it-IT", { timeZone: c.zone, timeZoneName: "longOffset" }),
          },
        ]),
      ),
    [offset],
  );

  const zoneLabel = (zone: string) => utcLabel(formatters[zone].zone.formatToParts(shifted).find((p) => p.type === "timeZoneName")?.value ?? "");

  return (
    <Stack>
      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className={cx("inline-flex items-center gap-2", u.statLabel)}><Globe className="w-4 h-4" /> Pianificatore fusi orari</span>
          <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(0)}>Ora reale</Button>
        </div>
        <Slider label={offset === 0 ? "Tempo reale" : "Spostamento"} value={offset} min={-12} max={12} onChange={setOffset} display={offset === 0 ? "LIVE" : `${offset > 0 ? "+" : ""}${offset} h`} />
      </Panel>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {CITIES.map((city) => {
          const f = formatters[city.zone];
          const hour = Number(f.hour.format(shifted));
          const day = hour >= 6 && hour < 18;
          return (
            <Panel key={city.zone} className="flex flex-col justify-between gap-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={cx("block text-[10px]", u.muted)}>{city.country}</span>
                  <span className={cx("block text-sm font-semibold truncate", u.text)}>{city.name}</span>
                </div>
                {day ? <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Moon className={cx("w-3.5 h-3.5 shrink-0", u.accent)} />}
              </div>
              <div>
                <span className={cx("block text-2xl font-light tabular-nums", u.text)}>{f.time.format(shifted)}</span>
                <span className={cx("block text-[10px] uppercase mt-0.5", u.muted)}>{f.date.format(shifted)} · {zoneLabel(city.zone)}</span>
              </div>
            </Panel>
          );
        })}
      </div>
      <Panel className="space-y-3">
        <span className={cx("inline-flex items-center gap-2", u.statLabel)}><ArrowLeftRight className="w-4 h-4" /> Convertitore fusi orari</span>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3">
          <Field label="Da">
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>{ZONES.map((z) => <option key={z} value={z}>{zoneName(z)}</option>)}</Select>
          </Field>
          <IconButton onClick={() => { setFrom(to); setTo(from); }} title="Inverti i due fusi" className="mb-1"><ArrowLeftRight className="w-4 h-4" /></IconButton>
          <Field label="A">
            <Select value={to} onChange={(e) => setTo(e.target.value)}>{ZONES.map((z) => <option key={z} value={z}>{zoneName(z)}</option>)}</Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><DatePicker value={date} onChange={setDate} /></Field>
          <Field label="Ora"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <p className={cx("text-lg font-semibold", u.text)}>
          {converted ? converted.text : "—"}
          {converted && <span className={cx("ml-2 text-xs font-normal normal-case", u.muted)}>{diffLabel(converted.diff)}</span>}
        </p>
      </Panel>
      <Notice>Gli orari seguono i fusi orari del sistema, ora legale inclusa. Sposta il cursore per vedere che ore saranno in un altro momento.</Notice>
    </Stack>
  );
}
