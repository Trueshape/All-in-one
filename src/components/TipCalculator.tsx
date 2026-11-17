import { useState } from "react";
import { Percent, Users } from "lucide-react";
import { Field, TextInput, Chips, ResultCard, Row, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const eur = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const num = (s: string) => Math.max(parseFloat(s) || 0, 0);

// Each control has its own color, as in the original design.
const COLORS = { discount: "#f59e0b", tip: "#818cf8", people: "#34d399" };

type Mode = "percent" | "fixed";
const MODES: Array<{ value: Mode; label: string }> = [
  { value: "percent", label: "Percentuale" },
  { value: "fixed", label: "Valore fisso" },
];

function Control({
  icon,
  label,
  value,
  display,
  color,
  min,
  max,
  onChange,
  presets,
  presetLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  display: string;
  color: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
  presets: number[];
  presetLabel: (v: number) => string;
}) {
  const u = useUi();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className={cx("flex items-center gap-1.5 text-xs", u.subtle)}>{icon} {label}</span>
        <span className="text-sm font-mono font-semibold" style={{ color }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${presets.length}, minmax(0, 1fr))` }}>
        {presets.map((p) => {
          const active = p === value;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cx("rounded-lg border py-1.5 text-[10px] font-mono font-semibold transition-colors cursor-pointer", !active && u.btnSecondary)}
              style={active ? { borderColor: color, color, background: `${color}1a` } : undefined}
            >
              {presetLabel(p)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A discount or tip that is either a percentage (slider) or a fixed amount in euro (typed). */
function AmountControl({
  icon,
  label,
  color,
  max,
  mode,
  onMode,
  percent,
  onPercent,
  fixed,
  onFixed,
  shown,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  max: number;
  mode: Mode;
  onMode: (m: Mode) => void;
  percent: number;
  onPercent: (v: number) => void;
  fixed: string;
  onFixed: (v: string) => void;
  shown: string;
}) {
  const u = useUi();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className={cx("flex items-center gap-1.5 text-xs", u.subtle)}>{icon} {label}</span>
        <span className="text-sm font-mono font-semibold" style={{ color }}>{shown}</span>
      </div>
      <Chips fill value={mode} onChange={onMode} options={MODES} />
      {mode === "percent" ? (
        <input type="range" min={0} max={max} value={percent} onChange={(e) => onPercent(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: color }} />
      ) : (
        <TextInput type="number" inputMode="decimal" min="0" step="0.01" value={fixed} onChange={(e) => onFixed(e.target.value)} prefixText="€" placeholder="0,00" />
      )}
    </div>
  );
}

export default function TipCalculator() {
  const [bill, setBill] = useState("100");
  const [discountMode, setDiscountMode] = useState<Mode>("percent");
  const [discountPct, setDiscountPct] = useState(15);
  const [discountFixed, setDiscountFixed] = useState("0");
  const [tipMode, setTipMode] = useState<Mode>("percent");
  const [tipPct, setTipPct] = useState(10);
  const [tipFixed, setTipFixed] = useState("0");
  const [people, setPeople] = useState(2);

  const billValue = num(bill);
  // a fixed discount cannot be bigger than the bill
  const discountAmount = discountMode === "percent" ? billValue * (discountPct / 100) : Math.min(num(discountFixed), billValue);
  const discounted = billValue - discountAmount;
  const tipAmount = tipMode === "percent" ? discounted * (tipPct / 100) : num(tipFixed);
  const total = discounted + tipAmount;
  const perPerson = total / people;

  const discountShown = discountMode === "percent" ? `${discountPct}%` : eur(num(discountFixed));
  const tipShown = tipMode === "percent" ? `${tipPct}%` : eur(num(tipFixed));

  const summary =
    `Conto: ${eur(billValue)} | Sconto: ${discountShown} (-${eur(discountAmount)}) | ` +
    `Mancia: ${tipShown} (+${eur(tipAmount)}) | Totale: ${eur(total)} | ` +
    `Dividi: ${people} persone (${eur(perPerson)} a persona)`;

  return (
    <Stack>
      <Field label="Importo del conto">
        <TextInput type="number" inputMode="decimal" min="0" step="0.01" value={bill} onChange={(e) => setBill(e.target.value)} prefixText="€" placeholder="0,00" />
      </Field>

      <AmountControl
        icon={<Percent className="w-3.5 h-3.5" />}
        label="Sconto"
        color={COLORS.discount}
        max={100}
        mode={discountMode}
        onMode={setDiscountMode}
        percent={discountPct}
        onPercent={setDiscountPct}
        fixed={discountFixed}
        onFixed={setDiscountFixed}
        shown={discountShown}
      />
      <AmountControl
        icon={<Percent className="w-3.5 h-3.5" />}
        label="Mancia"
        color={COLORS.tip}
        max={50}
        mode={tipMode}
        onMode={setTipMode}
        percent={tipPct}
        onPercent={setTipPct}
        fixed={tipFixed}
        onFixed={setTipFixed}
        shown={tipShown}
      />
      <Control icon={<Users className="w-3.5 h-3.5" />} label="Dividi tra persone" value={people} display={`${people}`} color={COLORS.people} min={1} max={30} onChange={setPeople} presets={[1, 2, 4, 8]} presetLabel={(v) => (v === 1 ? "Singolo" : `${v} Pers.`)} />

      <ResultCard label="Quota a persona" value={eur(perPerson)} copyText={summary}>
        <Row label="Prezzo originale" value={eur(billValue)} />
        <Row label={`Sconto (${discountShown})`} value={`-${eur(discountAmount)}`} tone="warn" />
        <Row label={`Mancia (${tipShown})`} value={`+${eur(tipAmount)}`} />
        <Row label="Totale finale" value={eur(total)} />
      </ResultCard>
      <Notice>Lo sconto in percentuale si calcola sul prezzo originale, la mancia in percentuale sul prezzo scontato. Un valore fisso si sottrae o si aggiunge così com'è. La quota a persona è il totale diviso per il numero di persone.</Notice>
    </Stack>
  );
}
