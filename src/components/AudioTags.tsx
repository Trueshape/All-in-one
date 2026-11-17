import { useRef, useState } from "react";
import { Field, TextInput, TextArea, Button, Notice, Stack } from "../ui/kit";
import { EMPTY_TAGS, detectFormat, readTags, writeTags } from "../lib/audioTags";
import type { Tags, TagFormat } from "../lib/audioTags";
import { download } from "../lib/imageOps";

interface Loaded {
  name: string;
  bytes: Uint8Array;
  format: TagFormat;
}

const FIELDS: Array<{ key: Exclude<keyof Tags, "lyrics">; label: string; numeric?: boolean; maxLength?: number }> = [
  { key: "title", label: "Nome canzone" },
  { key: "artist", label: "Artista" },
  { key: "album", label: "Album" },
  { key: "genre", label: "Genere" },
  { key: "year", label: "Anno", numeric: true, maxLength: 4 },
  { key: "track", label: "Numero traccia", numeric: true },
];

export default function AudioTags() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Loaded | null>(null);
  const [tags, setTags] = useState<Tags>(EMPTY_TAGS);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = async (picked: File | undefined) => {
    if (!picked) return;
    setError(null);
    setSaved(null);
    const bytes = new Uint8Array(await picked.arrayBuffer());
    const format = detectFormat(bytes);
    if (!format) {
      setFile(null);
      setError("Formato non supportato: sono ammessi MP3, FLAC e WAV.");
      return;
    }
    setFile({ name: picked.name.replace(/\.[^.]+$/, "") || "audio", bytes, format });
    setTags(readTags(bytes, format));
  };

  const update = (key: keyof Tags, value: string) => setTags((t) => ({ ...t, [key]: value }));

  const save = () => {
    if (!file) return;
    const out = writeTags(file.bytes, file.format, tags);
    const mime = file.format === "mp3" ? "audio/mpeg" : file.format === "flac" ? "audio/flac" : "audio/wav";
    download(new Blob([out], { type: mime }), `${file.name}_metadati.${file.format}`);
    setSaved(file.format === "wav" ? "File salvato. Nei WAV il testo della canzone non viene salvato." : "File salvato con i nuovi metadati.");
  };

  return (
    <Stack>
      <input ref={input} type="file" accept="audio/*,.mp3,.flac,.wav" className="hidden" onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => input.current?.click()}>Scegli file audio</Button>
        {file && <span className="text-sm">{file.name} · {file.format.toUpperCase()}</span>}
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {file ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <TextInput value={tags[f.key]} onChange={(e) => update(f.key, e.target.value)} inputMode={f.numeric ? "numeric" : undefined} maxLength={f.maxLength} />
              </Field>
            ))}
          </div>
          <Field label="Testo della canzone" hint={file.format === "wav" ? "Nei file WAV il testo non viene salvato." : undefined}>
            <TextArea rows={8} value={tags.lyrics} onChange={(e) => update("lyrics", e.target.value)} />
          </Field>
          <Button variant="primary" onClick={save}>Salva file</Button>
          {saved && <Notice tone="success">{saved}</Notice>}
        </>
      ) : (
        <Notice tone="empty">Carica un file MP3, FLAC o WAV per modificarne i metadati. Il file resta sul tuo dispositivo.</Notice>
      )}
    </Stack>
  );
}
