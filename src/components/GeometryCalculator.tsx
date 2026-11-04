import { useState } from "react";
import { Field, TextInput, Chips, Panel, Row, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { ShapePreview } from "../ui/ShapePreview";
import { SHAPES, measure } from "../lib/geometry";
import type { ShapeId } from "../lib/geometry";

const round = (n: number) => String(+n.toFixed(4));

export default function GeometryCalculator() {
  const u = useUi();
  const [shapeId, setShapeId] = useState<ShapeId>("square");
  const [values, setValues] = useState<Record<string, string>>({});

  const shape = SHAPES.find((s) => s.id === shapeId) ?? SHAPES[0];
  const numbers: Record<string, number> = {};
  for (const f of shape.fields) numbers[f.key] = parseFloat(values[f.key] ?? "");
  const complete = shape.fields.every((f) => Number.isFinite(numbers[f.key]) && numbers[f.key] > 0);
  const result = complete ? measure(shape.id, numbers) : null;

  return (
    <Stack>
      <Chips value={shapeId} onChange={(id) => { setShapeId(id); setValues({}); }} options={SHAPES.map((s) => ({ value: s.id, label: s.name }))} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className={`text-[11px] ${u.muted}`}>Inserisci le misure: il risultato si aggiorna mentre scrivi.</p>
          {shape.fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <TextInput type="number" inputMode="decimal" step="any" min="0" value={values[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))} />
            </Field>
          ))}
        </div>

        <Panel className="flex flex-col items-center gap-3">
          <span className={`${u.statLabel} self-start`}>Anteprima</span>
          <ShapePreview shape={shape.id} values={numbers} />
          <div className="w-full space-y-3">
          <span className={u.statLabel}>Risultato</span>
          {!complete ? (
            <p className={`text-sm ${u.muted}`}>Inserisci tutte le misure, con valori maggiori di zero.</p>
          ) : result?.error ? (
            <Notice tone="error">{result.error}</Notice>
          ) : result && (
            <div className={`pt-1 space-y-1.5 border-t ${u.divider}`}>
              {result.perimeter !== undefined && <Row label="Perimetro" value={`${round(result.perimeter)}`} />}
              <Row label={shape.dimensions === 2 ? "Area" : "Superficie"} value={`${round(result.area)}`} />
              {result.volume !== undefined && <Row label="Volume" value={`${round(result.volume)}`} />}
            </div>
          )}
          <p className={`text-[11px] font-mono ${u.muted}`}>{shape.formula}</p>
          </div>
        </Panel>
      </div>

      <Notice>I calcoli usano <code className="font-mono">Math.PI</code> e arrotondano a 4 decimali. Le unità restano quelle che inserisci: lati in cm danno aree in cm² e volumi in cm³.</Notice>
    </Stack>
  );
}
