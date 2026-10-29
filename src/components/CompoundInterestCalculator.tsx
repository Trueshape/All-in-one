import { useMemo, useState } from "react";
import { Field, TextInput, Chips, ResultCard, Panel, Stat, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";

const FREQUENCIES = [
  { value: 1, label: "Annuale" },
  { value: 2, label: "Semestrale" },
  { value: 4, label: "Trimestrale" },
  { value: 12, label: "Mensile" },
];

const eur = (n: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/**
 * Month-by-month simulation. Interest accrues every month on the capitalized
 * balance and is added to it every 12/frequency months; contributions are
 * deposited at the end of each month.
 */
function simulate(principal: number, monthly: number, annualRate: number, years: number, frequency: number) {
  const months = Math.floor(years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const capitalizeEvery = 12 / frequency;
  let balance = principal;
  let accrued = 0;
  let invested = principal;

  for (let m = 1; m <= months; m++) {
    accrued += balance * monthlyRate;
    balance += monthly;
    invested += monthly;
    if (m % capitalizeEvery === 0) {
      balance += accrued;
      accrued = 0;
    }
  }
  const final = balance + accrued;
  return { invested, interest: Math.max(0, final - invested), final };
}

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
            <TextInput type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} prefixText="€" />
          </Field>
          <Field label="Deposito mensile">
            <TextInput type="number" min="0" value={monthly} onChange={(e) => setMonthly(e.target.value)} prefixText="€" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tasso annuo">
              <TextInput type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} suffixText="%" />
            </Field>
            <Field label="Durata">
              <TextInput type="number" min="0" max="100" value={years} onChange={(e) => setYears(e.target.value)} suffixText="anni" />
            </Field>
          </div>
          <Field label="Capitalizzazione">
            <Chips value={frequency} onChange={setFrequency} options={FREQUENCIES} />
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
