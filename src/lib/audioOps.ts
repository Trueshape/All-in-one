/** Plain PCM audio (one Float32Array per channel, samples in -1..1), so the operations run and test without the Web Audio API. */
export interface Pcm {
  sampleRate: number;
  channels: Float32Array[];
}

export const durationOf = (pcm: Pcm) => (pcm.channels[0]?.length ?? 0) / pcm.sampleRate;

/** Copy of the part between two times, in seconds. */
export function sliceAudio(pcm: Pcm, start: number, end: number): Pcm {
  const length = pcm.channels[0]?.length ?? 0;
  const from = Math.min(length, Math.max(0, Math.round(start * pcm.sampleRate)));
  const to = Math.min(length, Math.max(from, Math.round(end * pcm.sampleRate)));
  return { sampleRate: pcm.sampleRate, channels: pcm.channels.map((c) => c.slice(from, to)) };
}

export const peakOf = (pcm: Pcm) => {
  let peak = 0;
  for (const channel of pcm.channels) for (let i = 0; i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
  return peak;
};

/** Gain that brings the loudest sample to just under full scale. */
export const normalizeGain = (pcm: Pcm) => {
  const peak = peakOf(pcm);
  return peak > 0 ? 0.98 / peak : 1;
};

/** Scales the volume and applies linear fades in seconds. Samples are clamped, so a big gain clips instead of wrapping. */
export function applyVolume(pcm: Pcm, gain: number, fadeIn = 0, fadeOut = 0): Pcm {
  const length = pcm.channels[0]?.length ?? 0;
  const inSamples = Math.round(fadeIn * pcm.sampleRate);
  const outSamples = Math.round(fadeOut * pcm.sampleRate);
  const channels = pcm.channels.map((channel) => {
    const out = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      let g = gain;
      if (i < inSamples) g *= i / inSamples;
      if (i >= length - outSamples) g *= (length - 1 - i) / outSamples;
      out[i] = Math.max(-1, Math.min(1, channel[i] * g));
    }
    return out;
  });
  return { sampleRate: pcm.sampleRate, channels };
}

/** Consecutive parts of at most `every` seconds; the last one takes what is left. */
export function splitRanges(duration: number, every: number): Array<{ start: number; end: number }> {
  if (!(every > 0) || !(duration > 0)) return [];
  const ranges: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < duration - 1e-9; start += every) ranges.push({ start, end: Math.min(duration, start + every) });
  return ranges;
}

/** Largest absolute value in each of `bins` equal slices, for drawing the waveform. */
export function waveformPeaks(pcm: Pcm, bins: number): number[] {
  const length = pcm.channels[0]?.length ?? 0;
  const peaks = new Array<number>(bins).fill(0);
  for (let b = 0; b < bins; b++) {
    const from = Math.floor((b * length) / bins);
    const to = Math.max(from + 1, Math.floor(((b + 1) * length) / bins));
    let peak = 0;
    for (const channel of pcm.channels) for (let i = from; i < to && i < length; i++) peak = Math.max(peak, Math.abs(channel[i]));
    peaks[b] = peak;
  }
  return peaks;
}

export const formatTime = (seconds: number) => {
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60);
  return `${m}:${(total - m * 60).toFixed(1).padStart(4, "0")}`;
};

const to16 = (x: number) => Math.round(Math.max(-1, Math.min(1, x)) * (x < 0 ? 32768 : 32767));

/** 16-bit PCM WAV. */
export function encodeWav(pcm: Pcm): Uint8Array {
  const channels = pcm.channels.length;
  const length = pcm.channels[0]?.length ?? 0;
  const out = new Uint8Array(44 + length * channels * 2);
  const view = new DataView(out.buffer);
  const text = (offset: number, s: string) => [...s].forEach((ch, i) => (out[offset + i] = ch.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, out.length - 8, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, pcm.sampleRate, true);
  view.setUint32(28, pcm.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, length * channels * 2, true);
  let p = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      view.setInt16(p, to16(pcm.channels[c][i]), true);
      p += 2;
    }
  }
  return out;
}

/** Appends bits, most significant first. */
class BitWriter {
  bytes = new Uint8Array(1 << 16);
  length = 0;
  private acc = 0;
  private bits = 0;

  private push(byte: number) {
    if (this.length === this.bytes.length) {
      const bigger = new Uint8Array(this.bytes.length * 2);
      bigger.set(this.bytes);
      this.bytes = bigger;
    }
    this.bytes[this.length++] = byte;
  }

  /** `count` up to 32 bits of a non-negative value. */
  write(value: number, count: number) {
    while (count > 0) {
      const take = Math.min(count, 8 - this.bits);
      const chunk = Math.floor(value / 2 ** (count - take)) % 2 ** take;
      this.acc = (this.acc << take) | chunk;
      this.bits += take;
      count -= take;
      if (this.bits === 8) {
        this.push(this.acc & 255);
        this.acc = 0;
        this.bits = 0;
      }
    }
  }

  /** Signed value in two's complement over `count` bits. */
  writeSigned(value: number, count: number) {
    this.write(value < 0 ? value + 2 ** count : value, count);
  }

  unary(zeros: number) {
    for (let i = 0; i < zeros; i++) this.write(0, 1);
    this.write(1, 1);
  }

  align() {
    if (this.bits > 0) this.write(0, 8 - this.bits);
  }

}

const crc8 = (bytes: Uint8Array) => {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let b = 0; b < 8; b++) crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 255 : (crc << 1) & 255;
  }
  return crc;
};
const crc16 = (bytes: Uint8Array) => {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x8005) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
};

/** FLAC frame numbers are written like UTF-8 code points. */
const utf8Number = (n: number): number[] => {
  if (n < 0x80) return [n];
  const lengths = [0x800, 0x10000, 0x200000, 0x4000000, 0x80000000];
  const extra = lengths.findIndex((limit) => n < limit) + 1;
  const bytes: number[] = [];
  let rest = n;
  for (let i = 0; i < extra; i++) {
    bytes.unshift(0x80 | (rest % 64));
    rest = Math.floor(rest / 64);
  }
  bytes.unshift(((0xff00 >> (extra + 1)) & 0xff) | rest);
  return bytes;
};

const FLAC_BLOCK = 4096;

/** Sums the Rice-coded size of the residuals for a parameter k. */
const riceBits = (residuals: Int32Array | number[], k: number) => {
  let bits = 0;
  for (let i = 0; i < residuals.length; i++) {
    const r = residuals[i];
    bits += Math.floor((r < 0 ? -2 * r - 1 : 2 * r) / 2 ** k) + 1 + k;
  }
  return bits;
};

/** One subframe: the best fixed predictor of order 0 to 4, with the residual Rice-coded in a single partition. */
function writeSubframe(w: BitWriter, samples: Int32Array) {
  const n = samples.length;
  let best: { order: number; residual: number[]; cost: number } | null = null;
  for (let order = 0; order <= Math.min(4, n); order++) {
    const residual: number[] = [];
    for (let i = order; i < n; i++) {
      const s = samples;
      const r =
        order === 0 ? s[i]
        : order === 1 ? s[i] - s[i - 1]
        : order === 2 ? s[i] - 2 * s[i - 1] + s[i - 2]
        : order === 3 ? s[i] - 3 * s[i - 1] + 3 * s[i - 2] - s[i - 3]
        : s[i] - 4 * s[i - 1] + 6 * s[i - 2] - 4 * s[i - 3] + s[i - 4];
      residual.push(r);
    }
    let sum = 0;
    for (const r of residual) sum += Math.abs(r);
    if (!best || sum < best.cost) best = { order, residual, cost: sum };
  }
  const { order, residual } = best!;
  const mean = residual.length ? best!.cost / residual.length : 0;
  const guess = Math.max(0, Math.min(14, Math.floor(Math.log2(mean * 2 + 1))));
  let k = guess;
  let kBits = riceBits(residual, k);
  for (const candidate of [guess - 1, guess + 1]) {
    if (candidate < 0 || candidate > 14) continue;
    const bits = riceBits(residual, candidate);
    if (bits < kBits) {
      k = candidate;
      kBits = bits;
    }
  }
  const verbatimBits = n * 16;
  if (order === 0 && kBits > verbatimBits) {
    w.write(0b000001 << 1, 8); // padding bit, verbatim type, no wasted bits
    for (let i = 0; i < n; i++) w.writeSigned(samples[i], 16);
    return;
  }
  w.write((0b001000 | order) << 1, 8); // padding bit, fixed type, no wasted bits
  for (let i = 0; i < order; i++) w.writeSigned(samples[i], 16); // warm-up
  w.write(0, 2); // 4-bit Rice parameters
  w.write(0, 4); // one partition
  w.write(k, 4);
  for (const r of residual) {
    const u = r < 0 ? -2 * r - 1 : 2 * r;
    w.unary(Math.floor(u / 2 ** k));
    if (k > 0) w.write(u % 2 ** k, k);
  }
}

/** 16-bit FLAC, mono or stereo (more channels keep the first two), fixed predictors and Rice coding. */
export function encodeFlac(pcm: Pcm): Uint8Array {
  const channels = Math.min(2, pcm.channels.length);
  const total = pcm.channels[0]?.length ?? 0;
  const data = pcm.channels.slice(0, channels).map((c) => Int32Array.from(c, to16));
  const w = new BitWriter();
  // "fLaC", then STREAMINFO as the only (last) metadata block.
  w.write(0x664c6143, 32);
  w.write(0x80, 8);
  w.write(34, 24);
  w.write(FLAC_BLOCK, 16);
  w.write(FLAC_BLOCK, 16);
  w.write(0, 24); // frame sizes unknown
  w.write(0, 24);
  w.write(pcm.sampleRate, 20);
  w.write(channels - 1, 3);
  w.write(15, 5); // 16 bits per sample
  w.write(Math.floor(total / 2 ** 32), 4);
  w.write(total % 2 ** 32, 32);
  for (let i = 0; i < 4; i++) w.write(0, 32); // MD5 left unset

  for (let start = 0, frame = 0; start < total; start += FLAC_BLOCK, frame++) {
    const size = Math.min(FLAC_BLOCK, total - start);
    const frameStart = w.length;
    w.write(0xfff8, 16); // sync, fixed block size
    const sizeCode = size === FLAC_BLOCK ? 12 : size <= 256 ? 6 : 7;
    w.write(sizeCode, 4);
    w.write(0, 4); // sample rate from STREAMINFO
    w.write(channels - 1, 4); // independent channels
    w.write(0b100, 3); // 16 bits per sample
    w.write(0, 1);
    for (const b of utf8Number(frame)) w.write(b, 8);
    if (sizeCode === 6) w.write(size - 1, 8);
    if (sizeCode === 7) w.write(size - 1, 16);
    w.write(crc8(w.bytes.subarray(frameStart, w.length)), 8);
    for (const channel of data) writeSubframe(w, channel.subarray(start, start + size));
    w.align();
    w.write(crc16(w.bytes.subarray(frameStart, w.length)), 16);
  }
  return w.bytes.slice(0, w.length);
}
