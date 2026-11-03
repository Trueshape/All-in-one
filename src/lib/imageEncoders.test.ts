import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeBmp, encodeIco, encodeTiff } from "./imageEncoders";

// 2 x 1 image: a red pixel then a transparent blue one.
const image = { width: 2, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 0]) };

test("BMP: header, size and BGR order, with transparency flattened over white", () => {
  const bmp = encodeBmp(image);
  assert.equal(String.fromCharCode(bmp[0], bmp[1]), "BM");
  assert.equal(bmp.length, 54 + 8); // one row of 6 bytes padded to 8
  assert.deepEqual([...bmp.slice(54, 60)], [0, 0, 255, 255, 255, 255]);
});

test("TIFF: little-endian header and one RGBA strip", () => {
  const tiff = encodeTiff(image);
  assert.equal(String.fromCharCode(tiff[0], tiff[1]), "II");
  assert.equal(new DataView(tiff.buffer).getUint16(2, true), 42);
  assert.equal(tiff.length, 142 + 8);
  assert.deepEqual([...tiff.slice(142, 146)], [255, 0, 0, 255]);
});

test("ICO: wraps the PNG after a 22-byte header", () => {
  const ico = encodeIco(new Uint8Array([1, 2, 3]), 256, 32);
  assert.equal(ico.length, 25);
  assert.equal(ico[6], 0); // 256 is stored as 0
  assert.equal(ico[7], 32);
  assert.deepEqual([...ico.slice(22)], [1, 2, 3]);
});
