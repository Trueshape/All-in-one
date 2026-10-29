import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { Field, TextInput, Select, IconButton, ResultCard, Row, Panel, SectionTitle, Notice, Stack, cx, fmtNumber } from "../ui/kit";
import { useUi } from "../ui/tokens";

const CURRENCIES: Record<string, { name: string; symbol: string; fallback: number }> = {
  EUR: { name: "Euro", symbol: "€", fallback: 1 },
  USD: { name: "Dollaro statunitense", symbol: "$", fallback: 1.09 },
  GBP: { name: "Sterlina britannica", symbol: "£", fallback: 0.85 },
  JPY: { name: "Yen giapponese", symbol: "¥", fallback: 165.25 },
  CAD: { name: "Dollaro canadese", symbol: "C$", fallback: 1.48 },
  AUD: { name: "Dollaro australiano", symbol: "A$", fallback: 1.63 },
  CHF: { name: "Franco svizzero", symbol: "CHF", fallback: 0.98 },
  CNY: { name: "Renminbi cinese", symbol: "¥", fallback: 7.82 },
};

const FALLBACK_RATES = Object.fromEntries(Object.entries(CURRENCIES).map(([code, c]) => [code, c.fallback]));

type Status = { kind: "fallback" } | { kind: "loading" } | { kind: "live"; at: string } | { kind: "error" };

export default function CurrencyConverter() {
  const u = useUi();
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [status, setStatus] = useState<Status>({ kind: "fallback" });
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/EUR", { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.rates) throw new Error("Risposta non valida");
      setRates(Object.fromEntries(Object.entries(CURRENCIES).map(([code, c]) => [code, Number(data.rates[code]) || c.fallback])));
      const at = new Date(data.time_last_update_utc);
      setStatus({ kind: "live", at: Number.isNaN(at.getTime()) ? "ora" : at.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) });
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

  const statusText = {
    fallback: "Tassi di riserva",
    loading: "Aggiornamento in corso…",
    live: `Aggiornati: ${status.kind === "live" ? status.at : ""}`,
    error: "Offline: tassi di riserva, non aggiornati",
  }[status.kind];

  return (
    <Stack>
      <div className="flex items-center justify-between gap-3">
        <span className={cx("text-xs", status.kind === "error" ? "text-amber-400" : u.muted)}>{statusText}</span>
        <IconButton onClick={() => load()} disabled={status.kind === "loading"} title="Aggiorna tassi">
          <RefreshCw className={cx("w-4 h-4", status.kind === "loading" && "animate-spin")} />
        </IconButton>
      </div>

      {status.kind === "error" && <Notice tone="warn">Impossibile contattare il servizio di cambio: i risultati usano valori indicativi fissi.</Notice>}

      <Field label="Importo">
        <TextInput type="number" inputMode="decimal" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} prefixText={CURRENCIES[from].symbol} />
      </Field>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label="Da">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {Object.entries(CURRENCIES).map(([code, c]) => <option key={code} value={code}>{code} · {c.name}</option>)}
          </Select>
        </Field>
        <IconButton onClick={() => { setFrom(to); setTo(from); }} title="Inverti valute" className="mb-1"><ArrowLeftRight className="w-4 h-4" /></IconButton>
        <Field label="A">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {Object.entries(CURRENCIES).map(([code, c]) => <option key={code} value={code}>{code} · {c.name}</option>)}
          </Select>
        </Field>
      </div>

      <ResultCard
        label={valid ? `${fmtNumber(value, 2)} ${from} =` : "Risultato"}
        value={valid ? `${fmtNumber(converted, 4)} ${to}` : "—"}
        copyText={valid ? `${fmtNumber(value, 2)} ${from} = ${fmtNumber(converted, 2)} ${to}` : ""}
      >
        <Row label="Tasso" value={`1 ${from} = ${fmtNumber(rate, 6)} ${to}`} />
      </ResultCard>

      <Panel className="space-y-2">
        <SectionTitle>Riferimento (1 EUR)</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-1">
          {Object.keys(CURRENCIES).filter((c) => c !== "EUR").map((code) => <Row key={code} label={code} value={fmtNumber(rates[code], 4)} />)}
        </div>
      </Panel>
    </Stack>
  );
}
