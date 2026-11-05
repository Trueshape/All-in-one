import { useState } from "react";
import { Percent, Users } from "lucide-react";
import { Field, TextInput, ResultCard, Row, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const eur = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

// Each control has its own color, as in the original design.
const COLORS = { discount: "#f59e0b", tip: "#818cf8", people: "#34d399" };

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

export default function TipCalculator() {
  const [bill, setBill] = useState("100");
  const [discount, setDiscount] = useState(15);
  const [tip, setTip] = useState(10);
  const [people, setPeople] = useState(2);

  const billValue = Math.max(parseFloat(bill) || 0, 0);
  const discountAmount = billValue * (discount / 100);
  const discounted = billValue - discountAmount;
  const tipAmount = discounted * (tip / 100);
  const total = discounted + tipAmount;
  const perPerson = total / people;

  const summary =
    `Conto: ${eur(billValue)} | Sconto: ${discount}% (-${eur(discountAmount)}) | ` +
    `Mancia: ${tip}% (+${eur(tipAmount)}) | Totale: ${eur(total)} | ` +
    `Dividi: ${people} persone (${eur(perPerson)} a persona)`;

  return (
    <Stack>
      <Field label="Importo del conto">
        <TextInput type="number" inputMode="decimal" min="0" step="0.01" value={bill} onChange={(e) => setBill(e.target.value)} prefixText="€" placeholder="0,00" />
      </Field>

      <Control icon={<Percent className="w-3.5 h-3.5" />} label="Sconto" value={discount} display={`${discount}%`} color={COLORS.discount} min={0} max={100} onChange={setDiscount} presets={[0, 10, 20, 30, 50]} presetLabel={(v) => `${v}%`} />
      <Control icon={<Percent className="w-3.5 h-3.5" />} label="Mancia" value={tip} display={`${tip}%`} color={COLORS.tip} min={0} max={50} onChange={setTip} presets={[0, 10, 15, 20, 25]} presetLabel={(v) => `${v}%`} />
      <Control icon={<Users className="w-3.5 h-3.5" />} label="Dividi tra persone" value={people} display={`${people}`} color={COLORS.people} min={1} max={30} onChange={setPeople} presets={[1, 2, 4, 8]} presetLabel={(v) => (v === 1 ? "Singolo" : `${v} Pers.`)} />

      <ResultCard label="Quota a persona" value={eur(perPerson)} copyText={summary}>
        <Row label="Prezzo originale" value={eur(billValue)} />
        <Row label={`Sconto (${discount}%)`} value={`-${eur(discountAmount)}`} tone="warn" />
        <Row label={`Mancia (${tip}%)`} value={`+${eur(tipAmount)}`} />
        <Row label="Totale finale" value={eur(total)} />
      </ResultCard>
      <Notice>Lo sconto si calcola sul prezzo originale, la mancia sul prezzo scontato. La quota a persona è il totale diviso per il numero di persone.</Notice>
    </Stack>
  );
}
