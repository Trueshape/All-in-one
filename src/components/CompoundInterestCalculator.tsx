import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";

export default function CompoundInterestCalculator() {
  const [initialPrincipal, setInitialPrincipal] = useState<string>("5000");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("150");
  const [annualRate, setAnnualRate] = useState<string>("6.5");
  const [durationYears, setDurationYears] = useState<string>("10");
  const [compoundFrequency, setCompoundFrequency] = useState<number>(12); // Compounding: 12 (monthly), 4 (quarterly), 1 (yearly)

  const calculateResults = () => {
    const P = parseFloat(initialPrincipal) || 0;
    const PMT = parseFloat(monthlyContribution) || 0;
    const r = (parseFloat(annualRate) || 0) / 100;
    const t = parseFloat(durationYears) || 0;
    const n = compoundFrequency;

    if (t <= 0) {
      return { totalPrincipal: P, totalInterest: 0, finalBalance: P };
    }

    // Formulas:
    // Future value of initial principal: A1 = P * (1 + r/n)^(n*t)
    // Future value of monthly contributions:
    // Since contribution is monthly, we can calculate period-by-period
    let balance = P;
    const totalPeriods = Math.floor(t * 12);
    const monthlyRate = r / 12;
    let totalInvested = P;

    for (let i = 1; i <= totalPeriods; i++) {
      // Add monthly interest to balance if we compound monthly, or use formula
      // Let's do exact monthly compound simulation for highest accuracy with monthly additions
      const periodInterest = balance * monthlyRate;
      balance += periodInterest;
      balance += PMT;
      totalInvested += PMT;
    }

    const finalBalance = balance;
    const totalInterest = Math.max(0, finalBalance - totalInvested);

    return {
      totalPrincipal: totalInvested,
      totalInterest: totalInterest,
      finalBalance: finalBalance,
    };
  };

  const results = calculateResults();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalInvested = results.totalPrincipal;
  const interestEarned = results.totalInterest;
  const balance = results.finalBalance;

  const totalRatio = totalInvested + interestEarned;
  const principalPercentage = totalRatio > 0 ? (totalInvested / totalRatio) * 100 : 100;
  const interestPercentage = totalRatio > 0 ? (interestEarned / totalRatio) * 100 : 0;

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Input Parameters Box */}
        <div className="space-y-5">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
            Parametri dell'Investimento
          </span>

          {/* Initial Principal */}
          <div>
            <label className="text-sm font-mono text-zinc-400 block mb-1.5">Capitale Iniziale (€)</label>
            <input
              type="number"
              value={initialPrincipal}
              onChange={(e) => setInitialPrincipal(e.target.value)}
              className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
            />
          </div>

          {/* Monthly Contribution */}
          <div>
            <label className="text-sm font-mono text-zinc-400 block mb-1.5">Deposito Mensile Ricorrente (€)</label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
            />
          </div>

          {/* Annual Rate & Duration */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-mono text-zinc-400 block mb-1.5">Tasso Annuale (%)</label>
              <input
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
              />
            </div>
            <div>
              <label className="text-sm font-mono text-zinc-400 block mb-1.5">Durata (Anni)</label>
              <input
                type="number"
                value={durationYears}
                onChange={(e) => setDurationYears(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
              />
            </div>
          </div>

          {/* Compounding Frequency Selection */}
          <div>
            <label className="text-sm font-mono text-zinc-400 block mb-2">Frequenza Capitalizzazione</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Annuale", value: 1 },
                { label: "Semestrale", value: 2 },
                { label: "Mensile", value: 12 },
              ].map((freq) => (
                <button
                  key={freq.value}
                  onClick={() => setCompoundFrequency(freq.value)}
                  className={`px-4 py-2 text-xs font-mono border rounded transition-all ${
                    compoundFrequency === freq.value
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold"
                      : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6 flex flex-col justify-between min-h-[312px]">
          <div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-4.5">
              Riepilogo Crescita Capitale
            </span>

            {/* Final Balance Accent Card */}
            <div className="text-center py-6 bg-indigo-500/5 border border-indigo-500/10 rounded-lg mb-6">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block">
                Valore Futuro Stimato
              </span>
              <span className="text-4xl font-normal tracking-tight text-indigo-300 font-mono block mt-1.5 not-italic">
                {formatCurrency(balance)}
              </span>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-5 font-mono text-sm mb-6">
              <div className="border-l-2 border-zinc-500 pl-3.5">
                <span className="text-[10px] text-zinc-500 block uppercase">Capitale Versato</span>
                <span className="text-base font-bold text-zinc-200 not-italic">{formatCurrency(totalInvested)}</span>
              </div>
              <div className="border-l-2 border-indigo-500 pl-3.5">
                <span className="text-[10px] text-zinc-500 block uppercase">Interessi Maturati</span>
                <span className="text-base font-bold text-indigo-400 not-italic">{formatCurrency(interestEarned)}</span>
              </div>
            </div>
          </div>

          {/* Stacked Growth Bar visual indicator */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono text-zinc-500">
              <span>Ripartizione Capitale</span>
              <span>{Math.round(principalPercentage)}% Versato vs {Math.round(interestPercentage)}% Interessi</span>
            </div>
            <div className="w-full h-4 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${principalPercentage}%` }}
                className="bg-zinc-400 h-full transition-all duration-300"
                title={`Capitale Versato: ${Math.round(principalPercentage)}%`}
              />
              <div
                style={{ width: `${interestPercentage}%` }}
                className="bg-indigo-500 h-full transition-all duration-300"
                title={`Interessi Maturati: ${Math.round(interestPercentage)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded flex gap-3 text-xs text-zinc-400">
        <TrendingUp className="w-4.5 h-4.5 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          L'interesse composto è l'interesse maturato sia sul capitale iniziale che sugli altri interessi precedentemente accumulati. 
          Questo calcolatore simula in modo continuo l'accumulo mese dopo mese incluse le quote aggiuntive periodiche.
        </p>
      </div>
    </div>
  );
}
