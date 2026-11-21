import test from "node:test";
import assert from "node:assert/strict";
import { buildMatrix, contrast, wifiPayload } from "./qr";

test("wifi payload escapes the characters that end a field", () => {
  assert.equal(wifiPayload("Casa", "segreta", "WPA"), "WIFI:T:WPA;S:Casa;P:segreta;;");
  assert.equal(wifiPayload("a;b:c", 'p"w,\\', "WPA"), 'WIFI:T:WPA;S:a\\;b\\:c;P:p\\"w\\,\\\\;;');
});

test("an open network has no password field, and no name gives no payload", () => {
  assert.equal(wifiPayload("Ospiti", "ignorata", "nopass"), "WIFI:T:nopass;S:Ospiti;;");
  assert.equal(wifiPayload("", "x", "WPA"), "");
});

test("the matrix is square, with the finder pattern in the corners", () => {
  const m = buildMatrix("https://example.com", "M");
  assert.ok(m.length >= 21 && m.length % 4 === 1);
  assert.ok(m.every((row) => row.length === m.length));
  // top-left finder: a dark 7×7 frame
  for (let i = 0; i < 7; i++) {
    assert.equal(m[0][i], true);
    assert.equal(m[6][i], true);
    assert.equal(m[i][0], true);
    assert.equal(m[i][6], true);
  }
  assert.equal(m[1][1], false);
});

test("accents and emoji are encoded as UTF-8, not Latin-1", () => {
  // the same length in characters needs a bigger code once the bytes are UTF-8
  const plain = buildMatrix("a".repeat(30), "L").length;
  const accented = buildMatrix("è".repeat(30), "L").length;
  assert.ok(accented > plain);
  assert.doesNotThrow(() => buildMatrix("ciao 😀", "H"));
});

test("data that does not fit at the level throws", () => {
  assert.throws(() => buildMatrix("x".repeat(3000), "H"));
});

test("contrast runs from 1 to 21", () => {
  assert.equal(Math.round(contrast("#000000", "#ffffff")), 21);
  assert.equal(contrast("#336699", "#336699"), 1);
  assert.equal(contrast("#000000", "#ffffff"), contrast("#ffffff", "#000000"));
});
