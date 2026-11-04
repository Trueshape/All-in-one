const NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const BLACK = new Set([1, 3, 6, 8, 10]);

export interface PianoKey {
  midi: number;
  name: string;
  black: boolean;
  /** Number of white keys to the left; a black key sits between white key `white - 1` and `white`. */
  white: number;
}

/** MIDI note number of C in the given octave (C4 is 60, middle C). */
export const cMidi = (octave: number) => 12 * (octave + 1);

/** Frequency in Hz of a MIDI note, with A4 (69) at 440 Hz. */
export const noteFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

/** Keys from C of `octave`, for `octaves` octaves plus the closing C. */
export function pianoKeys(octave: number, octaves: number): PianoKey[] {
  const first = cMidi(octave);
  const keys: PianoKey[] = [];
  let white = 0;
  for (let midi = first; midi <= first + octaves * 12; midi++) {
    const black = BLACK.has(midi % 12);
    keys.push({ midi, name: noteName(midi), black, white });
    if (!black) white++;
  }
  return keys;
}

/** Computer keys for the lowest 17 semitones, laid out like a piano: letters for white keys, the row above for black ones. */
export const KEYBOARD = "awsedftgyhujkolpò";
