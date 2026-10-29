import { Fragment, useState } from "react";
import { Field, TextInput, Panel, Row, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Key = "r" | "d" | "c" | "a";

const FIELDS: Array<{ key: Key; label: string; placeholder: string }> = [
  { key: "r", label: "Raggio (r)", placeholder: "Es. 5" },
  { key: "d", label: "Diametro (d)", placeholder: "Es. 10" },
  { key: "c", label: "Circonferenza (C)", placeholder: "Es. 31,42" },
  { key: "a", label: "Area (A)", placeholder: "Es. 78,54" },
];

const toRadius: Record<Key, (v: number) => number> = {
  r: (v) => v,
  d: (v) => v / 2,
  c: (v) => v / (2 * Math.PI),
  a: (v) => Math.sqrt(v / Math.PI),
};

const fromRadius = (r: number): Record<Key, string> => ({
  r: String(+r.toFixed(4)),
  d: String(+(r * 2).toFixed(4)),
  c: String(+(2 * Math.PI * r).toFixed(4)),
  a: String(+(Math.PI * r * r).toFixed(4)),
});

export default function CircleCalculator() {
  const u = useUi();
  const [values, setValues] = useState<Record<Key, string>>(fromRadius(5));
  const [edited, setEdited] = useState<Key>("r");

  const onChange = (key: Key, raw: string) => {
    const parsed = parseFloat(raw);
    setEdited(key);
    if (Number.isFinite(parsed) && parsed > 0) {
      setValues({ ...fromRadius(toRadius[key](parsed)), [key]: raw });
    } else {
      setValues((prev) => ({ ...prev, [key]: raw }));
    }
  };

  const radius = parseFloat(values.r) || 0;
  const visual = Math.min(88, Math.max(16, radius * 8.8));

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className={`text-[11px] ${u.muted}`}>Inserisci un parametro: gli altri si aggiornano.</p>
          {FIELDS.map((f) => (
            <Fragment key={f.key}><Field label={<span>{f.label}{edited === f.key && <span className={`ml-2 normal-case tracking-normal ${u.accent}`}>• modificato</span>}</span>}>
              <TextInput type="number" inputMode="decimal" step="any" min="0" value={values[f.key]} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
            </Field></Fragment>
          ))}
        </div>

        <Panel className="flex flex-col items-center gap-4">
          <span className={`${u.statLabel} self-start`}>Anteprima</span>
          <svg viewBox="0 0 192 192" className="w-48 h-48" role="img" aria-label={`Cerchio di raggio ${values.r}`}>
            <circle cx="96" cy="96" r="88" fill="none" stroke={u.mutedHex} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="96" cy="96" r={visual} fill={u.accentHex} fillOpacity="0.08" stroke={u.accentHex} strokeWidth="2" className="transition-all duration-300" />
            <line x1={96 - visual} y1="96" x2={96 + visual} y2="96" stroke={u.accentHex} strokeOpacity="0.35" strokeDasharray="4 2" />
            <line x1="96" y1="96" x2={96 + visual} y2="96" stroke={u.accentHex} strokeWidth="2" className="transition-all duration-300" />
            <circle cx="96" cy="96" r="3.5" fill={u.accentHex} />
          </svg>
          <div className={`w-full pt-3 border-t space-y-1.5 ${u.divider}`}>
            <Row label="Circonferenza" value={`2·π·r ≈ ${values.c}`} />
            <Row label="Area" value={`π·r² ≈ ${values.a}`} />
          </div>
        </Panel>
      </div>

      <Notice>I calcoli usano <code className="font-mono">Math.PI</code> e arrotondano a 4 decimali.</Notice>
    </Stack>
  );
}
