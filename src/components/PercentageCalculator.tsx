import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Field, TextInput, IconButton, ResultCard, Notice, Stack, fmtNumber } from "../ui/kit";
import { percentChange, percentOf, whatPercent, wholeFrom } from "../lib/percent";

const num = (value: string) => (value.trim() === "" ? NaN : Number(value.replace(",", ".")));
const show = (n: number | null, suffix = "") => (n === null || Number.isNaN(n) ? "—" : `${fmtNumber(n, 2)}${suffix}`);

/** Two numbers in, the four usual percentage answers out, all live. Order matters: A is the first number, B the second. */
export default function PercentageCalculator() {
  const [a, setA] = useState("15");
  const [b, setB] = useState("200");
  const x = num(a);
  const y = num(b);
  const shownA = a || "…";
  const shownB = b || "…";
  const change = percentChange(x, y);

  const cards = [
    { label: `Il ${shownA}% di ${shownB} è`, value: show(percentOf(x, y)) },
    { label: `${shownA} su ${shownB} è il`, value: show(whatPercent(x, y), "%") },
    { label: `${shownA} è il ${shownB}% di`, value: show(wholeFrom(x, y)) },
    {
      label: change === null || Number.isNaN(change) ? `Da ${shownA} a ${shownB}` : change >= 0 ? "Aumento del" : "Diminuzione del",
      value: show(change === null ? null : Math.abs(change), "%"),
      copy: show(change, "%"),
    },
  ];

  return (
    <Stack>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field label="Numero A"><TextInput type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <IconButton onClick={() => { setA(b); setB(a); }} title="Inverti A e B" className="mb-0.5"><ArrowLeftRight className="w-4 h-4" /></IconButton>
        <Field label="Numero B"><TextInput type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </div>
      <div className="space-y-3">
        {cards.map((c) => <ResultCard key={c.label} label={c.label} value={c.value} copyText={c.copy ?? c.value} />)}
      </div>
      <Notice>Le quattro risposte si aggiornano mentre scrivi: A è il primo numero, B il secondo. Inverti con la freccia per scambiarli.</Notice>
    </Stack>
  );
}
