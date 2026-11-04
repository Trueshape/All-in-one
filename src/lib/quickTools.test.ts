import { test } from "node:test";
import assert from "node:assert/strict";
import { codesToText, textToCodes } from "./textCodes";
import { percentChange, percentOf, wholeFrom, whatPercent } from "./percent";
import { computeEta, formatDuration } from "./eta";
import { asciiArt, renderLine } from "./asciiArt";
import { DIAL_CODES, PROVINCES, searchDial, searchProvinces } from "./italyCodes";

test("text to binary and hex, and back", () => {
  assert.equal(textToCodes("Hi", 2), "01001000 01101001");
  assert.equal(textToCodes("Hi", 16), "48 69");
  assert.equal(textToCodes("Hi", 10), "072 105");
  assert.deepEqual(codesToText("01001000 01101001", 2), { ok: true, text: "Hi" });
  assert.deepEqual(codesToText("0x48, 0x69", 16), { ok: true, text: "Hi" });
  assert.deepEqual(codesToText("4869", 16), { ok: true, text: "Hi" });
});

test("accents and emoji survive the round trip through UTF-8", () => {
  for (const base of [2, 8, 10, 16] as const) {
    const text = "è ñ 😀";
    assert.deepEqual(codesToText(textToCodes(text, base), base), { ok: true, text });
  }
});

test("bad codes give an error, not a wrong text", () => {
  assert.equal(codesToText("0102", 2).ok, false);
  assert.equal(codesToText("300", 10).ok, false);
  assert.equal(codesToText("FF", 16).ok, false); // a lone 0xFF is not valid UTF-8
  assert.equal(codesToText("123", 2).ok, false);
});

test("percentages", () => {
  assert.equal(percentOf(20, 150), 30);
  assert.equal(whatPercent(30, 150), 20);
  assert.equal(wholeFrom(30, 20), 150);
  assert.equal(percentChange(80, 100), 25);
  assert.equal(percentChange(100, 80), -20);
  assert.equal(whatPercent(1, 0), null);
  assert.equal(percentChange(0, 5), null);
});

test("ETA: 5 plates in 3 minutes, 500 plates, takes 5 hours", () => {
  const start = new Date("2026-01-01T10:00:00");
  const eta = computeEta(500, 5, 3, "minutes", start);
  assert.ok(eta);
  assert.equal(eta.durationMs, 5 * 3_600_000);
  assert.equal(eta.end.getTime() - start.getTime(), 5 * 3_600_000);
  assert.equal(computeEta(500, 0, 3, "minutes", start), null);
  assert.equal(computeEta(500, 5, 3, "minutes", new Date("nope")), null);
});

test("durations read in Italian", () => {
  assert.equal(formatDuration(5 * 3_600_000 + 10 * 60_000), "5 ore 10 minuti");
  assert.equal(formatDuration(86_400_000 + 3_600_000), "1 giorno 1 ora");
  assert.equal(formatDuration(45_000), "45 secondi");
});

test("ascii art: every glyph has 7 rows and the fill character is used", () => {
  const opt = { fill: "#", scale: 1, spacing: 1, invert: false };
  const art = renderLine("Ab 1", opt);
  assert.equal(art.split("\n").length, 7);
  assert.ok(art.includes("#"));
  assert.equal(renderLine("A", { ...opt, scale: 2 }).split("\n").length, 14);
  assert.equal(asciiArt("A\n\nB", opt).split("\n\n").length, 2);
  assert.equal(renderLine("é", opt), renderLine("e", opt));
});

test("110 provinces with unique sigle", () => {
  assert.equal(PROVINCES.length, 110);
  assert.equal(new Set(PROVINCES.map((p) => p.sigla)).size, 110);
  assert.ok(PROVINCES.every((p) => /^[A-Z]{2}$/.test(p.sigla) && /^0\d+( \/ 0\d+)?$/.test(p.prefix) && /^\d{5}/.test(p.cap)));
});

test("province search by sigla, name, prefix and CAP", () => {
  assert.equal(searchProvinces("MI")[0].name, "Milano");
  assert.deepEqual(searchProvinces("verona").map((p) => p.sigla), ["VR"]);
  assert.deepEqual(searchProvinces("0862").map((p) => p.sigla), ["AQ"]);
  assert.ok(searchProvinces("20121").some((p) => p.sigla === "MI"));
  assert.ok(searchProvinces("friuli").length === 4);
  assert.deepEqual(searchProvinces("0789").map((p) => p.sigla), ["OT"]);
  assert.ok(searchProvinces("079").some((p) => p.sigla === "OT"));
});

test("dialing codes search with or without +", () => {
  assert.ok(DIAL_CODES.length > 80);
  assert.ok(searchDial("+39").some((d) => d.iso === "IT"));
  assert.ok(searchDial("0049").some((d) => d.iso === "DE"));
  assert.equal(searchDial("it")[0].country.length > 0, true);
  assert.ok(searchDial("giappone").some((d) => d.code === "81"));
});
