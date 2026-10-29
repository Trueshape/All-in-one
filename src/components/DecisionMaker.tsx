import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Coins, Dices, ListTodo, Plus, Sparkles, X } from "lucide-react";
import { Notice, Segmented, Button, TextInput, Chips, Panel, Stack, Tag, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Tab = "coin" | "dice" | "list";

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function Die({ value, rolling, delay }: { value: number; rolling: boolean; delay: number }) {
  const u = useUi();
  return (
    <div
      className={cx("h-16 w-16 grid grid-cols-3 grid-rows-3 p-2 border-2 rounded-xl", u.panel)}
      style={{
        borderColor: u.accentHex,
        animation: rolling ? "dice-tumble 0.9s ease-out" : undefined,
        animationDelay: rolling ? `${delay}ms` : undefined,
        transformStyle: "preserve-3d",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.35)",
      }}
    >
      {Array.from({ length: 9 }, (_, cell) => (
        <span key={cell} className="flex items-center justify-center">
          {PIPS[value].includes(cell) && <span className="h-2.5 w-2.5 rounded-full" style={{ background: u.accentHex }} />}
        </span>
      ))}
    </div>
  );
}

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

  // Coin: a real 3D flip. The angle keeps growing so the coin always spins forward.
  const [coin, setCoin] = useState<"TESTA" | "CROCE" | null>(null);
  const [coinAngle, setCoinAngle] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const flip = () => {
    if (flipping) return;
    const outcome = randomInt(2) === 0 ? "TESTA" : "CROCE";
    const base = Math.ceil(coinAngle / 360) * 360;
    setFlipping(true);
    setCoin(null);
    setCoinAngle(base + 360 * 5 + (outcome === "CROCE" ? 180 : 0));
    timers.timeout(() => { setCoin(outcome); setFlipping(false); }, 1000);
  };

  // Dice: faces flicker while tumbling, then settle on the result
  const [diceCount, setDiceCount] = useState(1);
  const [dice, setDice] = useState<number[]>([]);
  const [shown, setShown] = useState<number[]>([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setDice([]);
    const id = timers.interval(() => setShown(Array.from({ length: 3 }, () => randomInt(6) + 1)), 90);
    timers.timeout(() => {
      window.clearInterval(id);
      setDice(Array.from({ length: diceCount }, () => randomInt(6) + 1));
      setRolling(false);
    }, 900);
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
        fill
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
          <div style={{ perspective: 800 }} className="h-32 w-32 flex items-center justify-center">
            <button
              type="button"
              onClick={flip}
              disabled={flipping}
              aria-label="Lancia la moneta"
              className="relative h-28 w-28 cursor-pointer"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${coinAngle}deg)`,
                transition: "transform 1s cubic-bezier(0.2, 0.7, 0.3, 1)",
              }}
            >
              {(["TESTA", "CROCE"] as const).map((face) => (
                <span
                  key={face}
                  className={cx("absolute inset-0 rounded-full border-4 flex items-center justify-center text-sm font-bold tracking-widest", u.text)}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: face === "CROCE" ? "rotateY(180deg)" : undefined,
                    borderColor: u.accentHex,
                    background: `radial-gradient(circle at 30% 30%, ${u.accentHex}33, ${u.accentHex}10)`,
                  }}
                >
                  {face}
                </span>
              ))}
            </button>
          </div>
          <p className={cx("text-sm", u.subtle)}>
            {coin && !flipping ? <>Risultato: <strong className={u.accent}>{coin}</strong></> : "Tocca la moneta per lanciarla"}
          </p>
          <Button variant="primary" onClick={flip} disabled={flipping}>{flipping ? "Lancio in corso..." : "Lancia la moneta"}</Button>
        </div>
      )}

      {tab === "dice" && (
        <div className="flex flex-col items-center gap-5 py-4">
          <Chips fill value={diceCount} onChange={setDiceCount} options={[{ value: 1, label: "1 dado" }, { value: 2, label: "2 dadi" }, { value: 3, label: "3 dadi" }]} />
          <div className="flex justify-center gap-4 min-h-[96px] items-center" style={{ perspective: 600 }}>
            {dice.length || rolling ? (rolling ? Array.from({ length: diceCount }, (_, i) => shown[i]) : dice).map((value, i) => (
              <Die key={i} value={value} rolling={rolling} delay={i * 80} />
            )) : <span className={cx("text-xs", u.muted)}>Nessun lancio</span>}
          </div>
          {dice.length > 1 && !rolling && <p className={cx("text-sm", u.subtle)}>Somma: <strong className={u.accent}>{dice.reduce((a, b) => a + b, 0)}</strong></p>}
          <Button variant="primary" onClick={roll} disabled={rolling}>{rolling ? "Lancio..." : "Lancia i dadi"}</Button>
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-4">
          <form onSubmit={addOption} className="flex gap-2">
            <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Aggiungi un'opzione (es. Cinema)" />
            <Button type="submit" variant="primary" className="h-11 w-11 p-0 shrink-0 rounded-xl" aria-label="Aggiungi opzione"><Plus className="w-4 h-4" /></Button>
          </form>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {options.map((opt) => (
              <Tag key={opt} label={opt} onRemove={() => { setOptions(options.filter((o) => o !== opt)); setPicked(null); }} />
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
      <Notice>Moneta, dadi e lista scelgono a caso con il generatore casuale del browser: ogni estrazione è indipendente dalle precedenti.</Notice>
    </Stack>
  );
}
