import { useState, useEffect } from "react";
import { ArrowLeftRight, Copy, RefreshCw, Check, TrendingUp } from "lucide-react";

interface Rates {
  [key: string]: number;
}

const DEFAULT_RATES: Rates = {
  EUR: 1.0,
  USD: 1.09,
  GBP: 0.85,
  JPY: 165.25,
  CAD: 1.48,
  AUD: 1.63,
  CHF: 0.98,
  CNY: 7.82,
};

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "元",
};

const CURRENCY_NAMES: { [key: string]: string } = {
  EUR: "Euro",
  USD: "Dollaro Statunitense",
  GBP: "Sterlina Britannica",
  JPY: "Yen Giapponese",
  CAD: "Dollaro Canadese",
  AUD: "Dollaro Australiano",
  CHF: "Franco Svizzero",
  CNY: "Renminbi Cinese",
};

export default function CurrencyConverter() {
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [amount, setAmount] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState<string>("EUR");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Statico (Default)");
  const [copied, setCopied] = useState<boolean>(false);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/EUR");
      if (!response.ok) throw new Error("Errore nel caricamento dei tassi");
      const data = await response.json();
      
      const filteredRates: Rates = {};
      Object.keys(DEFAULT_RATES).forEach((currency) => {
        if (data.rates[currency]) {
          filteredRates[currency] = data.rates[currency];
        } else {
          filteredRates[currency] = DEFAULT_RATES[currency];
        }
      });
      
      setRates(filteredRates);
      const date = new Date(data.time_last_update_utc);
      setLastUpdated(date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) + " UTC");
    } catch (error) {
      console.error("Using fallback rates:", error);
      setLastUpdated("Offline (Predefinito)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getConvertedAmount = (): number => {
    const value = parseFloat(amount);
    if (isNaN(value)) return 0;
    
    // Convert to EUR first
    const rateInEur = value / (rates[fromCurrency] || 1);
    // Convert from EUR to target
    return rateInEur * (rates[toCurrency] || 1);
  };

  const convertedValue = getConvertedAmount();

  const handleCopy = () => {
    const formatted = `${amount} ${fromCurrency} = ${convertedValue.toFixed(2)} ${toCurrency}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-zinc-100 font-display">Convertitore di Valuta</h3>
          <p className="text-xs text-zinc-400">Tassi aggiornati: {lastUpdated}</p>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="p-2 transition-colors rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50"
          title="Aggiorna tassi"
          id="btn-currency-refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Input Amount */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Importo</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
              {CURRENCY_SYMBOLS[fromCurrency]}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-zinc-700 font-medium text-lg transition-all"
              placeholder="0.00"
              id="input-currency-amount"
            />
          </div>
        </div>

        {/* Currency Selectors */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Da</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-700 font-medium"
              id="select-currency-from"
            >
              {Object.keys(rates).map((code) => (
                <option key={code} value={code}>
                  {code} - {CURRENCY_NAMES[code]}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-5">
            <button
              onClick={handleSwap}
              className="p-2.5 transition-all rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95"
              id="btn-currency-swap"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">A</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-700 font-medium"
              id="select-currency-to"
            >
              {Object.keys(rates).map((code) => (
                <option key={code} value={code}>
                  {code} - {CURRENCY_NAMES[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Area */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/80"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Risultato</span>
              <div className="text-2xl font-semibold text-zinc-100 font-display mt-1">
                {parseFloat(amount || "0").toLocaleString("it-IT", { minimumFractionDigits: 2 })} {fromCurrency} =
              </div>
              <div className="text-3xl font-bold text-indigo-400 font-display mt-0.5">
                {convertedValue.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {toCurrency}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-800 rounded-lg"
              title="Copia risultato"
              id="btn-currency-copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Conversions Table / Rates Info */}
        <div className="bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/40">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-2 px-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tassi di Cambio Riferimento (1 EUR)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(rates)
              .filter(([code]) => code !== "EUR")
              .slice(0, 4)
              .map(([code, val]) => (
                <div key={code} className="flex justify-between py-1 px-2 bg-zinc-900/40 rounded-lg border border-zinc-800/20">
                  <span className="text-zinc-500 font-medium">{code}</span>
                  <span className="text-zinc-300 font-mono font-medium">{(val as number).toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
