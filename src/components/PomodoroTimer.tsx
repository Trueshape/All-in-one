import { useCallback, useEffect, useRef, useState } from "react";
import { ListPlus, Pause, Play, RotateCcw } from "lucide-react";
import { Notice, Chips, Button, IconButton, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { parseTime } from "../lib/timeInput";

type Phase = "work" | "short" | "long";

const PHASES: Record<Phase, { label: string; short: string; seconds: number }> = {
  work: { label: "Focus", short: "Focus", seconds: 25 * 60 },
  short: { label: "Pausa breve", short: "Pausa", seconds: 5 * 60 },
  long: { label: "Pausa lunga", short: "Lunga", seconds: 15 * 60 },
};

/** Shortest first, as the chips are shown. */
const ORDER: Phase[] = ["short", "long", "work"];

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const mmss = (total: number) => `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
const stopwatch = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}`;

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.4].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    window.setTimeout(() => ctx.close(), 1500);
  } catch {
    // audio blocked: the visual state is enough
  }
}

function Pomodoro() {
  const u = useUi();
  const [phase, setPhase] = useState<Phase>("work");
  // Each phase keeps its own length, so a time typed in by hand stays after switching phase.
  const [durations, setDurations] = useState<Record<Phase, number>>({ work: PHASES.work.seconds, short: PHASES.short.seconds, long: PHASES.long.seconds });
  const [left, setLeft] = useState(PHASES.work.seconds);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const endAt = useRef(0);
  const total = durations[phase];

  // Uses a wall-clock deadline so background-tab throttling does not make the timer drift.
  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(id);
        setRunning(false);
        beep();
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const choose = (next: Phase) => {
    setRunning(false);
    setEditing(null);
    setPhase(next);
    setLeft(durations[next]);
  };

  const startEditing = () => {
    setRunning(false);
    setEditing(mmss(left));
  };

  const commitEditing = () => {
    if (editing === null) return;
    const seconds = parseTime(editing);
    setEditing(null);
    if (seconds === null) return;
    setDurations((d) => ({ ...d, [phase]: seconds }));
    setLeft(seconds);
  };

  const progress = total ? left / total : 0;

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <Chips fill value={phase} onChange={choose} options={ORDER.map((p) => ({ value: p, label: PHASES[p].short }))} />
      </div>

      <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center">
        <svg viewBox="0 0 192 192" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="96" cy="96" r={RADIUS} fill="none" stroke={u.mutedHex} strokeOpacity="0.4" strokeWidth="4" />
          <circle cx="96" cy="96" r={RADIUS} fill="none" stroke={u.accentHex} strokeWidth="4" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
        </svg>
        {editing === null ? (
          <button type="button" onClick={startEditing} title="Clicca per cambiare il tempo" className={cx("text-4xl font-bold font-mono tabular-nums cursor-text rounded-lg px-2 hover:bg-white/5 transition-colors", u.text)} role="timer">{mmss(left)}</button>
        ) : (
          <input
            autoFocus
            value={editing}
            onChange={(e) => setEditing(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEditing();
              if (e.key === "Escape") {
                // Only cancel the edit: the tool window must stay open.
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setEditing(null);
              }
            }}
            inputMode="numeric"
            aria-label="Tempo (minuti oppure mm:ss)"
            className={cx("w-32 text-center text-4xl font-bold font-mono tabular-nums bg-transparent border-b-2 focus:outline-none", u.text)}
            style={{ borderColor: u.accentHex }}
          />
        )}
        <span className={cx("text-xs mt-1", u.muted)}>{PHASES[phase].label}</span>
      </div>
      <p className={cx("text-[11px] -mt-3", u.muted)}>Clicca sul tempo per modificarlo (minuti, oppure mm:ss).</p>

      {/* Start sits in the middle of the container; reset is beside it, so the button stays centred. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span />
        <Button variant="primary" onClick={() => { if (left === 0) setLeft(total); setRunning((r) => !r); }} className="px-6" icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
          {running ? "Pausa" : left === 0 ? "Ricomincia" : "Avvia"}
        </Button>
        <div className="justify-self-start">
          <IconButton size="md" onClick={() => { setRunning(false); setLeft(total); }} title="Reset" className="border-current"><RotateCcw /></IconButton>
        </div>
      </div>
    </div>
  );
}

function Stopwatch() {
  const u = useUi();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    base.current = performance.now() - elapsed;
    const id = window.setInterval(() => setElapsed(performance.now() - base.current), 30);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = useCallback(() => { setRunning(false); setElapsed(0); setLaps([]); }, []);

  return (
    <div className="space-y-5 text-center">
      <div className={cx("py-6 text-5xl font-bold font-mono tabular-nums", u.text)} role="timer">{stopwatch(elapsed)}</div>
      <div className="flex justify-center gap-3">
        <IconButton size="md" onClick={reset} disabled={elapsed === 0} title="Reset"><RotateCcw /></IconButton>
        <Button variant="primary" onClick={() => setRunning((r) => !r)} className="px-6" icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
          {running ? "Ferma" : "Avvia"}
        </Button>
        <IconButton size="md" onClick={() => setLaps((l) => [elapsed, ...l])} disabled={!running} title="Giro"><ListPlus /></IconButton>
      </div>
      {laps.length > 0 && (
        <div className={cx("max-h-40 overflow-y-auto divide-y text-left", u.panel, u.divider)}>
          {laps.map((lap, i) => (
            <div key={i} className={cx("flex justify-between px-4 py-2 text-xs", u.divider)}>
              <span className={u.muted}>Giro {laps.length - i}</span>
              <span className={cx("font-mono", u.text)}>{stopwatch(lap)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PomodoroPage() {
  return (
    <Stack>
      <Pomodoro />
      <Notice>Tecnica Pomodoro: 25 minuti di concentrazione, poi una pausa. Il tempo è calcolato sull’orologio di sistema, quindi non si ferma se cambi scheda.</Notice>
    </Stack>
  );
}

export function StopwatchPage() {
  return (
    <Stack>
      <Stopwatch />
    </Stack>
  );
}
