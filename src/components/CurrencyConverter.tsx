import { Fragment, useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { Field, TextInput, Select, IconButton, HeaderAction, ResultCard, Row, Panel, SectionTitle, Notice, Stack, cx, fmtNumber } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { CPI, adjust, yearRange, type InflationCurrency } from "../lib/inflation";
import { historicalRate } from "../lib/fxHistory";

const CURRENCIES: Record<string, { name: string; symbol: string; fallback: number }> = {
  EUR: { name: "Euro", symbol: "€", fallback: 1 },
  USD: { name: "Dollaro statunitense", symbol: "$", fallback: 1.09 },
  GBP: { name: "Sterlina britannica", symbol: "£", fallback: 0.85 },
  JPY: { name: "Yen giapponese", symbol: "¥", fallback: 165.25 },
  CAD: { name: "Dollaro canadese", symbol: "C$", fallback: 1.48 },
  AUD: { name: "Dollaro australiano", symbol: "A$", fallback: 1.63 },
  CHF: { name: "Franco svizzero", symbol: "CHF", fallback: 0.98 },
  CNY: { name: "Renminbi cinese", symbol: "¥", fallback: 7.82 },
  // out of use since 2002: fixed conversion rate, never read from the service
  ITL: { name: "Lira italiana", symbol: "₤", fallback: 1936.27 },
};

/** Years offered for the "then" column: most series start in 1900. */
const THEN_YEARS = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 2025 - i);

/** What `amount` of a currency, as of the last year with price data, was worth in `year`; null when there is no price series for it. */
function worthIn(code: string, amount: number, year: number): number | null {
  if (!(code in CPI)) return null;
  const c = code as InflationCurrency;
  return adjust(c, amount, yearRange(c).last, year)?.value ?? null;
}

/** The "Da" and "A" lists, in alphabetical order of the currency name. */
const BY_NAME = Object.entries(CURRENCIES).sort(([, a], [, b]) => a.name.localeCompare(b.name, "it"));

const FALLBACK_RATES =Object.fromEntries(Object.entries(CURRENCIES).map(([code, c]) => [code, c.fallback]));

type Status = { kind: "fallback" } | { kind: "loading" } | { kind: "live" } | { kind: "error" };

export default function CurrencyConverter() {
  const u = useUi();
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [status, setStatus] = useState<Status>({ kind: "fallback" });
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [thenYear, setThenYear] = useState(2000);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/EUR", { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.rates) throw new Error("Risposta non valida");
      setRates(Object.fromEntries(Object.entries(CURRENCIES).map(([code, c]) => [code, code === "ITL" ? c.fallback : Number(data.rates[code]) || c.fallback])));
      setStatus({ kind: "live" });
    } catch (err) {
      if (signal?.aborted) return;
      setStatus({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const value = parseFloat(amount);
  const valid = Number.isFinite(value);
  const converted = valid ? (value / rates[from]) * rates[to] : 0;
  const rate = rates[to] / rates[from];

  return (
    <Stack>
      <HeaderAction onClick={() => load()} disabled={status.kind === "loading"} title="Aggiorna tassi">
        <RefreshCw className={cx("w-4 h-4", status.kind === "loading" && "animate-spin")} />
      </HeaderAction>

      {status.kind === "error" && <Notice tone="warn">Impossibile contattare il servizio di cambio: i risultati usano valori indicativi fissi.</Notice>}

      <Field label="Importo">
        <TextInput type="number" inputMode="decimal" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} prefixText={CURRENCIES[from].symbol} />
      </Field>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label="Da">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {BY_NAME.map(([code, c]) => <option key={code} value={code}>{code} · {c.name}</option>)}
          </Select>
        </Field>
        <IconButton onClick={() => { setFrom(to); setTo(from); }} title="Inverti valute" className="mb-1"><ArrowLeftRight className="w-4 h-4" /></IconButton>
        <Field label="A">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {BY_NAME.map(([code, c]) => <option key={code} value={code}>{code} · {c.name}</option>)}
          </Select>
        </Field>
      </div>

      <ResultCard
        label="Conversione"
        value={valid ? (
          <span className="block">
            <span className="block text-lg font-semibold font-display text-zinc-100">{fmtNumber(value, 2)} {from} =</span>
            <span className="block text-2xl font-bold font-display" style={{ color: u.accentHex }}>{fmtNumber(converted, 4)} {to}</span>
          </span>
        ) : "—"}
        copyText={valid ? `${fmtNumber(value, 2)} ${from} = ${fmtNumber(converted, 2)} ${to}` : ""}
      />

      <div className={cx("p-3 space-y-2 rounded-xl", u.panel)}>
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
          <span />
          <span className={cx("px-2 text-right font-medium", u.subtle)}>Tasso di cambio</span>
          <span className={cx("px-2 text-right font-medium", u.subtle)}>Oggi</span>
          <div className="flex items-center justify-end gap-2">
            <span className={cx("font-medium", u.subtle)}>Valeva nel</span>
            <div className="w-24">
              <Select value={String(thenYear)} onChange={(e) => setThenYear(Number(e.target.value))} aria-label="Anno del confronto">
                {THEN_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
          </div>
          {Object.keys(CURRENCIES).filter((c) => c !== from).map((code) => {
            const now = valid ? (value / rates[from]) * rates[code] : null;
            const past = now === null ? null : worthIn(code, now, thenYear);
            const rate = historicalRate(from, code, thenYear);
            return (
              <Fragment key={code}>
                <span className={cx("font-medium px-2 py-1.5", u.muted)}>{code}</span>
                <span className={cx("font-mono text-right px-2 py-1.5 rounded-lg", u.panelInset, rate === null ? u.muted : u.subtle)}>{rate === null ? "—" : fmtNumber(rate, 2)}</span>
                <span className={cx("font-mono font-semibold text-right px-2 py-1.5 rounded-lg", u.panelInset, u.text)}>{now === null ? "—" : fmtNumber(now, 2)}</span>
                <span className={cx("font-mono font-semibold text-right px-2 py-1.5 rounded-lg", u.panelInset, past === null ? u.muted : u.text)}>{past === null ? "—" : fmtNumber(past, 2)}</span>
              </Fragment>
            );
          })}
        </div>
      </div>
      <Notice>
        Cambia la valuta di partenza o di arrivo: il risultato si aggiorna subito. «Valeva nel» riporta l'importo di oggi con il potere d'acquisto dell'anno scelto, usando l'inflazione di ciascuna valuta, ferma all'ultimo anno con dati (2025; 2024 il dollaro USA, 2001 la lira). «Tasso di cambio» è quanto valeva 1 {from} in ogni valuta nell'anno scelto (media annua, da 1900 per le valute principali, dal 1960 per il renminbi, dal 1999 per l'euro). «—» se l'anno è fuori dalla serie.
      </Notice>
    </Stack>
  );
}
