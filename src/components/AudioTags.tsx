import { useRef, useState } from "react";
import { Music } from "lucide-react";
import { Button, Field, TextArea, TextInput, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { useUnsavedFlag } from "../ui/unsaved";
import { ALLOW, keepAllowed } from "../lib/inputGuards";
import { PdfDrop } from "../ui/PdfKit";
import { EMPTY_TAGS, detectFormat, readTags, writeTags } from "../lib/audioTags";
import type { Tags, TagFormat } from "../lib/audioTags";
import { download } from "../lib/imageOps";

interface Item {
  id: number;
  name: string;
  bytes: Uint8Array;
  format: TagFormat;
  tags: Tags;
  dirty: boolean;
}

const COLUMNS: Array<{ key: Exclude<keyof Tags, "lyrics">; label: string; width: string }> = [
  { key: "album", label: "Album", width: "w-40" },
  { key: "artist", label: "Artista", width: "w-40" },
  { key: "title", label: "Titolo", width: "w-48" },
  { key: "genre", label: "Genere", width: "w-28" },
  { key: "year", label: "Anno", width: "w-20" },
  { key: "track", label: "Traccia", width: "w-20" },
];
const BULK: Array<{ key: Exclude<keyof Tags, "lyrics" | "track" | "title">; label: string }> = [
  { key: "album", label: "Album" },
  { key: "artist", label: "Artista" },
  { key: "genre", label: "Genere" },
  { key: "year", label: "Anno" },
];

const outputName = (name: string) => name.replace(/(\.[^.]+)$/, "_metadati$1");
const mimeOf = (f: TagFormat) => (f === "mp3" ? "audio/mpeg" : f === "flac" ? "audio/flac" : "audio/wav");

export default function AudioTags() {
  const u = useUi();
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<number | null>(null);
  const [bulk, setBulk] = useState<Partial<Record<keyof Tags, string>>>({});
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ tone: "warn" | "success" | "error"; text: string } | null>(null);

  const multi = items.length > 1;
  const single = items.length === 1 ? items[0] : null;
  const current = items.find((it) => it.id === active) ?? single;
  const dirtyCount = items.filter((it) => it.dirty).length;
  useUnsavedFlag(dirtyCount > 0);

  const addFiles = async (picked: File[] | FileList | null | undefined) => {
    if (!picked || picked.length === 0) return;
    const added: Item[] = [];
    let skipped = 0;
    for (const f of Array.from(picked)) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const format = detectFormat(bytes);
      if (!format) {
        skipped++;
        continue;
      }
      added.push({ id: nextId.current++, name: f.name, bytes, format, tags: readTags(bytes, format), dirty: false });
    }
    setItems((prev) => [...prev, ...added]);
    if (added.length) setActive((a) => a ?? added[0].id);
    setMessage(skipped ? { tone: "warn", text: `${skipped} file saltati: formato non supportato (sono ammessi MP3, FLAC e WAV).` } : null);
  };

  const patch = (id: number, change: Partial<Tags>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, tags: { ...it.tags, ...change }, dirty: true } : it)));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((it) => it.id)));

  const applyBulk = () => {
    const change = Object.fromEntries(Object.entries(bulk).filter(([, v]) => v && v.trim())) as Partial<Tags>;
    if (Object.keys(change).length === 0) return;
    setItems((prev) => prev.map((it) => (selected.has(it.id) ? { ...it, tags: { ...it.tags, ...change }, dirty: true } : it)));
  };

  // numbers the selected files 1, 2, 3… in the order they are listed (the counter lives inside the update, which React may run twice)
  const numberTracks = () =>
    setItems((prev) => {
      let n = 0;
      return prev.map((it) => (selected.has(it.id) ? { ...it, tags: { ...it.tags, track: String(++n) }, dirty: true } : it));
    });

  const removeSelected = () => {
    setItems((prev) => prev.filter((it) => !selected.has(it.id)));
    if (active !== null && selected.has(active)) setActive(null);
    setSelected(new Set());
  };

  const saveChanges = () => {
    const targets = items.filter((it) => it.dirty);
    if (targets.length === 0) return;
    const outs = new Map(targets.map((it) => [it.id, writeTags(it.bytes, it.format, it.tags)]));
    // browsers may ask once to allow several downloads; they are spaced out so each one starts
    targets.forEach((it, i) => setTimeout(() => download(new Blob([outs.get(it.id)!], { type: mimeOf(it.format) }), outputName(it.name)), i * 400));
    setItems((prev) => prev.map((it) => (outs.has(it.id) ? { ...it, bytes: outs.get(it.id)!, dirty: false } : it)));
    setMessage({ tone: "success", text: `${targets.length} ${targets.length === 1 ? "file salvato" : "file salvati"} con i nuovi metadati.` });
  };

  const bulkCount = selected.size;

  return (
    <Stack>
      <input ref={input} type="file" multiple accept="audio/*,.mp3,.flac,.wav" className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => input.current?.click()}>{items.length ? "Aggiungi file" : "Scegli file"}</Button>
        <Button disabled={dirtyCount === 0} onClick={saveChanges}>Salva{dirtyCount ? ` (${dirtyCount})` : ""}</Button>
        {multi && <Button variant="ghost" disabled={bulkCount === 0} onClick={removeSelected}>Rimuovi selezionati</Button>}
        {items.length > 0 && <span className={`ml-auto text-xs ${u.muted}`}>{items.length} file{multi ? ` · ${bulkCount} selezionati` : ""}</span>}
      </div>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(e.dataTransfer.files); }}
        className={`border border-dashed p-4 transition-colors ${dragging ? u.accent : u.divider}`}
      >
        {items.length === 0 && (
          <PdfDrop
            multiple
            accept="audio/*,.mp3,.flac,.wav"
            icon={<Music className="w-7 h-7" />}
            label={"Seleziona o trascina uno o più file audio\nMP3, FLAC o WAV"}
            hint="Con un file solo lo modifichi da solo, con più file appare la tabella"
            onFiles={(files) => void addFiles(files)}
          />
        )}

        {single && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLUMNS.map((c) => (
              <Field key={c.key} label={c.label}>
                <TextInput value={single.tags[c.key]} allow={c.key === "year" ? ALLOW.digits : c.key === "track" ? ALLOW.trackNumber : undefined} maxLength={c.key === "year" ? 4 : c.key === "track" ? 7 : 200} onChange={(e) => patch(single.id, { [c.key]: e.target.value })} inputMode={c.key === "year" || c.key === "track" ? "numeric" : undefined} />
              </Field>
            ))}
            <div className="sm:col-span-2">
              <Field label="Testo della canzone" hint={single.format === "wav" ? "Nei file WAV il testo non viene salvato." : undefined}>
                <TextArea rows={7} value={single.tags.lyrics} onChange={(e) => patch(single.id, { lyrics: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        {multi && (
          <div className="space-y-4">
            <div className={`max-h-[40vh] overflow-auto border ${u.divider}`}>
              <table className="w-full text-xs">
                <thead className={`sticky top-0 ${u.muted}`}>
                  <tr className={`border-b ${u.divider}`}>
                    <th className="p-2 w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleziona tutti" /></th>
                    <th className="p-2 text-left font-medium min-w-56">Nome file</th>
                    {COLUMNS.map((c) => <th key={c.key} className="p-2 text-left font-medium">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className={`border-b ${u.divider} ${it.id === active ? "bg-white/5" : ""}`} onClick={() => setActive(it.id)}>
                      <td className="p-2"><input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} onClick={(e) => e.stopPropagation()} aria-label={`Seleziona ${it.name}`} /></td>
                      <td className="p-2 font-mono truncate max-w-72" title={it.name}>{it.dirty ? "● " : ""}{it.name}</td>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="p-1">
                          <input
                            value={it.tags[c.key]}
                            onFocus={() => setActive(it.id)}
                            onChange={(e) => patch(it.id, { [c.key]: c.key === "year" ? keepAllowed(e.target.value, ALLOW.digits, 4) : c.key === "track" ? keepAllowed(e.target.value, ALLOW.trackNumber, 7) : e.target.value })}
                            className={`${c.width} bg-transparent px-1.5 py-1 outline-none rounded focus:bg-white/10`}
                            aria-label={`${c.label} di ${it.name}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className={`text-xs ${u.subtle}`}>{bulkCount ? `Applica ai ${bulkCount} selezionati (i campi vuoti non cambiano)` : "Seleziona dei file per modificarli insieme"}</p>
                <div className="grid grid-cols-2 gap-3">
                  {BULK.map((b) => (
                    <Field key={b.key} label={b.label}>
                      <TextInput value={bulk[b.key] ?? ""} allow={b.key === "year" ? ALLOW.digits : undefined} maxLength={b.key === "year" ? 4 : 200} onChange={(e) => setBulk((s) => ({ ...s, [b.key]: e.target.value }))} disabled={bulkCount === 0} />
                    </Field>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button disabled={bulkCount === 0} onClick={applyBulk}>Applica</Button>
                  <Button disabled={bulkCount === 0} onClick={numberTracks}>Numera le tracce</Button>
                </div>
              </div>

              <div className="space-y-3">
                {current ? (
                  <Field label={`Testo di ${current.name}`} hint={current.format === "wav" ? "Nei file WAV il testo non viene salvato." : undefined}>
                    <TextArea rows={7} value={current.tags.lyrics} onChange={(e) => patch(current.id, { lyrics: e.target.value })} />
                  </Field>
                ) : (
                  <Notice tone="empty">Clicca un file per modificarne il testo.</Notice>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Stack>
  );
}
