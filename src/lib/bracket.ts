/**
 * A seat in a match: the player's name, `null` while it is not decided yet, or `EMPTY` when nobody
 * will ever sit there (a bye in the first round, or a loser that never existed).
 */
export type Slot = string | null;
export const EMPTY = "";

/** Winner chosen by hand, keyed by match key. A pick only counts while that name is still in the match. */
export type Picks = Record<string, string>;
/** Points per player in a match, keyed by match key and then by player name. */
export type Scores = Record<string, Record<string, number>>;

export interface Options {
  /** Add the losers' bracket and a grand final (needs at least 3 players). */
  double: boolean;
  /** Decide each match by its points instead of a manual pick. */
  scoring: boolean;
  picks: Picks;
  scores: Scores;
}

export interface Match {
  /** "0-1" winners' bracket round 0 match 1, "L2-0" losers' bracket round 2 match 0, "GF" grand final. */
  key: string;
  a: Slot;
  b: Slot;
  winner: Slot;
  loser: Slot;
  /** One side is EMPTY and the other a player, who simply moves on. */
  bye: boolean;
  scores: [number, number];
}

export interface Tournament {
  winners: Match[][];
  losers: Match[][];
  final: Match | null;
  champion: string | null;
}

/** Seed positions for a bracket of `size` (power of two): 1 plays last, 2 the second to last, and so on. */
function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const total = order.length * 2;
    order = order.flatMap((seed) => [seed, total + 1 - seed]);
  }
  return order;
}

function play(key: string, a: Slot, b: Slot, o: Options): Match {
  const points = (slot: Slot) => (slot ? o.scores[key]?.[slot] ?? 0 : 0);
  const scores: [number, number] = [points(a), points(b)];
  let winner: Slot = null;
  let loser: Slot = null;
  let bye = false;

  if (a === EMPTY && b === EMPTY) {
    winner = EMPTY;
    loser = EMPTY;
  } else if (a === EMPTY || b === EMPTY) {
    const other = a === EMPTY ? b : a;
    // The other seat may still be waiting for a result: then nothing is decided yet.
    if (other) {
      winner = other;
      loser = EMPTY;
      bye = true;
    }
  } else if (a && b) {
    if (o.scoring) {
      if (scores[0] > scores[1]) [winner, loser] = [a, b];
      else if (scores[1] > scores[0]) [winner, loser] = [b, a];
    } else {
      const picked = o.picks[key];
      if (picked === a) [winner, loser] = [a, b];
      else if (picked === b) [winner, loser] = [b, a];
    }
  }
  return { key, a, b, winner, loser, bye, scores };
}

/**
 * Single or double elimination rounds. Names are in seed order: the first name is the top seed and
 * gets any bye. In the losers' bracket the first round pairs the first-round losers, then each round
 * alternates between "survivors play each other" and "survivors meet the players dropping from above".
 */
export function buildTournament(names: string[], o: Options): Tournament {
  if (names.length < 2) return { winners: [], losers: [], final: null, champion: null };
  let size = 2;
  while (size < names.length) size *= 2;

  const winners: Match[][] = [];
  let entrants: Slot[] = seedOrder(size).map((seed) => names[seed - 1] ?? EMPTY);
  for (let r = 0; entrants.length > 1; r++) {
    const matches: Match[] = [];
    for (let i = 0; i < entrants.length; i += 2) matches.push(play(`${r}-${i / 2}`, entrants[i], entrants[i + 1], o));
    winners.push(matches);
    entrants = matches.map((m) => m.winner);
  }

  const rounds = winners.length;
  const losers: Match[][] = [];
  let final: Match | null = null;
  if (o.double && rounds >= 2) {
    let survivors: Slot[] = [];
    for (let r = 1; r <= 2 * (rounds - 1); r++) {
      const matches: Match[] = [];
      if (r === 1) {
        const drops = winners[0].map((m) => m.loser);
        for (let i = 0; i < drops.length; i += 2) matches.push(play(`L${r}-${i / 2}`, drops[i], drops[i + 1], o));
      } else if (r % 2 === 0) {
        const drops = winners[r / 2].map((m) => m.loser);
        survivors.forEach((s, i) => matches.push(play(`L${r}-${i}`, s, drops[i], o)));
      } else {
        for (let i = 0; i < survivors.length; i += 2) matches.push(play(`L${r}-${i / 2}`, survivors[i], survivors[i + 1], o));
      }
      losers.push(matches);
      survivors = matches.map((m) => m.winner);
    }
    final = play("GF", winners[rounds - 1][0].winner, losers[losers.length - 1][0].winner, o);
  }

  const last = final ?? winners[rounds - 1][0];
  return { winners, losers, final, champion: last.winner || null };
}
