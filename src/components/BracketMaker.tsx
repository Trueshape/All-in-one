import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Shuffle, Trophy } from "lucide-react";
import { Field, TextArea, Button, Notice, Stack, SectionTitle, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { buildBracket, champion } from "../lib/bracket";
import type { Picks } from "../lib/bracket";

const STORAGE = "utilita365_bracket";
const MAX_PLAYERS = 32;

const roundTitle = (matches: number, index: number) =>
  matches === 1 ? "Finale" : matches === 2 ? "Semifinali" : matches === 4 ? "Quarti di finale" : matches === 8 ? "Ottavi di finale" : `Turno ${index + 1}`;

/** One name per line; empty lines are dropped and repeated names get a number so every player stays distinct. */
function parseNames(text: string): string[] {
  const seen = new Map<string, number>();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS)
    .map((name) => {
      const count = (seen.get(name) ?? 0) + 1;
      seen.set(name, count);
      return count > 1 ? `${name} (${count})` : name;
    });
}

function readSaved(): { text: string; picks: Picks } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (saved && typeof saved.text === "string" && saved.picks && typeof saved.picks === "object") return saved;
  } catch {
    // no saved data, or storage is blocked
  }
  return { text: "Squadra A\nSquadra B\nSquadra C\nSquadra D", picks: {} };
}

export default function BracketMaker() {
  const u = useUi();
  const [saved] = useState(readSaved);
  const [text, setText] = useState(saved.text);
  const [picks, setPicks] = useState<Picks>(saved.picks);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ text, picks }));
    } catch {
      // storage unavailable: the bracket still works for this visit
    }
  }, [text, picks]);

  const names = useMemo(() => parseNames(text), [text]);
  const rounds = useMemo(() => buildBracket(names, picks), [names, picks]);
  const winner = champion(rounds);

  const shuffle = () => {
    const list = [...names];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setText(list.join("\n"));
    setPicks({});
  };

  const choose = (key: string, name: string) =>
    setPicks((prev) => {
      const next = { ...prev };
      if (next[key] === name) delete next[key];
      else next[key] = name;
      return next;
    });

  const radius = u.id === "sophisticated" ? "rounded-xl" : u.id === "artistic" ? "rounded" : "";

  return (
    <Stack>
      <Field label={`Partecipanti (uno per riga, massimo ${MAX_PLAYERS})`} hint="Il primo della lista è la testa di serie: con un numero dispari di partecipanti i primi passano il primo turno.">
        <TextArea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Mario\nLuigi\nPeach\nYoshi"} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Shuffle className="w-3.5 h-3.5" />} disabled={names.length < 2} onClick={shuffle}>Mescola</Button>
        <Button icon={<RotateCcw className="w-3.5 h-3.5" />} disabled={!Object.keys(picks).length} onClick={() => setPicks({})}>Azzera risultati</Button>
      </div>

      {names.length < 2 ? (
        <Notice>Inserisci almeno due partecipanti per creare il tabellone.</Notice>
      ) : (
        <>
          {winner && (
            <div className={cx("flex items-center justify-center gap-2 p-3 border font-bold", u.divider, u.accent, radius)}>
              <Trophy className="w-5 h-5" /> Vincitore: {winner}
            </div>
          )}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 min-w-max">
              {rounds.map((matches, r) => (
                <div key={r} className="flex flex-col w-44 shrink-0">
                  <SectionTitle>{roundTitle(matches.length, r)}</SectionTitle>
                  <div className="flex flex-col justify-around flex-1 gap-3 mt-2">
                    {matches.map((m, i) => (
                      <div key={i} className={cx("border overflow-hidden", u.divider, radius)}>
                        {([m.a, m.b] as const).map((name, side) => {
                          const playable = !m.bye && m.a !== null && m.b !== null;
                          const won = name !== null && m.winner === name;
                          return (
                            <button
                              key={side}
                              type="button"
                              disabled={!playable}
                              onClick={() => name && choose(`${r}-${i}`, name)}
                              className={cx(
                                "w-full px-2.5 py-1.5 text-left text-sm truncate border-b last:border-b-0",
                                u.divider,
                                won ? cx("font-bold", u.accent) : playable && m.winner ? u.muted : u.text,
                                playable ? "cursor-pointer" : "cursor-default",
                              )}
                              title={playable ? "Clic per scegliere il vincitore" : undefined}
                            >
                              {name ?? (m.bye ? "— (passa il turno)" : "—")}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Notice>Clicca un nome per farlo avanzare, cliccalo di nuovo per annullare. Il tabellone viene salvato in questo browser.</Notice>
        </>
      )}
    </Stack>
  );
}
