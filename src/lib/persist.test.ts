import assert from "node:assert/strict";
import test from "node:test";
import { parseSaved } from "./persist";

test("nothing saved gives the initial value", () => {
  assert.equal(parseSaved(null, "1995-05-15"), "1995-05-15");
  assert.equal(parseSaved(null, 2000), 2000);
});

test("a saved value of the same type is used", () => {
  assert.equal(parseSaved(JSON.stringify("2001-01-01"), "1995-05-15"), "2001-01-01");
  assert.equal(parseSaved(JSON.stringify(1990), 2000), 1990);
});

test("a value of another type, or broken JSON, gives the initial value", () => {
  assert.equal(parseSaved(JSON.stringify(12), "100"), "100");
  assert.equal(parseSaved(JSON.stringify("2000"), 2000), 2000);
  assert.equal(parseSaved("{not json", "EUR"), "EUR");
});

test("clearPersisted forgets only the keys of fields that are mounted", async () => {
  const store = new Map<string, string>([["tool:a", "1"], ["tool:b", "2"]]);
  (globalThis as { localStorage?: unknown }).localStorage = { removeItem: (k: string) => void store.delete(k) };
  const { clearPersisted } = await import("./persist");
  clearPersisted(); // nothing is mounted in a plain test run
  assert.equal(store.size, 2);
});
