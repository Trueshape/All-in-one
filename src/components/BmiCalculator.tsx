import { useState } from "react";
import { Field, Segmented, Slider, Panel, Row, Notice, Stack, fmtNumber } from "../ui/kit";
import { useUi } from "../ui/tokens";

const SCALE_MIN = 10;
const SCALE_MAX = 45;

const CLASSES = [
  { max: 18.5, label: "Sottopeso", text: "text-sky-400", bar: "bg-sky-500/40" },
  { max: 25, label: "Normopeso", text: "text-emerald-400", bar: "bg-emerald-500/40" },
  { max: 30, label: "Sovrappeso", text: "text-amber-400", bar: "bg-amber-500/40" },
  { max: Infinity, label: "Obesità", text: "text-rose-400", bar: "bg-rose-500/40" },
];

const pct = (bmi: number) => Math.min(100, Math.max(0, ((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));

export default function BmiCalculator() {
  const u = useUi();
  const [sex, setSex] = useState<"m" | "f">("m");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);

  const meters = height / 100;
  const bmi = Math.round((weight / (meters * meters)) * 10) / 10;
  const current = CLASSES.find((c) => bmi < c.max) ?? CLASSES[CLASSES.length - 1];

  const idealMin = 18.5 * meters * meters;
  const idealMax = 24.9 * meters * meters;
  // Deurenberg estimate: 1.2·BMI + 0.23·age − 10.8·sex − 5.4 (sex = 1 male, 0 female)
  const bodyFat = Math.max(0, 1.2 * bmi + 0.23 * age - 10.8 * (sex === "m" ? 1 : 0) - 5.4);

  // Segment widths follow the real BMI ranges on the 10–45 scale.
  const bounds = [SCALE_MIN, 18.5, 25, 30, SCALE_MAX];

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Field label="Sesso">
            <Segmented
              value={sex}
              onChange={setSex}
              options={[
                { value: "m", label: "Uomo" },
                { value: "f", label: "Donna" },
              ]}
            />
          </Field>
          <Slider label="Età" value={age} min={18} max={90} onChange={setAge} display={`${age} anni`} />
          <Slider label="Altezza" value={height} min={100} max={220} onChange={setHeight} display={`${height} cm`} />
          <Slider label="Peso" value={weight} min={30} max={150} onChange={setWeight} display={`${weight} kg`} />
        </div>

        <Panel className="space-y-5">
          <div>
            <span className={u.statLabel}>Indice di massa corporea</span>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className={`text-5xl font-light ${u.text}`}>{fmtNumber(bmi, 1)}</span>
              <span className={`text-sm font-bold uppercase tracking-widest ${current.text}`}>{current.label}</span>
            </div>
          </div>

          <div>
            <div className="relative h-2 flex border border-zinc-800/60">
              {CLASSES.map((c, i) => (
                <div key={c.label} className={`h-full ${c.bar}`} style={{ width: `${pct(bounds[i + 1]) - pct(bounds[i])}%` }} title={c.label} />
              ))}
              <div
                className="absolute -top-1 w-1.5 h-4 -translate-x-1/2 bg-white border border-black shadow-md transition-[left] duration-300"
                style={{ left: `${pct(bmi)}%` }}
              />
            </div>
            <div className={`flex justify-between text-[9px] font-mono mt-1.5 ${u.muted}`}>
              <span>10</span>
              <span>18,5</span>
              <span>25</span>
              <span>30</span>
              <span>45</span>
            </div>
          </div>

          <div className={`pt-3 border-t space-y-1.5 ${u.divider}`}>
            <Row label="Peso ideale (BMI 18,5–24,9)" value={`${fmtNumber(idealMin, 1)} – ${fmtNumber(idealMax, 1)} kg`} />
            <Row label="Grasso corporeo stimato" value={`~ ${fmtNumber(bodyFat, 1)}%`} />
          </div>
        </Panel>
      </div>

      <Notice>
        Il BMI è un indicatore statistico orientativo basato su altezza e peso: non distingue massa magra e massa grassa, quindi sportivi e
        culturisti possono ottenere classificazioni poco adatte. Non sostituisce un parere medico.
      </Notice>
    </Stack>
  );
}
