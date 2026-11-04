import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeBmp, encodeGif, encodeIco, encodeTiff } from "./imageEncoders";

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

/** Reads back the palette indices of a single-frame GIF written by encodeGif. */
function decodeGifIndices(gif: Uint8Array): number[] {
  const at = 13 + 768 + 8 + 10; // header + palette + graphic control + image descriptor
  let p = at + 1; // skip the minimum code size
  const data: number[] = [];
  while (gif[p] !== 0) {
    data.push(...gif.slice(p + 1, p + 1 + gif[p]));
    p += gif[p] + 1;
  }
  const out: number[] = [];
  let table: number[][] = [];
  let size = 9;
  let prev: number[] | null = null;
  let acc = 0;
  let bits = 0;
  let pos = 0;
  const reset = () => {
    table = Array.from({ length: 258 }, (_, i) => (i < 256 ? [i] : []));
    size = 9;
    prev = null;
  };
  reset();
  for (;;) {
    while (bits < size && pos < data.length) {
      acc |= data[pos++] << bits;
      bits += 8;
    }
    const code = acc & ((1 << size) - 1);
    acc >>>= size;
    bits -= size;
    if (code === 256) { reset(); continue; }
    if (code === 257) break;
    const entry: number[] = code < table.length ? table[code] : [...prev!, prev![0]];
    out.push(...entry);
    if (prev) table.push([...prev, entry[0]]);
    prev = entry;
    if (table.length >= 1 << size && size < 12) size++;
  }
  return out;
}

test("GIF: header, size, and pixels survive the LZW round trip", () => {
  const gif = encodeGif(image);
  assert.equal(String.fromCharCode(...gif.slice(0, 6)), "GIF89a");
  assert.equal(new DataView(gif.buffer).getUint16(6, true), 2);
  assert.equal(gif[gif.length - 1], 0x3b);
  assert.deepEqual(decodeGifIndices(gif), [180, 216]); // red in the 6x6x6 palette, then transparent
});

test("GIF: a large noisy image fills the LZW table and still decodes exactly", () => {
  const width = 200;
  const height = 100;
  const data = new Uint8ClampedArray(width * height * 4);
  let seed = 7;
  for (let i = 0; i < data.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; data[i] = i % 4 === 3 ? 255 : seed >> 8; }
  const indices = decodeGifIndices(encodeGif({ width, height, data }));
  assert.equal(indices.length, width * height);
  assert.ok(indices.every((n) => n < 216));
});
