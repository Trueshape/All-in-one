import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { PDFCheckBox, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField, degrees } from "pdf-lib";
import { Button, Chips, DatePicker, Field, IconButton, Notice, Segmented, Select, Slider, TextArea, TextInput, Toggle, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { FONTS, FONT_OPTIONS, PageStage, PdfFileBar, ResultPreview, SinglePdf, drawError, editPdf, embedImage, pdfColor, pdfPoint, readImage, savePdf, startDrag, usePageSize, usePdf, useSaver } from "../ui/PdfKit";
import type { FontKey, PdfFile, PickedImage } from "../ui/PdfKit";
import { markAnchors, parsePageList } from "../lib/pdfPages";

const STAGE = 360;

/** Colour square with its hex code, like the other tools. */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const u = useUi();
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label={label} />
        <span className={`font-mono text-xs ${u.subtle}`}>{value.toUpperCase()}</span>
      </div>
    </Field>
  );
}

/** A button that opens the file picker for one image. */
function ImageButton({ onImage, children }: { onImage: (image: PickedImage) => void; children: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button icon={<ImagePlus />} onClick={() => input.current?.click()}>{children}</Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            setError(null);
            onImage(await readImage(file));
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      />
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}

/** Pages typed by the user, or all pages when the field is empty. */
function pagesOf(text: string, count: number): number[] {
  if (!text.trim()) return Array.from({ length: count }, (_, i) => i);
  const list = parsePageList(text, count);
  if (typeof list === "string") throw new Error(list);
  return list;
}

/* ---------------- Filigrana ---------------- */

export function PdfWatermark() {
  const state = usePdf();
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState("RISERVATO");
  const [font, setFont] = useState<FontKey>("helvetica");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#dc2626");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [scale, setScale] = useState(40);
  const [opacity, setOpacity] = useState(25);
  const [angle, setAngle] = useState(45);
  const [layout, setLayout] = useState<"center" | "tile">("center");
  const [pages, setPages] = useState("");
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState<Uint8Array | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const saver = useSaver();

  const build = async (pdf: PdfFile) => {
    const doc = await editPdf(pdf.bytes);
    const targets = pagesOf(pages, pdf.pages);
    const fontObj = await doc.embedFont(FONTS[font].bold);
    const img = kind === "image" && image ? await embedImage(doc, image) : null;
    for (const i of targets) {
      const p = doc.getPage(i);
      const box = p.getCropBox();
      const rotation = p.getRotation().angle;
      // the angle is the one seen on screen: the page's own rotation is added on top
      const turn = angle + rotation;
      const seenWidth = rotation % 180 ? box.height : box.width;
      const w = img ? (seenWidth * scale) / 100 : fontObj.widthOfTextAtSize(text, size);
      const h = img ? (w * image!.height) / image!.width : size * 0.7;
      for (const at of markAnchors(box, w, h, turn, layout)) {
        if (img) p.drawImage(img, { x: at.x, y: at.y, width: w, height: h, opacity: opacity / 100, rotate: degrees(turn) });
        else p.drawText(text, { x: at.x, y: at.y, size, font: fontObj, color: pdfColor(color), opacity: opacity / 100, rotate: degrees(turn) });
      }
    }
    return doc.save();
  };

  // The preview is the real result, rebuilt shortly after each change.
  const pdf = state.pdf;
  useEffect(() => {
    if (!pdf || (kind === "image" && !image) || (kind === "text" && !text.trim())) return setPreview(null);
    const timer = setTimeout(() => {
      build(pdf).then((bytes) => {
        setPreview(bytes);
        setProblem(null);
      }, (e) => setProblem(drawError(e)));
    }, 400);
    return () => clearTimeout(timer);
  }, [pdf, kind, text, font, size, color, image, scale, opacity, angle, layout, pages]);

  const ready = kind === "text" ? !!text.trim() : !!image;
  return (
    <SinglePdf state={{ ...state, clear: () => { state.clear(); setPage(0); } }} info="L'anteprima è il risultato vero. L'angolo si misura come vedi la pagina. Senza pagine indicate, la filigrana va su tutte.">
      {(pdf) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 min-w-0">
            <PdfFileBar pdf={pdf} onClear={() => { state.clear(); setPage(0); }} />
            <Segmented fill value={kind} onChange={setKind} options={[{ value: "text", label: "Testo" }, { value: "image", label: "Immagine" }]} />
            {kind === "text" ? (
              <>
                <Field label="Testo"><TextInput value={text} onChange={(e) => setText(e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Font"><Chips value={font} onChange={setFont} options={FONT_OPTIONS} /></Field>
                  <ColorField label="Colore" value={color} onChange={setColor} />
                </div>
                <Slider label="Dimensione" value={size} min={12} max={200} onChange={setSize} display={`${size} pt`} />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <ImageButton onImage={setImage}>{image ? "Cambia immagine" : "Scegli immagine"}</ImageButton>
                  {image && <img src={image.url} alt="" className="h-10 max-w-24 object-contain" />}
                </div>
                <Slider label="Larghezza" value={scale} min={5} max={100} onChange={setScale} display={`${scale}% della pagina`} />
              </>
            )}
            <Slider label="Opacità" value={opacity} min={5} max={100} onChange={setOpacity} display={`${opacity}%`} />
            <Slider label="Angolo" value={angle} min={-90} max={90} step={5} onChange={setAngle} display={`${angle}°`} />
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Posizione"><Segmented fill value={layout} onChange={setLayout} options={[{ value: "center", label: "Al centro" }, { value: "tile", label: "Ripetuta" }]} /></Field>
              <Field label="Pagine"><TextInput value={pages} placeholder="Tutte (es. 1-3, 5)" onChange={(e) => setPages(e.target.value)} /></Field>
            </div>
            {(problem || saver.error) && <Notice tone="error">{problem ?? saver.error}</Notice>}
            <Button variant="primary" disabled={!ready || saver.busy} onClick={() => void saver.run(async () => savePdf(await build(pdf), `${pdf.name}_filigrana.pdf`))}>Salva</Button>
          </div>
          <PageStage pdf={pdf} page={page} onPage={setPage} width={300}>
            {preview && (
              <div className="absolute inset-0">
                <ResultPreview bytes={preview} page={page} width={300} />
              </div>
            )}
          </PageStage>
        </div>
      )}
    </SinglePdf>
  );
}

/* ---------------- Proprietà ---------------- */

interface Props {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  created: string;
  modified: string;
}
const EMPTY: Props = { title: "", author: "", subject: "", keywords: "", creator: "", producer: "", created: "", modified: "" };
const isoDay = (d?: Date) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
/** Keeps the hour of the original date when only the day changes. */
const withDay = (day: string, original?: Date) => {
  const [y, m, d] = day.split("-").map(Number);
  const out = original ? new Date(original) : new Date(y, m - 1, d, 12);
  out.setFullYear(y, m - 1, d);
  return out;
};

export function PdfProperties() {
  const state = usePdf();
  const [props, setProps] = useState<Props>(EMPTY);
  const [dates, setDates] = useState<{ created?: Date; modified?: Date }>({});
  const [touchToday, setTouchToday] = useState(true);
  const saver = useSaver();
  const pdf = state.pdf;

  useEffect(() => {
    setProps(EMPTY);
    if (!pdf) return;
    editPdf(pdf.bytes, true).then((doc) => {
      const created = doc.getCreationDate();
      const modified = doc.getModificationDate();
      setDates({ created, modified });
      setProps({
        title: doc.getTitle() ?? "",
        author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "",
        keywords: doc.getKeywords() ?? "",
        creator: doc.getCreator() ?? "",
        producer: doc.getProducer() ?? "",
        created: isoDay(created),
        modified: isoDay(modified),
      });
    }, (e) => saver.setError((e as Error).message));
  }, [pdf]);

  const set = (key: keyof Props) => (value: string) => setProps((p) => ({ ...p, [key]: value }));
  const save = (pdf: PdfFile) =>
    saver.run(async () => {
      const doc = await editPdf(pdf.bytes, true);
      doc.setTitle(props.title);
      doc.setAuthor(props.author);
      doc.setSubject(props.subject);
      doc.setKeywords(props.keywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean));
      doc.setCreator(props.creator);
      doc.setProducer(props.producer);
      if (props.created) doc.setCreationDate(withDay(props.created, dates.created));
      if (touchToday) doc.setModificationDate(new Date());
      else if (props.modified) doc.setModificationDate(withDay(props.modified, dates.modified));
      savePdf(await doc.save(), `${pdf.name}_modificato.pdf`);
    });

  const text = (key: keyof Props, label: string, hint?: string) => (
    <Field label={label} hint={hint}><TextInput value={props[key]} onChange={(e) => set(key)(e.target.value)} /></Field>
  );
  return (
    <SinglePdf state={state} info="Le proprietà sono i dati che i lettori PDF mostrano in Proprietà del documento. Il contenuto delle pagine non cambia.">
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={state.clear} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {text("title", "Titolo")}
            {text("author", "Autore")}
            {text("subject", "Oggetto")}
            {text("keywords", "Parole chiave", "Separate da virgola.")}
            {text("creator", "Programma di origine")}
            {text("producer", "Produttore PDF")}
            <Field label="Data di creazione"><DatePicker value={props.created} onChange={set("created")} /></Field>
            <div className="space-y-2">
              <Field label="Data di modifica">{touchToday ? <TextInput value="Oggi, al salvataggio" disabled /> : <DatePicker value={props.modified} onChange={set("modified")} />}</Field>
              <Toggle checked={touchToday} onChange={setTouchToday} label="Usa la data di oggi" />
            </div>
          </div>
          {saver.error && <Notice tone="error">{saver.error}</Notice>}
          <Button variant="primary" disabled={saver.busy} onClick={() => void save(pdf)}>Salva</Button>
        </>
      )}
    </SinglePdf>
  );
}

/* ---------------- Aggiungi testo ---------------- */

interface TextItem {
  id: number;
  page: number;
  fx: number;
  fy: number;
  text: string;
  size: number;
  color: string;
  font: FontKey;
  bold: boolean;
}

/** Writes text items on their pages: the item's top-left corner is where it was placed on screen. */
async function drawTexts(pdf: PdfFile, items: TextItem[]) {
  const doc = await editPdf(pdf.bytes);
  const fonts = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
  for (const item of items) {
    if (!item.text.trim()) continue;
    const key = FONTS[item.font][item.bold ? "bold" : "regular"];
    if (!fonts.has(key)) fonts.set(key, await doc.embedFont(key));
    const pt = await pdfPoint(pdf.doc, item.page);
    // on screen the first line's baseline sits about one font size below the top of the box
    const [x, y] = pt.at(item.fx, item.fy + item.size / pt.height);
    doc.getPage(item.page).drawText(item.text, { x, y, size: item.size, font: fonts.get(key), color: pdfColor(item.color), lineHeight: item.size * 1.2, rotate: degrees(pt.rotate) });
  }
  return doc.save();
}

export function PdfAddText() {
  const u = useUi();
  const state = usePdf();
  const [items, setItems] = useState<TextItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const saver = useSaver();
  const size = usePageSize(state.pdf?.doc, page);
  const zoom = size ? STAGE / size.width : 1;

  const current = items.find((i) => i.id === selected);
  const shownText = current ?? { text: "", size: 14, color: "#000000", font: "helvetica" as FontKey, bold: false };
  const update = (patch: Partial<TextItem>) => setItems((list) => list.map((i) => (i.id === selected ? { ...i, ...patch } : i)));
  const reset = () => {
    state.clear();
    setItems([]);
    setSelected(null);
    setPage(0);
  };
  const add = (fx: number, fy: number) => {
    const last = current ?? items[items.length - 1];
    const item: TextItem = { id: Date.now(), page, fx, fy, text: "Testo", size: last?.size ?? 14, color: last?.color ?? "#000000", font: last?.font ?? "helvetica", bold: last?.bold ?? false };
    setItems((list) => [...list, item]);
    setSelected(item.id);
  };

  return (
    <SinglePdf state={{ ...state, clear: reset }} info="Clicca sulla pagina per aggiungere un testo, trascinalo per spostarlo. Usa i font standard dei PDF: lettere latine, numeri e punteggiatura comune.">
      {(pdf) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageStage pdf={pdf} page={page} onPage={setPage} width={STAGE} onPick={add} stageRef={stage}>
            {items.filter((i) => i.page === page).map((item) => (
              <div
                key={item.id}
                onPointerDown={(e) => {
                  setSelected(item.id);
                  startDrag(e, stage.current, item, (fx, fy) => setItems((list) => list.map((i) => (i.id === item.id ? { ...i, fx, fy } : i))));
                }}
                className={cx("absolute whitespace-pre cursor-move", item.id === selected && "outline outline-1 outline-offset-2")}
                style={{ left: `${item.fx * 100}%`, top: `${item.fy * 100}%`, fontFamily: FONTS[item.font].css, fontWeight: item.bold ? 700 : 400, fontSize: item.size * zoom, lineHeight: 1.2, color: item.color, outlineColor: u.accentHex }}
              >
                {item.text || " "}
              </div>
            ))}
          </PageStage>
          <div className="space-y-4 min-w-0">
            <PdfFileBar pdf={pdf} onClear={reset} />
            {/* The controls are always shown, dimmed until a text is selected, so the panel does not jump */}
            <div className={cx("space-y-4", !current && "opacity-40")} inert={!current}>
              <Field label="Testo" actions={<Button size="sm" variant="danger" disabled={!current} icon={<Trash2 />} onClick={() => { setItems(items.filter((i) => i.id !== selected)); setSelected(null); }}>Elimina</Button>}>
                <TextArea rows={3} value={shownText.text} onChange={(e) => update({ text: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Font"><Chips value={shownText.font} onChange={(font) => update({ font })} options={FONT_OPTIONS} /></Field>
                <ColorField label="Colore" value={shownText.color} onChange={(color) => update({ color })} />
              </div>
              <Slider label="Dimensione" value={shownText.size} min={6} max={96} onChange={(s) => update({ size: s })} display={`${shownText.size} pt`} />
              <Toggle checked={shownText.bold} onChange={(bold) => update({ bold })} label="Grassetto" />
            </div>
            {!current && <Notice tone="empty">Clicca sulla pagina nel punto dove vuoi scrivere.</Notice>}
            {items.length > 0 && (
              <div className={cx("max-h-40 overflow-auto border divide-y", u.divider)}>
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setSelected(item.id); setPage(item.page); }} className={cx("w-full text-left px-3 py-1.5 text-xs truncate cursor-pointer", item.id === selected ? u.accent : u.subtle)}>
                    Pagina {item.page + 1} · {item.text || "(vuoto)"}
                  </button>
                ))}
              </div>
            )}
            {saver.error && <Notice tone="error">{saver.error}</Notice>}
            <Button variant="primary" disabled={!items.some((i) => i.text.trim()) || saver.busy} onClick={() => void saver.run(async () => savePdf(await drawTexts(pdf, items), `${pdf.name}_testo.pdf`))}>Salva</Button>
          </div>
        </div>
      )}
    </SinglePdf>
  );
}

/* ---------------- Aggiungi immagini ---------------- */

interface ImageItem {
  id: number;
  page: number;
  fx: number;
  fy: number;
  /** Width as a fraction of the page width. */
  fw: number;
  opacity: number;
  image: PickedImage;
}

export function PdfAddImage() {
  const u = useUi();
  const state = usePdf();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const saver = useSaver();
  const size = usePageSize(state.pdf?.doc, page);

  const current = items.find((i) => i.id === selected);
  const update = (patch: Partial<ImageItem>) => setItems((list) => list.map((i) => (i.id === selected ? { ...i, ...patch } : i)));
  const reset = () => {
    state.clear();
    setItems([]);
    setSelected(null);
    setPage(0);
  };
  const add = (image: PickedImage) => {
    const item: ImageItem = { id: Date.now(), page, fx: 0.35, fy: 0.35, fw: 0.3, opacity: 100, image };
    setItems((list) => [...list, item]);
    setSelected(item.id);
  };

  const save = (pdf: PdfFile) =>
    saver.run(async () => {
      const doc = await editPdf(pdf.bytes);
      const embedded = new Map<PickedImage, Awaited<ReturnType<typeof embedImage>>>();
      for (const item of items) {
        if (!embedded.has(item.image)) embedded.set(item.image, await embedImage(doc, item.image));
        const pt = await pdfPoint(pdf.doc, item.page);
        const width = item.fw * pt.width;
        const height = (width * item.image.height) / item.image.width;
        // the image is anchored at its bottom-left corner as seen on screen
        const [x, y] = pt.at(item.fx, item.fy + height / pt.height);
        doc.getPage(item.page).drawImage(embedded.get(item.image)!, { x, y, width, height, opacity: item.opacity / 100, rotate: degrees(pt.rotate) });
      }
      savePdf(await doc.save(), `${pdf.name}_immagini.pdf`);
    });

  return (
    <SinglePdf state={{ ...state, clear: reset }} info="Aggiungi un'immagine e trascinala dove vuoi. PNG e JPG entrano così come sono, gli altri formati come PNG.">
      {(pdf) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageStage pdf={pdf} page={page} onPage={setPage} width={320} stageRef={stage}>
            {items.filter((i) => i.page === page).map((item) => (
              <img
                key={item.id}
                src={item.image.url}
                alt=""
                draggable={false}
                onPointerDown={(e) => {
                  setSelected(item.id);
                  startDrag(e, stage.current, item, (fx, fy) => setItems((list) => list.map((i) => (i.id === item.id ? { ...i, fx, fy } : i))));
                }}
                className={cx("absolute cursor-move", item.id === selected && "outline outline-2 outline-offset-1")}
                style={{ left: `${item.fx * 100}%`, top: `${item.fy * 100}%`, width: `${item.fw * 100}%`, opacity: item.opacity / 100, outlineColor: u.accentHex }}
              />
            ))}
          </PageStage>
          <div className="space-y-4 min-w-0">
            <PdfFileBar pdf={pdf} onClear={reset} />
            <ImageButton onImage={add}>Aggiungi immagine</ImageButton>
            {/* The controls are always shown, dimmed until an image is selected, so the panel does not jump */}
            <div className={cx("space-y-4", !current && "opacity-40")} inert={!current}>
              <Slider label="Larghezza" value={Math.round((current?.fw ?? 0.3) * 100)} min={2} max={100} onChange={(v) => update({ fw: v / 100 })} display={size ? `${Math.round(((current?.fw ?? 0.3) * size.width * 25.4) / 72)} mm` : `${Math.round((current?.fw ?? 0.3) * 100)}%`} />
              <Slider label="Opacità" value={current?.opacity ?? 100} min={5} max={100} onChange={(opacity) => update({ opacity })} display={`${current?.opacity ?? 100}%`} />
              <Button size="sm" variant="danger" disabled={!current} icon={<Trash2 />} onClick={() => { setItems(items.filter((i) => i.id !== selected)); setSelected(null); }}>Elimina</Button>
            </div>
            {!current && items.length === 0 && <Notice tone="empty">Scegli un'immagine: compare sulla pagina, poi la sposti.</Notice>}
            {items.length > 0 && (
              <div className={cx("max-h-40 overflow-auto border divide-y", u.divider)}>
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setSelected(item.id); setPage(item.page); }} className={cx("w-full text-left px-3 py-1.5 text-xs truncate cursor-pointer", item.id === selected ? u.accent : u.subtle)}>
                    Pagina {item.page + 1} · {item.image.name}
                  </button>
                ))}
              </div>
            )}
            {saver.error && <Notice tone="error">{saver.error}</Notice>}
            <Button variant="primary" disabled={!items.length || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
          </div>
        </div>
      )}
    </SinglePdf>
  );
}

/* ---------------- Moduli ---------------- */

type FieldInfo =
  | { name: string; type: "text"; multiline: boolean }
  | { name: string; type: "check" }
  | { name: string; type: "choice"; options: string[] }
  | { name: string; type: "other" };

interface NewField {
  id: number;
  page: number;
  fx: number;
  fy: number;
  fw: number;
  fh: number;
  kind: "text" | "check";
  name: string;
}

export function PdfForms() {
  const u = useUi();
  const state = usePdf();
  const [mode, setMode] = useState<"fill" | "add">("fill");
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [flatten, setFlatten] = useState(false);
  const [added, setAdded] = useState<NewField[]>([]);
  const [kind, setKind] = useState<"text" | "check">("text");
  const [page, setPage] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const saver = useSaver();
  const pdf = state.pdf;
  const size = usePageSize(pdf?.doc, page);

  useEffect(() => {
    setFields([]);
    setValues({});
    setAdded([]);
    if (!pdf) return;
    editPdf(pdf.bytes).then((doc) => {
      const form = doc.getForm();
      const info: FieldInfo[] = [];
      const start: Record<string, string | boolean> = {};
      for (const f of form.getFields()) {
        const name = f.getName();
        if (f instanceof PDFTextField) {
          info.push({ name, type: "text", multiline: f.isMultiline() });
          start[name] = f.getText() ?? "";
        } else if (f instanceof PDFCheckBox) {
          info.push({ name, type: "check" });
          start[name] = f.isChecked();
        } else if (f instanceof PDFRadioGroup) {
          info.push({ name, type: "choice", options: f.getOptions() });
          start[name] = f.getSelected() ?? "";
        } else if (f instanceof PDFDropdown || f instanceof PDFOptionList) {
          info.push({ name, type: "choice", options: f.getOptions() });
          start[name] = f.getSelected()[0] ?? "";
        } else info.push({ name, type: "other" });
      }
      setFields(info);
      setValues(start);
    }, (e) => saver.setError((e as Error).message));
  }, [pdf]);

  const reset = () => {
    state.clear();
    setPage(0);
  };
  const place = (fx: number, fy: number) => {
    const w = size ? size.width : 595;
    const h = size ? size.height : 842;
    const field: NewField =
      kind === "text"
        ? { id: Date.now(), page, fx, fy, fw: 180 / w, fh: 22 / h, kind, name: `campo${added.length + 1}` }
        : { id: Date.now(), page, fx, fy, fw: 14 / w, fh: 14 / h, kind, name: `casella${added.length + 1}` };
    setAdded((list) => [...list, field]);
  };

  const save = (pdf: PdfFile) =>
    saver.run(async () => {
      if (added.some((n) => !n.name.trim())) throw new Error("Ogni campo nuovo ha bisogno di un nome.");
      const names = [...fields.map((f) => f.name), ...added.map((f) => f.name.trim())];
      const twice = names.find((n, i) => names.indexOf(n) !== i);
      if (twice !== undefined) throw new Error(`Il nome "${twice}" è usato due volte: ogni campo ne vuole uno suo.`);
      const doc = await editPdf(pdf.bytes);
      const form = doc.getForm();
      for (const info of fields) {
        const value = values[info.name];
        const f = form.getField(info.name);
        if (f instanceof PDFTextField) f.setText(String(value ?? ""));
        else if (f instanceof PDFCheckBox) (value ? f.check() : f.uncheck());
        else if (f instanceof PDFRadioGroup || f instanceof PDFDropdown || f instanceof PDFOptionList) {
          if (value) f.select(String(value));
        }
      }
      for (const n of added) {
        const pt = await pdfPoint(pdf.doc, n.page);
        const [x1, y1] = pt.at(n.fx, n.fy + n.fh);
        const [x2, y2] = pt.at(n.fx + n.fw, n.fy);
        const rect = { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
        const target = doc.getPage(n.page);
        if (n.kind === "text") form.createTextField(n.name.trim()).addToPage(target, rect);
        else form.createCheckBox(n.name.trim()).addToPage(target, rect);
      }
      if (flatten) form.flatten();
      savePdf(await doc.save(), `${pdf.name}_modulo.pdf`);
    });

  const editable = fields.filter((f) => f.type !== "other");
  return (
    <SinglePdf state={{ ...state, clear: reset }} info="Compila i campi di un modulo PDF, oppure aggiungine di nuovi cliccando sulla pagina. Con «Rendi non modificabile» i valori diventano parte della pagina.">
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={reset} />
          <Segmented fill value={mode} onChange={setMode} options={[{ value: "fill", label: `Compila (${editable.length})` }, { value: "add", label: `Aggiungi campi (${added.length})` }]} />
          {mode === "fill" ? (
            editable.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[560px] overflow-auto p-1">
                {editable.map((f) => (
                  <Field key={f.name} label={f.name}>
                    {f.type === "text" ? (
                      f.multiline ? <TextArea rows={3} value={String(values[f.name] ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} /> : <TextInput value={String(values[f.name] ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                    ) : f.type === "check" ? (
                      <Toggle checked={!!values[f.name]} onChange={(v) => setValues({ ...values, [f.name]: v })} label="Spuntata" />
                    ) : f.type === "choice" ? (
                      <Select value={String(values[f.name] ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                        <option value="">—</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </Select>
                    ) : null}
                  </Field>
                ))}
              </div>
            ) : (
              <Notice tone="empty">Questo PDF non ha campi da compilare: puoi aggiungerli da «Aggiungi campi».</Notice>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PageStage pdf={pdf} page={page} onPage={setPage} width={STAGE} onPick={place} stageRef={stage}>
                {added.filter((n) => n.page === page).map((n) => (
                  <div
                    key={n.id}
                    onPointerDown={(e) => startDrag(e, stage.current, n, (fx, fy) => setAdded((list) => list.map((i) => (i.id === n.id ? { ...i, fx, fy } : i))))}
                    className="absolute border-2 cursor-move"
                    style={{ left: `${n.fx * 100}%`, top: `${n.fy * 100}%`, width: `${n.fw * 100}%`, height: `${n.fh * 100}%`, borderColor: u.accentHex, background: `${u.accentHex}22` }}
                    title={n.name}
                  />
                ))}
              </PageStage>
              <div className="space-y-4 min-w-0">
                <Field label="Tipo di campo da aggiungere"><Segmented fill value={kind} onChange={setKind} options={[{ value: "text", label: "Testo" }, { value: "check", label: "Casella" }]} /></Field>
                {added.length ? (
                  <div className={cx("max-h-[360px] overflow-auto border divide-y", u.divider)}>
                    {added.map((n) => (
                      <div key={n.id} className="flex items-center gap-2 px-3 py-1.5">
                        <span className={cx("text-[11px] font-mono w-28 shrink-0", u.muted)}>{n.kind === "text" ? "Testo" : "Casella"} · pag. {n.page + 1}</span>
                        <TextInput value={n.name} aria-label="Nome del campo" onChange={(e) => setAdded(added.map((i) => (i.id === n.id ? { ...i, name: e.target.value } : i)))} />
                        <IconButton onClick={() => setAdded(added.filter((i) => i.id !== n.id))} title="Elimina campo"><Trash2 /></IconButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Notice tone="empty">Clicca sulla pagina dove vuoi il campo, poi trascinalo per sistemarlo.</Notice>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Toggle checked={flatten} onChange={setFlatten} label="Rendi non modificabile" />
            <Button variant="primary" className="ml-auto" disabled={(!editable.length && !added.length) || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
          </div>
          {saver.error && <Notice tone="error">{saver.error}</Notice>}
        </>
      )}
    </SinglePdf>
  );
}
