import { useEffect, useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Field, Chips, Segmented, Slider, Toggle, Button, IconButton, Panel, SectionTitle, Notice, Stack, Row } from "../ui/kit";
import { ImageDrop, useImageSource } from "../ui/ImageDrop";
import { hexToRgb } from "../lib/color";
import type { Rgb } from "../lib/color";
import { extractPalette, nearestIndex } from "../lib/palette";
import { download, readPixels, resample, toBlob, writePixels } from "../lib/imageOps";

type PaletteMode = "original" | "adaptive" | "preset";

const PRESETS: Record<string, { label: string; colors: string[] }> = {
  gameboy: { label: "Game Boy", colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"] },
  pico8: { label: "PICO-8", colors: ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8", "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"] },
  cga: { label: "CGA", colors: ["#000000", "#55ffff", "#ff55ff", "#ffffff"] },
  bw: { label: "Bianco e nero", colors: ["#000000", "#ffffff"] },
};

// 4 × 4 Bayer matrix, used for ordered dithering.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export default function PixelArt() {
  const { source, error, load, clear } = useImageSource();
  const [block, setBlock] = useState(8);
  const [mode, setMode] = useState<PaletteMode>("adaptive");
  const [count, setCount] = useState(16);
  const [preset, setPreset] = useState("pico8");
  const [dither, setDither] = useState(false);
  const display = useRef<HTMLCanvasElement>(null);
  const small = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<{ cols: number; rows: number } | null>(null);

  // Start with a grid of about 64 pixels on the long side.
  useEffect(() => {
    if (source) setBlock(Math.min(64, Math.max(2, Math.round(Math.max(source.width, source.height) / 64))));
  }, [source]);

  useEffect(() => {
    const target = display.current;
    if (!source || !target) return;
    const cols = Math.max(1, Math.ceil(source.width / block));
    const rows = Math.max(1, Math.ceil(source.height / block));
    const canvas = resample(source.image, cols, rows);
    const image = readPixels(canvas);
    const data = image.data;

    let colors: Rgb[] | null = null;
    if (mode === "adaptive") colors = extractPalette(data, count).map((c) => c.rgb);
    else if (mode === "preset") colors = PRESETS[preset].colors.map((hex) => hexToRgb(hex) ?? [0, 0, 0]);

    if (colors?.length) {
      // Dithering shifts each pixel by a threshold before choosing its colour: the wider the palette, the smaller the shift.
      const spread = dither ? 255 / Math.max(2, Math.cbrt(colors.length)) : 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          if (data[i + 3] < 128) {
            data[i + 3] = 0;
            continue;
          }
          const shift = ((BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5) * spread;
          const [r, g, b] = colors[nearestIndex(colors, [data[i] + shift, data[i + 1] + shift, data[i + 2] + shift])];
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }
    }
    writePixels(canvas, image);
    small.current = canvas;

    target.width = cols * block;
    target.height = rows * block;
    const ctx = target.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(canvas, 0, 0, target.width, target.height);
    }
    setGrid({ cols, rows });
  }, [source, block, mode, count, preset, dither]);

  const save = async (scaled: boolean) => {
    const canvas = scaled ? display.current : small.current;
    if (!canvas || !source) return;
    const blob = await toBlob(canvas, "image/png");
    if (blob) download(blob, `${source.name}_pixel${scaled ? "" : "_piccola"}.png`);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SectionTitle right={source && <IconButton onClick={clear} title="Rimuovi immagine"><Trash2 className="w-4 h-4" /></IconButton>}>Risultato</SectionTitle>
          {!source ? (
            <ImageDrop onFile={load} />
          ) : (
            <Panel className="space-y-3">
              <div className="flex items-center justify-center">
                <canvas ref={display} className="max-h-72 max-w-full" style={{ imageRendering: "pixelated" }} aria-label="Immagine convertita in pixel art" />
              </div>
              {grid && (
                <div className="space-y-1.5">
                  <Row label="Griglia" value={`${grid.cols} × ${grid.rows} pixel`} />
                  <Row label="Originale" value={`${source.width} × ${source.height} px`} />
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Opzioni</SectionTitle>
          <Slider label="Dimensione del pixel" value={block} min={2} max={64} onChange={setBlock} display={`${block} px`} />
          <Field label="Colori">
            <Segmented fill value={mode} onChange={setMode} options={[{ value: "original", label: "Originali" }, { value: "adaptive", label: "Immagine" }, { value: "preset", label: "Preset" }]} />
          </Field>
          {mode === "adaptive" && <Slider label="Numero di colori" value={count} min={2} max={32} onChange={setCount} />}
          {mode === "preset" && (
            <Chips value={preset} onChange={setPreset} options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))} />
          )}
          {mode !== "original" && <Toggle checked={dither} onChange={setDither} label="Dithering (retino a griglia)" />}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" disabled={!source} icon={<Download className="w-3.5 h-3.5" />} onClick={() => save(true)}>PNG grande</Button>
            <Button disabled={!source} icon={<Download className="w-3.5 h-3.5" />} onClick={() => save(false)}>PNG 1 px = 1 pixel</Button>
          </div>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>La conversione avviene nel browser: nessun file viene inviato a server esterni.</Notice>
    </Stack>
  );
}
