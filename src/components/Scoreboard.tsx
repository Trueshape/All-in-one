import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Plus, RotateCcw, Undo2, X } from "lucide-react";
import { Button, IconButton, TextInput, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const STORAGE = "utilita365_scoreboard";
const MAX_TEAMS = 6;
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];
const STEPS = [-1, 1];

interface Team {
  id: number;
  name: string;
  score: number;
}

const initial = (): Team[] => [
  { id: 1, name: "Squadra 1", score: 0 },
  { id: 2, name: "Squadra 2", score: 0 },
];

function readSaved(): Team[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (Array.isArray(saved) && saved.length >= 1 && saved.length <= MAX_TEAMS && saved.every((t) => typeof t.id === "number" && typeof t.name === "string" && Number.isFinite(t.score))) return saved;
  } catch {
    // no saved data, or storage is blocked
  }
  return initial();
}

export default function Scoreboard() {
  const u = useUi();
  // One state object, so several quick clicks never overwrite each other and every score change can be undone.
  const [{ teams, history }, setState] = useState<{ teams: Team[]; history: Team[][] }>(() => ({ teams: readSaved(), history: [] }));
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(teams));
    } catch {
      // storage unavailable: the scores still work for this visit
    }
  }, [teams]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const update = (change: (prev: Team[]) => Team[]) => setState((s) => ({ teams: change(s.teams), history: [...s.history.slice(-49), s.teams] }));
  const add = (id: number, step: number) => update((prev) => prev.map((t) => (t.id === id ? { ...t, score: t.score + step } : t)));
  const rename = (id: number, name: string) => setState((s) => ({ ...s, teams: s.teams.map((t) => (t.id === id ? { ...t, name } : t)) }));
  const undo = () => setState((s) => (s.history.length ? { teams: s.history[s.history.length - 1], history: s.history.slice(0, -1) } : s));
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else box.current?.requestFullscreen?.().catch(() => {});
  };

  const leader = Math.max(...teams.map((t) => t.score));
  const columns = teams.length <= 2 ? teams.length : teams.length === 4 ? 2 : 3;

  return (
    <Stack>
      <div ref={box} className={cx("space-y-4", full && "bg-black text-white p-6 flex flex-col justify-center min-h-screen")}>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {teams.map((t, i) => (
            <div key={t.id} className={cx("border p-3 space-y-3 text-center", u.divider)} style={{ borderTopWidth: 4, borderTopColor: COLORS[i] }}>
              <div className="flex items-center gap-1">
                <TextInput value={t.name} onChange={(e) => rename(t.id, e.target.value)} maxLength={24} aria-label={`Nome squadra ${i + 1}`} className="text-center font-semibold" />
                {teams.length > 2 && !full && (
                  <IconButton onClick={() => update((prev) => prev.filter((x) => x.id !== t.id))} title="Rimuovi squadra"><X className="w-4 h-4" /></IconButton>
                )}
              </div>
              <button
                type="button"
                onClick={() => add(t.id, 1)}
                onContextMenu={(e) => { e.preventDefault(); add(t.id, -1); }}
                title="Clic sinistro +1 · clic destro −1"
                aria-label={`${t.name}: ${t.score} punti. Clic sinistro aggiunge 1, clic destro toglie 1`}
                className={cx("w-full py-2 rounded-xl font-black tabular-nums leading-none cursor-pointer select-none hover:bg-white/5 transition-colors", full ? "text-[12vw]" : "text-6xl sm:text-7xl")}
                style={{ color: t.score === leader && leader !== 0 && teams.filter((x) => x.score === leader).length === 1 ? COLORS[i] : undefined }}
              >
                {t.score}
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                {STEPS.map((s) => (
                  <button key={s} type="button" onClick={() => add(t.id, s)} className={cx(u.chip, "justify-center", full && "!py-3 !text-lg")}>{s > 0 ? `+${s}` : s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={cx("flex flex-wrap gap-2", full && "justify-center")}>
          <Button icon={<Undo2 className="w-3.5 h-3.5" />} disabled={!history.length} onClick={undo}>Annulla</Button>
          <Button icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => update((prev) => prev.map((t) => ({ ...t, score: 0 })))}>Azzera punteggi</Button>
          {!full && <Button icon={<Plus className="w-3.5 h-3.5" />} disabled={teams.length >= MAX_TEAMS} onClick={() => update((prev) => [...prev, { id: Math.max(...prev.map((t) => t.id)) + 1, name: `Squadra ${prev.length + 1}`, score: 0 }])}>Aggiungi squadra</Button>}
          <Button icon={full ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />} onClick={toggleFull}>{full ? "Esci da schermo intero" : "Schermo intero"}</Button>
        </div>
      </div>
      {!full && <p className="text-[11px] text-center text-zinc-500">Clic sinistro sul punteggio: +1 · clic destro: −1</p>}
      <Notice>I punteggi vengono salvati in questo browser. In schermo intero i numeri diventano molto grandi, adatti a proiettore o TV.</Notice>
    </Stack>
  );
}
