/** Italian tax code (codice fiscale): encoding, decoding and checksum. */

export const COMUNI: Array<{ name: string; code: string }> = [
  ["Ancona (AN)", "A271"], ["Arezzo (AR)", "A390"], ["Bari (BA)", "A662"], ["Bergamo (BG)", "A794"],
  ["Bologna (BO)", "A944"], ["Bolzano (BZ)", "A952"], ["Brescia (BS)", "B157"], ["Cagliari (CA)", "B354"],
  ["Catania (CT)", "C351"], ["Cesena (FC)", "C573"], ["Ferrara (FE)", "D548"], ["Firenze (FI)", "D612"],
  ["Foggia (FG)", "D643"], ["Forlì (FC)", "D704"], ["Genova (GE)", "D969"], ["Latina (LT)", "E472"],
  ["Lecce (LE)", "E506"], ["Livorno (LI)", "E625"], ["Messina (ME)", "F158"], ["Milano (MI)", "F205"],
  ["Modena (MO)", "F257"], ["Monza (MB)", "F704"], ["Napoli (NA)", "F839"], ["Novara (NO)", "F952"],
  ["Padova (PD)", "G224"], ["Palermo (PA)", "G273"], ["Parma (PR)", "G337"], ["Perugia (PG)", "G478"],
  ["Pescara (PE)", "G482"], ["Piacenza (PC)", "G535"], ["Prato (PO)", "G999"], ["Ravenna (RA)", "H199"],
  ["Reggio Emilia (RE)", "H223"], ["Reggio Calabria (RC)", "H224"], ["Rimini (RN)", "H294"], ["Roma (RM)", "H501"],
  ["Salerno (SA)", "H703"], ["Sassari (SS)", "I452"], ["Siracusa (SR)", "I754"], ["Taranto (TA)", "L049"],
  ["Terni (TR)", "L117"], ["Torino (TO)", "L219"], ["Trento (TN)", "L378"], ["Trieste (TS)", "L424"],
  ["Udine (UD)", "L483"], ["Venezia (VE)", "L736"], ["Verona (VR)", "L781"], ["Vicenza (VI)", "L840"],
].map(([name, code]) => ({ name, code }));

export const placeName = (belfiore: string) => COMUNI.find((c) => c.code === belfiore)?.name ?? null;

const MONTH_LETTERS = "ABCDEHLMPRST";
export const MONTH_NAMES = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const ODD = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
const valueOf = (ch: string) => (/[0-9]/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 65);

/** Check character for the first 15 characters of a codice fiscale. */
export function checkChar(first15: string): string {
  let sum = 0;
  for (let i = 0; i < first15.length; i++) {
    const v = valueOf(first15[i]);
    sum += i % 2 === 0 ? ODD[v] : v; // positions are 1-based: odd positions use the ODD table
  }
  return String.fromCharCode(65 + (sum % 26));
}

const letters = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
const split = (s: string) => ({ consonants: s.replace(/[AEIOU]/g, ""), vowels: s.replace(/[^AEIOU]/g, "") });
const pad3 = (s: string) => (s + "XXX").slice(0, 3);

export const surnameCode = (surname: string) => {
  const { consonants, vowels } = split(letters(surname));
  return pad3(consonants + vowels);
};

export const nameCode = (name: string) => {
  const { consonants, vowels } = split(letters(name));
  const picked = consonants.length >= 4 ? consonants[0] + consonants[2] + consonants[3] : consonants + vowels;
  return pad3(picked);
};

export interface EncodeInput {
  surname: string;
  name: string;
  /** "YYYY-MM-DD" */
  birthDate: string;
  sex: "M" | "F";
  belfiore: string;
}

export interface EncodeParts {
  surname: string;
  name: string;
  date: string;
  belfiore: string;
  check: string;
}

export function encode(input: EncodeInput): { code: string; parts: EncodeParts } | { error: string } {
  if (!letters(input.surname)) return { error: "Inserisci il cognome." };
  if (!letters(input.name)) return { error: "Inserisci il nome." };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate);
  if (!m) return { error: "Seleziona la data di nascita." };
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const real = new Date(year, month - 1, day);
  if (real.getFullYear() !== year || real.getMonth() !== month - 1 || real.getDate() !== day) return { error: "Data di nascita non valida." };
  const belfiore = input.belfiore.trim().toUpperCase();
  if (!/^[A-Z]\d{3}$/.test(belfiore)) return { error: "Codice Belfiore non valido: una lettera e 3 cifre (es. H501)." };

  const date = `${String(year).slice(-2)}${MONTH_LETTERS[month - 1]}${String(day + (input.sex === "F" ? 40 : 0)).padStart(2, "0")}`;
  const parts: EncodeParts = { surname: surnameCode(input.surname), name: nameCode(input.name), date, belfiore, check: "" };
  const first15 = parts.surname + parts.name + parts.date + parts.belfiore;
  parts.check = checkChar(first15);
  return { code: first15 + parts.check, parts };
}

const OMOCODIA = "LMNPQRSTUV";
const undoOmocodia = (s: string) => [...s].map((c) => (OMOCODIA.includes(c) ? String(OMOCODIA.indexOf(c)) : c)).join("");

export interface Decoded {
  code: string;
  sex: "Maschio" | "Femmina";
  day: number;
  monthName: string;
  year: number;
  belfiore: string;
  place: string | null;
  checkValid: boolean;
  expectedCheck: string;
  surnamePart: string;
  namePart: string;
  omocodia: boolean;
}

export function decode(raw: string): Decoded | { error: string } {
  const code = raw.replace(/\s/g, "").toUpperCase();
  if (code.length !== 16) return { error: "Il codice fiscale deve avere esattamente 16 caratteri." };
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(code)) return { error: "Formato del codice fiscale non valido." };

  const monthIndex = MONTH_LETTERS.indexOf(code[8]);
  if (monthIndex < 0) return { error: `Mese di nascita non valido (carattere "${code[8]}").` };

  let day = Number(undoOmocodia(code.slice(9, 11)));
  const sex = day > 40 ? "Femmina" : "Maschio";
  if (day > 40) day -= 40;
  if (day < 1 || day > 31) return { error: `Giorno di nascita non valido (${day}).` };

  const yy = Number(undoOmocodia(code.slice(6, 8)));
  const currentYY = new Date().getFullYear() % 100;
  const year = (yy <= currentYY ? 2000 : 1900) + yy;

  const belfiore = code[11] + undoOmocodia(code.slice(12, 15));
  const expectedCheck = checkChar(code.slice(0, 15));

  return {
    code,
    sex,
    day,
    monthName: MONTH_NAMES[monthIndex],
    year,
    belfiore,
    place: placeName(belfiore),
    checkValid: expectedCheck === code[15],
    expectedCheck,
    surnamePart: code.slice(0, 3),
    namePart: code.slice(3, 6),
    omocodia: code.slice(6, 15) !== undoOmocodia(code.slice(6, 15)),
  };
}
