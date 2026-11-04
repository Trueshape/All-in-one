import { test } from "node:test";
import assert from "node:assert/strict";
import { applyVolume, durationOf, encodeFlac, encodeWav, normalizeGain, sliceAudio, splitRanges, waveformPeaks } from "./audioOps";
import type { Pcm } from "./audioOps";

const tone = (seconds: number, sampleRate = 8000): Pcm => ({
  sampleRate,
  channels: [Float32Array.from({ length: seconds * sampleRate }, (_, i) => Math.sin((i / sampleRate) * 440 * 2 * Math.PI) * 0.5)],
});

test("slice keeps the requested part and clamps the range", () => {
  const pcm = tone(2);
  assert.equal(durationOf(sliceAudio(pcm, 0.5, 1.5)), 1);
  assert.equal(durationOf(sliceAudio(pcm, -3, 99)), 2);
  assert.equal(durationOf(sliceAudio(pcm, 1.5, 1)), 0);
});

test("volume scales, clamps and fades", () => {
  const flat: Pcm = { sampleRate: 4, channels: [new Float32Array([0.5, 0.5, 0.5, 0.5])] };
  assert.deepEqual([...applyVolume(flat, 2).channels[0]], [1, 1, 1, 1]);
  assert.deepEqual([...applyVolume(flat, 4).channels[0]], [1, 1, 1, 1]); // clipped, not wrapped
  const faded = applyVolume(flat, 1, 1, 0).channels[0];
  assert.deepEqual([...faded], [0, 0.125, 0.25, 0.375]);
  assert.equal(applyVolume(flat, 1, 0, 1).channels[0][3], 0);
  assert.ok(Math.abs(normalizeGain(flat) * 0.5 - 0.98) < 1e-6);
});

test("split ranges cover the duration with a shorter last part", () => {
  assert.deepEqual(splitRanges(10, 4), [{ start: 0, end: 4 }, { start: 4, end: 8 }, { start: 8, end: 10 }]);
  assert.deepEqual(splitRanges(8, 4).length, 2);
  assert.deepEqual(splitRanges(5, 0), []);
});

test("waveform peaks follow the loudest sample of each slice", () => {
  const pcm: Pcm = { sampleRate: 4, channels: [new Float32Array([0.1, -0.9, 0.2, 0.3])] };
  assert.deepEqual(waveformPeaks(pcm, 2).map((n) => Math.round(n * 10)), [9, 3]);
});

test("WAV: header and 16-bit samples", () => {
  const wav = encodeWav({ sampleRate: 8000, channels: [new Float32Array([0, 1, -1])] });
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), "RIFF");
  assert.equal(wav.length, 44 + 6);
  const view = new DataView(wav.buffer);
  assert.equal(view.getUint32(24, true), 8000);
  assert.deepEqual([view.getInt16(44, true), view.getInt16(46, true), view.getInt16(48, true)], [0, 32767, -32768]);
});

test("FLAC: stream header, STREAMINFO and compression of a tone", () => {
  const pcm = tone(1);
  const flac = encodeFlac(pcm);
  assert.equal(String.fromCharCode(...flac.slice(0, 4)), "fLaC");
  assert.equal(flac[4], 0x80);
  assert.ok(flac.length < 8000 * 2 * 0.7, `expected compression, got ${flac.length} bytes`);
  assert.equal(flac[42], 0xff); // first frame sync
  assert.equal(flac[43] & 0xfc, 0xf8);
});
