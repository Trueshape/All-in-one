/** Minimal encoders for formats the browser canvas cannot write. Input is RGBA pixel data. */
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

/** 24-bit BMP. Transparent pixels are flattened over white, like JPEG. */
export function encodeBmp({ width, height, data }: Pixels): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const imageSize = rowSize * height;
  const out = new Uint8Array(54 + imageSize);
  const view = new DataView(out.buffer);
  out[0] = 0x42;
  out[1] = 0x4d;
  view.setUint32(2, out.length, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  for (let y = 0; y < height; y++) {
    // BMP rows are stored bottom-up.
    const row = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] / 255;
      for (let c = 0; c < 3; c++) out[row + x * 3 + (2 - c)] = Math.round(data[i + c] * a + 255 * (1 - a));
    }
  }
  return out;
}

/** Uncompressed little-endian RGBA TIFF in a single strip. */
export function encodeTiff({ width, height, data }: Pixels): Uint8Array {
  const entries = 10;
  const ifdSize = 2 + entries * 12 + 4;
  const bitsOffset = 8 + ifdSize;
  const pixelOffset = bitsOffset + 8;
  const byteCount = width * height * 4;
  const out = new Uint8Array(pixelOffset + byteCount);
  const view = new DataView(out.buffer);
  out[0] = 0x49;
  out[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);
  view.setUint16(8, entries, true);
  let at = 10;
  const entry = (tag: number, type: 3 | 4, count: number, value: number) => {
    view.setUint16(at, tag, true);
    view.setUint16(at + 2, type, true);
    view.setUint32(at + 4, count, true);
    if (type === 3 && count === 1) view.setUint16(at + 8, value, true);
    else view.setUint32(at + 8, value, true);
    at += 12;
  };
  entry(256, 4, 1, width);
  entry(257, 4, 1, height);
  entry(258, 3, 4, bitsOffset);
  entry(259, 3, 1, 1);
  entry(262, 3, 1, 2);
  entry(273, 4, 1, pixelOffset);
  entry(277, 3, 1, 4);
  entry(278, 4, 1, height);
  entry(279, 4, 1, byteCount);
  entry(338, 3, 1, 2);
  for (let i = 0; i < 4; i++) view.setUint16(bitsOffset + i * 2, 8, true);
  out.set(data.subarray(0, byteCount), pixelOffset);
  return out;
}

/** ICO holding one PNG image (up to 256 × 256 px). */
export function encodeIco(png: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(22 + png.length);
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  out[6] = width >= 256 ? 0 : width;
  out[7] = height >= 256 ? 0 : height;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true);
  out.set(png, 22);
  return out;
}

const GIF_LEVELS = 6;
const GIF_TRANSPARENT = GIF_LEVELS ** 3;

/** Single-frame GIF with a fixed 6x6x6 colour palette, Floyd-Steinberg dithering and one transparent index (alpha under 128). */
export function encodeGif({ width, height, data }: Pixels): Uint8Array {
  const step = 255 / (GIF_LEVELS - 1);
  const work = Float32Array.from(data);
  const indices = new Uint8Array(width * height);
  const spread = (x: number, y: number, c: number, err: number, weight: number) => {
    if (x < 0 || x >= width || y >= height) return;
    work[(y * width + x) * 4 + c] += err * weight;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (work[i + 3] < 128) {
        indices[y * width + x] = GIF_TRANSPARENT;
        continue;
      }
      let index = 0;
      for (let c = 0; c < 3; c++) {
        const level = Math.min(GIF_LEVELS - 1, Math.max(0, Math.round(work[i + c] / step)));
        index = index * GIF_LEVELS + level;
        const err = work[i + c] - level * step;
        spread(x + 1, y, c, err, 7 / 16);
        spread(x - 1, y + 1, c, err, 3 / 16);
        spread(x, y + 1, c, err, 5 / 16);
        spread(x + 1, y + 1, c, err, 1 / 16);
      }
      indices[y * width + x] = index;
    }
  }

  const bytes: number[] = [];
  const word = (n: number) => bytes.push(n & 255, n >> 8);
  bytes.push(...[..."GIF89a"].map((ch) => ch.charCodeAt(0)));
  word(width);
  word(height);
  bytes.push(0xf7, 0, 0); // global 256-colour table, background 0, square pixels
  for (let n = 0; n < 256; n++) {
    if (n < GIF_TRANSPARENT) {
      const r = Math.floor(n / (GIF_LEVELS * GIF_LEVELS));
      const g = Math.floor(n / GIF_LEVELS) % GIF_LEVELS;
      bytes.push(Math.round(r * step), Math.round(g * step), Math.round((n % GIF_LEVELS) * step));
    } else bytes.push(0, 0, 0);
  }
  bytes.push(0x21, 0xf9, 4, 0x01, 0, 0, GIF_TRANSPARENT, 0); // transparent colour index
  bytes.push(0x2c);
  word(0);
  word(0);
  word(width);
  word(height);
  bytes.push(0, 8); // no local table, LZW minimum code size 8

  // LZW: codes start at 9 bits and grow; the table is reset with a clear code when full.
  const CLEAR = 256;
  const END = 257;
  const packed: number[] = [];
  let acc = 0;
  let accBits = 0;
  let codeSize = 9;
  const emit = (code: number) => {
    acc |= code << accBits;
    accBits += codeSize;
    while (accBits >= 8) {
      packed.push(acc & 255);
      acc >>>= 8;
      accBits -= 8;
    }
  };
  let table = new Map<number, number>();
  let next = END + 1;
  emit(CLEAR);
  let prefix = indices[0];
  for (let p = 1; p < indices.length; p++) {
    const key = prefix * 256 + indices[p];
    const hit = table.get(key);
    if (hit !== undefined) {
      prefix = hit;
      continue;
    }
    emit(prefix);
    if (next === 4096) {
      emit(CLEAR);
      table = new Map();
      next = END + 1;
      codeSize = 9;
    } else {
      table.set(key, next++);
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    }
    prefix = indices[p];
  }
  emit(prefix);
  emit(END);
  if (accBits > 0) packed.push(acc & 255);
  for (let p = 0; p < packed.length; p += 255) {
    const chunk = packed.slice(p, p + 255);
    bytes.push(chunk.length, ...chunk);
  }
  bytes.push(0, 0x3b);
  return Uint8Array.from(bytes);
}
