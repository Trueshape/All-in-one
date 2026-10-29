import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Field, TextInput, Slider, Panel, SectionTitle, Stack, useCopy, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Rgb = [number, number, number];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

const rgbToHex = ([r, g, b]: Rgb) => "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, Math.round(l * 100)];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h *= 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrastWith = (rgb: Rgb, other: Rgb) => {
  const [hi, lo] = [luminance(rgb), luminance(other)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
};

export default function ColorPicker() {
  const u = useUi();
  const [hex, setHex] = useState("#8b5cf6");
  const [draft, setDraft] = useState("#8b5cf6");
  const { copied, copy } = useCopy();

  const rgb = hexToRgb(hex) ?? [0, 0, 0];
  const [h, s, l] = rgbToHsl(rgb);

  const apply = (next: string) => {
    setHex(next);
    setDraft(next);
  };

  const onDraft = (value: string) => {
    setDraft(value);
    const withHash = value.startsWith("#") ? value : `#${value}`;
    if (hexToRgb(withHash)) setHex(withHash.toLowerCase());
  };

  const setChannel = (index: number, value: number) => {
    const next = [...rgb] as Rgb;
    next[index] = value;
    apply(rgbToHex(next));
  };

  const palettes = useMemo(
    () => [
      { name: "Complementare", colors: [hslToHex((h + 180) % 360, s, l)] },
      { name: "Analoga", colors: [hslToHex((h + 30) % 360, s, l), hslToHex((h + 330) % 360, s, l)] },
      { name: "Triade", colors: [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)] },
      { name: "Monocromatica", colors: [clamp(l - 25, 8, 95), clamp(l - 12, 8, 95), clamp(l + 12, 5, 95), clamp(l + 25, 5, 95)].map((ll) => hslToHex(h, s, ll)) },
    ],
    [h, s, l],
  );

  const formats = [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "RGB", value: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` },
    { label: "HSL", value: `hsl(${h}, ${s}%, ${l}%)` },
  ];

  const onWhite = contrastWith(rgb, [255, 255, 255]);
  const onBlack = contrastWith(rgb, [0, 0, 0]);

  const Swatch = ({ color, size = "w-9 h-9" }: { color: string; size?: string }) => (
    <button
      type="button"
      onClick={() => copy(color.toUpperCase())}
      onDoubleClick={() => apply(color)}
      title={`${color.toUpperCase()} · clic: copia · doppio clic: usa`}
      className={cx(size, "border cursor-pointer shrink-0", u.divider, u.id === "sophisticated" ? "rounded-lg" : u.id === "artistic" ? "rounded" : "")}
      style={{ backgroundColor: color }}
    />
  );

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
        <label className="block cursor-pointer">
          <div className={cx("w-28 h-28 border relative", u.divider, u.id === "sophisticated" ? "rounded-2xl" : u.id === "artistic" ? "rounded" : "")} style={{ backgroundColor: hex }}>
            <input type="color" value={hex} onChange={(e) => apply(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Scegli colore" />
          </div>
          <span className={cx("block mt-2 text-center", u.statLabel)}>Clicca per scegliere</span>
        </label>

        <div className="space-y-2">
          <Field label="Codice HEX">
            <TextInput value={draft} onChange={(e) => onDraft(e.target.value)} maxLength={7} spellCheck={false} />
          </Field>
          {formats.map((f) => (
            <Panel key={f.label} className="flex items-center justify-between py-2">
              <div>
                <span className={u.statLabel}>{f.label}</span>
                <div className={cx("font-mono text-sm", u.text)}>{f.value}</div>
              </div>
              <button type="button" onClick={() => copy(f.value)} className={cx("p-1.5 cursor-pointer", u.muted)} title={`Copia ${f.label}`}>
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </Panel>
          ))}
        </div>
      </div>

      <Panel className="space-y-3">
        <SectionTitle>Canali RGB</SectionTitle>
        <Slider label="Rosso" value={rgb[0]} min={0} max={255} onChange={(v) => setChannel(0, v)} />
        <Slider label="Verde" value={rgb[1]} min={0} max={255} onChange={(v) => setChannel(1, v)} />
        <Slider label="Blu" value={rgb[2]} min={0} max={255} onChange={(v) => setChannel(2, v)} />
      </Panel>

      <div className="space-y-3">
        <SectionTitle>Palette armoniche</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {palettes.map((p) => (
            <div key={p.name} className="space-y-1.5">
              <span className={u.statLabel}>{p.name}</span>
              <div className="flex gap-2">{p.colors.map((c, i) => <Swatch key={`${c}-${i}`} color={c} />)}</div>
            </div>
          ))}
        </div>
        <p className={cx("text-[11px]", u.muted)}>Clic su un colore per copiarlo, doppio clic per usarlo come colore corrente.</p>
      </div>

      <Panel className="grid grid-cols-2 gap-3">
        <div className="p-3 text-center text-sm font-semibold" style={{ backgroundColor: hex, color: "#fff" }}>Bianco · {onWhite.toFixed(1)}:1</div>
        <div className="p-3 text-center text-sm font-semibold" style={{ backgroundColor: hex, color: "#000" }}>Nero · {onBlack.toFixed(1)}:1</div>
      </Panel>
    </Stack>
  );
}
