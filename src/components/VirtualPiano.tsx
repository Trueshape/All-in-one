import { useEffect, useMemo, useRef, useState } from "react";
import { Field, Chips, Slider, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { KEYBOARD, noteFrequency, pianoKeys } from "../lib/piano";

type Wave = OscillatorType;
const OCTAVES = 3;

/** A playable piano: click or touch the keys, or type on the computer keyboard. Sound comes from simple oscillators. */
export default function VirtualPiano() {
  const u = useUi();
  const [octave, setOctave] = useState(3);
  const [wave, setWave] = useState<Wave>("triangle");
  const [volume, setVolume] = useState(60);
  const [active, setActive] = useState<Set<number>>(new Set());
  const keys = useMemo(() => pianoKeys(octave, OCTAVES), [octave]);
  const whiteCount = keys.filter((k) => !k.black).length;

  const ctx = useRef<AudioContext | null>(null);
  const voices = useRef(new Map<number, { osc: OscillatorNode; gain: GainNode }>());
  const settings = useRef({ wave, volume });
  settings.current = { wave, volume };

  const start = (midi: number) => {
    if (voices.current.has(midi)) return;
    ctx.current ??= new AudioContext();
    const audio = ctx.current;
    if (audio.state === "suspended") void audio.resume();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = settings.current.wave;
    osc.frequency.value = noteFrequency(midi);
    const level = (settings.current.volume / 100) * 0.4;
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(level, audio.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(Math.max(level * 0.5, 0.0001), audio.currentTime + 0.8);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    voices.current.set(midi, { osc, gain });
    setActive((s) => new Set(s).add(midi));
  };
  const stop = (midi: number) => {
    const voice = voices.current.get(midi);
    if (!voice || !ctx.current) return;
    voices.current.delete(midi);
    const now = ctx.current.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    voice.osc.stop(now + 0.25);
    setActive((s) => { const next = new Set(s); next.delete(midi); return next; });
  };

  // Computer keyboard: the first keys of the piano, starting from its lowest C.
  useEffect(() => {
    const midiFor = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return null;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return null;
      const i = KEYBOARD.indexOf(e.key.toLowerCase());
      return i < 0 ? null : keys[0].midi + i;
    };
    const down = (e: KeyboardEvent) => { const m = midiFor(e); if (m !== null && !e.repeat) start(m); };
    const up = (e: KeyboardEvent) => { const m = midiFor(e); if (m !== null) stop(m); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [keys]);

  useEffect(() => () => {
    voices.current.forEach((v) => { try { v.osc.stop(); } catch { /* already stopped */ } });
    voices.current.clear();
    void ctx.current?.close();
  }, []);

  const keyboardLabel = (midi: number) => {
    const i = midi - keys[0].midi;
    return i < KEYBOARD.length ? KEYBOARD[i].toUpperCase() : "";
  };
  const press = (midi: number) => (e: React.PointerEvent) => { e.preventDefault(); start(midi); };
  const release = (midi: number) => () => stop(midi);
  const enter = (midi: number) => (e: React.PointerEvent) => { if (e.buttons === 1) start(midi); };

  const blackWidth = 0.62 / whiteCount;
  const keyHandlers = (midi: number) => ({ onPointerDown: press(midi), onPointerUp: release(midi), onPointerLeave: release(midi), onPointerCancel: release(midi), onPointerEnter: enter(midi) });

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Suono"><Chips value={wave} onChange={setWave} options={[{ value: "sine", label: "Sinus" }, { value: "triangle", label: "Triangolo" }, { value: "square", label: "Quadra" }, { value: "sawtooth", label: "Dente" }]} /></Field>
        <Field label="Ottava"><Chips value={octave} onChange={setOctave} options={[1, 2, 3, 4, 5].map((o) => ({ value: o, label: `C${o}` }))} /></Field>
        <Slider label="Volume" value={volume} min={0} max={100} step={5} onChange={setVolume} display={`${volume}%`} />
      </div>

      <div className="relative h-44 select-none touch-none" role="group" aria-label="Tastiera del pianoforte">
        <div className="flex h-full">
          {keys.filter((k) => !k.black).map((k) => (
            <button
              key={k.midi}
              type="button"
              {...keyHandlers(k.midi)}
              aria-label={k.name}
              className={cx("flex-1 min-w-0 flex flex-col justify-end items-center gap-1 pb-2 border border-zinc-700 text-[10px] cursor-pointer transition-colors", active.has(k.midi) ? "text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
              style={active.has(k.midi) ? { background: u.accentHex } : undefined}
            >
              <span className="font-mono">{keyboardLabel(k.midi)}</span>
              {k.name.startsWith("Do") && !k.name.includes("#") && <span>{k.name}</span>}
            </button>
          ))}
        </div>
        {keys.filter((k) => k.black).map((k) => (
          <button
            key={k.midi}
            type="button"
            {...keyHandlers(k.midi)}
            aria-label={k.name}
            className={cx("absolute top-0 h-[60%] z-10 flex items-end justify-center pb-1 text-[9px] font-mono border border-black cursor-pointer transition-colors", active.has(k.midi) ? "text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-700")}
            style={{ left: `${(k.white / whiteCount - blackWidth / 2) * 100}%`, width: `${blackWidth * 100}%`, ...(active.has(k.midi) ? { background: u.accentHex } : {}) }}
          >
            {keyboardLabel(k.midi)}
          </button>
        ))}
      </div>
      <Notice>Con il computer suoni le prime note a partire dal Do più basso: le lettere A S D F G H J K L sono i tasti bianchi, quelle sopra (W E T Y U O P) i neri. Puoi tenere premuti più tasti insieme.</Notice>
    </Stack>
  );
}
