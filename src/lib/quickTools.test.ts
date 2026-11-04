import { test } from "node:test";
import assert from "node:assert/strict";
import { codesToText, textToCodes } from "./textCodes";
import { percentChange, percentOf, wholeFrom, whatPercent } from "./percent";
import { computeEta, formatDuration } from "./eta";
import { DEFAULT_OPTIONS, asciiArt, renderLine } from "./asciiArt";
import { fitTile, patternSvg } from "./pattern";
import { fromBytes, toBytes, unitLabel } from "./dataSize";
import { splitForSpeech } from "./speech";
import { offsetDifference, zoneOffsetMinutes, zonedTimeToInstant } from "./timeZones";
import { radarPoint, radarSvg } from "./radar";
import { cMidi, noteFrequency, noteName, pianoKeys } from "./piano";
import { morseToText, textToMorse } from "./morse";
import { fromRoman, toRoman } from "./roman";
import { dedupeLines, findReplace, shuffle } from "./textTools";
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

test("ascii art: every glyph has the font height and the fill character is used", () => {
  const opt = DEFAULT_OPTIONS;
  const art = renderLine("Ab 1", opt);
  assert.equal(art.split("\n").length, 7);
  assert.ok(art.includes("#"));
  assert.equal(renderLine("A", { ...opt, scale: 2 }).split("\n").length, 14);
  assert.equal(renderLine("A", { ...opt, font: "slim" }).split("\n").length, 5);
  assert.equal(asciiArt("A\n\nB", opt).split("\n\n").length, 2);
  assert.equal(renderLine("é", opt), renderLine("e", opt));
});

test("ascii art styles: outline leaves the inside empty, shadow adds rows", () => {
  const solid = renderLine("I", { ...DEFAULT_OPTIONS, scale: 3 });
  const outline = renderLine("I", { ...DEFAULT_OPTIONS, scale: 3, style: "outline" });
  assert.ok((outline.match(/#/g) ?? []).length < (solid.match(/#/g) ?? []).length);
  const shadow = renderLine("I", { ...DEFAULT_OPTIONS, style: "shadow" });
  assert.equal(shadow.split("\n").length, 8);
  assert.ok(shadow.includes("."));
});

test("ascii art layout: frame, alignment and comment wrapper", () => {
  const o = { ...DEFAULT_OPTIONS, font: "slim" as const };
  const framed = asciiArt("I", { ...o, frame: "double" }).split("\n");
  assert.equal(framed.length, 7);
  assert.ok(framed[0].startsWith("╔") && framed[6].endsWith("╝"));
  assert.ok(framed.every((l) => Array.from(l).length === Array.from(framed[0]).length));
  const lines = asciiArt("I\nWW", { ...o, align: "right" }).split("\n");
  assert.ok(lines[0].startsWith(" ") && !lines[6].startsWith(" "));
  assert.ok(asciiArt("I", { ...o, comment: "block" }).startsWith("/*\n * "));
  assert.ok(asciiArt("I", { ...o, comment: "slashes" }).split("\n").every((l) => l.startsWith("//")));
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
  assert.ok(DIAL_CODES.length > 240);
  assert.equal(new Set(DIAL_CODES.map((d) => d.iso)).size, DIAL_CODES.length);
  assert.ok(searchDial("+1 876").some((d) => d.iso === "JM"));
  assert.ok(searchDial("1242").some((d) => d.iso === "BS"));
  assert.ok(searchDial("+39").some((d) => d.iso === "IT"));
  assert.ok(searchDial("0049").some((d) => d.iso === "DE"));
  assert.equal(searchDial("it")[0].country.length > 0, true);
  assert.ok(searchDial("giappone").some((d) => d.codes[0] === "81"));
});

test("fitTile: a square image always holds a whole number of equal tiles", () => {
  for (const side of [100, 360, 600, 800, 1000, 1024, 4096]) {
    for (const size of [8, 17, 32, 45, 120]) {
      const t = fitTile(size, side, side);
      assert.ok(Number.isInteger(side / t) && t >= 4, `${side} / ${t}`);
    }
  }
  assert.equal(fitTile(32, 1024, 1024), 32);
  assert.equal(fitTile(30, 1000, 1000), 25);
});

test("fitTile: rectangles use a common divisor, or fit the width when there is none", () => {
  assert.equal(fitTile(32, 800, 600), 25);
  const t = fitTile(32, 801, 600);
  assert.ok(Math.abs(801 / t - Math.round(801 / t)) < 1e-9);
});

test("a fitted pattern svg uses the snapped tile size; grid lines run through the middle of the tile", () => {
  const svg = patternSvg({ type: "grid", size: 30, weight: 4, rotation: 0, fg: "#ffffff", bg: "#000000", width: 1000, height: 1000, fit: true });
  assert.ok(svg.includes('pattern id="p" width="25" height="25"'));
  assert.ok(svg.includes("M0 12.5H25M12.5 0V25"));
});

test("morse converts both ways", () => {
  assert.equal(textToMorse("SOS ciao").code, "... --- ... / -.-. .. .- ---");
  assert.deepEqual(morseToText("... --- ... / -.-. .. .- ---"), { text: "SOS CIAO", unknown: 0 });
  assert.equal(textToMorse("è").code, ".");
  assert.deepEqual(textToMorse("a~b"), { code: ".- -...", skipped: 1 });
  assert.equal(morseToText("...---...").unknown, 1);
});

test("roman numerals round-trip and reject non-canonical forms", () => {
  assert.equal(toRoman(2026), "MMXXVI");
  assert.equal(toRoman(0), null);
  assert.equal(toRoman(4000), null);
  assert.equal(fromRoman("mcmxciv"), 1994);
  assert.equal(fromRoman("IIII"), null);
  assert.equal(fromRoman("VX"), null);
  for (let n = 1; n <= 3999; n++) assert.equal(fromRoman(toRoman(n)!), n);
});

test("find and replace, with options and regex", () => {
  const off = { caseSensitive: false, wholeWord: false, regex: false };
  assert.deepEqual(findReplace("Gatto gatto", "gatto", "cane", off), { result: "cane cane", count: 2 });
  assert.deepEqual(findReplace("Gatto gatto", "gatto", "cane", { ...off, caseSensitive: true }), { result: "Gatto cane", count: 1 });
  assert.deepEqual(findReplace("ora o orario", "ora", "X", { ...off, wholeWord: true }), { result: "X o orario", count: 1 });
  assert.deepEqual(findReplace("a1 b22", "(\\w)(\\d+)", "$2$1", { ...off, regex: true }), { result: "1a 22b", count: 2 });
  assert.deepEqual(findReplace("costo", "costo", "$1", off), { result: "$1", count: 1 });
  assert.ok("error" in findReplace("x", "(", "", { ...off, regex: true }));
});

test("duplicate lines keep the first occurrence", () => {
  const o = { caseSensitive: false, trim: true, skipEmpty: false };
  assert.deepEqual(dedupeLines("a\nA\n b\nb\n\n\n", o), { result: "a\nb\n", removed: 4 });
  assert.deepEqual(dedupeLines("a\nA", { ...o, caseSensitive: true }), { result: "a\nA", removed: 0 });
  assert.deepEqual(dedupeLines("a\n\nb", { ...o, skipEmpty: true }), { result: "a\nb", removed: 1 });
});

test("shuffle keeps the same items", () => {
  const items = Array.from({ length: 50 }, (_, i) => i);
  const out = shuffle(items);
  assert.deepEqual([...out].sort((a, b) => a - b), items);
  assert.equal(items[0], 0);
});

test("data sizes convert in decimal and binary", () => {
  assert.equal(toBytes(1, "KB", "decimal"), 1000);
  assert.equal(toBytes(1, "KB", "binary"), 1024);
  assert.equal(toBytes(8, "bit", "decimal"), 1);
  assert.equal(fromBytes(1_000_000, "MB", "decimal"), 1);
  assert.equal(fromBytes(1024 ** 3, "GB", "binary"), 1);
  assert.equal(unitLabel("MB", "binary"), "MiB");
  assert.equal(unitLabel("B", "binary"), "B");
  assert.equal(unitLabel("bit", "binary"), "bit");
});

test("speech text is cut at sentence ends and never over the limit", () => {
  assert.deepEqual(splitForSpeech("Ciao. Come stai? Bene!"), ["Ciao.", "Come stai?", "Bene!"]);
  assert.deepEqual(splitForSpeech("   "), []);
  const long = "parola ".repeat(100);
  const pieces = splitForSpeech(long, 50);
  assert.ok(pieces.every((p) => p.length <= 50));
  assert.equal(pieces.join(" "), long.trim());
});

test("time zones: offsets, conversion and clock changes", () => {
  const winter = Date.UTC(2026, 0, 15, 12);
  const summer = Date.UTC(2026, 6, 15, 12);
  assert.equal(zoneOffsetMinutes(winter, "Europe/Rome"), 60);
  assert.equal(zoneOffsetMinutes(summer, "Europe/Rome"), 120);
  assert.equal(zoneOffsetMinutes(winter, "Asia/Kolkata"), 330);
  assert.equal(offsetDifference(winter, "Europe/Rome", "America/New_York"), -360);
  // 12:00 in Rome on 15 January is 11:00 UTC.
  assert.equal(zonedTimeToInstant("2026-01-15", "12:00", "Europe/Rome"), Date.UTC(2026, 0, 15, 11));
  assert.equal(zonedTimeToInstant("2026-07-15", "12:00", "Europe/Rome"), Date.UTC(2026, 6, 15, 10));
  // Day of the change to summer time in Rome (29 March 2026): 12:00 is already +2.
  assert.equal(zonedTimeToInstant("2026-03-29", "12:00", "Europe/Rome"), Date.UTC(2026, 2, 29, 10));
  assert.equal(zonedTimeToInstant("2026-01-15", "", "Europe/Rome"), null);
});

test("radar: axis 0 points up, values scale to the radius and text is escaped", () => {
  const top = radarPoint(0, 4, 1);
  assert.equal(Math.round(top.x), 240);
  assert.equal(Math.round(top.y), 90);
  const right = radarPoint(1, 4, 0.5);
  assert.deepEqual([Math.round(right.x), Math.round(right.y)], [315, 240]);
  const svg = radarSvg({ axes: ["A<b>", "B", "C"], series: [{ name: "S", color: "#000000", values: [10, 5, 99] }], max: 10, rings: 2 });
  assert.ok(svg.includes("A&lt;b&gt;"));
  assert.ok(!svg.includes("A<b>"));
  assert.equal((svg.match(/<circle/g) ?? []).length, 3);
  // 99 is clamped to the edge: same point as axis value 10.
  assert.ok(svg.includes("<polygon points=\"240,90 "));
});

test("piano: frequencies, names and key layout", () => {
  assert.equal(noteFrequency(69), 440);
  assert.ok(Math.abs(noteFrequency(60) - 261.6256) < 0.001);
  assert.equal(cMidi(4), 60);
  assert.equal(noteName(60), "Do4");
  assert.equal(noteName(70), "La#4");
  const keys = pianoKeys(3, 3);
  assert.equal(keys.length, 37);
  assert.equal(keys.filter((k) => !k.black).length, 22);
  assert.equal(keys[0].name, "Do3");
  assert.equal(keys[36].name, "Do6");
  // The first black key (Do#) sits after the first white key.
  assert.equal(keys[1].black, true);
  assert.equal(keys[1].white, 1);
});
