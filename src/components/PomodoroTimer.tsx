import { useCallback, useEffect, useRef, useState } from "react";
import { Hourglass, ListPlus, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Segmented, Chips, Button, IconButton, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Phase = "work" | "short" | "long";

const PHASES: Record<Phase, { label: string; short: string; seconds: number }> = {
  work: { label: "Focus", short: "Focus", seconds: 25 * 60 },
  short: { label: "Pausa breve", short: "Pausa", seconds: 5 * 60 },
  long: { label: "Pausa lunga", short: "Lunga", seconds: 15 * 60 },
};

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
  const [left, setLeft] = useState(PHASES.work.seconds);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

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
    setPhase(next);
    setLeft(PHASES[next].seconds);
  };

  const progress = left / PHASES[phase].seconds;

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <Chips value={phase} onChange={choose} options={(Object.keys(PHASES) as Phase[]).map((p) => ({ value: p, label: PHASES[p].short }))} />
      </div>

      <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center">
        <svg viewBox="0 0 192 192" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="96" cy="96" r={RADIUS} fill="none" stroke={u.mutedHex} strokeOpacity="0.4" strokeWidth="4" />
          <circle cx="96" cy="96" r={RADIUS} fill="none" stroke={u.accentHex} strokeWidth="4" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
        </svg>
        <span className={cx("text-4xl font-bold font-mono tabular-nums", u.text)} role="timer">{mmss(left)}</span>
        <span className={cx("text-xs mt-1", u.muted)}>{PHASES[phase].label}</span>
      </div>

      <div className="flex justify-center gap-3">
        <IconButton onClick={() => { setRunning(false); setLeft(PHASES[phase].seconds); }} title="Reset" className="border-current"><RotateCcw className="w-5 h-5" /></IconButton>
        <Button variant="primary" onClick={() => setRunning((r) => !r)} className="px-6" icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
          {running ? "Pausa" : left === 0 ? "Ricomincia" : "Avvia"}
        </Button>
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
        <IconButton onClick={reset} disabled={elapsed === 0} title="Reset"><RotateCcw className="w-5 h-5" /></IconButton>
        <Button variant="primary" onClick={() => setRunning((r) => !r)} className="px-6" icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
          {running ? "Ferma" : "Avvia"}
        </Button>
        <IconButton onClick={() => setLaps((l) => [elapsed, ...l])} disabled={!running} title="Giro"><ListPlus className="w-5 h-5" /></IconButton>
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

export default function PomodoroTimer() {
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  return (
    <Stack>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "pomodoro", label: <span className="inline-flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5" /> Pomodoro</span> },
          { value: "stopwatch", label: <span className="inline-flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> Cronometro</span> },
        ]}
      />
      {mode === "pomodoro" ? <Pomodoro /> : <Stopwatch />}
    </Stack>
  );
}
