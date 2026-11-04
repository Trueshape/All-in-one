import { useState } from "react";
import { Field, TextInput, Select, Segmented, ResultCard, Notice, Stack, fmtNumber } from "../ui/kit";
import { UNITS, fromBytes, toBytes, unitLabel } from "../lib/dataSize";
import type { System, UnitId } from "../lib/dataSize";

/** One value in, the same size in every unit out. */
export default function DataSizeConverter() {
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState<UnitId>("GB");
  const [system, setSystem] = useState<System>("decimal");
  const value = amount.trim() === "" ? NaN : Number(amount.replace(",", "."));
  const valid = Number.isFinite(value) && value >= 0;
  const bytes = valid ? toBytes(value, unit, system) : 0;

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-3">
        <Field label="Quantità"><TextInput type="number" inputMode="decimal" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Unità">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as UnitId)}>
            {UNITS.map((x) => <option key={x.id} value={x.id}>{unitLabel(x.id, system)}</option>)}
          </Select>
        </Field>
        <Field label="Sistema">
          <Segmented value={system} onChange={setSystem} options={[{ value: "decimal", label: "1000" }, { value: "binary", label: "1024" }]} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {UNITS.filter((x) => x.id !== unit).map((x) => {
          const text = valid ? fmtNumber(fromBytes(bytes, x.id, system), 6) : "—";
          return <ResultCard key={x.id} label={unitLabel(x.id, system)} value={text} copyText={valid ? String(fromBytes(bytes, x.id, system)) : ""} />;
        })}
      </div>
      <Notice>Con 1000 un KB sono 1000 byte (come lo dichiarano dischi e provider); con 1024 sono KiB, MiB, GiB (come li mostrano molti sistemi operativi). 1 byte = 8 bit.</Notice>
    </Stack>
  );
}
