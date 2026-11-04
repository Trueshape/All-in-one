import { encodeFlac, encodeWav } from "./audioOps";
import type { Pcm } from "./audioOps";

export type AudioFormat = "wav" | "mp3" | "ogg" | "flac";

export const AUDIO_FORMATS: Array<{ value: AudioFormat; label: string; mime: string }> = [
  { value: "wav", label: "WAV", mime: "audio/wav" },
  { value: "mp3", label: "MP3", mime: "audio/mpeg" },
  { value: "ogg", label: "OGG", mime: "audio/ogg" },
  { value: "flac", label: "FLAC", mime: "audio/flac" },
];

const MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];
const CHUNK = 1 << 16;

/** Encodes in the browser. MP3 and OGG use small WebAssembly encoders that load only when first needed. */
export async function encodeAudio(pcm: Pcm, format: AudioFormat): Promise<Blob> {
  const mime = AUDIO_FORMATS.find((f) => f.value === format)!.mime;
  if (format === "wav") return new Blob([encodeWav(pcm)], { type: mime });
  if (format === "flac") return new Blob([encodeFlac(pcm)], { type: mime });

  const { createMp3Encoder, createOggEncoder } = await import("wasm-media-encoders");
  const channels = pcm.channels.slice(0, 2);
  const common = { channels: channels.length as 1 | 2, sampleRate: pcm.sampleRate };
  const parts: Uint8Array[] = [];
  const run = (encoder: { encode(samples: readonly Float32Array[]): Uint8Array; finalize(): Uint8Array }) => {
    const length = channels[0].length;
    for (let from = 0; from < length; from += CHUNK) parts.push(encoder.encode(channels.map((c) => c.subarray(from, from + CHUNK))).slice());
    parts.push(encoder.finalize().slice());
  };
  if (format === "mp3") {
    const encoder = await createMp3Encoder();
    encoder.configure({ ...common, vbrQuality: 2, ...(MP3_RATES.includes(pcm.sampleRate) ? {} : { outputSampleRate: 48000 as const }) });
    run(encoder);
  } else {
    const encoder = await createOggEncoder();
    encoder.configure({ ...common, vbrQuality: 5 });
    run(encoder);
  }
  return new Blob(parts, { type: mime });
}
