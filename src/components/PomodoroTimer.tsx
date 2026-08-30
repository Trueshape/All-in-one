import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Award, Hourglass, ListPlus, Timer } from "lucide-react";

type TimerMode = "work" | "shortBreak" | "longBreak";

const MODE_TIMES: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  work: "Lavoro (Focus)",
  shortBreak: "Pausa Breve",
  longBreak: "Pausa Lunga",
};

export default function PomodoroTimer() {
  // Main Suite Mode: "pomodoro" or "stopwatch"
  const [suiteMode, setSuiteMode] = useState<"pomodoro" | "stopwatch">("pomodoro");

  // --- POMODORO STATES ---
  const [pMode, setPMode] = useState<TimerMode>("work");
  const [pTimeLeft, setPTimeLeft] = useState<number>(MODE_TIMES.work);
  const [pIsRunning, setPIsRunning] = useState<boolean>(false);
  const pIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- STOPWATCH STATES ---
  const [swTime, setSwTime] = useState<number>(0); // in ms
  const [swIsRunning, setSwIsRunning] = useState<boolean>(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const swIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const swStartTimeRef = useRef<number>(0);
  const swElapsedTimeRef = useRef<number>(0);

  // Web Audio synth for completion alert
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      // Ring twice
      [0, 0.4].forEach((delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + delay); // A5 note
        gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.35);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.4);
      });
    } catch (e) {
      console.warn("Audio feedback omitted or blocked:", e);
    }
  };

  // --- POMODORO EFFECT ---
  useEffect(() => {
    if (pIsRunning) {
      pIntervalRef.current = setInterval(() => {
        setPTimeLeft((prev) => {
          if (prev <= 1) {
            playBeep();
            setPIsRunning(false);
            clearInterval(pIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pIntervalRef.current) clearInterval(pIntervalRef.current);
    }

    return () => {
      if (pIntervalRef.current) clearInterval(pIntervalRef.current);
    };
  }, [pIsRunning]);

  // Handle pomodoro mode changes
  const handlePModeChange = (mode: TimerMode) => {
    setPIsRunning(false);
    setPMode(mode);
    setPTimeLeft(MODE_TIMES[mode]);
  };

  const handlePReset = () => {
    setPIsRunning(false);
    setPTimeLeft(MODE_TIMES[pMode]);
  };

  // --- STOPWATCH EFFECT ---
  useEffect(() => {
    if (swIsRunning) {
      swStartTimeRef.current = Date.now() - swElapsedTimeRef.current;
      swIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - swStartTimeRef.current;
        setSwTime(elapsed);
        swElapsedTimeRef.current = elapsed;
      }, 10);
    } else {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    }

    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    };
  }, [swIsRunning]);

  const handleSwReset = () => {
    setSwIsRunning(false);
    setSwTime(0);
    swElapsedTimeRef.current = 0;
    setSwLaps([]);
  };

  const handleSwLap = () => {
    setSwLaps((prev) => [swTime, ...prev]);
  };

  // Helper formats
  const formatPomodoroTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatStopwatchTime = (ms: number): string => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Selector Suite */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
        <button
          onClick={() => setSuiteMode("pomodoro")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            suiteMode === "pomodoro"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-suite-pomodoro"
        >
          <Hourglass className="w-3.5 h-3.5" />
          <span>Pomodoro Timer</span>
        </button>
        <button
          onClick={() => setSuiteMode("stopwatch")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            suiteMode === "stopwatch"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-suite-stopwatch"
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Cronometro</span>
        </button>
      </div>

      {suiteMode === "pomodoro" ? (
        // --- POMODORO SECTION ---
        <div className="space-y-6 text-center">
          {/* Quick Sub-modes */}
          <div className="flex justify-center gap-1 pb-1">
            {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handlePModeChange(mode)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full transition-colors ${
                  pMode === mode
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
                id={`btn-pmode-${mode}`}
              >
                {mode === "work" ? "Focus" : mode === "shortBreak" ? "Pausa" : "Lunga"}
              </button>
            ))}
          </div>

          {/* Time Display */}
          <div className="py-2 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer circular tracker bar */}
              <div className="w-48 h-48 rounded-full border border-zinc-800 flex flex-col items-center justify-center bg-zinc-950/40 relative">
                {/* Dynamically scaled progress ring backer can be a simple SVG circle */}
                <svg className="w-48 h-48 absolute transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-zinc-900/60"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - pTimeLeft / MODE_TIMES[pMode])}
                    className="text-indigo-500 transition-all duration-300"
                  />
                </svg>
                
                <span className="text-4xl font-extrabold text-zinc-100 font-mono tracking-tight select-none">
                  {formatPomodoroTime(pTimeLeft)}
                </span>
                <span className="text-xs text-zinc-400 mt-1 font-medium tracking-wide">
                  {MODE_LABELS[pMode]}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={handlePReset}
              className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors active:scale-95"
              id="btn-pomodoro-reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setPIsRunning(!pIsRunning)}
              className={`p-4 rounded-xl shadow-lg transition-all active:scale-95 text-white ${
                pIsRunning 
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/10" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/10"
              }`}
              id="btn-pomodoro-toggle"
            >
              {pIsRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
            </button>
            
            <div className="p-3 opacity-0 w-11 h-11 pointer-events-none" /> {/* Spacer for symmetry */}
          </div>
        </div>
      ) : (
        // --- STOPWATCH SECTION ---
        <div className="space-y-4">
          {/* Display */}
          <div className="py-6 text-center">
            <div className="text-5xl font-extrabold text-zinc-100 font-mono tracking-tight tabular-nums select-none">
              {formatStopwatchTime(swTime)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={handleSwReset}
              disabled={swTime === 0}
              className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              id="btn-sw-reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setSwIsRunning(!swIsRunning)}
              className={`p-4 rounded-xl shadow-lg transition-all active:scale-95 text-white ${
                swIsRunning 
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/10" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/10"
              }`}
              id="btn-sw-toggle"
            >
              {swIsRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
            </button>
            
            <button
              onClick={handleSwLap}
              disabled={!swIsRunning}
              className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              id="btn-sw-lap"
              title="Giro"
            >
              <ListPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Laps List */}
          {swLaps.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-zinc-800/80 bg-zinc-950/40 rounded-xl divide-y divide-zinc-800/50 no-scrollbar">
              {swLaps.map((lap, index) => (
                <div key={index} className="flex justify-between items-center px-4 py-2 text-xs">
                  <span className="text-zinc-500 font-medium">Giro {swLaps.length - index}</span>
                  <span className="text-zinc-300 font-mono font-medium">{formatStopwatchTime(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
