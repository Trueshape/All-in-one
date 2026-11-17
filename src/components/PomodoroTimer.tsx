import { useEffect, useState, useSyncExternalStore } from "react";
import { ListPlus, Pause, Play, RotateCcw } from "lucide-react";
import { Notice, Chips, Button, IconButton, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { parseTime } from "../lib/timeInput";
import { ALLOW, keepAllowed } from "../lib/inputGuards";
import { useOnReset } from "../lib/persist";
import { pomodoro, pomodoroLeft, pomodoroStore, stopwatch, stopwatchElapsed, stopwatchStore } from "../lib/timers";
import type { Phase } from "../lib/timers";

const PHASES: Record<Phase, { label: string; short: string }> = {
  work: { label: "Focus", short: "Focus" },
  short: { label: "Pausa breve", short: "Pausa" },
  long: { label: "Pausa lunga", short: "Lunga" },
};

/** Shortest first, as the chips are shown. */
const ORDER: Phase[] = ["short", "long", "work"];

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const mmss = (total: number) => `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
const stopwatchText = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}`;

/** Draws the component again every `ms` while `active`: the times are read from the clock, not counted here. */
function useTick(active: boolean, ms: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [active, ms]);
}

function Pomodoro() {
  const u = useUi();
  const state = useSyncExternalStore(pomodoroStore.subscribe, pomodoroStore.get);
  const [editing, setEditing] = useState<string | null>(null);
  const running = state.endAt !== null;
  useTick(running, 250);
  useOnReset(pomodoro.reset);
  const { phase } = state;
  const left = pomodoroLeft(state);
  const total = state.durations[phase];

  const choose = (next: Phase) => {
    setEditing(null);
    pomodoro.choose(next);
  };

  const startEditing = () => {
    pomodoro.pause();
    setEditing(mmss(left));
  };

  const commitEditing = () => {
    if (editing === null) return;
    const seconds = parseTime(editing);
    setEditing(null);
    if (seconds !== null) pomodoro.setDuration(seconds);
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
            onChange={(e) => setEditing(keepAllowed(e.target.value, ALLOW.clock, 6))}
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
        <Button variant="primary" onClick={() => (running ? pomodoro.pause() : pomodoro.start())} className="px-6" icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
          {running ? "Pausa" : left === 0 ? "Ricomincia" : "Avvia"}
        </Button>
        <div className="justify-self-start">
          <IconButton size="md" onClick={pomodoro.restart} title="Reset" className="border-current"><RotateCcw /></IconButton>
        </div>
      </div>
    </div>
  );
}

function Stopwatch() {
  const u = useUi();
  const state = useSyncExternalStore(stopwatchStore.subscribe, stopwatchStore.get);
  const running = state.since !== null;
  useTick(running, 30);
  useOnReset(stopwatch.reset);
  const elapsed = stopwatchElapsed(state);

  return (
    <div className="space-y-5 text-center">
      <div className={cx("py-6 text-5xl font-bold font-mono tabular-nums", u.text)} role="timer">{stopwatchText(elapsed)}</div>
      <div className="flex justify-center gap-3">
        <IconButton size="md" onClick={stopwatch.reset} disabled={elapsed === 0} title="Reset"><RotateCcw /></IconButton>
        <Button variant="primary" onClick={stopwatch.toggle} className="px-6" icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
          {running ? "Ferma" : "Avvia"}
        </Button>
        <IconButton size="md" onClick={stopwatch.lap} disabled={!running} title="Giro"><ListPlus /></IconButton>
      </div>
      {state.laps.length > 0 && (
        <div className={cx("max-h-40 overflow-y-auto divide-y text-left", u.panel, u.divider)}>
          {state.laps.map((lap, i) => (
            <div key={i} className={cx("flex justify-between px-4 py-2 text-xs", u.divider)}>
              <span className={u.muted}>Giro {state.laps.length - i}</span>
              <span className={cx("font-mono", u.text)}>{stopwatchText(lap)}</span>
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
      <Notice>Tecnica Pomodoro: 25 minuti di concentrazione, poi una pausa. Il tempo è calcolato sull’orologio di sistema: continua anche se cambi scheda o chiudi questa finestra, e alla fine suona.</Notice>
    </Stack>
  );
}

export function StopwatchPage() {
  return (
    <Stack>
      <Stopwatch />
      <Notice>Il cronometro continua a contare anche se chiudi questa finestra: riaprilo per leggere il tempo.</Notice>
    </Stack>
  );
}
