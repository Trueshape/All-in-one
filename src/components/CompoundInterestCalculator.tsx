import { useMemo, useState } from "react";
import { Field, TextInput, Chips, ResultCard, Panel, Stat, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { simulate } from "../lib/compound";

const FREQUENCIES = [
  { value: 1, label: "Annuale" },
  { value: 2, label: "Semestrale" },
  { value: 4, label: "Trimestrale" },
  { value: 12, label: "Mensile" },
];

const eur = (n: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function CompoundInterestCalculator() {
  const u = useUi();
  const [principal, setPrincipal] = useState("5000");
  const [monthly, setMonthly] = useState("150");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("10");
  const [frequency, setFrequency] = useState(12);

  const result = useMemo(
    () => simulate(Math.max(parseFloat(principal) || 0, 0), Math.max(parseFloat(monthly) || 0, 0), Math.max(parseFloat(rate) || 0, 0), Math.min(Math.max(parseFloat(years) || 0, 0), 100), frequency),
    [principal, monthly, rate, years, frequency],
  );

  const total = result.invested + result.interest;
  const investedPct = total > 0 ? (result.invested / total) * 100 : 100;

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Capitale iniziale">
            <TextInput type="number" min="0" max="1000000000" decimals={2} value={principal} onChange={(e) => setPrincipal(e.target.value)} prefixText="€" />
          </Field>
          <Field label="Deposito mensile">
            <TextInput type="number" min="0" max="1000000000" decimals={2} value={monthly} onChange={(e) => setMonthly(e.target.value)} prefixText="€" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tasso annuo">
              <TextInput type="number" min="0" max="100" step="0.1" decimals={2} value={rate} onChange={(e) => setRate(e.target.value)} suffixText="%" />
            </Field>
            <Field label="Durata">
              <TextInput type="number" min="0" max="100" decimals={2} value={years} onChange={(e) => setYears(e.target.value)} suffixText="anni" />
            </Field>
          </div>
          <Field label="Capitalizzazione">
            <Chips fill value={frequency} onChange={setFrequency} options={FREQUENCIES} />
          </Field>
        </div>

        <div className="space-y-4">
          <ResultCard label="Valore futuro stimato" value={eur(result.final)} copyText={eur(result.final)} />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Versato" value={eur(result.invested)} tone="accent" />
            <Stat label="Interessi" value={eur(result.interest)} tone="good" />
          </div>
          <Panel className="space-y-2">
            <div className={`flex justify-between text-[11px] font-mono ${u.muted}`}>
              <span>Versato {Math.round(investedPct)}%</span>
              <span>Interessi {Math.round(100 - investedPct)}%</span>
            </div>
            <div className="h-3 flex overflow-hidden border border-zinc-800/60">
              <div className="h-full bg-zinc-500/60 transition-all duration-300" style={{ width: `${investedPct}%` }} />
              <div className="h-full transition-all duration-300" style={{ width: `${100 - investedPct}%`, background: u.accentHex }} />
            </div>
          </Panel>
        </div>
      </div>

      <Notice>
        Interessi calcolati mese per mese e capitalizzati secondo la frequenza scelta, con i depositi versati a fine mese. Simulazione indicativa, senza tasse né commissioni.
      </Notice>
    </Stack>
  );
}
