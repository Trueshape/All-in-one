import { encodeFlac, encodeWav } from "./audioOps";
import type { Pcm } from "./audioOps";

export type AudioFormat = "wav" | "mp3" | "ogg" | "flac";

export const AUDIO_FORMATS: Array<{ value: AudioFormat; label: string; mime: string }> = [
  { value: "wav", label: "WAV", mime: "audio/wav" },
  { value: "mp3", label: "MP3", mime: "audio/mpeg" },
  { value: "ogg", label: "OGG", mime: "audio/ogg" },
  { value: "flac", label: "FLAC", mime: "audio/flac" },
];

/** MP3 constant bitrates the LAME encoder accepts, in kbit/s. */
export const MP3_BITRATES = [8, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];

/** LAME VBR scale: 0 is the best quality, 9.999 the worst. */
const MP3_VBR = { low: 6, mid: 4, high: 2 } as const;

export type Mp3Setting = { mode: "cbr"; kbps: number } | { mode: "vbr"; quality: keyof typeof MP3_VBR };

export interface AudioOptions {
  mp3: Mp3Setting;
  /** OGG variable quality, 0 (smallest) to 100 (best). */
  oggQuality: number;
  wavBits: 16 | 24;
}

export const DEFAULT_AUDIO_OPTIONS: AudioOptions = { mp3: { mode: "vbr", quality: "mid" }, oggQuality: 60, wavBits: 16 };

const MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];
const CHUNK = 1 << 16;

/** The part of a wasm-media-encoders encoder used here. */
interface Encoder {
  configure(options: object): void;
  encode(samples: readonly Float32Array[]): Uint8Array;
  finalize(): Uint8Array;
}

/** Encodes in the browser. MP3 and OGG use small WebAssembly encoders that load only when first needed. */
export async function encodeAudio(pcm: Pcm, format: AudioFormat, options: AudioOptions = DEFAULT_AUDIO_OPTIONS): Promise<Blob> {
  const mime = AUDIO_FORMATS.find((f) => f.value === format)!.mime;
  if (format === "wav") return new Blob([encodeWav(pcm, options.wavBits)], { type: mime });
  if (format === "flac") return new Blob([encodeFlac(pcm)], { type: mime });

  const { createMp3Encoder, createOggEncoder } = await import("wasm-media-encoders");
  const channels = pcm.channels.slice(0, 2);
  const common = { channels: channels.length as 1 | 2, sampleRate: pcm.sampleRate };
  const parts: Uint8Array[] = [];
  const run = (encoder: Encoder) => {
    const length = channels[0].length;
    for (let from = 0; from < length; from += CHUNK) parts.push(encoder.encode(channels.map((c) => c.subarray(from, from + CHUNK))).slice());
    parts.push(encoder.finalize().slice());
  };
  if (format === "mp3") {
    const encoder = (await createMp3Encoder()) as unknown as Encoder;
    const rate = MP3_RATES.includes(pcm.sampleRate) ? {} : { outputSampleRate: 48000 };
    // constant bitrate and VBR are two separate settings of the encoder
    const quality = options.mp3.mode === "cbr" ? { bitrate: options.mp3.kbps } : { vbrQuality: MP3_VBR[options.mp3.quality] };
    encoder.configure({ ...common, ...quality, ...rate });
    run(encoder);
  } else {
    const encoder = (await createOggEncoder()) as unknown as Encoder;
    // the OGG encoder only takes a VBR quality, from -1 (worst) to 10 (best)
    encoder.configure({ ...common, vbrQuality: -1 + (options.oggQuality / 100) * 11 });
    run(encoder);
  }
  return new Blob(parts, { type: mime });
}
