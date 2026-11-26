/** Reads and writes the title, artist, album, genre, year and track number of MP3, FLAC and WAV files. Pure byte work, no dependencies. */

export interface Tags {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  track: string;
  /** Song lyrics: kept in MP3 and FLAC files; WAV has no standard field for them. */
  lyrics: string;
}

export const EMPTY_TAGS: Tags = { title: "", artist: "", album: "", genre: "", year: "", track: "", lyrics: "" };
export type TagFormat = "mp3" | "flac" | "wav";

const text = new TextEncoder();
const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));
const be32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
const le32 = (b: Uint8Array, at: number) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;
const bytes32be = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const bytes32le = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

export function detectFormat(b: Uint8Array): TagFormat | null {
  if (ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return "mp3";
  if (ascii(b, 0, 4) === "fLaC") return "flac";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE") return "wav";
  return null;
}

export function readTags(b: Uint8Array, format: TagFormat): Tags {
  if (format === "mp3") return readMp3(b);
  if (format === "flac") return readFlac(b);
  return readWav(b);
}

export function writeTags(b: Uint8Array, format: TagFormat, tags: Tags): Uint8Array {
  if (format === "mp3") return writeMp3(b, tags);
  if (format === "flac") return writeFlac(b, tags);
  return writeWav(b, tags);
}

// ---- MP3: ID3v2 tag at the start of the file

const syncsafe = (b: Uint8Array, at: number) => (b[at] << 21) | (b[at + 1] << 14) | (b[at + 2] << 7) | b[at + 3];
const toSyncsafe = (n: number) => [(n >>> 21) & 127, (n >>> 14) & 127, (n >>> 7) & 127, n & 127];

/** Text of an ID3 text frame: first byte is the encoding (0 Latin-1, 1 UTF-16 with BOM, 2 UTF-16BE, 3 UTF-8). */
function decodeId3Text(data: Uint8Array): string {
  const enc = data[0];
  const body = data.subarray(1);
  let s: string;
  if (enc === 1 || enc === 2) {
    const bigEndian = enc === 2 || (body[0] === 0xfe && body[1] === 0xff);
    const skip = body[0] === 0xff && body[1] === 0xfe ? 2 : body[0] === 0xfe && body[1] === 0xff ? 2 : 0;
    s = new TextDecoder(bigEndian ? "utf-16be" : "utf-16le").decode(body.subarray(skip));
  } else if (enc === 3) {
    s = new TextDecoder("utf-8").decode(body);
  } else {
    s = String.fromCharCode(...body);
  }
  return s.replace(/\0+/g, "").trim();
}

/** USLT frame: encoding, 3-letter language, a content descriptor ending in a terminator, then the lyrics. */
function decodeLyrics(data: Uint8Array): string {
  const enc = data[0];
  const rest = data.subarray(4);
  let start = 0;
  if (enc === 1 || enc === 2) {
    for (let i = 2; i + 1 < rest.length; i += 2) if (rest[i] === 0 && rest[i + 1] === 0) { start = i + 2; break; }
  } else {
    const at = rest.indexOf(0);
    start = at < 0 ? rest.length : at + 1;
  }
  return decodeId3Text(concat([Uint8Array.of(enc), rest.subarray(start)]));
}

function readMp3(b: Uint8Array): Tags {
  const tags = { ...EMPTY_TAGS };
  if (ascii(b, 0, 3) !== "ID3") return tags;
  const version = b[3];
  const end = Math.min(b.length, 10 + syncsafe(b, 6));
  let pos = 10;
  while (pos + 10 <= end && b[pos] !== 0) {
    const id = ascii(b, pos, 4);
    const size = version === 4 ? syncsafe(b, pos + 4) : be32(b, pos + 4);
    const data = b.subarray(pos + 10, pos + 10 + size);
    if (id === "TIT2") tags.title = decodeId3Text(data);
    else if (id === "TPE1") tags.artist = decodeId3Text(data);
    else if (id === "TALB") tags.album = decodeId3Text(data);
    else if (id === "TCON") tags.genre = decodeId3Text(data);
    else if (id === "TYER" || id === "TDRC") tags.year = decodeId3Text(data).slice(0, 4);
    else if (id === "TRCK") tags.track = decodeId3Text(data);
    else if (id === "USLT") tags.lyrics = decodeLyrics(data);
    pos += 10 + size;
  }
  return tags;
}

function writeMp3(b: Uint8Array, tags: Tags): Uint8Array {
  const audioAt = ascii(b, 0, 3) === "ID3" ? 10 + syncsafe(b, 6) : 0;
  const audio = b.subarray(audioAt);
  const frames: Uint8Array[] = [];
  const add = (id: string, value: string) => {
    if (!value) return;
    const body = concat([Uint8Array.of(1, 0xff, 0xfe), Uint8Array.from(encodeUtf16Le(value))]);
    frames.push(concat([Uint8Array.from(text.encode(id)), Uint8Array.from(bytes32be(body.length)), Uint8Array.of(0, 0), body]));
  };
  add("TIT2", tags.title);
  add("TPE1", tags.artist);
  add("TALB", tags.album);
  add("TCON", tags.genre);
  add("TYER", tags.year);
  add("TRCK", tags.track);
  if (tags.lyrics) {
    const body = concat([Uint8Array.of(1), Uint8Array.from(text.encode("eng")), Uint8Array.of(0xff, 0xfe, 0, 0), Uint8Array.from(encodeUtf16Le(tags.lyrics))]);
    frames.push(concat([Uint8Array.from(text.encode("USLT")), Uint8Array.from(bytes32be(body.length)), Uint8Array.of(0, 0), body]));
  }
  const framesAll = concat(frames);
  if (framesAll.length === 0) return audio.slice();
  const header = Uint8Array.of(0x49, 0x44, 0x33, 3, 0, 0, ...toSyncsafe(framesAll.length));
  return concat([header, framesAll, audio]);
}

/** UTF-16LE bytes of a string, as a plain array. */
function encodeUtf16Le(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 255, s.charCodeAt(i) >> 8);
  return out;
}

// ---- FLAC: Vorbis comment metadata block (type 4)

interface Block {
  type: number;
  data: Uint8Array;
}

function flacBlocks(b: Uint8Array): { blocks: Block[]; audioAt: number } {
  const blocks: Block[] = [];
  let pos = 4;
  for (;;) {
    const head = b[pos];
    const len = (b[pos + 1] << 16) | (b[pos + 2] << 8) | b[pos + 3];
    blocks.push({ type: head & 0x7f, data: b.subarray(pos + 4, pos + 4 + len) });
    pos += 4 + len;
    if (head & 0x80 || pos >= b.length) break;
  }
  return { blocks, audioAt: pos };
}

function readFlac(b: Uint8Array): Tags {
  const tags = { ...EMPTY_TAGS };
  const block = flacBlocks(b).blocks.find((x) => x.type === 4);
  if (!block) return tags;
  const d = block.data;
  let p = 4 + le32(d, 0);
  const count = le32(d, p);
  p += 4;
  for (let i = 0; i < count && p + 4 <= d.length; i++) {
    const len = le32(d, p);
    const entry = new TextDecoder("utf-8").decode(d.subarray(p + 4, p + 4 + len));
    p += 4 + len;
    const eq = entry.indexOf("=");
    if (eq < 0) continue;
    const key = entry.slice(0, eq).toUpperCase();
    const value = entry.slice(eq + 1).trim();
    if (key === "TITLE") tags.title = value;
    else if (key === "ARTIST") tags.artist = value;
    else if (key === "ALBUM") tags.album = value;
    else if (key === "GENRE") tags.genre = value;
    else if (key === "DATE" || key === "YEAR") tags.year = value.slice(0, 4);
    else if (key === "TRACKNUMBER") tags.track = value;
    else if (key === "LYRICS") tags.lyrics = value;
  }
  return tags;
}

function writeFlac(b: Uint8Array, tags: Tags): Uint8Array {
  const { blocks, audioAt } = flacBlocks(b);
  const entries: string[] = [];
  const add = (key: string, value: string) => value && entries.push(`${key}=${value}`);
  add("TITLE", tags.title);
  add("ARTIST", tags.artist);
  add("ALBUM", tags.album);
  add("GENRE", tags.genre);
  add("DATE", tags.year);
  add("TRACKNUMBER", tags.track);
  add("LYRICS", tags.lyrics);
  const vendor = text.encode("allin1");
  const comments = entries.map((e) => text.encode(e));
  const data = concat([
    Uint8Array.from(bytes32le(vendor.length)),
    vendor,
    Uint8Array.from(bytes32le(comments.length)),
    ...comments.flatMap((c) => [Uint8Array.from(bytes32le(c.length)), c]),
  ]);
  // keep STREAMINFO first, then the new comment block, then the others (without the old comments)
  const kept = blocks.filter((x) => x.type !== 4);
  const ordered: Block[] = [kept[0], { type: 4, data }, ...kept.slice(1)];
  const parts: Uint8Array[] = [Uint8Array.from(text.encode("fLaC"))];
  ordered.forEach((blk, i) => {
    const last = i === ordered.length - 1 ? 0x80 : 0;
    const n = blk.data.length;
    parts.push(Uint8Array.of(last | blk.type, n >>> 16, (n >>> 8) & 255, n & 255), blk.data);
  });
  parts.push(b.subarray(audioAt));
  return concat(parts);
}

// ---- WAV: LIST chunk of type INFO

const WAV_KEYS: Array<[keyof Tags, string]> = [
  ["title", "INAM"],
  ["artist", "IART"],
  ["album", "IPRD"],
  ["genre", "IGNR"],
  ["year", "ICRD"],
  ["track", "ITRK"],
];

function readWav(b: Uint8Array): Tags {
  const tags = { ...EMPTY_TAGS };
  let pos = 12;
  while (pos + 8 <= b.length) {
    const id = ascii(b, pos, 4);
    const size = le32(b, pos + 4);
    if (id === "LIST" && ascii(b, pos + 8, 4) === "INFO") {
      let p = pos + 12;
      const end = Math.min(b.length, pos + 8 + size);
      while (p + 8 <= end) {
        const sub = ascii(b, p, 4);
        const len = le32(b, p + 4);
        const value = new TextDecoder("utf-8").decode(b.subarray(p + 8, p + 8 + len)).replace(/\0+/g, "").trim();
        const key = WAV_KEYS.find(([, k]) => k === sub);
        if (key) tags[key[0]] = key[0] === "year" ? value.slice(0, 4) : value;
        p += 8 + len + (len & 1);
      }
    }
    pos += 8 + size + (size & 1);
  }
  return tags;
}

function writeWav(b: Uint8Array, tags: Tags): Uint8Array {
  // keep every chunk except an old INFO list, then add the new one at the end
  const parts: Uint8Array[] = [];
  let pos = 12;
  while (pos + 8 <= b.length) {
    const id = ascii(b, pos, 4);
    const size = le32(b, pos + 4);
    const end = Math.min(b.length, pos + 8 + size + (size & 1));
    const isInfo = id === "LIST" && ascii(b, pos + 8, 4) === "INFO";
    if (!isInfo) parts.push(b.subarray(pos, end));
    pos = end;
  }
  const subs: Uint8Array[] = [];
  for (const [key, id] of WAV_KEYS) {
    const value = tags[key];
    if (!value) continue;
    const bytes = concat([text.encode(value), Uint8Array.of(0)]);
    subs.push(concat([Uint8Array.from(text.encode(id)), Uint8Array.from(bytes32le(bytes.length)), bytes, new Uint8Array(bytes.length & 1)]));
  }
  if (subs.length) {
    const body = concat([Uint8Array.from(text.encode("INFO")), ...subs]);
    parts.push(concat([Uint8Array.from(text.encode("LIST")), Uint8Array.from(bytes32le(body.length)), body]));
  }
  const rest = concat(parts);
  const head = concat([Uint8Array.from(text.encode("RIFF")), Uint8Array.from(bytes32le(4 + rest.length)), Uint8Array.from(text.encode("WAVE"))]);
  return concat([head, rest]);
}
