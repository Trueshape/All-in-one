import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useUi } from "../ui/tokens";
import { Field, TextInput, Select, Segmented, IconButton, ResultCard, Notice, Stack, cx, fmtUnit } from "../ui/kit";
import { UNITS, fromBytes, toBytes, unitLabel } from "../lib/dataSize";
import type { System, UnitId } from "../lib/dataSize";

/** Same layout as the other quantities of the unit converter: value, from / to, result, then every unit at once. */
export default function DataSizeConverter() {
  const u = useUi();
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<UnitId>("GB");
  const [to, setTo] = useState<UnitId>("MB");
  const [system, setSystem] = useState<System>("decimal");
  const value = amount.trim() === "" ? NaN : Number(amount.replace(",", "."));
  const valid = Number.isFinite(value) && value >= 0;
  const bytes = valid ? toBytes(value, from, system) : 0;
  const convert = (id: UnitId) => fromBytes(bytes, id, system);
  const fromLabel = unitLabel(from, system);
  const toLabel = unitLabel(to, system);
  const text = valid ? `${fmtUnit(value)} ${fromLabel} = ${fmtUnit(convert(to))} ${toLabel}` : "";

  return (
    <Stack>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <Field label="Valore">
          <TextInput type="number" inputMode="decimal" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} suffixText={fromLabel} />
        </Field>
        <Field label="Sistema">
          <Segmented value={system} onChange={setSystem} options={[{ value: "decimal", label: "1000" }, { value: "binary", label: "1024" }]} />
        </Field>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label="Da">
          <Select value={from} onChange={(e) => setFrom(e.target.value as UnitId)}>
            {UNITS.map((x) => <option key={x.id} value={x.id}>{unitLabel(x.id, system)}</option>)}
          </Select>
        </Field>
        <IconButton onClick={() => { setFrom(to); setTo(from); }} title="Inverti unità" className="mb-1"><ArrowLeftRight /></IconButton>
        <Field label="A">
          <Select value={to} onChange={(e) => setTo(e.target.value as UnitId)}>
            {UNITS.map((x) => <option key={x.id} value={x.id}>{unitLabel(x.id, system)}</option>)}
          </Select>
        </Field>
      </div>

      <ResultCard
        label="Conversione"
        value={valid ? (
          <span className="block">
            <span className="block text-lg font-semibold font-display text-zinc-100">{fmtUnit(value)} {fromLabel} =</span>
            <span className="block text-2xl font-bold font-display" style={{ color: u.accentHex }}>{fmtUnit(convert(to))} {toLabel}</span>
          </span>
        ) : "—"}
        copyText={text}
      />

      {valid && (
        <div className={cx("p-3 space-y-2 rounded-xl", u.panel)}>
          <div className={cx("px-1 text-xs font-medium", u.subtle)}>{value === 1 ? `1 ${fromLabel} in tutte le unità` : `${fmtUnit(value)} ${fromLabel} in tutte le unità`}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {UNITS.filter((x) => x.id !== from).map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTo(x.id)}
                title={`${unitLabel(x.id, system)}: usa come unità di arrivo`}
                className={cx("flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-left", u.panelInset, x.id === to && "ring-1")}
                style={x.id === to ? { boxShadow: `inset 0 0 0 1px ${u.accentHex}` } : undefined}
              >
                <span className={cx("font-medium", x.id === to ? u.accent : u.muted)}>{unitLabel(x.id, system)}</span>
                <span className={cx("font-mono font-semibold truncate", u.text)}>{fmtUnit(convert(x.id))}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Notice>Con 1000 un KB sono 1000 byte (come lo dichiarano dischi e provider); con 1024 sono KiB, MiB, GiB (come li mostrano molti sistemi operativi). 1 byte = 8 bit.</Notice>
    </Stack>
  );
}
