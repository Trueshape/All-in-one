import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_TAGS, detectFormat, readTags, writeTags } from "./audioTags";
import type { Tags } from "./audioTags";

const sample: Tags = { title: "Canzone è bella", artist: "Mario Rossi", album: "Il disco", genre: "Pop", year: "1999", track: "3", lyrics: "Prima riga\nSeconda riga" };
const audio = Uint8Array.from([0xff, 0xfb, 0x90, 0x00, 1, 2, 3, 4]);

test("MP3: tags survive a round trip, and writing again replaces them", () => {
  const once = writeTags(audio, "mp3", sample);
  assert.equal(detectFormat(once), "mp3");
  assert.deepEqual(readTags(once, "mp3"), sample);
  const twice = writeTags(once, "mp3", { ...sample, title: "Nuovo" });
  assert.equal(readTags(twice, "mp3").title, "Nuovo");
  // the audio after the tag is untouched and not duplicated
  assert.deepEqual(twice.slice(twice.length - audio.length), audio);
});

test("MP3: empty fields leave no frame and no tag", () => {
  const out = writeTags(audio, "mp3", EMPTY_TAGS);
  assert.deepEqual(out, audio);
  assert.deepEqual(readTags(out, "mp3"), EMPTY_TAGS);
});

test("FLAC: comments survive a round trip, STREAMINFO stays first, audio is kept", () => {
  const streaminfo = new Uint8Array(34);
  const header = Uint8Array.of(0x80, 0, 0, 34); // last block, type 0 (STREAMINFO)
  const frame = Uint8Array.from([0xff, 0xf8, 9, 9, 9]);
  const flac = new Uint8Array([...Array.from("fLaC", (c) => c.charCodeAt(0)), ...header, ...streaminfo, ...frame]);
  assert.equal(detectFormat(flac), "flac");
  const out = writeTags(flac, "flac", sample);
  assert.deepEqual(readTags(out, "flac"), sample);
  assert.equal(out[4] & 0x7f, 0); // STREAMINFO still first
  assert.deepEqual(out.slice(out.length - frame.length), frame);
  // writing again keeps a single comment block
  const again = writeTags(out, "flac", { ...EMPTY_TAGS, title: "Solo titolo" });
  assert.deepEqual(readTags(again, "flac"), { ...EMPTY_TAGS, title: "Solo titolo" });
  assert.deepEqual(again.slice(again.length - frame.length), frame);
});

test("WAV: tags survive a round trip and the data chunk is kept (lyrics are not stored)", () => {
  const data = Uint8Array.from([1, 0, 2, 0]);
  const fmt = Uint8Array.from([1, 0, 1, 0, 0x40, 0x1f, 0, 0, 0x80, 0x3e, 0, 0, 2, 0, 16, 0]);
  const chunk = (id: string, body: Uint8Array) => new Uint8Array([...Array.from(id, (c) => c.charCodeAt(0)), body.length & 255, body.length >> 8, 0, 0, ...body]);
  const body = new Uint8Array([...Array.from("WAVE", (c) => c.charCodeAt(0)), ...chunk("fmt ", fmt), ...chunk("data", data)]);
  const wav = new Uint8Array([...Array.from("RIFF", (c) => c.charCodeAt(0)), body.length & 255, body.length >> 8, 0, 0, ...body]);
  assert.equal(detectFormat(wav), "wav");
  const out = writeTags(wav, "wav", { ...sample, lyrics: "" });
  const got = readTags(out, "wav");
  assert.equal(got.title, sample.title);
  assert.equal(got.track, "3");
  assert.equal(got.lyrics, "");
  // RIFF size matches the file
  const riffSize = out[4] | (out[5] << 8) | (out[6] << 16) | (out[7] << 24);
  assert.equal(riffSize, out.length - 8);
});
