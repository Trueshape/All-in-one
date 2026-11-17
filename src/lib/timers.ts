/**
 * Pomodoro and stopwatch state, kept outside the components so that a countdown keeps running (and beeps) when the tool window is closed.
 * Times are derived from the clock when read, so nothing has to tick while nobody is looking.
 */

export type Phase = "work" | "short" | "long";
export const PHASE_SECONDS: Record<Phase, number> = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };

function makeStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: T) => {
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
  };
}

export function beep() {
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

// ---- Pomodoro ----

export interface PomodoroState {
  phase: Phase;
  /** Each phase keeps its own length, so a time typed in by hand stays after switching phase. */
  durations: Record<Phase, number>;
  /** Seconds left while stopped. */
  paused: number;
  /** When the countdown ends, while it runs; null when stopped. */
  endAt: number | null;
}

const pomodoroStart = (): PomodoroState => ({ phase: "work", durations: { ...PHASE_SECONDS }, paused: PHASE_SECONDS.work, endAt: null });
export const pomodoroStore = makeStore<PomodoroState>(pomodoroStart());

/** Seconds left now. */
export const pomodoroLeft = (s: PomodoroState, now = Date.now()) => (s.endAt === null ? s.paused : Math.max(0, Math.ceil((s.endAt - now) / 1000)));

let finishTimer: ReturnType<typeof setTimeout> | undefined;
const stopFinishTimer = () => clearTimeout(finishTimer);

export const pomodoro = {
  start() {
    const s = pomodoroStore.get();
    if (s.endAt !== null) return;
    const left = s.paused > 0 ? s.paused : s.durations[s.phase];
    const endAt = Date.now() + left * 1000;
    pomodoroStore.set({ ...s, paused: left, endAt });
    stopFinishTimer();
    finishTimer = setTimeout(() => {
      const now = pomodoroStore.get();
      if (now.endAt !== endAt) return;
      pomodoroStore.set({ ...now, paused: 0, endAt: null });
      beep();
    }, left * 1000 + 30);
  },
  pause() {
    const s = pomodoroStore.get();
    stopFinishTimer();
    pomodoroStore.set({ ...s, paused: pomodoroLeft(s), endAt: null });
  },
  choose(phase: Phase) {
    stopFinishTimer();
    const s = pomodoroStore.get();
    pomodoroStore.set({ ...s, phase, paused: s.durations[phase], endAt: null });
  },
  setDuration(seconds: number) {
    stopFinishTimer();
    const s = pomodoroStore.get();
    pomodoroStore.set({ ...s, durations: { ...s.durations, [s.phase]: seconds }, paused: seconds, endAt: null });
  },
  restart() {
    stopFinishTimer();
    const s = pomodoroStore.get();
    pomodoroStore.set({ ...s, paused: s.durations[s.phase], endAt: null });
  },
  reset() {
    stopFinishTimer();
    pomodoroStore.set(pomodoroStart());
  },
};

// ---- Stopwatch ----

export interface StopwatchState {
  /** Milliseconds counted before the current run. */
  before: number;
  /** performance.now() when the current run began; null when stopped. */
  since: number | null;
  laps: number[];
}

export const stopwatchStore = makeStore<StopwatchState>({ before: 0, since: null, laps: [] });
export const stopwatchElapsed = (s: StopwatchState) => (s.since === null ? s.before : s.before + performance.now() - s.since);

export const stopwatch = {
  toggle() {
    const s = stopwatchStore.get();
    stopwatchStore.set(s.since === null ? { ...s, since: performance.now() } : { ...s, before: stopwatchElapsed(s), since: null });
  },
  lap() {
    const s = stopwatchStore.get();
    if (s.since !== null) stopwatchStore.set({ ...s, laps: [stopwatchElapsed(s), ...s.laps] });
  },
  reset() {
    stopwatchStore.set({ before: 0, since: null, laps: [] });
  },
};
