import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Coins, Dices, ListTodo, Plus, Sparkles, X } from "lucide-react";
import { Segmented, Button, TextInput, Chips, Panel, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Tab = "coin" | "dice" | "list";

function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

/** Timers started by this tool, cleared on unmount. */
function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); }), []);
  return {
    timeout: (fn: () => void, ms: number) => { ids.current.push(window.setTimeout(fn, ms)); },
    interval: (fn: () => void, ms: number) => { const id = window.setInterval(fn, ms); ids.current.push(id); return id; },
  };
}

export default function DecisionMaker() {
  const u = useUi();
  const timers = useTimers();
  const [tab, setTab] = useState<Tab>("coin");

  // Coin
  const [coin, setCoin] = useState<"TESTA" | "CROCE" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setCoin(null);
    timers.timeout(() => { setCoin(randomInt(2) === 0 ? "TESTA" : "CROCE"); setFlipping(false); }, 800);
  };

  // Dice
  const [diceCount, setDiceCount] = useState(1);
  const [dice, setDice] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setDice([]);
    timers.timeout(() => { setDice(Array.from({ length: diceCount }, () => randomInt(6) + 1)); setRolling(false); }, 700);
  };

  // List
  const [draft, setDraft] = useState("");
  const [options, setOptions] = useState(["Pizza", "Sushi", "Cucina italiana", "Fast food"]);
  const [picked, setPicked] = useState<string | null>(null);
  const [ticking, setTicking] = useState(false);

  const addOption = (e: FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (value && !options.includes(value)) {
      setOptions([...options, value]);
      setDraft("");
    }
  };

  const pick = () => {
    if (options.length < 2 || ticking) return;
    setTicking(true);
    setPicked(null);
    let count = 0;
    const id = timers.interval(() => {
      setPicked(options[randomInt(options.length)]);
      if (++count > 12) {
        window.clearInterval(id);
        setPicked(options[randomInt(options.length)]);
        setTicking(false);
      }
    }, 100);
  };

  const big = cx("text-3xl font-bold", u.statValue);

  return (
    <Stack>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "coin", label: <span className="inline-flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Moneta</span> },
          { value: "dice", label: <span className="inline-flex items-center gap-1.5"><Dices className="w-3.5 h-3.5" /> Dadi</span> },
          { value: "list", label: <span className="inline-flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" /> Lista</span> },
        ]}
      />

      {tab === "coin" && (
        <div className="flex flex-col items-center gap-5 py-4">
          <button
            type="button"
            onClick={flip}
            disabled={flipping}
            aria-label="Lancia la moneta"
            className={cx("w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer text-xs font-bold tracking-widest transition-transform", u.text, flipping && "animate-spin")}
            style={{ borderColor: u.accentHex, background: `${u.accentHex}14` }}
          >
            {coin ?? "LANCIA"}
          </button>
          <p className={cx("text-sm", u.subtle)}>
            {coin && !flipping ? <>Risultato: <strong className={u.accent}>{coin}</strong></> : "Tocca la moneta per lanciarla"}
          </p>
          <Button variant="primary" onClick={flip} disabled={flipping}>{flipping ? "Lancio in corso..." : "Lancia la moneta"}</Button>
        </div>
      )}

      {tab === "dice" && (
        <div className="flex flex-col items-center gap-5 py-4">
          <Chips value={diceCount} onChange={setDiceCount} options={[{ value: 1, label: "1 dado" }, { value: 2, label: "2 dadi" }, { value: 3, label: "3 dadi" }]} />
          <div className="flex gap-4 min-h-[72px] items-center">
            {rolling
              ? Array.from({ length: diceCount }, (_, i) => (
                  <div key={i} className={cx("w-16 h-16 flex items-center justify-center text-xl font-bold animate-pulse", u.panel, u.muted)}>?</div>
                ))
              : dice.length
                ? dice.map((d, i) => (
                    <div key={i} className={cx("w-16 h-16 flex items-center justify-center", u.panel, big)} style={{ borderColor: u.accentHex }}>{d}</div>
                  ))
                : <span className={cx("text-xs", u.muted)}>Nessun lancio</span>}
          </div>
          {dice.length > 1 && !rolling && <p className={cx("text-sm", u.subtle)}>Somma: <strong className={u.accent}>{dice.reduce((a, b) => a + b, 0)}</strong></p>}
          <Button variant="primary" onClick={roll} disabled={rolling}>{rolling ? "Lancio..." : "Lancia i dadi"}</Button>
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-4">
          <form onSubmit={addOption} className="flex gap-2">
            <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Aggiungi un'opzione (es. Cinema)" />
            <Button type="submit" variant="primary" className="px-3 shrink-0" aria-label="Aggiungi opzione"><Plus className="w-4 h-4" /></Button>
          </form>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {options.map((opt) => (
              <span key={opt} className={cx("inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs", u.panel, u.subtle)}>
                {opt}
                <button type="button" onClick={() => { setOptions(options.filter((o) => o !== opt)); setPicked(null); }} className={cx("cursor-pointer hover:text-red-400", u.muted)} aria-label={`Rimuovi ${opt}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {!options.length && <p className={cx("text-xs", u.muted)}>La lista è vuota: aggiungi delle opzioni.</p>}
          </div>

          <Panel inset className="min-h-[96px] flex items-center justify-center text-center">
            {picked ? (
              <div>
                {!ticking && <span className={cx("flex items-center justify-center gap-1 mb-1", u.statLabel)}><Sparkles className="w-3 h-3" /> Scelto per te</span>}
                <p className={big}>{picked}</p>
              </div>
            ) : (
              <p className={cx("text-xs", u.muted)}>Servono almeno 2 opzioni.</p>
            )}
          </Panel>

          <Button variant="primary" className="w-full" onClick={pick} disabled={options.length < 2 || ticking} icon={<Sparkles className="w-4 h-4" />}>
            {ticking ? "Scelta in corso..." : "Scegli per me"}
          </Button>
        </div>
      )}
    </Stack>
  );
}
