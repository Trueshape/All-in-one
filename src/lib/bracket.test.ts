import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY, buildTournament } from "./bracket";
import type { Options, Tournament } from "./bracket";

const base: Options = { double: false, scoring: false, picks: {}, scores: {} };
const single = (names: string[], picks = {}) => buildTournament(names, { ...base, picks });
const double = (names: string[], picks = {}) => buildTournament(names, { ...base, double: true, picks });

/** Plays every pending match by always choosing the first player, until nothing is left to play. */
function playOut(names: string[], o: Options): { t: Tournament; picks: Record<string, string> } {
  const picks: Record<string, string> = {};
  for (let guard = 0; guard < 2000; guard++) {
    const t = buildTournament(names, { ...o, picks });
    const all = [...t.winners.flat(), ...t.losers.flat(), ...(t.final ? [t.final] : [])];
    const open = all.find((m) => m.a && m.b && !m.winner);
    if (!open) return { t, picks };
    picks[open.key] = open.a as string;
  }
  throw new Error("tournament did not finish");
}

test("4 players make 2 rounds, with seed 1 against 4 and 2 against 3", () => {
  const { winners } = single(["A", "B", "C", "D"]);
  assert.equal(winners.length, 2);
  assert.deepEqual(winners[0].map((m) => [m.a, m.b]), [["A", "D"], ["B", "C"]]);
});

test("5 players: the top 3 seeds get a bye and move on", () => {
  const { winners } = single(["A", "B", "C", "D", "E"]);
  assert.equal(winners[0].length, 4);
  assert.deepEqual(winners[0].filter((m) => m.bye).map((m) => m.winner).sort(), ["A", "B", "C"]);
});

test("picked winners move up and the final decides the champion", () => {
  const t = single(["A", "B", "C", "D"], { "0-0": "A", "0-1": "C", "1-0": "C" });
  assert.deepEqual([t.winners[1][0].a, t.winners[1][0].b, t.winners[1][0].winner], ["A", "C", "C"]);
  assert.equal(t.champion, "C");
});

test("a pick whose player is no longer in the match is ignored", () => {
  const t = single(["A", "B", "C", "D"], { "0-0": "D", "0-1": "B", "1-0": "A" });
  assert.equal(t.winners[1][0].winner, null);
  assert.equal(t.champion, null);
});

test("fewer than 2 players make no bracket", () => {
  assert.deepEqual(single(["A"]), { winners: [], losers: [], final: null, champion: null });
});

test("256 players make 8 rounds with 128 first-round matches and no byes", () => {
  const { winners } = single(Array.from({ length: 256 }, (_, i) => `P${i + 1}`));
  assert.equal(winners.length, 8);
  assert.equal(winners[0].length, 128);
  assert.ok(winners[0].every((m) => !m.bye));
  assert.deepEqual([winners[0][0].a, winners[0][0].b], ["P1", "P256"]);
});

test("double elimination, 4 players: losers' bracket has 2 rounds of 1 match, then a grand final", () => {
  const t = double(["A", "B", "C", "D"], { "0-0": "A", "0-1": "B", "1-0": "A" });
  assert.deepEqual(t.losers.map((r) => r.length), [1, 1]);
  // Round 1 of the losers: the two first-round losers meet.
  assert.deepEqual([t.losers[0][0].a, t.losers[0][0].b], ["D", "C"]);
  // The loser of the winners' final drops to the last losers' round.
  assert.equal(t.losers[1][0].b, "B");
  assert.ok(t.final);
});

test("double elimination: a full run ends with a champion and every match played", () => {
  const { t } = playOut(["A", "B", "C", "D", "E", "F", "G", "H"], { ...base, double: true });
  assert.equal(t.champion, "A");
  assert.deepEqual(t.losers.map((r) => r.length), [2, 2, 1, 1]);
  assert.ok([...t.winners.flat(), ...t.losers.flat()].every((m) => m.winner !== null));
});

test("double elimination with byes (3 and 5 players) still finishes", () => {
  for (const n of [3, 5, 6, 7]) {
    const names = Array.from({ length: n }, (_, i) => `P${i + 1}`);
    const { t } = playOut(names, { ...base, double: true });
    assert.equal(t.champion, "P1", `${n} players`);
  }
});

test("empty seats never reach the champion or a player's name", () => {
  const { t } = playOut(["A", "B", "C"], { ...base, double: true });
  for (const m of [...t.winners.flat(), ...t.losers.flat()]) {
    if (m.a === EMPTY && m.b === EMPTY) assert.equal(m.winner, EMPTY);
  }
  assert.ok(t.champion && t.champion !== EMPTY);
});

test("2 players have no losers' bracket even with double elimination on", () => {
  const t = double(["A", "B"]);
  assert.equal(t.losers.length, 0);
  assert.equal(t.final, null);
});

test("with scoring on, the player with more points wins and a tie decides nothing", () => {
  const o: Options = { ...base, scoring: true, scores: { "0-0": { A: 3, D: 1 }, "0-1": { B: 2, C: 2 } } };
  const t = buildTournament(["A", "B", "C", "D"], o);
  assert.equal(t.winners[0][0].winner, "A");
  assert.equal(t.winners[0][0].loser, "D");
  assert.deepEqual(t.winners[0][0].scores, [3, 1]);
  assert.equal(t.winners[0][1].winner, null);
});

test("with scoring on, manual picks are ignored", () => {
  const t = buildTournament(["A", "B", "C", "D"], { ...base, scoring: true, picks: { "0-0": "D" } });
  assert.equal(t.winners[0][0].winner, null);
});

test("256 players in double elimination: 14 losers' rounds", () => {
  const t = double(Array.from({ length: 256 }, (_, i) => `P${i + 1}`));
  assert.equal(t.losers.length, 14);
  assert.deepEqual([t.losers[0].length, t.losers[1].length, t.losers[13].length], [64, 64, 1]);
});
