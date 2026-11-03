import { useState } from "react";
import { Lock, LockOpen, Maximize } from "lucide-react";
import { Notice, Field, TextInput, Chips, Panel, SectionTitle, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const PRESETS = [
  { label: "16:9", w: 16, h: 9 },
  { label: "9:16", w: 9, h: 16 },
  { label: "4:3", w: 4, h: 3 },
  { label: "1:1", w: 1, h: 1 },
  { label: "21:9", w: 21, h: 9 },
  { label: "16:10", w: 16, h: 10 },
];

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const simplify = (w: number, h: number) => {
  const d = gcd(Math.round(w), Math.round(h)) || 1;
  return { w: Math.round(w) / d, h: Math.round(h) / d };
};

export default function AspectRatioCalculator() {
  const u = useUi();
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  // Locked: the two sides always keep the selected ratio. Unlocked: each side is free.
  const [locked, setLocked] = useState(true);
  const [ratio, setRatio] = useState({ w: 16, h: 9 });

  const w = parseFloat(width);
  const h = parseFloat(height);
  const valid = w > 0 && h > 0;
  const current = valid ? simplify(w, h) : null;

  const onWidth = (value: string) => {
    setWidth(value);
    const next = parseFloat(value);
    if (locked && next > 0) setHeight(String(Math.round((next * ratio.h) / ratio.w)));
    else if (!locked && next > 0 && h > 0) setRatio(simplify(next, h));
  };

  const onHeight = (value: string) => {
    setHeight(value);
    const next = parseFloat(value);
    if (locked && next > 0) setWidth(String(Math.round((next * ratio.w) / ratio.h)));
    else if (!locked && next > 0 && w > 0) setRatio(simplify(w, next));
  };

  // Locking takes the ratio currently shown on the fields
  const toggleLock = () => {
    setLocked((l) => {
      if (!l && current) setRatio(current);
      return !l;
    });
  };

  // A preset sets the ratio and resizes the height from the current width (the locked side)
  const applyPreset = (p: { w: number; h: number }) => {
    setRatio({ w: p.w, h: p.h });
    setLocked(true);
    if (w > 0) setHeight(String(Math.round((w * p.h) / p.w)));
  };

  const activeRatio = locked ? `${ratio.w}:${ratio.h}` : "";
  const previewW = valid ? w : 16;
  const previewH = valid ? h : 9;
  const scale = Math.min(480 / previewW, 230 / previewH);

  return (
    <Stack>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field label="Larghezza (px)">
          <TextInput type="number" min="0" step={locked ? ratio.w : 1} value={width} onChange={(e) => onWidth(e.target.value)} />
        </Field>
        <button
          type="button"
          onClick={toggleLock}
          aria-pressed={locked}
          aria-label={locked ? "Sblocca proporzioni" : "Blocca proporzioni"}
          title={locked ? `Proporzioni bloccate (${ratio.w}:${ratio.h})` : "Proporzioni libere"}
          className={cx("mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border cursor-pointer transition-colors", locked ? u.tag : u.btnSecondary)}
          style={locked ? { color: u.accentHex, borderColor: u.accentHex } : undefined}
        >
          {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        </button>
        <Field label="Altezza (px)">
          <TextInput type="number" min="0" step={locked ? ratio.h : 1} value={height} onChange={(e) => onHeight(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2">
        <SectionTitle>Preset comuni</SectionTitle>
        <Chips
          fill
          value={activeRatio}
          onChange={(value) => {
            const p = PRESETS.find((x) => x.label === value);
            if (p) applyPreset(p);
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
        />
      </div>

      <Panel inset className="flex flex-col items-center gap-3">
        <span className={`${u.statLabel} self-start`}>Anteprima</span>
        <div className="h-[270px] w-full flex items-center justify-center">
          <div
            className="flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300"
            style={{ width: Math.max(180, previewW * scale), height: previewH * scale, borderColor: u.accentHex, background: `${u.accentHex}14` }}
          >
            <Maximize className={`w-4 h-4 ${u.accent}`} />
            <span className={`text-xs font-mono font-bold ${u.text}`}>{valid ? `${width} × ${height}` : "—"}</span>
            <span className={`text-[10px] font-mono ${u.muted}`}>Rapporto {current ? `${current.w}:${current.h}` : "N/D"}</span>
          </div>
        </div>
      </Panel>
      <Notice>Con il lucchetto chiuso, cambiando un lato l’altro si ricalcola sul rapporto attivo. Con il lucchetto aperto i due lati sono indipendenti.</Notice>
    </Stack>
  );
}
