import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useUi } from "../ui/tokens";
import DataSizeConverter from "./DataSizeConverter";
import { CATEGORIES, convert } from "../lib/units";
import { Notice, Field, TextInput, Select, Tabs, IconButton, ResultCard, Row, Stack, fmtUnit, cx } from "../ui/kit";

const DATA = "dati";

/** One tab per quantity; the data-size tab is a converter of its own, with a 1000/1024 switch. */
export default function UnitConverter() {
  const [category, setCategory] = useState("lunghezza");
  const [value, setValue] = useState("1");

  // As tall as the longest tab (length, 8 units), so the centred window does not move when the tab changes.
  return (
    <Stack className="min-h-[560px]">
      <Tabs fill value={category} onChange={(v) => setCategory(String(v))} options={[...Object.entries(CATEGORIES).map(([id, c]) => ({ value: id, label: c.name })), { value: DATA, label: "Dati" }]} />
      {category === DATA ? <DataSizeConverter /> : <UnitCategory key={category} category={category} value={value} setValue={setValue} />}
    </Stack>
  );
}

function UnitCategory({ category, value, setValue }: { category: string; value: string; setValue: (v: string) => void }) {
  const u = useUi();
  const firstKeys = Object.keys(CATEGORIES[category].units);
  const [from, setFrom] = useState(category === "lunghezza" ? "m" : firstKeys[0]);
  const [to, setTo] = useState(category === "lunghezza" ? "cm" : firstKeys[1] ?? firstKeys[0]);

  const cat = CATEGORIES[category];
  const keys = Object.keys(cat.units);
  const number = parseFloat(value);
  const valid = Number.isFinite(number);
  const result = valid ? convert(category, number, from, to) : 0;
  const fromSymbol = cat.units[from].symbol;
  // only a temperature can be below zero, and never below absolute zero
  const lowest = category === "temperatura" ? (from === "C" ? -273.15 : from === "F" ? -459.67 : 0) : 0;
  const toSymbol = cat.units[to].symbol;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const text = valid ? `${fmtUnit(number)} ${fromSymbol} = ${fmtUnit(result)} ${toSymbol}` : "";

  return (
    <Stack>
      <Field label="Valore">
        <TextInput type="number" inputMode="decimal" step="any" min={lowest} max={1e12} decimals={6} value={value} onChange={(e) => setValue(e.target.value)} suffixText={fromSymbol} />
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
        label="Conversione"
        value={valid ? (
          <span className="block">
            <span className="block text-lg font-semibold font-display text-zinc-100">{fmtUnit(number)} {fromSymbol} =</span>
            <span className="block text-2xl font-bold font-display" style={{ color: u.accentHex }}>{fmtUnit(result)} {toSymbol}</span>
          </span>
        ) : "—"}
        copyText={text}
      />

      {valid && (
        <div className={cx("p-3 space-y-2", u.panel)}>
          <div className={cx("px-1 text-xs font-medium", u.subtle)}>{number === 1 ? `1 ${fromSymbol} in tutte le unità` : `${fmtUnit(number)} ${fromSymbol} in tutte le unità`}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {keys.filter((k) => k !== from).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTo(k)}
                title={`${cat.units[k].name}: usa come unità di arrivo`}
                className={cx("flex items-center justify-between gap-2 px-2 py-1.5 cursor-pointer text-left", u.panelInset, k === to && "ring-1")}
                style={k === to ? { boxShadow: `inset 0 0 0 1px ${u.accentHex}` } : undefined}
              >
                <span className={cx("font-medium", k === to ? u.accent : u.muted)}>{cat.units[k].symbol}</span>
                <span className={cx("font-mono font-semibold truncate", u.text)}>{fmtUnit(convert(category, number, from, k))}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Notice>Ogni unità è riportata a un’unità base della categoria tramite un fattore fisso. La temperatura usa formule dedicate.</Notice>
    </Stack>
  );
}
