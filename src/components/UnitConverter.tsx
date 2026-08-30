import { useState } from "react";
import { ArrowLeftRight, Copy, Check, Scale } from "lucide-react";

interface Unit {
  name: string;
  symbol: string;
  factor: number; // Factor to convert to base unit
}

interface Category {
  name: string;
  baseUnit: string;
  units: { [key: string]: Unit };
  convert?: (value: number, from: string, to: string) => number; // Special convert function (e.g. for Temp)
}

const CATEGORIES: { [key: string]: Category } = {
  area: {
    name: "Area",
    baseUnit: "m²",
    units: {
      cm2: { name: "Centimetro quadrato", symbol: "cm²", factor: 0.0001 },
      m2: { name: "Metro quadrato", symbol: "m²", factor: 1 },
      km2: { name: "Chilometro quadrato", symbol: "km²", factor: 1000000 },
      he: { name: "Ettaro", symbol: "ha", factor: 10000 },
      acre: { name: "Acre", symbol: "ac", factor: 4046.856 },
      sqft: { name: "Piede quadrato", symbol: "ft²", factor: 0.092903 },
    },
  },
  energia: {
    name: "Energia",
    baseUnit: "J",
    units: {
      j: { name: "Joule", symbol: "J", factor: 1 },
      kj: { name: "Chilojoule", symbol: "kJ", factor: 1000 },
      cal: { name: "Caloria", symbol: "cal", factor: 4.184 },
      kcal: { name: "Chilocaloria", symbol: "kcal", factor: 4184 },
      wh: { name: "Wattora", symbol: "Wh", factor: 3600 },
      kwh: { name: "Chilowattora", symbol: "kWh", factor: 3600000 },
      btu: { name: "BTU (British Thermal Unit)", symbol: "BTU", factor: 1055.056 },
    },
  },
  lunghezza: {
    name: "Lunghezza",
    baseUnit: "m",
    units: {
      mm: { name: "Millimetro", symbol: "mm", factor: 0.001 },
      cm: { name: "Centimetro", symbol: "cm", factor: 0.01 },
      m: { name: "Metro", symbol: "m", factor: 1 },
      km: { name: "Chilometro", symbol: "km", factor: 1000 },
      inch: { name: "Pollice", symbol: "in", factor: 0.0254 },
      foot: { name: "Piede", symbol: "ft", factor: 0.3048 },
      yard: { name: "Iarda", symbol: "yd", factor: 0.9144 },
      mile: { name: "Miglio", symbol: "mi", factor: 1609.344 },
    },
  },
  peso: {
    name: "Peso / Massa",
    baseUnit: "kg",
    units: {
      mg: { name: "Milligrammo", symbol: "mg", factor: 0.000001 },
      g: { name: "Grammo", symbol: "g", factor: 0.001 },
      kg: { name: "Chilogrammo", symbol: "kg", factor: 1 },
      ton: { name: "Tonnellata", symbol: "t", factor: 1000 },
      oz: { name: "Oncia", symbol: "oz", factor: 0.028349523125 },
      lb: { name: "Libbra", symbol: "lb", factor: 0.45359237 },
    },
  },
  temperatura: {
    name: "Temperatura",
    baseUnit: "°C",
    units: {
      C: { name: "Celsius", symbol: "°C", factor: 1 },
      F: { name: "Fahrenheit", symbol: "°F", factor: 1 },
      K: { name: "Kelvin", symbol: "K", factor: 1 },
    },
    convert: (value: number, from: string, to: string): number => {
      if (from === to) return value;
      // Convert to Celsius first
      let celsius = value;
      if (from === "F") celsius = (value - 32) * (5 / 9);
      if (from === "K") celsius = value - 273.15;

      // Convert from Celsius to target
      if (to === "C") return celsius;
      if (to === "F") return celsius * (9 / 5) + 32;
      if (to === "K") return celsius + 273.15;
      return value;
    },
  },
  velocita: {
    name: "Velocità",
    baseUnit: "m/s",
    units: {
      ms: { name: "Metri al secondo", symbol: "m/s", factor: 1 },
      kmh: { name: "Chilometri orari", symbol: "km/h", factor: 0.2777777777777778 },
      mph: { name: "Miglia orarie", symbol: "mph", factor: 0.44704 },
      nodi: { name: "Nodi", symbol: "kt", factor: 0.5144444444444445 },
    },
  },
  volume: {
    name: "Volume",
    baseUnit: "l",
    units: {
      ml: { name: "Millilitro", symbol: "ml", factor: 0.001 },
      l: { name: "Litro", symbol: "l", factor: 1 },
      m3: { name: "Metro cubo", symbol: "m³", factor: 1000 },
      cup: { name: "Tazza (US)", symbol: "cup", factor: 0.236588 },
      gallon: { name: "Gallone (US)", symbol: "gal", factor: 3.78541 },
      floz: { name: "Oncia liquida (US)", symbol: "fl oz", factor: 0.029574 },
    },
  },
};

export default function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState<string>("area");
  const [fromValue, setFromValue] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("m2");
  const [toUnit, setToUnit] = useState<string>("cm2");
  const [copied, setCopied] = useState<boolean>(false);

  const categoryData = CATEGORIES[activeCategory];
  const unitList = Object.keys(categoryData.units);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    const newCat = CATEGORIES[cat];
    const units = Object.keys(newCat.units);
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const doConversion = (): number => {
    const val = parseFloat(fromValue);
    if (isNaN(val)) return 0;

    if (categoryData.convert) {
      return categoryData.convert(val, fromUnit, toUnit);
    }

    // Standard factor conversion
    const fromFactor = categoryData.units[fromUnit].factor;
    const toFactor = categoryData.units[toUnit].factor;
    const valInBase = val * fromFactor;
    return valInBase / toFactor;
  };

  const result = doConversion();

  const handleCopy = () => {
    const fromSymbol = categoryData.units[fromUnit].symbol;
    const toSymbol = categoryData.units[toUnit].symbol;
    const text = `${fromValue} ${fromSymbol} = ${result.toLocaleString("it-IT", { maximumFractionDigits: 6 })} ${toSymbol}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto pb-1 no-scrollbar">
        {Object.entries(CATEGORIES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeCategory === key
                ? "bg-zinc-800 text-zinc-100 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
            id={`tab-unit-${key}`}
          >
            {value.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Value Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Valore da Convertire</label>
          <div className="relative">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-zinc-700 font-medium text-lg transition-all"
              placeholder="0"
              id="input-unit-value"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold font-mono text-sm">
              {categoryData.units[fromUnit]?.symbol}
            </span>
          </div>
        </div>

        {/* Unit Selector Grid */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Da</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-700 font-medium"
              id="select-unit-from"
            >
              {unitList.map((u) => (
                <option key={u} value={u}>
                  {categoryData.units[u].name} ({categoryData.units[u].symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-5">
            <button
              onClick={handleSwap}
              className="p-2.5 transition-all rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95"
              id="btn-unit-swap"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">A</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-700 font-medium"
              id="select-unit-to"
            >
              {unitList.map((u) => (
                <option key={u} value={u}>
                  {categoryData.units[u].name} ({categoryData.units[u].symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Output Result */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/80"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Conversione</span>
              <div className="text-2xl font-semibold text-zinc-100 font-display mt-1">
                {parseFloat(fromValue || "0").toLocaleString("it-IT")} {categoryData.units[fromUnit]?.symbol} =
              </div>
              <div className="text-3xl font-bold text-emerald-400 font-display mt-0.5">
                {result.toLocaleString("it-IT", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 8,
                })}{" "}
                {categoryData.units[toUnit]?.symbol}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-800 rounded-lg"
              title="Copia risultato"
              id="btn-unit-copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Reference Box */}
        <div className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/40 text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Info Unità di Riferimento</span>
          </div>
          <div className="pl-5 space-y-0.5 list-disc">
            <div>Unità base impostata per questa categoria: <strong className="text-zinc-300">{categoryData.baseUnit}</strong></div>
            {activeCategory !== "temperatura" && (
              <div>
                1 {categoryData.units[fromUnit]?.symbol} = {(categoryData.units[fromUnit]?.factor / categoryData.units[toUnit]?.factor).toLocaleString("it-IT", { maximumFractionDigits: 6 })} {categoryData.units[toUnit]?.symbol}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
