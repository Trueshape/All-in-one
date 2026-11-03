import { test } from "node:test";
import assert from "node:assert/strict";
import { PASSPHRASE_BITS_PER_WORD, passphrase, pin, pronounceable, randomInt, token } from "./passwordModes";
import { WORDS } from "./wordlist";

test("the word list has only distinct lowercase words", () => {
  assert.equal(new Set(WORDS).size, WORDS.length);
  assert.ok(WORDS.every((w) => /^[a-z]{3,10}$/.test(w)));
  assert.ok(PASSPHRASE_BITS_PER_WORD > 7.5);
});

test("a passphrase has the requested words, separator and extras", () => {
  const plain = passphrase({ words: 4, separator: "-", capitalize: false, number: false }).split("-");
  assert.equal(plain.length, 4);
  assert.ok(plain.every((w) => WORDS.includes(w)));
  const fancy = passphrase({ words: 3, separator: " ", capitalize: true, number: true }).split(" ");
  assert.equal(fancy.length, 4);
  assert.ok(/^[A-Z]/.test(fancy[0]) && /^\d\d$/.test(fancy[3]));
});

test("a pronounceable password alternates consonants and vowels", () => {
  const value = pronounceable(9, false);
  assert.equal(value.length, 9);
  assert.match(value, /^([bcdfglmnprstvz][aeiou])*[bcdfglmnprstvz]$/);
  assert.match(pronounceable(6, true), /^[A-Z]/);
});

test("PIN and tokens have the right length and alphabet", () => {
  assert.match(pin(6), /^\d{6}$/);
  assert.match(token(16, "hex"), /^[0-9a-f]{32}$/);
  assert.match(token(16, "base64url"), /^[A-Za-z0-9_-]{22}$/);
});

test("randomInt stays inside the range", () => {
  for (let i = 0; i < 200; i++) assert.ok(randomInt(7) < 7);
});
