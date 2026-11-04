import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Notice, Field, TextInput, Slider, Panel, SectionTitle, Stack, useCopy, cx, IconButton } from "../ui/kit";
import { ColorWheel, HARMONY_NAMES } from "../ui/ColorWheel";
import { useUi } from "../ui/tokens";
import { contrastRatio, harmonies, hexToRgb, hslToHex, rgbToHex, rgbToHsl } from "../lib/color";
import type { Rgb } from "../lib/color";

/** The colour is kept as hex and as HSL together: dragging the wheel keeps the exact hue even where it is lost in hex (black, white, grey). */
interface Color {
  hex: string;
  hsl: [number, number, number];
}

const fromHex = (hex: string): Color => ({ hex, hsl: rgbToHsl(hexToRgb(hex) ?? [0, 0, 0]) });
const fromHsl = (h: number, s: number, l: number): Color => ({ hex: hslToHex(h, s, l), hsl: [h, s, l] });

function Swatch({ color, onCopy, onUse }: { color: string; onCopy: (text: string) => void; onUse: (color: string) => void }) {
  const u = useUi();
  return (
    <button
      type="button"
      onClick={() => onCopy(color.toUpperCase())}
      onDoubleClick={() => onUse(color)}
      title={`${color.toUpperCase()} · clic: copia · doppio clic: usa`}
      className={cx("w-9 h-9 border cursor-pointer shrink-0", u.divider, u.id === "sophisticated" ? "rounded-lg" : u.id === "artistic" ? "rounded" : "")}
      style={{ backgroundColor: color }}
    />
  );
}

export default function ColorPicker() {
  const u = useUi();
  const [color, setColor] = useState<Color>(() => fromHsl(258, 90, 50));
  const [draft, setDraft] = useState(color.hex);
  const { copied, copy } = useCopy();
  const [copiedLabel, setCopiedLabel] = useState("");

  const { hex } = color;
  const rgb = hexToRgb(hex) ?? [0, 0, 0];
  const [h, s, l] = color.hsl;

  const apply = (next: Color) => {
    setColor(next);
    setDraft(next.hex);
  };

  const onDraft = (value: string) => {
    setDraft(value);
    const withHash = value.startsWith("#") ? value : `#${value}`;
    if (hexToRgb(withHash)) setColor(fromHex(withHash.toLowerCase()));
  };

  const setChannel = (index: number, value: number) => {
    const next = [...rgb] as Rgb;
    next[index] = value;
    apply(fromHex(rgbToHex(next)));
  };

  const formats = [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "RGB", value: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` },
    { label: "HSL", value: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)` },
  ];

  const onWhite = contrastRatio(rgb, [255, 255, 255]);
  const onBlack = contrastRatio(rgb, [0, 0, 0]);

  return (
    <Stack>
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-6 items-start">
        <div className="space-y-4 justify-self-center">
          <ColorWheel size={220} lightness={l} colors={[hex]} onPick={(nh, ns) => apply(fromHsl(nh, ns, l))} label="Ruota dei colori: tonalità e saturazione" />
          <Slider label="Luminosità" value={Math.round(l)} min={0} max={100} onChange={(v) => apply(fromHsl(h, s, v))} display={`${Math.round(l)}%`} />
        </div>

        <Panel className="space-y-3">
          <SectionTitle>Canali RGB</SectionTitle>
          <Slider label="Rosso" value={rgb[0]} min={0} max={255} onChange={(v) => setChannel(0, v)} />
          <Slider label="Verde" value={rgb[1]} min={0} max={255} onChange={(v) => setChannel(1, v)} />
          <Slider label="Blu" value={rgb[2]} min={0} max={255} onChange={(v) => setChannel(2, v)} />
        </Panel>

        <div className="space-y-2">
          <div className={cx("h-12 border", u.divider, u.id === "sophisticated" ? "rounded-2xl" : u.id === "artistic" ? "rounded" : "")} style={{ backgroundColor: hex }} />
          <Field label="Codice HEX">
            <TextInput value={draft} onChange={(e) => onDraft(e.target.value)} maxLength={7} spellCheck={false} />
          </Field>
          {formats.map((f) => (
            <Panel key={f.label} className="flex items-center justify-between py-2">
              <div>
                <span className={u.statLabel}>{f.label}</span>
                <div className={cx("font-mono text-sm", u.text)}>{f.value}</div>
              </div>
              <IconButton onClick={() => { setCopiedLabel(f.label); copy(f.value); }} title={`Copia ${f.label}`}>
                {copied && copiedLabel === f.label ? <Check className="text-emerald-400" /> : <Copy />}
              </IconButton>
            </Panel>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 text-center text-xs font-semibold" style={{ backgroundColor: hex, color: "#fff" }}>Bianco · {onWhite.toFixed(1)}:1</div>
            <div className="p-2 text-center text-xs font-semibold" style={{ backgroundColor: hex, color: "#000" }}>Nero · {onBlack.toFixed(1)}:1</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Armonie</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {harmonies(hex, color.hsl).map((harmony) => (
            <Panel key={harmony.id} className="flex items-center gap-3">
              <ColorWheel size={96} lightness={l} colors={harmony.colors} baseIndex={harmony.base} onPick={(nh, ns, i) => apply(fromHsl((((nh - harmony.offsets[i]) % 360) + 360) % 360, ns, l))} label={`Ruota ${HARMONY_NAMES[harmony.id].name}: trascina un punto per cambiare il colore`} />
              <div className="space-y-2 min-w-0">
                <span className={cx("text-sm font-semibold", u.text)}>{HARMONY_NAMES[harmony.id].name}</span>
                <div className="flex flex-wrap gap-1.5">
                  {harmony.colors.map((c, i) => <Swatch key={`${c}-${i}`} color={c} onCopy={copy} onUse={(next) => apply(fromHex(next))} />)}
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <Notice>Le ruote sotto seguono il colore scelto nella prima: puoi anche trascinare un loro punto per spostare tutta l'armonia. Clic su un colore per copiarlo, doppio clic per usarlo come colore corrente.</Notice>
      </div>
    </Stack>
  );
}
