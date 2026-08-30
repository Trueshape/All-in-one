import { useState } from "react";
import { Users, Percent, DollarSign, Calculator, Check, Copy } from "lucide-react";

export default function TipCalculator() {
  const [bill, setBill] = useState<string>("100");
  const [discount, setDiscount] = useState<number>(15);
  const [tip, setTip] = useState<number>(10);
  const [people, setPeople] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);

  const billVal = parseFloat(bill) || 0;
  
  // Calculate discount
  const discountAmount = billVal * (discount / 100);
  const discountedBill = billVal - discountAmount;
  
  // Calculate tip (based on discounted bill or original bill? Usually based on discounted or original. Let's do based on discounted, which is standard, or original. Let's do discounted, or make it simple and do discounted bill).
  const tipAmount = discountedBill * (tip / 100);
  
  // Totals
  const totalBill = discountedBill + tipAmount;
  const perPersonAmount = people > 0 ? totalBill / people : 0;
  const discountPerPerson = people > 0 ? discountAmount / people : 0;
  const tipPerPerson = people > 0 ? tipAmount / people : 0;

  const handleCopy = () => {
    const formatted = `Conto: €${billVal.toFixed(2)} | Sconto: ${discount}% (-€${discountAmount.toFixed(2)}) | Mancia: ${tip}% (+€${tipAmount.toFixed(2)}) | Totale: €${totalBill.toFixed(2)} | Dividi: ${people} persone (${(totalBill / people).toFixed(2)} €/persona)`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input Bill */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Importo del Conto (€)</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold font-display">
            €
          </span>
          <input
            type="number"
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-zinc-700 font-medium text-lg transition-all"
            placeholder="0.00"
            id="input-tip-bill"
          />
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-4">
        {/* Discount Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-zinc-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-zinc-400" /> Sconto
            </span>
            <span className="text-amber-400 font-mono text-sm font-semibold">{discount}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            id="slider-tip-discount"
          />
          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 10, 20, 30, 50].map((preset) => (
              <button
                key={preset}
                onClick={() => setDiscount(preset)}
                className={`py-1 text-[10px] font-semibold rounded-lg transition-colors border ${
                  discount === preset
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
                id={`btn-discount-preset-${preset}`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Tip Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-zinc-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-zinc-400" /> Mancia
            </span>
            <span className="text-indigo-400 font-mono text-sm font-semibold">{tip}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={tip}
            onChange={(e) => setTip(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            id="slider-tip-rate"
          />
          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 10, 15, 20, 25].map((preset) => (
              <button
                key={preset}
                onClick={() => setTip(preset)}
                className={`py-1 text-[10px] font-semibold rounded-lg transition-colors border ${
                  tip === preset
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
                id={`btn-tip-preset-${preset}`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Split Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-zinc-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-400" /> Dividi tra persone
            </span>
            <span className="text-emerald-400 font-mono text-sm font-semibold">{people}</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={people}
            onChange={(e) => setPeople(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            id="slider-tip-people"
          />
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 4, 8].map((preset) => (
              <button
                key={preset}
                onClick={() => setPeople(preset)}
                className={`py-1 text-[10px] font-semibold rounded-lg transition-colors border ${
                  people === preset
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
                id={`btn-people-preset-${preset}`}
              >
                {preset === 1 ? "Singolo" : `${preset} Pers.`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Workspace */}
      <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/80"></div>
        
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Quota a Persona</span>
            <span className="text-3xl font-extrabold text-zinc-100 font-display mt-0.5">
              € {perPersonAmount.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-800 rounded-lg"
            title="Copia riepilogo"
            id="btn-tip-copy"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500 font-medium">Prezzo Orig.</span>
            <span className="text-zinc-300 font-mono">€ {billVal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 font-medium">Sconto ({discount}%)</span>
            <span className="text-amber-400 font-mono">-€ {discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 font-medium">Mancia ({tip}%)</span>
            <span className="text-indigo-400 font-mono">+€ {tipAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 font-medium">Totale Finale</span>
            <span className="text-zinc-200 font-mono font-semibold">€ {totalBill.toFixed(2)}</span>
          </div>
        </div>

        {people > 1 && (
          <div className="pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-400 flex items-center justify-between font-medium">
            <span>Quota sconto p.p.: -€{discountPerPerson.toFixed(2)}</span>
            <span>Quota mancia p.p.: +€{tipPerPerson.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
