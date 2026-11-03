import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Trash2 } from "lucide-react";
import { Slider, Panel, SectionTitle, Notice, Stack, IconButton, CopyButton, Row, cx } from "../ui/kit";
import { ImageDrop, useImageSource } from "../ui/ImageDrop";
import { useUi } from "../ui/tokens";
import { contrastRatio, hexToRgb, rgbToHex } from "../lib/color";
import type { Rgb } from "../lib/color";
import { extractPalette } from "../lib/palette";
import { readPixels, resample } from "../lib/imageOps";

const SAMPLE_SIDE = 400;

const textOn = (hex: string) => {
  const rgb = hexToRgb(hex) ?? [0, 0, 0];
  return contrastRatio(rgb, [255, 255, 255]) >= contrastRatio(rgb, [0, 0, 0]) ? "#ffffff" : "#000000";
};

export default function ColorExtractor() {
  const u = useUi();
  const { source, error, load, clear } = useImageSource();
  const [count, setCount] = useState(6);
  const [picked, setPicked] = useState<{ hex: string; rgb: Rgb } | null>(null);
  const sample = useRef<ImageData | null>(null);

  const palette = useMemo(() => {
    sample.current = null;
    if (!source) return [];
    const scale = Math.min(1, SAMPLE_SIDE / Math.max(source.width, source.height));
    const canvas = resample(source.image, Math.max(1, source.width * scale), Math.max(1, source.height * scale));
    sample.current = readPixels(canvas);
    return extractPalette(sample.current.data, count);
  }, [source, count]);

  const pick = (e: MouseEvent<HTMLImageElement>) => {
    const data = sample.current;
    if (!data) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = Math.min(data.width - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * data.width)));
    const y = Math.min(data.height - 1, Math.max(0, Math.floor(((e.clientY - box.top) / box.height) * data.height)));
    const i = (y * data.width + x) * 4;
    const rgb: Rgb = [data.data[i], data.data[i + 1], data.data[i + 2]];
    setPicked({ hex: rgbToHex(rgb), rgb });
  };

  const css = `:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")}\n}`;

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SectionTitle right={source && <IconButton onClick={() => { clear(); setPicked(null); }} title="Rimuovi immagine"><Trash2 className="w-4 h-4" /></IconButton>}>Immagine</SectionTitle>
          {!source ? (
            <ImageDrop onFile={load} />
          ) : (
            <Panel className="space-y-3">
              <div className="flex items-center justify-center">
                <img src={source.url} alt="Immagine da cui estrarre i colori" onClick={pick} className="max-h-60 max-w-full object-contain cursor-crosshair" />
              </div>
              <p className={cx("text-xs", u.muted)}>Clicca sull'immagine per leggere il colore di un punto.</p>
              {picked && (
                <div className="flex items-center gap-3">
                  <div className={cx("w-10 h-10 border shrink-0", u.divider)} style={{ backgroundColor: picked.hex }} />
                  <div className="min-w-0 flex-1">
                    <div className={cx("font-mono text-sm", u.text)}>{picked.hex.toUpperCase()}</div>
                    <div className={cx("font-mono text-xs", u.muted)}>rgb({picked.rgb.join(", ")})</div>
                  </div>
                  <CopyButton text={picked.hex.toUpperCase()} label="Copia colore" />
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Colori principali</SectionTitle>
          <Slider label="Numero di colori" value={count} min={2} max={16} onChange={setCount} />
          {palette.length === 0 ? (
            <Notice>Carica un'immagine per vedere la sua palette.</Notice>
          ) : (
            <>
              <div className={cx("flex h-10 overflow-hidden border", u.divider)}>
                {palette.map((c) => <div key={c.hex} style={{ backgroundColor: c.hex, width: `${c.share * 100}%` }} title={`${c.hex.toUpperCase()} · ${Math.round(c.share * 100)}%`} />)}
              </div>
              <div className="space-y-2">
                {palette.map((c) => (
                  <Panel key={c.hex} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 shrink-0 border flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: c.hex, color: textOn(c.hex), borderColor: "rgba(127,127,127,.4)" }}>Aa</div>
                    <div className="min-w-0 flex-1">
                      <div className={cx("font-mono text-sm", u.text)}>{c.hex.toUpperCase()}</div>
                      <div className={cx("font-mono text-xs", u.muted)}>rgb({c.rgb.join(", ")}) · {Math.round(c.share * 100)}%</div>
                    </div>
                    <CopyButton text={c.hex.toUpperCase()} label={`Copia ${c.hex.toUpperCase()}`} />
                  </Panel>
                ))}
              </div>
              <Panel className="space-y-1.5">
                <Row label="Copia tutti (HEX)" value={<CopyButton text={palette.map((c) => c.hex.toUpperCase()).join(", ")} label="Copia tutti i colori" />} />
                <Row label="Copia come variabili CSS" value={<CopyButton text={css} label="Copia variabili CSS" />} />
              </Panel>
            </>
          )}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>L'analisi avviene nel browser: l'immagine non viene inviata a server esterni.</Notice>
    </Stack>
  );
}
