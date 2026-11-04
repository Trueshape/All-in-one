import { useState } from "react";
import { Field, TextInput, ResultCard, Panel, SectionTitle, Stack, fmtNumber } from "../ui/kit";
import { percentChange, percentOf, whatPercent, wholeFrom } from "../lib/percent";

const num = (value: string) => (value.trim() === "" ? NaN : Number(value.replace(",", ".")));
const show = (n: number | null, suffix = "") => (n === null || Number.isNaN(n) ? "—" : `${fmtNumber(n, 4)}${suffix}`);

function Pair({ a, b, setA, setB, labelA, labelB, suffixA, suffixB }: { a: string; b: string; setA: (v: string) => void; setB: (v: string) => void; labelA: string; labelB: string; suffixA?: string; suffixB?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label={labelA}><TextInput type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} suffixText={suffixA} /></Field>
      <Field label={labelB}><TextInput type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} suffixText={suffixB} /></Field>
    </div>
  );
}

/** The four usual percentage questions, all live at once. */
export default function PercentageCalculator() {
  const [of, setOf] = useState({ x: "15", y: "200" });
  const [what, setWhat] = useState({ x: "30", y: "200" });
  const [whole, setWhole] = useState({ x: "30", y: "15" });
  const [change, setChange] = useState({ from: "80", to: "100" });

  const changeValue = percentChange(num(change.from), num(change.to));

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel className="space-y-3">
          <SectionTitle>Quanto è il X% di Y</SectionTitle>
          <Pair a={of.x} b={of.y} setA={(x) => setOf({ ...of, x })} setB={(y) => setOf({ ...of, y })} labelA="Percentuale" labelB="Numero" suffixA="%" />
          <ResultCard label={`Il ${of.x || "…"}% di ${of.y || "…"} è`} value={show(percentOf(num(of.x), num(of.y)))} copyText={show(percentOf(num(of.x), num(of.y)))} />
        </Panel>

        <Panel className="space-y-3">
          <SectionTitle>X è quanto per cento di Y</SectionTitle>
          <Pair a={what.x} b={what.y} setA={(x) => setWhat({ ...what, x })} setB={(y) => setWhat({ ...what, y })} labelA="Numero X" labelB="Totale Y" />
          <ResultCard label={`${what.x || "…"} su ${what.y || "…"} è il`} value={show(whatPercent(num(what.x), num(what.y)), "%")} copyText={show(whatPercent(num(what.x), num(what.y)), "%")} />
        </Panel>

        <Panel className="space-y-3">
          <SectionTitle>X è il Y% di quale numero</SectionTitle>
          <Pair a={whole.x} b={whole.y} setA={(x) => setWhole({ ...whole, x })} setB={(y) => setWhole({ ...whole, y })} labelA="Numero X" labelB="Percentuale" suffixB="%" />
          <ResultCard label={`${whole.x || "…"} è il ${whole.y || "…"}% di`} value={show(wholeFrom(num(whole.x), num(whole.y)))} copyText={show(wholeFrom(num(whole.x), num(whole.y)))} />
        </Panel>

        <Panel className="space-y-3">
          <SectionTitle>Aumento o diminuzione in %</SectionTitle>
          <Pair a={change.from} b={change.to} setA={(from) => setChange({ ...change, from })} setB={(to) => setChange({ ...change, to })} labelA="Da" labelB="A" />
          <ResultCard
            label={changeValue === null || Number.isNaN(changeValue) ? "Variazione" : changeValue >= 0 ? "Aumento del" : "Diminuzione del"}
            value={show(changeValue === null ? null : Math.abs(changeValue), "%")}
            copyText={show(changeValue, "%")}
          />
        </Panel>
      </div>
    </Stack>
  );
}
