import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileImage, Trash2, Undo2 } from "lucide-react";
import * as opentype from "opentype.js";
import { Field, TextInput, TextArea, Button, IconButton, Notice, Panel, Row, SectionTitle, Segmented, Slider, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { ImageDrop, useImageSource } from "../ui/ImageDrop";
import type { Source } from "../ui/ImageDrop";
import { download, toBlob } from "../lib/imageOps";
import { BASELINE, CELL, CHARS, COLS, FRAME, GROUPS, MARGIN, PAD, ROWS, UNITS, ASCENT, DESCENT, cellArea, cyclingGsub, glyphFromMask, inkBox, otsu, sheetSize } from "../lib/handwriting";
import type { Glyph, Stroke } from "../lib/handwriting";
import { ALLOW } from "../lib/inputGuards";

const MAX_SIDE = 3200;
const SAMPLE = "Nel mezzo del cammin di nostra vita 0123456789";
const STORAGE = "utilita365_handwriting";
/** Versions of one character that can be drawn: the normal one and four variants. */
const VARIANTS = [1, 2, 3, 4, 5];
/** Key of a drawing: the character for the normal version, `a#2` and `a#3` for the variants. */
const drawKey = (char: string, variant: number) => (variant === 1 ? char : `${char}#${variant}`);

/** A variant glyph and which turn it takes in the rotation (1 = first variant, 2 = second, ...). */
interface Alternate {
  char: string;
  slot: number;
  glyph: Glyph;
}

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

/** Reads the photographed sheet: finds the frame, cuts the cells and turns each one into a glyph. */
function glyphsFromSheet(source: Source): Glyph[] | string {
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
  return glyphs.length ? glyphs : "Non ho trovato nessuna lettera scritta nelle caselle.";
}

/** Draws pen strokes: a lone point is a dot, longer strokes are smoothed through the midpoints. */
function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], thickness: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(s[0].x, s[0].y, thickness / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(s[0].x, s[0].y);
    for (let i = 1; i < s.length - 1; i++) ctx.quadraticCurveTo(s[i].x, s[i].y, (s[i].x + s[i + 1].x) / 2, (s[i].y + s[i + 1].y) / 2);
    ctx.lineTo(s[s.length - 1].x, s[s.length - 1].y);
    ctx.stroke();
  }
}

function glyphFromStrokes(char: string, strokes: Stroke[], thickness: number): Glyph | null {
  const canvas = document.createElement("canvas");
  canvas.width = PAD.w;
  canvas.height = PAD.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !strokes.length) return null;
  paintStrokes(ctx, strokes, thickness, "#000");
  const px = ctx.getImageData(0, 0, PAD.w, PAD.h).data;
  const mask = new Uint8Array(PAD.w * PAD.h);
  for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  return glyphFromMask(char, mask, PAD.w, PAD.h);
}

interface FontFile {
  buffer: ArrayBuffer;
  found: string[];
}

function makeFont(glyphs: Glyph[], alternates: Alternate[], family: string): FontFile {
  const notdef = new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 500, path: new opentype.Path() });
  const space = new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 300, path: new opentype.Path() });
  const build = (g: Glyph, name: string, unicode?: number) => {
    const path = new opentype.Path();
    for (const r of g.rects) {
      // Clockwise in a y-up font, so overlapping rectangles never cancel out.
      path.moveTo(r.x, r.y);
      path.lineTo(r.x, r.y + r.h);
      path.lineTo(r.x + r.w, r.y + r.h);
      path.lineTo(r.x + r.w, r.y);
      path.close();
    }
    return new opentype.Glyph({ name, unicode, advanceWidth: g.advance, path });
  };
  const made = glyphs.map((g) => build(g, `u${g.char.codePointAt(0)}`, g.char.codePointAt(0)));
  // Variants follow the normal glyphs and have no character of their own: the calt table swaps them in.
  const extra = alternates.map((a) => build(a.glyph, `u${a.char.codePointAt(0)}.alt${a.slot}`));
  const font = new opentype.Font({ familyName: family, styleName: "Regular", unitsPerEm: UNITS, ascender: ASCENT, descender: -DESCENT, glyphs: [notdef, space, ...made, ...extra] });
  // Glyph ids: 0 notdef, 1 space, then the normal glyphs, then the variants.
  const baseId = new Map(glyphs.map((g, i) => [g.char, 2 + i]));
  const swaps = (slot: number) =>
    alternates.flatMap((a, i) => (a.slot === slot ? [{ base: baseId.get(a.char)!, alt: 2 + glyphs.length + i }] : []));
  const gsub = cyclingGsub([...baseId.values()], VARIANTS.slice(1).map((_, i) => swaps(i + 1)));
  if (gsub) (font.tables as Record<string, unknown>).gsub = gsub;
  return { buffer: font.toArrayBuffer(), found: glyphs.map((g) => g.char) };
}

interface Saved {
  drawn: Record<string, Stroke[]>;
  thickness: number;
  variance: boolean;
}

function readSaved(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (saved && typeof saved.drawn === "object" && saved.drawn) return { drawn: saved.drawn, thickness: Number(saved.thickness) || 16, variance: saved.variance === true };
  } catch {
    // nothing saved, or storage is blocked
  }
  return { drawn: {}, thickness: 16, variance: false };
}

/** One character's drawing area: guides, a faint model letter, and pointer drawing. */
function DrawPad({ char, strokes, thickness, onStroke }: { char: string; strokes: Stroke[]; thickness: number; onStroke: (stroke: Stroke) => void }) {
  const u = useUi();
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);

  const render = (extra?: Stroke | null) => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const { w, h } = PAD;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${Math.round(h * 0.77)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(128,128,128,0.16)";
    ctx.fillText(char, w / 2, h * PAD.baseline);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(128,128,128,0.45)";
    for (const f of [PAD.capLine, PAD.xLine]) {
      ctx.beginPath();
      ctx.moveTo(0, h * f);
      ctx.lineTo(w, h * f);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(99,102,241,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, h * PAD.baseline);
    ctx.lineTo(w, h * PAD.baseline);
    ctx.stroke();
    paintStrokes(ctx, extra ? [...strokes, extra] : strokes, thickness, "#e4e4e7");
  };
  useEffect(() => render(), [char, strokes, thickness]);

  const point = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: Math.round(((e.clientX - rect.left) / rect.width) * PAD.w), y: Math.round(((e.clientY - rect.top) / rect.height) * PAD.h) };
  };

  return (
    <canvas
      ref={canvas}
      width={PAD.w}
      height={PAD.h}
      aria-label={`Disegna il carattere ${char}`}
      className={cx("w-full max-w-[300px] mx-auto border cursor-crosshair bg-black/30", u.divider)}
      style={{ touchAction: "none", aspectRatio: `${PAD.w} / ${PAD.h}` }}
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // a pointer that is no longer active cannot be captured; drawing still works while it stays over the pad
        }
        live.current = [point(e)];
        render(live.current);
      }}
      onPointerMove={(e) => {
        if (!live.current) return;
        live.current.push(point(e));
        render(live.current);
      }}
      onPointerUp={() => {
        if (live.current) onStroke(live.current);
        live.current = null;
      }}
      onPointerCancel={() => {
        live.current = null;
        render();
      }}
    />
  );
}

type Mode = "draw" | "sheet";

export default function HandwritingFont() {
  const u = useUi();
  const { source, error, load, clear } = useImageSource(false);
  const [saved] = useState(readSaved);
  const [mode, setMode] = useState<Mode>("draw");
  const [family, setFamily] = useState("LaMiaScrittura");
  const [text, setText] = useState(SAMPLE);
  const [drawn, setDrawn] = useState(saved.drawn);
  const [thickness, setThickness] = useState(saved.thickness);
  const [variance, setVariance] = useState(saved.variance);
  const [variant, setVariant] = useState(1);
  const [group, setGroup] = useState(GROUPS[1].id);
  const [current, setCurrent] = useState("a");
  const [sheetGlyphs, setSheetGlyphs] = useState<Glyph[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [file, setFile] = useState<FontFile | null>(null);
  const [face, setFace] = useState<string | null>(null);
  const cache = useRef(new Map<string, { strokes: Stroke[]; thickness: number; glyph: Glyph | null }>());

  const cleanName = family.replace(/[^A-Za-z0-9]/g, "") || "LaMiaScrittura";
  const chars = GROUPS.find((g) => g.id === group)?.chars ?? [];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ drawn, thickness, variance }));
    } catch {
      // storage unavailable: the drawing still works for this visit
    }
  }, [drawn, thickness, variance]);

  // The photographed sheet is read once per image.
  useEffect(() => {
    setProblem(null);
    setSheetGlyphs([]);
    if (!source) return;
    const timer = window.setTimeout(() => {
      const result = glyphsFromSheet(source);
      if (typeof result === "string") setProblem(result);
      else setSheetGlyphs(result);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [source]);

  // Drawn glyphs win over the ones from the sheet; each is rebuilt only when its strokes or the pen change.
  // The variants (keys like `a#2`) only count with "Con varianza", and only for characters that have a normal glyph.
  const { glyphs, alternates } = useMemo(() => {
    const byChar = new Map(sheetGlyphs.map((g) => [g.char, g]));
    const variants = new Map<string, Array<{ variant: number; glyph: Glyph }>>();
    for (const [key, strokes] of Object.entries(drawn)) {
      if (!strokes.length) continue;
      const [char, v] = key.split("#");
      const number = v ? Number(v) : 1;
      if (number > 1 && !variance) continue;
      let hit = cache.current.get(key);
      if (!hit || hit.strokes !== strokes || hit.thickness !== thickness) {
        hit = { strokes, thickness, glyph: glyphFromStrokes(char, strokes, thickness) };
        cache.current.set(key, hit);
      }
      if (!hit.glyph) continue;
      if (number === 1) byChar.set(char, hit.glyph);
      else variants.set(char, [...(variants.get(char) ?? []), { variant: number, glyph: hit.glyph }]);
    }
    // A character that skips a variant simply uses the next one drawn in its place.
    const alternates: Alternate[] = [];
    for (const [char, list] of variants) {
      if (!byChar.has(char)) continue;
      list.sort((a, b) => a.variant - b.variant).slice(0, VARIANTS.length - 1).forEach((item, i) => alternates.push({ char, slot: i + 1, glyph: item.glyph }));
    }
    return { glyphs: [...byChar.values()], alternates };
  }, [sheetGlyphs, drawn, thickness, variance]);

  useEffect(() => {
    setFile(null);
    setFace(null);
    if (!glyphs.length) return;
    let cancelled = false;
    let loaded: FontFace | null = null;
    const timer = window.setTimeout(async () => {
      const made = makeFont(glyphs, alternates, cleanName);
      if (cancelled) return;
      const name = `hw-${Date.now()}`;
      loaded = new FontFace(name, made.buffer.slice(0));
      try {
        await loaded.load();
        document.fonts.add(loaded);
        if (!cancelled) setFace(name);
      } catch {
        // the font file is still downloadable even if this browser cannot preview it
      }
      if (!cancelled) setFile(made);
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (loaded) document.fonts.delete(loaded);
    };
  }, [glyphs, alternates, cleanName]);

  const key = drawKey(current, variance ? variant : 1);
  const strokes = drawn[key] ?? [];
  const setStrokes = (next: Stroke[]) => setDrawn((prev) => ({ ...prev, [key]: next }));
  const step = (delta: number) => {
    const i = chars.indexOf(current);
    setCurrent(chars[(i + delta + chars.length) % chars.length] ?? chars[0]);
  };
  const pickGroup = (id: string) => {
    setGroup(id);
    setCurrent(GROUPS.find((g) => g.id === id)?.chars[0] ?? "a");
  };
  const drawnCount = Object.entries(drawn).filter(([k, s]) => s.length && !k.includes("#")).length;
  const variantCount = variance ? alternates.length : 0;

  const saveSheet = async () => {
    const blob = await toBlob(drawSheet(), "image/png");
    if (blob) download(blob, "foglio-scrittura.png");
  };
  const saveFont = () => {
    if (file) download(new Blob([file.buffer], { type: "font/ttf" }), `${cleanName}.ttf`);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Segmented fill value={mode} onChange={setMode} options={[{ value: "draw", label: "Disegna online" }, { value: "sheet", label: "Foglio da stampare" }]} />
        <Segmented
          fill
          value={variance ? "variance" : "normal"}
          onChange={(v) => {
            setVariance(v === "variance");
            setVariant(1);
          }}
          options={[{ value: "normal", label: "Font normale" }, { value: "variance", label: "Con varianza" }]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mode === "draw" ? (
          <div className="space-y-3">
            <SectionTitle>1 · Disegna le lettere</SectionTitle>
            <p className="text-xs leading-relaxed">Appoggia la lettera sulla riga blu e porta le tonde fino alla riga tratteggiata. Quello che salti resta senza lettera.</p>
            <div className="flex items-center justify-between gap-2">
              <IconButton onClick={() => step(-1)} title="Carattere precedente"><ChevronLeft className="w-4 h-4" /></IconButton>
              <span className={cx("text-2xl font-bold", u.accent)}>{current}</span>
              <IconButton onClick={() => step(1)} title="Carattere successivo"><ChevronRight className="w-4 h-4" /></IconButton>
            </div>
            {variance && (
              <>
                <Segmented
                  fill
                  value={String(variant)}
                  onChange={(v) => setVariant(Number(v))}
                  options={VARIANTS.map((n) => ({ value: String(n), label: `${n}${drawn[drawKey(current, n)]?.length ? " ✓" : ""}` }))}
                />
                <p className="text-xs leading-relaxed">Scegli la variante (da 1 a 5) e disegna la stessa lettera in modi leggermente diversi: nel font le versioni si alternano a rotazione. Se un programma non supporta le alternative contestuali, usa sempre la variante 1.</p>
              </>
            )}
            <DrawPad char={current} strokes={strokes} thickness={thickness} onStroke={(stroke) => setDrawn((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), stroke] }))} />
            <div className="flex gap-2">
              <Button size="sm" disabled={!strokes.length} icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => setStrokes(strokes.slice(0, -1))}>Annulla</Button>
              <Button size="sm" variant="danger" disabled={!strokes.length} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setStrokes([])}>Svuota</Button>
              <Button size="sm" onClick={() => step(1)} className="ml-auto">Avanti</Button>
            </div>
            <Slider label="Spessore della penna" value={thickness} min={6} max={40} onChange={setThickness} display={`${thickness} px`} />
          </div>
        ) : (
          <div className="space-y-3">
            <SectionTitle>1 · Il foglio</SectionTitle>
            <p className="text-xs leading-relaxed">Scarica il foglio, stampalo e scrivi ogni carattere nella sua casella, appoggiandolo alla linea tratteggiata, con una penna nera.</p>
            <Button variant="primary" icon={<FileImage className="w-3.5 h-3.5" />} onClick={saveSheet}>PNG</Button>
            {variance && <p className="text-xs leading-relaxed">Il foglio dà la versione normale di ogni lettera. Le varianti si aggiungono da "Disegna online".</p>}
            <SectionTitle>2 · La foto</SectionTitle>
            {!source ? (
              <ImageDrop onFile={load} hint="Foto o scansione del foglio compilato" />
            ) : (
              <Panel className="space-y-3">
                <img src={source.url} alt="Foglio compilato" className="max-h-40 mx-auto" />
                <Row label="File" value={`${source.name} · ${source.width} × ${source.height} px`} />
                <IconButton onClick={clear} title="Rimuovi immagine"><Trash2 className="w-4 h-4" /></IconButton>
              </Panel>
            )}
          </div>
        )}

        <div className="space-y-3">
          {mode === "draw" && (
            <div className="space-y-3">
              <SectionTitle>Caratteri</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button key={g.id} type="button" onClick={() => pickGroup(g.id)} className={group === g.id ? u.segmentActive : u.segment}>{g.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {chars.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrent(c)}
              className={cx("w-8 h-8 text-sm border", u.divider, current === c ? u.accent + " font-bold" : drawn[c]?.length ? u.text : u.muted)}
              aria-label={`Carattere ${c}${drawn[c]?.length ? " (disegnato)" : ""}`}
            >
              {c}
              {drawn[c]?.length ? <span className="sr-only"> ✓</span> : null}
            </button>
          ))}
        </div>
        <p className={cx("text-xs", u.muted)}>{drawnCount} caratteri disegnati{variance ? ` · ${variantCount} varianti` : ""} · il lavoro resta salvato in questo browser</p>
            </div>
          )}
          <SectionTitle>{mode === "draw" ? "2" : "3"} · Il font</SectionTitle>
          <Field label="Nome del font">
            <TextInput value={family} allow={ALLOW.fontName} maxLength={40} onChange={(e) => setFamily(e.target.value)} />
          </Field>
          <Field label="Prova di scrittura">
            <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Panel className="min-h-24 text-3xl leading-snug break-words" aria-label="Anteprima del font">
            {face ? <span style={{ fontFamily: `"${face}"` }}>{text || " "}</span> : <span className="text-sm">{glyphs.length ? "Creo il font…" : "L'anteprima compare dopo aver disegnato le prime lettere."}</span>}
          </Panel>
          {file && (
            <div className="space-y-1.5">
              <Row label="Caratteri nel font" value={`${file.found.length}`} />
              {variantCount > 0 && <Row label="Varianti nel font" value={`${variantCount}`} />}
              {mode === "sheet" && sheetGlyphs.length > 0 && <Row label="Dal foglio" value={`${sheetGlyphs.length} su ${CHARS.length}`} />}
            </div>
          )}
          <Button variant="primary" disabled={!file} icon={<Download className="w-3.5 h-3.5" />} onClick={saveFont}>TTF</Button>
        </div>
      </div>

      {(problem || error) && mode === "sheet" && <Notice tone="error">{problem ?? error}</Notice>}
      <Notice>
        Tutto avviene nel browser, nessun file viene inviato. Puoi mescolare le due modalità: le lettere disegnate online sostituiscono quelle lette dal foglio. Il contorno segue la penna ma resta approssimato. Con la varianza il font alterna le versioni a rotazione (funzione OpenType "alternative contestuali"): non è casuale, ma due lettere uguali vicine escono diverse. Funziona nei browser e nei programmi che la supportano.
      </Notice>
    </Stack>
  );
}
