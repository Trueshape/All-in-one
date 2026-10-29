import { useState } from "react";
import { Maximize } from "lucide-react";
import { Field, TextInput, Toggle, Chips, Panel, SectionTitle, Stack } from "../ui/kit";
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
  const [lock, setLock] = useState(true);
  const [ratio, setRatio] = useState({ w: 16, h: 9 });

  const w = parseFloat(width);
  const h = parseFloat(height);
  const valid = w > 0 && h > 0;
  const current = valid ? simplify(w, h) : null;

  const onWidth = (value: string) => {
    setWidth(value);
    const next = parseFloat(value);
    if (lock && next > 0) setHeight(String(Math.round((next * ratio.h) / ratio.w)));
  };

  const onHeight = (value: string) => {
    setHeight(value);
    const next = parseFloat(value);
    if (lock && next > 0) setWidth(String(Math.round((next * ratio.w) / ratio.h)));
  };

  const onLock = (checked: boolean) => {
    setLock(checked);
    if (checked && current) setRatio(current);
  };

  const applyPreset = (p: { w: number; h: number }) => {
    setRatio({ w: p.w, h: p.h });
    setLock(true);
    if (w > 0) setHeight(String(Math.round((w * p.h) / p.w)));
  };

  const previewW = valid ? w : 16;
  const previewH = valid ? h : 9;
  const scale = Math.min(300 / previewW, 150 / previewH);

  return (
    <Stack>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Larghezza (px)">
          <TextInput type="number" min="1" value={width} onChange={(e) => onWidth(e.target.value)} />
        </Field>
        <Field label="Altezza (px)">
          <TextInput type="number" min="1" value={height} onChange={(e) => onHeight(e.target.value)} />
        </Field>
      </div>

      <Toggle checked={lock} onChange={onLock} label={`Mantieni proporzioni (${ratio.w}:${ratio.h})`} />

      <div className="space-y-2">
        <SectionTitle>Preset comuni</SectionTitle>
        <Chips
          value={(lock ? `${ratio.w}:${ratio.h}` : "") as string}
          onChange={(value) => {
            const p = PRESETS.find((x) => x.label === value);
            if (p) applyPreset(p);
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
        />
      </div>

      <Panel inset className="flex flex-col items-center gap-3">
        <span className={`${u.statLabel} self-start`}>Anteprima</span>
        <div className="h-[170px] w-full flex items-center justify-center">
          <div
            className="flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300"
            style={{ width: previewW * scale, height: previewH * scale, borderColor: u.accentHex, background: `${u.accentHex}14` }}
          >
            <Maximize className={`w-4 h-4 ${u.accent}`} />
            <span className={`text-xs font-mono font-bold ${u.text}`}>{valid ? `${width} × ${height}` : "—"}</span>
            <span className={`text-[10px] font-mono ${u.muted}`}>Rapporto {current ? `${current.w}:${current.h}` : "N/D"}</span>
          </div>
        </div>
      </Panel>
    </Stack>
  );
}
