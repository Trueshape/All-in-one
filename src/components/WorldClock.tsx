import { useEffect, useMemo, useState } from "react";
import { Globe, Moon, Sun } from "lucide-react";
import { Panel, Slider, Button, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const CITIES = [
  { name: "Roma", country: "Italia", flag: "🇮🇹", zone: "Europe/Rome" },
  { name: "Londra", country: "Regno Unito", flag: "🇬🇧", zone: "Europe/London" },
  { name: "New York", country: "USA", flag: "🇺🇸", zone: "America/New_York" },
  { name: "Los Angeles", country: "USA", flag: "🇺🇸", zone: "America/Los_Angeles" },
  { name: "Tokyo", country: "Giappone", flag: "🇯🇵", zone: "Asia/Tokyo" },
  { name: "Sydney", country: "Australia", flag: "🇦🇺", zone: "Australia/Sydney" },
  { name: "Dubai", country: "Emirati Arabi", flag: "🇦🇪", zone: "Asia/Dubai" },
];

export default function WorldClock() {
  const u = useUi();
  const [now, setNow] = useState(() => new Date());
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

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
            zone: new Intl.DateTimeFormat("it-IT", { timeZone: c.zone, timeZoneName: "short" }),
          },
        ]),
      ),
    [offset],
  );

  const zoneLabel = (zone: string) => formatters[zone].zone.formatToParts(shifted).find((p) => p.type === "timeZoneName")?.value ?? "";

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
                  <span className={cx("block text-[10px]", u.muted)}>{city.flag} {city.country}</span>
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
    </Stack>
  );
}
