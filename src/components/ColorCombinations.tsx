import { useEffect, useState } from "react";
import { Field, TextInput, Segmented, Panel, SectionTitle, Notice, Stack, CopyButton, Row, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { contrastRatio, harmonies, hexToRgb, mixRgb, rgbToHex } from "../lib/color";
import type { Harmony } from "../lib/color";

const NAMES: Record<Harmony["id"], { name: string; hint: string }> = {
  complementary: { name: "Complementari", hint: "Opposti sulla ruota: massimo contrasto." },
  analogous: { name: "Analoghi", hint: "Vicini sulla ruota: armonia morbida." },
  split: { name: "Split-complementari", hint: "Il colore e i due vicini del suo opposto." },
  triadic: { name: "Triade", hint: "Tre colori a 120° l'uno dall'altro." },
  tetradic: { name: "Tetradica", hint: "Due coppie di complementari (rettangolo)." },
  square: { name: "Quadrato", hint: "Quattro colori a 90° l'uno dall'altro." },
  monochromatic: { name: "Monocromatica", hint: "Stesso colore, luminosità diversa." },
};

const STEPS = 7;

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const normalize = (text: string) => (text.startsWith("#") ? text : `#${text}`).toLowerCase();
  // The colour can also change from outside (double click on a swatch): follow it.
  useEffect(() => { if (normalize(draft) !== value) setDraft(value); }, [value]);
  const type = (text: string) => {
    setDraft(text);
    if (hexToRgb(normalize(text))) onChange(normalize(text));
  };
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-11 h-11 bg-transparent cursor-pointer shrink-0" aria-label={label} />
        <TextInput value={draft} onChange={(e) => type(e.target.value)} maxLength={7} spellCheck={false} />
      </div>
    </Field>
  );
}

function Swatch({ hex, onUse }: { hex: string; onUse?: (hex: string) => void }) {
  const u = useUi();
  const rgb = hexToRgb(hex) ?? [0, 0, 0];
  const text = contrastRatio(rgb, [255, 255, 255]) >= contrastRatio(rgb, [0, 0, 0]) ? "#ffffff" : "#000000";
  return (
    <div className="flex-1 min-w-[4.5rem]">
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(hex.toUpperCase()).catch(() => {})}
        onDoubleClick={() => onUse?.(hex)}
        title={`${hex.toUpperCase()} · clic: copia${onUse ? " · doppio clic: usa come base" : ""}`}
        className={cx("w-full h-16 border cursor-pointer text-[11px] font-mono font-semibold", u.divider)}
        style={{ backgroundColor: hex, color: text }}
      >
        {hex.toUpperCase()}
      </button>
    </div>
  );
}

export default function ColorCombinations() {
  const u = useUi();
  const [mode, setMode] = useState<"harmony" | "pair">("harmony");
  const [base, setBase] = useState("#8b5cf6");
  const [a, setA] = useState("#ef4444");
  const [b, setB] = useState("#3b82f6");

  const rgbA = hexToRgb(a) ?? [0, 0, 0];
  const rgbB = hexToRgb(b) ?? [0, 0, 0];
  const steps = Array.from({ length: STEPS }, (_, i) => rgbToHex(mixRgb(rgbA, rgbB, i / (STEPS - 1))));
  const ratio = contrastRatio(rgbA, rgbB);

  return (
    <Stack>
      <Segmented fill value={mode} onChange={setMode} options={[{ value: "harmony", label: "Armonie da un colore" }, { value: "pair", label: "Due colori" }]} />

      {mode === "harmony" ? (
        <>
          <ColorInput label="Colore di partenza" value={base} onChange={setBase} />
          <div className="space-y-4">
            {harmonies(base).map((h) => (
              <div key={h.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cx("text-sm font-semibold", u.text)}>{NAMES[h.id].name}</span>
                  <CopyButton text={h.colors.map((c) => c.toUpperCase()).join(", ")} label={`Copia ${NAMES[h.id].name}`} />
                </div>
                <div className="flex gap-1.5 flex-wrap">{h.colors.map((c, i) => <Swatch key={`${c}-${i}`} hex={c} onUse={setBase} />)}</div>
                <p className={cx("text-xs", u.muted)}>{NAMES[h.id].hint}</p>
              </div>
            ))}
          </div>
          <Notice>Clic su un colore per copiarlo, doppio clic per usarlo come nuovo colore di partenza.</Notice>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorInput label="Primo colore" value={a} onChange={setA} />
            <ColorInput label="Secondo colore" value={b} onChange={setB} />
          </div>
          <div className="space-y-1.5">
            <SectionTitle>Sfumatura tra i due colori</SectionTitle>
            <div className="flex gap-1.5 flex-wrap">{steps.map((c, i) => <Swatch key={i} hex={c} />)}</div>
          </div>
          <Panel className="space-y-3">
            <SectionTitle>Leggibilità</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 text-center text-lg font-bold" style={{ backgroundColor: b, color: a }}>Testo A su B</div>
              <div className="p-4 text-center text-lg font-bold" style={{ backgroundColor: a, color: b }}>Testo B su A</div>
            </div>
            <Row label="Contrasto" value={`${ratio.toFixed(2)}:1`} tone={ratio >= 4.5 ? "good" : ratio >= 3 ? "warn" : "bad"} />
            <p className={cx("text-xs", u.muted)}>WCAG: almeno 4.5:1 per il testo normale, 3:1 per il testo grande.</p>
          </Panel>
        </>
      )}
    </Stack>
  );
}
