import { test } from "node:test";
import assert from "node:assert/strict";
import { decode, encode, nameCode, surnameCode } from "./codiceFiscale";

const input = { surname: "Rossi", name: "Mario", birthDate: "1980-01-01", sex: "M" as const, belfiore: "H501" };

test("encodes the well-known Mario Rossi example", () => {
  const result = encode(input);
  assert.ok("code" in result);
  assert.equal(result.code, "RSSMRA80A01H501U");
});

test("short names are padded with X, and 4+ consonants skip the second one", () => {
  assert.equal(surnameCode("Fo"), "FOX");
  assert.equal(nameCode("Gianfranco"), "GFR");
});

test("decodes sex, date and a valid check character", () => {
  const decoded = decode("RSSMRA80A01H501U");
  assert.ok("code" in decoded);
  assert.equal(decoded.sex, "Maschio");
  assert.equal(decoded.day, 1);
  assert.equal(decoded.year, 1980);
  assert.equal(decoded.alternativeYear, null);
  assert.equal(decoded.checkValid, true);
});

test("a wrong check character is reported", () => {
  const decoded = decode("RSSMRA80A01H501X");
  assert.ok("code" in decoded);
  assert.equal(decoded.checkValid, false);
});

test("a two-digit year that could be 19xx or 20xx offers both", () => {
  const encoded = encode({ ...input, birthDate: "2005-03-15", sex: "F" });
  assert.ok("code" in encoded);
  const decoded = decode(encoded.code);
  assert.ok("code" in decoded);
  assert.equal(decoded.sex, "Femmina");
  assert.equal(decoded.year, 2005);
  assert.equal(decoded.alternativeYear, 1905);
});

test("an impossible date is rejected", () => {
  assert.ok("error" in encode({ ...input, birthDate: "2021-02-30" }));
});
