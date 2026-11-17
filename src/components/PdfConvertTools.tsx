import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Trash2 } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { Button, Chips, CopyButton, Field, IconButton, Notice, Segmented, Slider, Stack, TextArea, TextInput, Toggle, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { ImageDrop } from "../ui/ImageDrop";
import { FONTS, FONT_OPTIONS, PageStage, PdfFileBar, SinglePdf, editPdf, embedImage, pdfColor, pdfPoint, pdfjs, readImage, savePdf, usePageSize, usePdf, useSaver } from "../ui/PdfKit";
import type { FontKey, PdfFile, PickedImage } from "../ui/PdfKit";
import { download, toBlob } from "../lib/imageOps";
import { groupText, inkBounds, inkColour, mmToPt, moveItem, parsePageList, piecesToLines, ringBackground } from "../lib/pdfPages";
import type { RawText, TextBox } from "../lib/pdfPages";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pages typed by the user, or all pages when the field is empty. */
function pagesOf(text: string, count: number): number[] {
  if (!text.trim()) return Array.from({ length: count }, (_, i) => i);
  const list = parsePageList(text, count);
  if (typeof list === "string") throw new Error(list);
  return list;
}

/** Downloads several files one after the other: browsers drop downloads started too close together. */
async function downloadAll(files: Array<{ blob: Blob; name: string }>) {
  for (const [i, file] of files.entries()) {
    download(file.blob, file.name);
    if (i < files.length - 1) await wait(300);
  }
}

/** Text of every page as lines, top to bottom. */
async function readText(pdf: PdfFile, pages: number[]): Promise<string[][]> {
  const out: string[][] = [];
  for (const i of pages) {
    const page = await pdf.doc.getPage(i + 1);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pieces = content.items.flatMap((item) => {
      if (!("str" in item)) return [];
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      // read in the page as shown: y grows downward there, the sorting wants it upward
      return [{ str: item.str, x, y: viewport.height - y, height: Math.abs(item.height) || 10 }];
    });
    out.push(piecesToLines(pieces));
  }
  return out;
}

/* ---------------- Converti ---------------- */

type ConvertMode = "images" | "pdf" | "text";
type ImageFormat = "png" | "jpeg";

interface ListedImage extends PickedImage {
  id: number;
}

export function PdfConvert() {
  const u = useUi();
  const state = usePdf();
  const [mode, setMode] = useState<ConvertMode>("images");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [dpi, setDpi] = useState(150);
  const [pages, setPages] = useState("");
  const [images, setImages] = useState<ListedImage[]>([]);
  const [sheet, setSheet] = useState<"image" | "a4" | "letter">("image");
  const [fit, setFit] = useState(true);
  const [text, setText] = useState("");
  const [split, setSplit] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const saver = useSaver();
  const pdf = state.pdf;

  useEffect(() => {
    setText("");
    setProblem(null);
  }, [pdf, mode, pages, split]);

  const reset = () => {
    state.clear();
    setText("");
  };

  const toImages = (p: PdfFile) =>
    saver.run(async () => {
      const targets = pagesOf(pages, p.pages);
      const files: Array<{ blob: Blob; name: string }> = [];
      for (const i of targets) {
        const page = await p.doc.getPage(i + 1);
        const viewport = page.getViewport({ scale: dpi / 72 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        if (canvas.width * canvas.height > 50_000_000) throw new Error("La pagina è troppo grande a questa risoluzione: abbassa i DPI.");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Il browser non permette di disegnare le pagine.");
        // JPEG has no transparency: the paper is white
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, viewport }).promise;
        const blob = await toBlob(canvas, format === "png" ? "image/png" : "image/jpeg", 0.92);
        if (!blob) throw new Error("Impossibile creare l'immagine.");
        files.push({ blob, name: `${p.name}_pagina${i + 1}.${format === "png" ? "png" : "jpg"}` });
      }
      await downloadAll(files);
    });

  const addImages = async (files: File[]) => {
    setProblem(null);
    const added: ListedImage[] = [];
    const skipped: string[] = [];
    for (const file of files) {
      try {
        added.push({ ...(await readImage(file)), id: Date.now() + Math.random() });
      } catch {
        skipped.push(file.name);
      }
    }
    setImages((prev) => [...prev, ...added]);
    if (skipped.length) setProblem(`Non riesco a leggere: ${skipped.join(", ")}.`);
  };

  const toPdf = () =>
    saver.run(async () => {
      const doc = await PDFDocument.create();
      const size = sheet === "a4" ? ([mmToPt(210), mmToPt(297)] as const) : sheet === "letter" ? ([612, 792] as const) : null;
      for (const image of images) {
        const embedded = await embedImage(doc, image);
        if (!size) {
          doc.addPage([image.width, image.height]).drawImage(embedded, { x: 0, y: 0, width: image.width, height: image.height });
          continue;
        }
        // the sheet turns to follow the picture, then the picture is fitted inside a 10 mm margin
        const landscape = image.width > image.height;
        const [pw, ph] = landscape ? [size[1], size[0]] : [size[0], size[1]];
        const page = doc.addPage([pw, ph]);
        const margin = fit ? mmToPt(10) : 0;
        const scale = Math.min((pw - margin * 2) / image.width, (ph - margin * 2) / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      savePdf(await doc.save(), `${images[0].name}${images.length > 1 ? "_e_altre" : ""}.pdf`);
    });

  const extract = async (p: PdfFile) => {
    setProblem(null);
    try {
      const targets = pagesOf(pages, p.pages);
      const all = await readText(p, targets);
      const body = all.map((lines, k) => (split ? `--- Pagina ${targets[k] + 1} ---\n` : "") + lines.join("\n")).join("\n\n");
      setText(body);
      if (!body.replace(/-+ Pagina \d+ -+/g, "").trim()) setProblem("Non trovo testo: il PDF potrebbe essere una scansione (immagini di pagine).");
    } catch (e) {
      setProblem((e as Error).message);
    }
  };

  const pageField = (
    <Field label="Pagine" hint="Lascia vuoto per tutte, oppure scrivi per esempio 1-3, 5.">
      <TextInput value={pages} placeholder="Tutte" onChange={(e) => setPages(e.target.value)} />
    </Field>
  );

  return (
    <Stack>
      <Segmented fill value={mode} onChange={setMode} options={[{ value: "images", label: "PDF in immagini" }, { value: "pdf", label: "Immagini in PDF" }, { value: "text", label: "PDF in testo" }]} />

      {mode === "pdf" ? (
        <>
          <ImageDrop onFiles={(files) => void addImages(files)} hint="PNG, JPG, WEBP, GIF, BMP, AVIF: nell'ordine dell'elenco" />
          {images.length > 0 && (
            <div className={cx("max-h-[360px] overflow-auto border divide-y", u.divider)}>
              {images.map((image, i) => (
                <div key={image.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                  <img src={image.url} alt="" className="h-9 w-12 object-contain shrink-0" />
                  <span className={cx("flex-1 min-w-0 truncate", u.text)}>{image.name}</span>
                  <span className={cx("font-mono", u.muted)}>{image.width} × {image.height}</span>
                  <IconButton disabled={i === 0} onClick={() => setImages(moveItem(images, i, i - 1))} title="Sposta su"><ArrowUp /></IconButton>
                  <IconButton disabled={i === images.length - 1} onClick={() => setImages(moveItem(images, i, i + 1))} title="Sposta giù"><ArrowDown /></IconButton>
                  <IconButton onClick={() => setImages(images.filter((x) => x.id !== image.id))} title="Togli dall'elenco"><Trash2 /></IconButton>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Field label="Pagina"><Segmented fill value={sheet} onChange={setSheet} options={[{ value: "image", label: "Come l'immagine" }, { value: "a4", label: "A4" }, { value: "letter", label: "Letter" }]} /></Field>
            {sheet !== "image" && <Toggle checked={fit} onChange={setFit} label="Margine di 10 mm" />}
          </div>
          {(problem || saver.error) && <Notice tone="error">{problem ?? saver.error}</Notice>}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled={!images.length || saver.busy} onClick={() => void toPdf()}>PDF</Button>
            {images.length > 0 && <Button size="sm" variant="danger" icon={<Trash2 />} className="ml-auto" onClick={() => setImages([])}>Svuota</Button>}
          </div>
          <Notice>Ogni immagine diventa una pagina. PNG e JPG entrano senza perdere qualità, gli altri formati vengono ridisegnati come PNG.</Notice>
        </>
      ) : (
        <SinglePdf
          state={{ ...state, clear: reset }}
          info={mode === "images" ? "Ogni pagina diventa un'immagine. Più DPI vuol dire più nitidezza e file più grandi: 150 va bene per lo schermo, 300 per stampare." : "Il testo viene letto dal PDF, riga per riga. Se il PDF è una scansione non c'è testo da leggere."}
        >
          {(p) => (
            <>
              <PdfFileBar pdf={p} onClear={reset} />
              {mode === "images" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 min-w-0">
                    <Field label="Formato"><Chips value={format} onChange={setFormat} options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPG" }]} /></Field>
                    <Slider label="Risoluzione" value={dpi} min={72} max={300} step={6} onChange={setDpi} display={`${dpi} DPI`} />
                  </div>
                  <div className="space-y-4 min-w-0">
                    {pageField}
                    {saver.error && <Notice tone="error">{saver.error}</Notice>}
                    <Button variant="primary" disabled={saver.busy} onClick={() => void toImages(p)}>{format === "png" ? "PNG" : "JPG"}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    {pageField}
                    <Toggle checked={split} onChange={setSplit} label="Intestazione per ogni pagina" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" onClick={() => void extract(p)}>Leggi il testo</Button>
                    <Button disabled={!text} icon={<Download />} onClick={() => download(new Blob([text], { type: "text/plain;charset=utf-8" }), `${p.name}.txt`)}>TXT</Button>
                  </div>
                  {problem && <Notice tone="warn">{problem}</Notice>}
                  <Field label="Testo" actions={<CopyButton text={text} />}>
                    <TextArea rows={14} readOnly value={text} placeholder="Premi «Leggi il testo»" />
                  </Field>
                </>
              )}
            </>
          )}
        </SinglePdf>
      )}
    </Stack>
  );
}

/* ---------------- Estrai immagini ---------------- */

interface Found {
  id: string;
  page: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  url: string;
}

/** Turns what pdf.js decoded for one image into a canvas, whichever shape it came in. */
function toCanvas(img: { bitmap?: ImageBitmap; data?: Uint8ClampedArray; width: number; height: number; kind?: number }): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || !img.width || !img.height) return null;
  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
    return canvas;
  }
  if (!img.data) return null;
  const out = ctx.createImageData(img.width, img.height);
  const n = img.width * img.height;
  if (img.kind === 3 || img.data.length === n * 4) out.data.set(img.data.subarray(0, n * 4));
  else if (img.kind === 2 || img.data.length === n * 3) for (let i = 0; i < n; i++) out.data.set([img.data[i * 3], img.data[i * 3 + 1], img.data[i * 3 + 2], 255], i * 4);
  else if (img.data.length === n) for (let i = 0; i < n; i++) out.data.set([img.data[i], img.data[i], img.data[i], 255], i * 4);
  else return null;
  ctx.putImageData(out, 0, 0);
  return canvas;
}

const MIN_SIDE = 16;

export function PdfExtractImages() {
  const u = useUi();
  const state = usePdf();
  const [found, setFound] = useState<Found[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ImageFormat>("png");
  const [scanning, setScanning] = useState(false);
  const [skipSmall, setSkipSmall] = useState(true);
  const saver = useSaver();
  const pdf = state.pdf;

  useEffect(() => {
    setFound([]);
    setChosen(new Set());
    if (!pdf) return;
    let cancelled = false;
    const urls: string[] = [];
    setScanning(true);
    void (async () => {
      const list: Found[] = [];
      const seen = new Set<string>();
      for (let n = 1; n <= pdf.pages && !cancelled; n++) {
        const page = await pdf.doc.getPage(n);
        const ops = await page.getOperatorList();
        for (let i = 0; i < ops.fnArray.length; i++) {
          if (ops.fnArray[i] !== pdfjs.OPS.paintImageXObject) continue;
          const name = ops.argsArray[i][0] as string;
          // the same picture drawn on many pages (a logo) is listed once
          if (seen.has(name)) continue;
          seen.add(name);
          const img = await new Promise<any>((resolve) => {
            const store = name.startsWith("g_") ? page.commonObjs : page.objs;
            store.get(name, resolve);
          });
          const canvas = img && toCanvas(img);
          if (!canvas) continue;
          const blob = await toBlob(canvas, "image/png");
          if (!blob || cancelled) continue;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          list.push({ id: `${n}-${name}`, page: n, width: canvas.width, height: canvas.height, canvas, url });
        }
      }
      if (!cancelled) {
        setFound(list);
        setScanning(false);
      }
    })().catch(() => setScanning(false));
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pdf]);

  const shown = found.filter((f) => !skipSmall || (f.width >= MIN_SIDE * 2 && f.height >= MIN_SIDE * 2));
  const toggle = (id: string) => setChosen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const picked = shown.filter((f) => chosen.has(f.id));

  const save = (p: PdfFile, list: Found[]) =>
    saver.run(async () => {
      const files: Array<{ blob: Blob; name: string }> = [];
      for (const f of list) {
        const flat = document.createElement("canvas");
        flat.width = f.width;
        flat.height = f.height;
        const ctx = flat.getContext("2d");
        if (format === "jpeg" && ctx) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, f.width, f.height);
        }
        ctx?.drawImage(f.canvas, 0, 0);
        const blob = await toBlob(flat, format === "png" ? "image/png" : "image/jpeg", 0.92);
        if (blob) files.push({ blob, name: `${p.name}_immagine${found.indexOf(f) + 1}.${format === "png" ? "png" : "jpg"}` });
      }
      await downloadAll(files);
    });

  return (
    <SinglePdf state={{ ...state, clear: state.clear }} info="Cerca le immagini incorporate nelle pagine (foto, loghi, scansioni). Il disegno vettoriale e il testo non sono immagini e non vengono estratti. Un'immagine usata su più pagine compare una volta sola.">
      {(p) => (
        <>
          <PdfFileBar pdf={p} onClear={state.clear} />
          <div className="flex flex-wrap items-center gap-4">
            <Field label="Formato"><Chips value={format} onChange={setFormat} options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPG" }]} /></Field>
            <Toggle checked={skipSmall} onChange={setSkipSmall} label="Salta le immagini minuscole" />
            <span className={cx("text-xs", u.muted)}>{scanning ? "Cerco le immagini…" : `${shown.length} immagini trovate`}</span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" disabled={!shown.length} onClick={() => setChosen(new Set(shown.map((f) => f.id)))}>Tutte</Button>
              <Button size="sm" disabled={!chosen.size} onClick={() => setChosen(new Set())}>Nessuna</Button>
              <Button variant="primary" disabled={!picked.length || saver.busy} onClick={() => void save(p, picked)}>{format === "png" ? "PNG" : "JPG"}{picked.length ? ` (${picked.length})` : ""}</Button>
            </div>
          </div>
          {saver.error && <Notice tone="error">{saver.error}</Notice>}
          {!scanning && !shown.length && <Notice tone="empty">Questo PDF non ha immagini incorporate{found.length && skipSmall ? " (a parte quelle minuscole)" : ""}.</Notice>}
          <div className="grid gap-3 max-h-[560px] overflow-auto p-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {shown.map((f) => (
              <button key={f.id} type="button" onClick={() => toggle(f.id)} aria-pressed={chosen.has(f.id)} className={cx("flex flex-col items-center gap-2 p-2 border rounded-lg cursor-pointer", u.divider, chosen.has(f.id) && "ring-2")} style={chosen.has(f.id) ? { boxShadow: `0 0 0 2px ${u.accentHex}` } : undefined}>
                <span className="h-28 w-full flex items-center justify-center bg-[repeating-conic-gradient(#80808022_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
                  <img src={f.url} alt={`Immagine della pagina ${f.page}`} className="max-h-28 max-w-full object-contain" />
                </span>
                <span className={cx("text-[11px] font-mono", u.muted)}>Pag. {f.page} · {f.width} × {f.height}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </SinglePdf>
  );
}

/* ---------------- Modifica testo ---------------- */

interface EditBox extends TextBox {
  id: number;
  page: number;
  /** The text as typed; the box counts as edited when it differs from `text`. */
  value: string;
  /** Colour of the page around the line and of the line itself, read from the rendered page. */
  bg: string;
  ink: string;
  /** The rectangle that hides the old text: the ink plus 1 pt, in the page as shown (pt from its top-left corner). */
  hide: { x: number; y: number; w: number; h: number };
}

const STAGE = 500;

/** Pixels of a page drawn at `scale`, to read colours from; null when the browser does not draw it in time. */
async function pagePixels(pdf: PdfFile, page: number, scale: number): Promise<ImageData | null> {
  try {
    const p = await pdf.doc.getPage(page + 1);
    const viewport = p.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const task = p.render({ canvas, viewport });
    // a page that is not being painted (hidden window) never finishes drawing: the colours then fall back to paper and black
    const done = await Promise.race([task.promise.then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000))]);
    if (!done) {
      task.cancel();
      return null;
    }
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }
}

/** Reads the text of one page as boxes in the page as shown, with the colours around and inside each. */
async function readBoxes(pdf: PdfFile, page: number): Promise<Array<TextBox & { bg: string; ink: string; hide: EditBox["hide"] }>> {
  const p = await pdf.doc.getPage(page + 1);
  const content = await p.getTextContent();
  const viewport = p.getViewport({ scale: 1 });
  const pieces: RawText[] = content.items.flatMap((item) => {
    if (!("str" in item)) return [];
    const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    const size = Math.hypot(item.transform[2], item.transform[3]) || Math.abs(item.height) || 10;
    const style = content.styles[item.fontName];
    return [{ str: item.str, x, y, width: item.width, size, family: style?.fontFamily }];
  });
  const boxes = groupText(pieces);
  const SCALE = 2;
  const pixels = boxes.length ? await pagePixels(pdf, page, SCALE) : null;
  const MARGIN = 1;
  return boxes.map((b) => {
    // Without pixels the rectangle follows the font's own height: cap height above the baseline, descenders below.
    const metrics = { x: b.x - MARGIN, y: b.y - b.size * 0.75 - MARGIN, w: b.width + MARGIN * 2, h: b.size * 0.95 + MARGIN * 2 };
    if (!pixels) return { ...b, bg: "#ffffff", ink: "#000000", hide: metrics };
    // the band the letters of this line can be in, in pixels of the sampled page: from just above the capitals to just below the descenders
    const band = { x: b.x * SCALE, y: (b.y - b.size * 0.8) * SCALE, w: b.width * SCALE, h: b.size * 1.02 * SCALE };
    const bg = ringBackground(pixels.data, pixels.width, pixels.height, band, 3);
    const ink = inkColour(pixels.data, pixels.width, pixels.height, band, bg);
    const bounds = inkBounds(pixels.data, pixels.width, pixels.height, band, bg);
    // the ink box plus 1 pt each side, never wider than the line's own advance
    const hide = bounds
      ? { x: bounds.x0 / SCALE - MARGIN, y: bounds.y0 / SCALE - MARGIN, w: (bounds.x1 - bounds.x0) / SCALE + MARGIN * 2, h: (bounds.y1 - bounds.y0) / SCALE + MARGIN * 2 }
      : metrics;
    return { ...b, bg, ink, hide };
  });
}

const autoFont = (family?: string): FontKey => (family && /serif(?!.*sans)/i.test(family) && !/sans/i.test(family) ? "times" : family && /mono|courier/i.test(family) ? "courier" : "helvetica");

export function PdfEditText() {
  const u = useUi();
  const state = usePdf();
  const [page, setPage] = useState(0);
  const [boxes, setBoxes] = useState<EditBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [fontChoice, setFontChoice] = useState<FontKey | "auto">("auto");
  const [color, setColor] = useState("#000000");
  const [cover, setCover] = useState("#ffffff");
  // "auto" takes the colours from the page itself, line by line
  const [colorAuto, setColorAuto] = useState(true);
  const [coverAuto, setCoverAuto] = useState(true);
  const [focused, setFocused] = useState<number | null>(null);
  const read = useRef(new Set<number>());
  const saver = useSaver();
  const pdf = state.pdf;
  const size = usePageSize(pdf?.doc, page);
  const zoom = size ? STAGE / size.width : 1;

  // A page's text is read once, the first time it is shown; edits stay when moving between pages.
  useEffect(() => {
    if (!pdf || read.current.has(page)) return;
    read.current.add(page);
    setLoading(true);
    readBoxes(pdf, page).then((list) => {
      setBoxes((prev) => [...prev, ...list.map((b, i) => ({ ...b, id: page * 10000 + i, page, value: b.text }))]);
      setLoading(false);
    }, () => setLoading(false));
  }, [pdf, page]);

  const reset = () => {
    state.clear();
    setBoxes([]);
    read.current = new Set();
    setPage(0);
  };

  const edited = boxes.filter((b) => b.value !== b.text);
  const fontOf = (family?: string) => FONTS[fontChoice === "auto" ? autoFont(family) : fontChoice];
  const coverOf = (b: EditBox) => (coverAuto ? b.bg : cover);
  const inkOf = (b: EditBox) => (colorAuto ? b.ink : color);

  const save = (p: PdfFile) =>
    saver.run(async () => {
      const doc = await editPdf(p.bytes);
      const fonts = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
      for (const box of edited) {
        const pt = await pdfPoint(p.doc, box.page);
        const key = fontOf(box.family).regular;
        if (!fonts.has(key)) fonts.set(key, await doc.embedFont(key));
        const target = doc.getPage(box.page);
        // hide the old text with a rectangle that hugs it: 1 pt around the letters, so borders next to it stay visible
        const [x1, y1] = pt.at(box.hide.x / pt.width, box.hide.y / pt.height);
        const [x2, y2] = pt.at((box.hide.x + box.hide.w) / pt.width, (box.hide.y + box.hide.h) / pt.height);
        target.drawRectangle({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), color: pdfColor(coverOf(box)) });
        if (box.value.trim()) {
          const [x, y] = pt.at(box.x / pt.width, box.y / pt.height);
          target.drawText(box.value, { x, y, size: box.size, font: fonts.get(key), color: pdfColor(inkOf(box)), rotate: degrees(pt.rotate) });
        }
      }
      savePdf(await doc.save(), `${p.name}_modificato.pdf`);
    });

  return (
    <SinglePdf
      state={{ ...state, clear: reset }}
      info="Clicca su una riga della pagina e correggila. Il vecchio testo viene coperto da un rettangolo, non cancellato: nel file resta sotto e si può ancora selezionare, quindi non serve per nascondere dati riservati. Il nuovo testo usa i font standard dei PDF, non quello originale."
    >
      {(p) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageStage pdf={p} page={page} onPage={setPage} width={STAGE}>
            {boxes.filter((b) => b.page === page).map((b) => {
              const changed = b.value !== b.text;
              const shown = changed || focused === b.id;
              return (
                <Fragment key={b.id}>
                {shown && <div className="absolute pointer-events-none" style={{ left: b.hide.x * zoom, top: b.hide.y * zoom, width: b.hide.w * zoom, height: b.hide.h * zoom, background: coverOf(b) }} />}
                <input
                  value={b.value}
                  onChange={(e) => setBoxes((list) => list.map((x) => (x.id === b.id ? { ...x, value: e.target.value } : x)))}
                  aria-label={`Testo: ${b.text}`}
                  spellCheck={false}
                  onFocus={() => setFocused(b.id)}
                  onBlur={() => setFocused((id) => (id === b.id ? null : id))}
                  className="absolute m-0 p-0 outline-none border border-dashed border-transparent hover:border-current focus:border-solid"
                  style={{
                    left: b.x * zoom - 1,
                    top: (b.y - b.size * 0.95) * zoom,
                    width: Math.max(b.width, b.value.length * b.size * 0.5) * zoom + 4,
                    height: b.size * 1.3 * zoom,
                    fontSize: b.size * zoom,
                    lineHeight: `${b.size * 1.3 * zoom}px`,
                    fontFamily: fontOf(b.family).css,
                    // untouched lines show the page itself; edited ones, and the one being typed, show how they will come out
                    color: shown ? inkOf(b) : "transparent",
                    caretColor: inkOf(b),
                  }}
                />
                </Fragment>
              );
            })}
          </PageStage>
          <div className="space-y-4 min-w-0">
            <PdfFileBar pdf={p} onClear={reset} />
            <Field label="Font del testo nuovo">
              <Chips value={fontChoice} onChange={setFontChoice} options={[{ value: "auto", label: "Come l'originale" }, ...FONT_OPTIONS]} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Colore del testo nuovo">
                <div className="space-y-2">
                  <Chips value={colorAuto ? "auto" : "own"} onChange={(v) => setColorAuto(v === "auto")} options={[{ value: "auto", label: "Come l'originale" }, { value: "own", label: "Scelto" }]} />
                  {!colorAuto && (
                    <div className="flex items-center gap-2">
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore del testo nuovo" />
                      <span className={`font-mono text-xs ${u.subtle}`}>{color.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Sfondo che copre il vecchio testo">
                <div className="space-y-2">
                  <Chips value={coverAuto ? "auto" : "own"} onChange={(v) => setCoverAuto(v === "auto")} options={[{ value: "auto", label: "Come la pagina" }, { value: "own", label: "Scelto" }]} />
                  {!coverAuto && (
                    <div className="flex items-center gap-2">
                      <input type="color" value={cover} onChange={(e) => setCover(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore dello sfondo" />
                      <span className={`font-mono text-xs ${u.subtle}`}>{cover.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={cx("text-xs", u.muted)}>{loading ? "Leggo il testo…" : edited.length === 1 ? "1 riga modificata" : `${edited.length} righe modificate`}</span>
              {edited.length > 0 && <Button size="sm" onClick={() => setBoxes((list) => list.map((b) => ({ ...b, value: b.text })))}>Annulla tutto</Button>}
            </div>
            {/* The same lines as a list: easier for small print, and it keeps the two columns about as tall */}
            {boxes.some((b) => b.page === page) && (
              <Field label={`Righe della pagina ${page + 1}`}>
                <div className={cx("h-[400px] overflow-auto space-y-1.5 p-2 border", u.divider)}>
                  {boxes.filter((b) => b.page === page).map((b) => (
                    <TextInput key={b.id} value={b.value} aria-label={`Riga: ${b.text}`} className={b.value !== b.text ? u.accent : undefined} onChange={(e) => setBoxes((list) => list.map((x) => (x.id === b.id ? { ...x, value: e.target.value } : x)))} />
                  ))}
                </div>
              </Field>
            )}
            {!loading && boxes.every((b) => b.page !== page) && <Notice tone="warn">In questa pagina non trovo testo: potrebbe essere una scansione.</Notice>}
            {saver.error && <Notice tone="error">{saver.error}</Notice>}
            <Button variant="primary" disabled={!edited.length || saver.busy} onClick={() => void save(p)}>PDF</Button>
          </div>
        </div>
      )}
    </SinglePdf>
  );
}
