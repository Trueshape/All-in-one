import { useState } from "react";
import { Field, TextInput, Slider, Chips, ResultCard, Row, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";

const eur = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

export default function TipCalculator() {
  const u = useUi();
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

      <div className="space-y-2">
        <Slider label="Sconto" value={discount} min={0} max={100} onChange={setDiscount} display={`${discount}%`} />
        <Chips value={discount} onChange={setDiscount} options={[0, 10, 20, 30, 50].map((v) => ({ value: v, label: `${v}%` }))} />
      </div>

      <div className="space-y-2">
        <Slider label="Mancia" value={tip} min={0} max={50} onChange={setTip} display={`${tip}%`} />
        <Chips value={tip} onChange={setTip} options={[0, 10, 15, 20, 25].map((v) => ({ value: v, label: `${v}%` }))} />
      </div>

      <div className="space-y-2">
        <Slider label="Dividi tra persone" value={people} min={1} max={30} onChange={setPeople} />
        <Chips value={people} onChange={setPeople} options={[1, 2, 4, 8].map((v) => ({ value: v, label: v === 1 ? "Singolo" : `${v} pers.` }))} />
      </div>

      <ResultCard label="Quota a persona" value={eur(perPerson)} copyText={summary}>
        <Row label="Prezzo originale" value={eur(billValue)} />
        <Row label={`Sconto (${discount}%)`} value={`-${eur(discountAmount)}`} tone="warn" />
        <Row label={`Mancia (${tip}%)`} value={`+${eur(tipAmount)}`} />
        <Row label="Totale finale" value={eur(total)} />
        {people > 1 && (
          <p className={`pt-1 text-[11px] ${u.muted}`}>
            Per persona: sconto -{eur(discountAmount / people)} · mancia +{eur(tipAmount / people)}
          </p>
        )}
      </ResultCard>
    </Stack>
  );
}
