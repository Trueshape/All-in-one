import { useMemo, useState } from "react";
import { Field, TextInput, Chips, Select, ResultCard, Stat, Notice, Stack } from "../ui/kit";
import { adjust, yearRange, type InflationCurrency } from "../lib/inflation";

const CURRENCIES: Array<{ value: InflationCurrency; label: string; symbol: string }> = [
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "USD", label: "Dollaro", symbol: "$" },
  { value: "JPY", label: "Yen", symbol: "¥" },
  { value: "ITL", label: "Lira", symbol: "₤" },
];

const SOURCE: Record<InflationCurrency, string> = {
  EUR: "Eurostat (indice HICP dell'area euro, disponibile dal 1996)",
  USD: "FRED e Banca Mondiale (prezzi al consumo degli Stati Uniti), prima del 1913 Macrohistory Database",
  JPY: "Banca Mondiale (prezzi al consumo del Giappone) dal 1990, prima Macrohistory Database",
  ITL: "ISTAT (prezzi al consumo delle famiglie di operai e impiegati), fino al 2001, ultimo anno della lira",
};

const percent = (n: number) => `${n > 0 ? "+" : ""}${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(n)}%`;

export default function InflationCalculator() {
  const [currency, setCurrency] = useState<InflationCurrency>("EUR");
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(2000);
  const [to, setTo] = useState(2025);

  const { first, last } = yearRange(currency);
  // switching currency can leave a year outside the new series: pull it back in
  const start = Math.min(Math.max(from, first), last);
  const end = Math.min(Math.max(to, first), last);
  const years = useMemo(() => Array.from({ length: last - first + 1 }, (_, i) => last - i), [first, last]);

  const money = (n: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency, maximumFractionDigits: currency === "JPY" || currency === "ITL" ? 0 : 2 }).format(n);
  const value = Math.max(parseFloat(amount) || 0, 0);
  const result = adjust(currency, value, start, end);

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Valuta">
            <Chips fill value={currency} onChange={setCurrency} options={CURRENCIES.map(({ value: v, label }) => ({ value: v, label }))} />
          </Field>
          <Field label="Importo">
            <TextInput type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} prefixText={CURRENCIES.find((c) => c.value === currency)!.symbol} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dall'anno">
              <Select value={String(start)} onChange={(e) => setFrom(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </Field>
            <Field label="All'anno">
              <Select value={String(end)} onChange={(e) => setTo(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          {result && (
            <>
              <ResultCard label={`Potere d'acquisto nel ${end}`} value={money(result.value)} copyText={money(result.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Variazione prezzi" value={percent(result.total)} tone={result.total > 0 ? "bad" : "good"} />
                <Stat label="Media annua" value={result.yearly === null ? "—" : percent(result.yearly)} tone="accent" />
              </div>
            </>
          )}
        </div>
      </div>

      <Notice>
        {money(value)} del {start} comprano ciò che oggi nel {end} costa {result ? money(result.value) : "—"}. Fonte: {SOURCE[currency]}, media annuale, dal {first} al {last}. Dato indicativo: l'inflazione reale cambia da persona a persona.
      </Notice>
    </Stack>
  );
}
