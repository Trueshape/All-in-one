import test from "node:test";
import assert from "node:assert/strict";
import { MARKUP, relative } from "./discord";

const wrap = (id: string, s: string) => MARKUP.find((m) => m.id === id)!.wrap(s);

test("each markup wraps the text the way Discord reads it", () => {
  assert.equal(wrap("bold", "ciao"), "**ciao**");
  assert.equal(wrap("italic", "ciao"), "*ciao*");
  assert.equal(wrap("underline", "ciao"), "__ciao__");
  assert.equal(wrap("strike", "ciao"), "~~ciao~~");
  assert.equal(wrap("spoiler", "ciao"), "||ciao||");
  assert.equal(wrap("code", "ciao"), "`ciao`");
  assert.equal(wrap("header", "ciao"), "# ciao");
  assert.equal(wrap("subtext", "ciao"), "-# ciao");
  assert.equal(wrap("silent", "https://a.it"), "<https://a.it>");
});

test("a quote marks every line, a code block keeps the lines", () => {
  assert.equal(wrap("quote", "uno\ndue"), "> uno\n> due");
  assert.equal(wrap("block", "a\nb"), "```\na\nb\n```");
});

test("relative time uses the largest unit that fits", () => {
  const now = Date.UTC(2026, 10, 21, 12, 0, 0);
  const at = (seconds: number) => relative(new Date(now + seconds * 1000), now);
  assert.equal(at(0), "ora");
  assert.equal(at(-3 * 3600), "3 ore fa");
  assert.equal(at(3 * 86_400), "tra 3 giorni");
  assert.equal(at(86_400), "domani");
  assert.equal(at(-86_400), "ieri");
  assert.equal(at(90 * 86_400), "tra 3 mesi");
});

test("every markup id is unique", () => {
  assert.equal(new Set(MARKUP.map((m) => m.id)).size, MARKUP.length);
});
