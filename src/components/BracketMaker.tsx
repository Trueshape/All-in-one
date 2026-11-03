import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Shuffle, Trophy } from "lucide-react";
import { Field, TextArea, Button, Notice, Panel, Stack, SectionTitle, Toggle, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { EMPTY, buildTournament } from "../lib/bracket";
import type { Match, Picks, Scores } from "../lib/bracket";

const STORAGE = "utilita365_bracket";
const MAX_PLAYERS = 256;

const winnersTitle = (matches: number, index: number) =>
  matches === 1 ? "Finale" : matches === 2 ? "Semifinali" : matches === 4 ? "Quarti di finale" : matches === 8 ? "Ottavi di finale" : `Turno ${index + 1}`;
const losersTitle = (index: number, total: number) => (index === total - 1 ? "Finale perdenti" : `Perdenti ${index + 1}`);

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

interface Saved {
  text: string;
  picks: Picks;
  scores: Scores;
  double: boolean;
  scoring: boolean;
}

function readSaved(): Saved {
  const fallback: Saved = { text: "Squadra A\nSquadra B\nSquadra C\nSquadra D", picks: {}, scores: {}, double: false, scoring: false };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (saved && typeof saved.text === "string" && saved.picks && typeof saved.picks === "object") {
      return {
        text: saved.text,
        picks: saved.picks,
        scores: saved.scores && typeof saved.scores === "object" ? saved.scores : {},
        double: saved.double === true,
        scoring: saved.scoring === true,
      };
    }
  } catch {
    // no saved data, or storage is blocked
  }
  return fallback;
}

interface Handlers {
  scoring: boolean;
  onPick: (key: string, name: string) => void;
  onScore: (key: string, name: string, delta: number) => void;
}

function MatchCard({ match, scoring, onPick, onScore }: { match: Match } & Handlers) {
  const u = useUi();
  const radius = u.id === "sophisticated" ? "rounded-xl" : u.id === "artistic" ? "rounded" : "";
  const playable = !!match.a && !!match.b;
  return (
    <div className={cx("border overflow-hidden", u.divider, radius)}>
      {([match.a, match.b] as const).map((slot, side) => {
        const won = !!slot && match.winner === slot;
        const label = slot === null ? "—" : slot === EMPTY ? (match.bye ? "— (passa il turno)" : "—") : slot;
        return (
          <button
            key={side}
            type="button"
            disabled={!playable}
            onClick={() => slot && (scoring ? onScore(match.key, slot, 1) : onPick(match.key, slot))}
            onContextMenu={(e) => {
              if (!playable || !scoring || !slot) return;
              e.preventDefault();
              onScore(match.key, slot, -1);
            }}
            className={cx(
              "w-full px-2.5 py-1.5 text-left text-sm border-b last:border-b-0 flex items-center justify-between gap-2 select-none",
              u.divider,
              won ? cx("font-bold", u.accent) : playable && match.winner ? u.muted : u.text,
              playable ? "cursor-pointer" : "cursor-default",
            )}
            title={playable ? (scoring ? "Clic sinistro +1 punto · clic destro −1" : "Clic per scegliere il vincitore") : undefined}
          >
            <span className="truncate">{label}</span>
            {scoring && playable && <span className="font-mono shrink-0">{match.scores[side]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Round({ title, matches, ...handlers }: { title: string; matches: Match[] } & Handlers) {
  return (
    <div className="flex flex-col w-44 shrink-0">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col justify-around flex-1 gap-3 mt-2">
        {matches.map((m) => <MatchCard key={m.key} match={m} {...handlers} />)}
      </div>
    </div>
  );
}

export default function BracketMaker() {
  const u = useUi();
  const [saved] = useState(readSaved);
  const [text, setText] = useState(saved.text);
  const [picks, setPicks] = useState<Picks>(saved.picks);
  const [scores, setScores] = useState<Scores>(saved.scores);
  const [double, setDouble] = useState(saved.double);
  const [scoring, setScoring] = useState(saved.scoring);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ text, picks, scores, double, scoring }));
    } catch {
      // storage unavailable: the bracket still works for this visit
    }
  }, [text, picks, scores, double, scoring]);

  const names = useMemo(() => parseNames(text), [text]);
  const canDouble = names.length >= 3;
  const tournament = useMemo(() => buildTournament(names, { double: double && canDouble, scoring, picks, scores }), [names, double, canDouble, scoring, picks, scores]);
  const { winners, losers, final, champion } = tournament;
  const showLosers = losers.length > 0;

  const shuffle = () => {
    const list = [...names];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setText(list.join("\n"));
    setPicks({});
    setScores({});
  };

  const pick = (key: string, name: string) =>
    setPicks((prev) => {
      const next = { ...prev };
      if (next[key] === name) delete next[key];
      else next[key] = name;
      return next;
    });

  const score = (key: string, name: string, delta: number) =>
    setScores((prev) => {
      const value = Math.max(0, (prev[key]?.[name] ?? 0) + delta);
      return { ...prev, [key]: { ...prev[key], [name]: value } };
    });

  const handlers: Handlers = { scoring, onPick: pick, onScore: score };
  const radius = u.id === "sophisticated" ? "rounded-xl" : u.id === "artistic" ? "rounded" : "";

  return (
    <Stack>
      <Field label={`Partecipanti (uno per riga, massimo ${MAX_PLAYERS})`} hint="Il primo della lista è la testa di serie: con un numero dispari di partecipanti i primi passano il primo turno.">
        <TextArea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Mario\nLuigi\nPeach\nYoshi"} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Shuffle className="w-3.5 h-3.5" />} disabled={names.length < 2} onClick={shuffle}>Mescola</Button>
        <Button icon={<RotateCcw className="w-3.5 h-3.5" />} disabled={!Object.keys(picks).length && !Object.keys(scores).length} onClick={() => { setPicks({}); setScores({}); }}>Azzera risultati</Button>
      </div>
      <Panel className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5">
        <Toggle checked={double && canDouble} onChange={setDouble} label={canDouble ? "Tabellone dei perdenti (doppia eliminazione)" : "Tabellone dei perdenti (servono 3 partecipanti)"} />
        <Toggle checked={scoring} onChange={setScoring} label="Segna i punteggi (clic sinistro +1, destro −1)" />
      </Panel>

      {names.length < 2 ? (
        <Notice>Inserisci almeno due partecipanti per creare il tabellone.</Notice>
      ) : (
        <>
          {champion && (
            <div className={cx("flex items-center justify-center gap-2 p-3 border font-bold", u.divider, u.accent, radius)}>
              <Trophy className="w-5 h-5" /> Vincitore: {champion}
            </div>
          )}
          <div className="overflow-auto pb-2 max-h-[48vh] space-y-6">
            <div className="space-y-2">
              {showLosers && <p className={cx("text-xs font-semibold uppercase tracking-widest", u.subtle)}>Tabellone dei vincenti</p>}
              <div className="flex gap-6 min-w-max">
                {winners.map((matches, r) => <Round key={r} title={winnersTitle(matches.length, r)} matches={matches} {...handlers} />)}
                {final && <Round title="Finalissima" matches={[final]} {...handlers} />}
              </div>
            </div>
            {showLosers && (
              <div className="space-y-2">
                <p className={cx("text-xs font-semibold uppercase tracking-widest", u.subtle)}>Tabellone dei perdenti</p>
                <div className="flex gap-6 min-w-max">
                  {losers.map((matches, r) => <Round key={r} title={losersTitle(r, losers.length)} matches={matches} {...handlers} />)}
                </div>
              </div>
            )}
          </div>
          <Notice>
            {scoring
              ? "Clic sinistro su un giocatore: +1 punto; clic destro: −1. Vince chi è avanti; con il pareggio la partita resta aperta."
              : "Clicca un nome per farlo avanzare, cliccalo di nuovo per annullare."}{" "}
            {showLosers && "Chi perde nel tabellone dei vincenti scende in quello dei perdenti; la finalissima è una sola partita. "}
            Il tabellone viene salvato in questo browser.
          </Notice>
        </>
      )}
    </Stack>
  );
}
