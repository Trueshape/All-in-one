import { useEffect, useMemo, useRef, useState } from "react";
import { Music, Pause, Play, Trash2 } from "lucide-react";
import { Field, TextInput, Toggle, Chips, Segmented, Slider, Button, Notice, Stack, Row, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { AUDIO_FORMATS, encodeAudio } from "../lib/audioEncoders";
import type { AudioFormat } from "../lib/audioEncoders";
import { applyVolume, durationOf, formatTime, normalizeGain, sliceAudio, splitRanges, waveformPeaks } from "../lib/audioOps";
import type { Pcm } from "../lib/audioOps";
import { download, formatBytes } from "../lib/imageOps";

type Mode = "trim" | "split";
interface Loaded {
  pcm: Pcm;
  name: string;
  size: number;
}

const BINS = 480;

/** Loads one audio file, then trims or splits it, changes the volume and saves it as WAV, MP3, OGG or FLAC. Everything runs in the browser. */
export default function AudioEditor() {
  const u = useUi();
  const [file, setFile] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("trim");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [every, setEvery] = useState("30");
  const [volume, setVolume] = useState(100);
  const [normalize, setNormalize] = useState(false);
  const [fadeIn, setFadeIn] = useState("0");
  const [fadeOut, setFadeOut] = useState("0");
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<{ ctx: AudioContext; source: AudioBufferSourceNode } | null>(null);

  const duration = file ? durationOf(file.pcm) : 0;
  const peaks = useMemo(() => (file ? waveformPeaks(file.pcm, BINS) : []), [file]);
  const ranges = useMemo(() => (mode === "split" ? splitRanges(duration, Number(every.replace(",", "."))) : [{ start, end }]), [mode, duration, every, start, end]);

  const stop = () => {
    const current = player.current;
    player.current = null;
    if (current) {
      current.source.onended = null;
      try { current.source.stop(); } catch { /* already stopped */ }
      void current.ctx.close();
    }
    setPlaying(false);
  };
  useEffect(() => stop, []);

  const load = async (picked: File | undefined) => {
    if (!picked) return;
    stop();
    setError(null);
    setBusy("Lettura del file…");
    try {
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(await picked.arrayBuffer());
      void ctx.close();
      const pcm: Pcm = { sampleRate: decoded.sampleRate, channels: Array.from({ length: decoded.numberOfChannels }, (_, c) => decoded.getChannelData(c).slice()) };
      setFile({ pcm, name: picked.name.replace(/\.[^.]+$/, "") || "audio", size: picked.size });
      setStart(0);
      setEnd(decoded.duration);
    } catch {
      setFile(null);
      setError("Impossibile leggere il file: formato non supportato da questo browser.");
    }
    setBusy(null);
  };

  // Draws the waveform with the selected part highlighted.
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    if (!file) return;
    const mid = el.height / 2;
    const selected = (i: number) => {
      const t = ((i + 0.5) / BINS) * duration;
      return mode === "split" || (t >= start && t <= end);
    };
    peaks.forEach((p, i) => {
      ctx.fillStyle = selected(i) ? u.accentHex : "rgba(128,128,128,0.35)";
      const h = Math.max(1, p * (el.height - 4));
      ctx.fillRect((i / BINS) * el.width, mid - h / 2, Math.max(1, el.width / BINS - 1), h);
    });
  }, [file, peaks, start, end, mode, duration, u.accentHex]);

  const render = (range: { start: number; end: number }): Pcm => {
    const part = sliceAudio(file!.pcm, range.start, range.end);
    const gain = normalize ? normalizeGain(part) : volume / 100;
    return applyVolume(part, gain, Number(fadeIn.replace(",", ".")) || 0, Number(fadeOut.replace(",", ".")) || 0);
  };

  const preview = () => {
    if (playing) return stop();
    const range = ranges[0];
    if (!file || !range) return;
    const pcm = render(range);
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(pcm.channels.length, pcm.channels[0].length, pcm.sampleRate);
    pcm.channels.forEach((c, i) => buffer.copyToChannel(c as Float32Array<ArrayBuffer>, i));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = stop;
    player.current = { ctx, source };
    source.start();
    setPlaying(true);
  };

  const save = async (range: { start: number; end: number }, index: number) => {
    if (!file) return;
    setError(null);
    setBusy("Codifica in corso…");
    try {
      const blob = await encodeAudio(render(range), format);
      const suffix = mode === "split" ? `_parte${index + 1}` : "_modificato";
      download(blob, `${file.name}${suffix}.${format}`);
    } catch {
      setError("Codifica non riuscita: riprova con un altro formato.");
    }
    setBusy(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void load(e.dataTransfer.files?.[0]);
  };
  const changeStart = (v: number) => { setStart(v); if (v > end) setEnd(v); };
  const changeEnd = (v: number) => { setEnd(v); if (v < start) setStart(v); };
  const validRanges = ranges.filter((r) => r.end > r.start);

  return (
    <Stack>
      <input ref={input} type="file" accept="audio/*,.flac,.ogg,.mp3,.wav" className="hidden" onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 min-w-0">
          {!file ? (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cx("w-full h-44 flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-colors", u.divider, u.muted, dragging && u.accent, u.id === "sophisticated" && "rounded-2xl")}
            >
              <Music className="w-7 h-7" />
              <span className={cx("text-xs font-semibold", u.text)}>{busy ?? "Seleziona o trascina un file audio"}</span>
              <span className="text-[11px]">MP3, WAV, OGG, FLAC</span>
            </button>
          ) : (
            <>
              <canvas ref={canvas} width={960} height={140} className={cx("w-full h-28 border", u.divider)} />
              <div className="space-y-1">
                <Row label="File" value={file.name} />
                <Row label="Durata" value={`${formatTime(duration)} · ${file.pcm.sampleRate} Hz · ${file.pcm.channels.length === 1 ? "mono" : "stereo"} · ${formatBytes(file.size)}`} />
              </div>
            </>
          )}
          <Segmented fill value={mode} onChange={setMode} options={[{ value: "trim", label: "Ritaglia" }, { value: "split", label: "Dividi" }]} />
          {mode === "trim" ? (
            <div className="space-y-3">
              <Slider label="Inizio" value={start} min={0} max={duration} step={0.1} onChange={changeStart} display={formatTime(start)} />
              <Slider label="Fine" value={end} min={0} max={duration} step={0.1} onChange={changeEnd} display={formatTime(end)} />
            </div>
          ) : (
            <Field label="Parti da (secondi)"><TextInput className="w-32" type="number" inputMode="decimal" min={1} value={every} onChange={(e) => setEvery(e.target.value)} /></Field>
          )}
          {file && <Button size="sm" variant="danger" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => { stop(); setFile(null); setStart(0); setEnd(0); }}>Cambia file</Button>}
        </div>

        <div className="space-y-4 min-w-0">
          <Slider label="Volume" value={volume} min={0} max={300} step={5} onChange={setVolume} display={normalize ? "auto" : `${volume}%`} />
          <Toggle checked={normalize} onChange={setNormalize} label="Normalizza al massimo" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dissolvenza in entrata (s)"><TextInput type="number" inputMode="decimal" min={0} step="any" value={fadeIn} onChange={(e) => setFadeIn(e.target.value)} /></Field>
            <Field label="Dissolvenza in uscita (s)"><TextInput type="number" inputMode="decimal" min={0} step="any" value={fadeOut} onChange={(e) => setFadeOut(e.target.value)} /></Field>
          </div>
          <Field label="Formato"><Chips value={format} onChange={setFormat} options={AUDIO_FORMATS.map((f) => ({ value: f.value, label: f.label }))} /></Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={validRanges.length === 0} icon={playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} onClick={preview}>{playing ? "Stop" : "Ascolta"}</Button>
            {mode === "trim" && <Button variant="primary" disabled={!!busy || validRanges.length === 0} onClick={() => void save(ranges[0], 0)}>{AUDIO_FORMATS.find((f) => f.value === format)!.label}</Button>}
            {file && busy && <span className={cx("text-xs", u.muted)}>{busy}</span>}
          </div>
          {mode === "split" && (
            <div className={cx("max-h-40 overflow-auto border divide-y", u.divider)}>
              {validRanges.length === 0 && <p className={cx("p-3 text-xs", u.muted)}>{file ? "Inserisci la durata di ogni parte." : "Carica un file per vedere le parti."}</p>}
              {validRanges.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                  <span className={cx("font-mono", u.muted)}>Parte {i + 1} · {formatTime(r.start)}–{formatTime(r.end)}</span>
                  <Button size="sm" disabled={!!busy} onClick={() => void save(r, i)}>{AUDIO_FORMATS.find((f) => f.value === format)!.label}</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Notice>Il file resta sul tuo dispositivo. Volume sopra 100% può distorcere i picchi. Non tutti i browser leggono tutti i formati: se un file non si apre, convertilo prima in WAV o MP3.</Notice>
    </Stack>
  );
}
