import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, convert } from "./units";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("known length, weight and volume equivalences", () => {
  close(convert("lunghezza", 1, "mile", "m"), 1609.344);
  close(convert("lunghezza", 1, "inch", "cm"), 2.54);
  close(convert("lunghezza", 3, "foot", "yard"), 1);
  close(convert("peso", 1, "lb", "oz"), 16);
  close(convert("volume", 1, "gallon", "cup"), 16);
  close(convert("volume", 1, "m3", "l"), 1000);
});

test("known area, speed and energy equivalences", () => {
  close(convert("area", 1, "ha", "m2"), 10000);
  close(convert("area", 1, "km2", "ha"), 100);
  close(convert("velocita", 36, "kmh", "ms"), 10);
  close(convert("velocita", 1, "kt", "kmh"), 1.852);
  close(convert("energia", 1, "kcal", "kj"), 4.184);
  close(convert("energia", 1, "kwh", "wh"), 1000);
});

test("temperature scales", () => {
  close(convert("temperatura", 0, "C", "F"), 32);
  close(convert("temperatura", 100, "C", "F"), 212);
  close(convert("temperatura", 0, "C", "K"), 273.15);
  close(convert("temperatura", -40, "C", "F"), -40);
  close(convert("temperatura", 0, "K", "C"), -273.15);
  close(convert("temperatura", 32, "F", "K"), 273.15);
});

test("every unit has a positive factor and converting there and back returns the start", () => {
  for (const [id, cat] of Object.entries(CATEGORIES)) {
    if (id === "temperatura") continue;
    const keys = Object.keys(cat.units);
    for (const k of keys) assert.ok(cat.units[k].factor > 0, `${id}.${k}`);
    for (const a of keys) for (const b of keys) close(convert(id, convert(id, 7.5, a, b), b, a), 7.5);
    // one unit of the base equals itself
    close(convert(id, 1, keys.find((k) => cat.units[k].factor === 1)!, keys.find((k) => cat.units[k].factor === 1)!), 1);
  }
});
