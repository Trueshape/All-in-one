import { useEffect, useState } from "react";
import { Download, FileImage, Trash2 } from "lucide-react";
import * as opentype from "opentype.js";
import { Field, TextInput, TextArea, Button, Notice, Panel, Row, SectionTitle, Stack } from "../ui/kit";
import { ImageDrop, useImageSource } from "../ui/ImageDrop";
import type { Source } from "../ui/ImageDrop";
import { download, toBlob } from "../lib/imageOps";
import { BASELINE, CELL, CHARS, COLS, FRAME, MARGIN, ROWS, UNITS, ASCENT, DESCENT, cellArea, glyphFromMask, inkBox, otsu, sheetSize } from "../lib/handwriting";
import type { Glyph } from "../lib/handwriting";

const MAX_SIDE = 3200;
const SAMPLE = "Nel mezzo del cammin di nostra vita 0123456789";

/** The printable sheet: a black frame, one cell per character with its label and a baseline guide. */
function drawSheet(): HTMLCanvasElement {
  const { width, height } = sheetSize();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 2;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(MARGIN + c * CELL, MARGIN);
    ctx.lineTo(MARGIN + c * CELL, height - MARGIN);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN + r * CELL);
    ctx.lineTo(width - MARGIN, MARGIN + r * CELL);
    ctx.stroke();
  }
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "#888";
  ctx.textBaseline = "top";
  ctx.setLineDash([8, 6]);
  CHARS.forEach((ch, i) => {
    const x = MARGIN + (i % COLS) * CELL;
    const y = MARGIN + Math.floor(i / COLS) * CELL;
    ctx.fillText(ch, x + 10, y + 8);
    ctx.beginPath();
    ctx.moveTo(x + 8, y + CELL * BASELINE);
    ctx.lineTo(x + CELL - 8, y + CELL * BASELINE);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = FRAME;
  ctx.strokeRect(MARGIN - FRAME / 2, MARGIN - FRAME / 2, width - MARGIN * 2 + FRAME, height - MARGIN * 2 + FRAME);
  return canvas;
}

interface Built {
  font: opentype.Font;
  found: string[];
  missing: string[];
  buffer: ArrayBuffer;
}

/** Reads the photographed sheet: finds the frame, cuts the cells, turns each into a glyph and assembles the font. */
function buildFont(source: Source, family: string): Built | string {
  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const w = Math.round(source.width * scale);
  const h = Math.round(source.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "Il browser non permette di leggere l'immagine.";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source.image, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = Math.round(rgba[i * 4] * 0.299 + rgba[i * 4 + 1] * 0.587 + rgba[i * 4 + 2] * 0.114);

  const threshold = otsu(gray);
  const frame = inkBox(gray, w, h, threshold);
  if (!frame || frame.w < w * 0.3 || frame.h < h * 0.3) return "Non trovo la cornice nera del foglio: inquadra tutto il foglio, ben illuminato e senza ombre.";
  // The frame's outer edge is its bounding box; the cells start just inside it.
  const inset = (FRAME / (COLS * CELL + MARGIN * 2)) * frame.w;
  const sheet = { x: frame.x + inset, y: frame.y + inset, w: frame.w - inset * 2, h: frame.h - inset * 2 };

  const glyphs: Glyph[] = [];
  const cell = document.createElement("canvas");
  const cellCtx = cell.getContext("2d", { willReadFrequently: true });
  if (!cellCtx) return "Il browser non permette di leggere l'immagine.";
  CHARS.forEach((ch, i) => {
    const area = cellArea(i, sheet);
    // Enlarge small cells so the outline follows the pen more smoothly.
    const factor = Math.min(3, 320 / Math.max(area.w, area.h));
    cell.width = Math.max(8, Math.round(area.w * factor));
    cell.height = Math.max(8, Math.round(area.h * factor));
    cellCtx.imageSmoothingQuality = "high";
    cellCtx.drawImage(canvas, area.x, area.y, area.w, area.h, 0, 0, cell.width, cell.height);
    const px = cellCtx.getImageData(0, 0, cell.width, cell.height).data;
    const mask = new Uint8Array(cell.width * cell.height);
    for (let p = 0; p < mask.length; p++) mask[p] = px[p * 4] * 0.299 + px[p * 4 + 1] * 0.587 + px[p * 4 + 2] * 0.114 <= threshold ? 1 : 0;
    const glyph = glyphFromMask(ch, mask, cell.width, cell.height);
    if (glyph) glyphs.push(glyph);
  });
  if (!glyphs.length) return "Non ho trovato nessuna lettera scritta nelle caselle.";

  const notdef = new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 500, path: new opentype.Path() });
  const space = new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 300, path: new opentype.Path() });
  const made = glyphs.map((g) => {
    const path = new opentype.Path();
    for (const r of g.rects) {
      // Clockwise in a y-up font, so overlapping rectangles never cancel out.
      path.moveTo(r.x, r.y);
      path.lineTo(r.x, r.y + r.h);
      path.lineTo(r.x + r.w, r.y + r.h);
      path.lineTo(r.x + r.w, r.y);
      path.close();
    }
    return new opentype.Glyph({ name: `u${g.char.codePointAt(0)}`, unicode: g.char.codePointAt(0), advanceWidth: g.advance, path });
  });
  const font = new opentype.Font({ familyName: family, styleName: "Regular", unitsPerEm: UNITS, ascender: ASCENT, descender: -DESCENT, glyphs: [notdef, space, ...made] });
  const found = glyphs.map((g) => g.char);
  return { font, found, missing: CHARS.filter((c) => !found.includes(c)), buffer: font.toArrayBuffer() };
}

export default function HandwritingFont() {
  const { source, error, load, clear } = useImageSource();
  const [family, setFamily] = useState("LaMiaScrittura");
  const [text, setText] = useState(SAMPLE);
  const [built, setBuilt] = useState<Built | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [face, setFace] = useState<string | null>(null);

  const cleanName = family.replace(/[^A-Za-z0-9]/g, "") || "LaMiaScrittura";

  useEffect(() => {
    setBuilt(null);
    setProblem(null);
    setFace(null);
    if (!source) return;
    let cancelled = false;
    let loaded: FontFace | null = null;
    // Let the "loading" state paint before the heavy work starts.
    const timer = window.setTimeout(async () => {
      const result = buildFont(source, cleanName);
      if (cancelled) return;
      if (typeof result === "string") return setProblem(result);
      const name = `hw-${Date.now()}`;
      loaded = new FontFace(name, result.buffer.slice(0));
      try {
        await loaded.load();
        document.fonts.add(loaded);
        if (!cancelled) setFace(name);
      } catch {
        // the font file is still downloadable even if this browser cannot preview it
      }
      if (!cancelled) setBuilt(result);
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (loaded) document.fonts.delete(loaded);
    };
  }, [source, cleanName]);

  const saveSheet = async () => {
    const blob = await toBlob(drawSheet(), "image/png");
    if (blob) download(blob, "foglio-scrittura.png");
  };
  const saveFont = () => {
    if (built) download(new Blob([built.buffer], { type: "font/ttf" }), `${cleanName}.ttf`);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <SectionTitle>1 · Il foglio</SectionTitle>
          <p className="text-xs leading-relaxed">
            Scarica il foglio, stampalo e scrivi ogni carattere nella sua casella, appoggiandolo alla linea tratteggiata, con una penna nera.
          </p>
          <Button variant="primary" icon={<FileImage className="w-3.5 h-3.5" />} onClick={saveSheet}>Scarica il foglio (PNG)</Button>
          <SectionTitle>2 · La foto</SectionTitle>
          {!source ? (
            <ImageDrop onFile={load} hint="Foto o scansione del foglio compilato" />
          ) : (
            <Panel className="space-y-3">
              <img src={source.url} alt="Foglio compilato" className="max-h-40 mx-auto" />
              <Row label="File" value={`${source.name} · ${source.width} × ${source.height} px`} />
              <Button size="sm" variant="danger" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={clear}>Rimuovi</Button>
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <SectionTitle>3 · Il font</SectionTitle>
          <Field label="Nome del font">
            <TextInput value={family} onChange={(e) => setFamily(e.target.value)} />
          </Field>
          <Field label="Prova di scrittura">
            <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Panel className="min-h-24 text-3xl leading-snug break-words" aria-label="Anteprima del font">
            {face ? <span style={{ fontFamily: `"${face}"` }}>{text || " "}</span> : <span className="text-sm">{source ? (problem ? "—" : "Creo il font…") : "L'anteprima compare dopo aver caricato la foto."}</span>}
          </Panel>
          {built && (
            <div className="space-y-1.5">
              <Row label="Caratteri trovati" value={`${built.found.length} su ${CHARS.length}`} />
              {built.missing.length > 0 && <Row label="Vuoti" value={built.missing.join(" ")} />}
            </div>
          )}
          <Button variant="primary" disabled={!built} icon={<Download className="w-3.5 h-3.5" />} onClick={saveFont}>Scarica il font (.ttf)</Button>
        </div>
      </div>

      {(problem || error) && <Notice tone="error">{problem ?? error}</Notice>}
      <Notice>
        Tutto avviene nel browser, nessun file viene inviato. Il contorno segue la penna ma resta approssimato: scrivi con tratto spesso e nero, su foglio ben illuminato. Le caselle vuote restano senza lettera.
      </Notice>
    </Stack>
  );
}
