import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Field, TextInput, Select, Chips, IconButton, ResultCard, Row, Stack, fmtNumber } from "../ui/kit";

interface Unit {
  name: string;
  symbol: string;
  /** Multiplier to the category base unit (ignored for temperature). */
  factor: number;
}

interface Category {
  name: string;
  base: string;
  units: Record<string, Unit>;
}

const CATEGORIES: Record<string, Category> = {
  lunghezza: {
    name: "Lunghezza",
    base: "m",
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
    name: "Peso",
    base: "kg",
    units: {
      mg: { name: "Milligrammo", symbol: "mg", factor: 0.000001 },
      g: { name: "Grammo", symbol: "g", factor: 0.001 },
      kg: { name: "Chilogrammo", symbol: "kg", factor: 1 },
      ton: { name: "Tonnellata", symbol: "t", factor: 1000 },
      oz: { name: "Oncia", symbol: "oz", factor: 0.028349523125 },
      lb: { name: "Libbra", symbol: "lb", factor: 0.45359237 },
    },
  },
  area: {
    name: "Area",
    base: "m²",
    units: {
      cm2: { name: "Centimetro quadrato", symbol: "cm²", factor: 0.0001 },
      m2: { name: "Metro quadrato", symbol: "m²", factor: 1 },
      km2: { name: "Chilometro quadrato", symbol: "km²", factor: 1_000_000 },
      ha: { name: "Ettaro", symbol: "ha", factor: 10_000 },
      acre: { name: "Acro", symbol: "ac", factor: 4046.8564224 },
      sqft: { name: "Piede quadrato", symbol: "ft²", factor: 0.09290304 },
    },
  },
  volume: {
    name: "Volume",
    base: "l",
    units: {
      ml: { name: "Millilitro", symbol: "ml", factor: 0.001 },
      l: { name: "Litro", symbol: "l", factor: 1 },
      m3: { name: "Metro cubo", symbol: "m³", factor: 1000 },
      cup: { name: "Tazza (US)", symbol: "cup", factor: 0.2365882365 },
      floz: { name: "Oncia liquida (US)", symbol: "fl oz", factor: 0.0295735295625 },
      gallon: { name: "Gallone (US)", symbol: "gal", factor: 3.785411784 },
    },
  },
  velocita: {
    name: "Velocità",
    base: "m/s",
    units: {
      ms: { name: "Metri al secondo", symbol: "m/s", factor: 1 },
      kmh: { name: "Chilometri orari", symbol: "km/h", factor: 1 / 3.6 },
      mph: { name: "Miglia orarie", symbol: "mph", factor: 0.44704 },
      kt: { name: "Nodi", symbol: "kt", factor: 1852 / 3600 },
    },
  },
  energia: {
    name: "Energia",
    base: "J",
    units: {
      j: { name: "Joule", symbol: "J", factor: 1 },
      kj: { name: "Chilojoule", symbol: "kJ", factor: 1000 },
      cal: { name: "Caloria", symbol: "cal", factor: 4.184 },
      kcal: { name: "Chilocaloria", symbol: "kcal", factor: 4184 },
      wh: { name: "Wattora", symbol: "Wh", factor: 3600 },
      kwh: { name: "Chilowattora", symbol: "kWh", factor: 3_600_000 },
      btu: { name: "BTU", symbol: "BTU", factor: 1055.05585262 },
    },
  },
  temperatura: {
    name: "Temperatura",
    base: "°C",
    units: {
      C: { name: "Celsius", symbol: "°C", factor: 1 },
      F: { name: "Fahrenheit", symbol: "°F", factor: 1 },
      K: { name: "Kelvin", symbol: "K", factor: 1 },
    },
  },
};

const toCelsius = (v: number, from: string) => (from === "F" ? ((v - 32) * 5) / 9 : from === "K" ? v - 273.15 : v);
const fromCelsius = (c: number, to: string) => (to === "F" ? (c * 9) / 5 + 32 : to === "K" ? c + 273.15 : c);

function convert(category: string, value: number, from: string, to: string): number {
  if (category === "temperatura") return fromCelsius(toCelsius(value, from), to);
  const units = CATEGORIES[category].units;
  return (value * units[from].factor) / units[to].factor;
}

export default function UnitConverter() {
  const [category, setCategory] = useState("lunghezza");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("cm");

  const cat = CATEGORIES[category];
  const keys = Object.keys(cat.units);
  const number = parseFloat(value);
  const valid = Number.isFinite(number);
  const result = valid ? convert(category, number, from, to) : 0;
  const fromSymbol = cat.units[from].symbol;
  const toSymbol = cat.units[to].symbol;

  const selectCategory = (next: string) => {
    const nextKeys = Object.keys(CATEGORIES[next].units);
    setCategory(next);
    setFrom(nextKeys[0]);
    setTo(nextKeys[1] ?? nextKeys[0]);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const text = valid ? `${fmtNumber(number, 8)} ${fromSymbol} = ${fmtNumber(result, 8)} ${toSymbol}` : "";

  return (
    <Stack>
      <Chips value={category} onChange={selectCategory} options={Object.entries(CATEGORIES).map(([id, c]) => ({ value: id, label: c.name }))} />

      <Field label="Valore">
        <TextInput type="number" inputMode="decimal" step="any" value={value} onChange={(e) => setValue(e.target.value)} suffixText={fromSymbol} />
      </Field>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label="Da">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {keys.map((k) => <option key={k} value={k}>{cat.units[k].name} ({cat.units[k].symbol})</option>)}
          </Select>
        </Field>
        <IconButton onClick={swap} title="Inverti unità" className="mb-1"><ArrowLeftRight className="w-4 h-4" /></IconButton>
        <Field label="A">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {keys.map((k) => <option key={k} value={k}>{cat.units[k].name} ({cat.units[k].symbol})</option>)}
          </Select>
        </Field>
      </div>

      <ResultCard
        label="Risultato"
        value={valid ? `${fmtNumber(result, 8)} ${toSymbol}` : "—"}
        copyText={text}
      >
        <Row label="Unità base" value={cat.base} />
        {category !== "temperatura" && <Row label="Rapporto" value={`1 ${fromSymbol} = ${fmtNumber(cat.units[from].factor / cat.units[to].factor, 8)} ${toSymbol}`} />}
      </ResultCard>
    </Stack>
  );
}
