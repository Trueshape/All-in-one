export interface Match {
  a: string | null;
  b: string | null;
  winner: string | null;
  /** True when one side is empty from the start (the other player moves on without playing). */
  bye: boolean;
}

/** Winner chosen by hand, keyed by `${round}-${match}`. A pick only counts while that name is still in the match. */
export type Picks = Record<string, string>;

/** Seed positions for a bracket of `size` (power of two): 1 plays last, 2 the second to last, and so on. */
function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const total = order.length * 2;
    order = order.flatMap((seed) => [seed, total + 1 - seed]);
  }
  return order;
}

/** Single-elimination rounds. Names are in seed order: the first name is the top seed and gets any bye. */
export function buildBracket(names: string[], picks: Picks = {}): Match[][] {
  if (names.length < 2) return [];
  let size = 2;
  while (size < names.length) size *= 2;
  const slots = seedOrder(size).map((seed) => names[seed - 1] ?? null);

  const rounds: Match[][] = [];
  let entrants: Array<string | null> = slots;
  for (let r = 0; entrants.length > 1; r++) {
    const matches: Match[] = [];
    for (let i = 0; i < entrants.length; i += 2) {
      const a = entrants[i];
      const b = entrants[i + 1];
      const bye = r === 0 && (a === null) !== (b === null);
      const picked = picks[`${r}-${i / 2}`];
      const winner = bye ? (a ?? b) : picked !== undefined && (picked === a || picked === b) ? picked : null;
      matches.push({ a, b, winner, bye });
    }
    rounds.push(matches);
    entrants = matches.map((m) => m.winner);
  }
  return rounds;
}

export const champion = (rounds: Match[][]): string | null => rounds.at(-1)?.[0]?.winner ?? null;
