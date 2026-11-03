import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBracket, champion } from "./bracket";

test("4 players make 2 rounds, with seed 1 against 4 and 2 against 3", () => {
  const rounds = buildBracket(["A", "B", "C", "D"]);
  assert.equal(rounds.length, 2);
  assert.deepEqual(rounds[0].map((m) => [m.a, m.b]), [["A", "D"], ["B", "C"]]);
});

test("5 players: the top 3 seeds get a bye and move on", () => {
  const rounds = buildBracket(["A", "B", "C", "D", "E"]);
  assert.equal(rounds[0].length, 4);
  assert.deepEqual(rounds[0].filter((m) => m.bye).map((m) => m.winner).sort(), ["A", "B", "C"]);
});

test("picked winners move up and the final decides the champion", () => {
  const picks = { "0-0": "A", "0-1": "C", "1-0": "C" };
  const rounds = buildBracket(["A", "B", "C", "D"], picks);
  assert.deepEqual(rounds[1][0], { a: "A", b: "C", winner: "C", bye: false });
  assert.equal(champion(rounds), "C");
});

test("a pick whose player is no longer in the match is ignored", () => {
  const rounds = buildBracket(["A", "B", "C", "D"], { "0-0": "D", "0-1": "B", "1-0": "A" });
  assert.equal(rounds[1][0].winner, null);
  assert.equal(champion(rounds), null);
});

test("fewer than 2 players make no bracket", () => {
  assert.deepEqual(buildBracket(["A"]), []);
});
