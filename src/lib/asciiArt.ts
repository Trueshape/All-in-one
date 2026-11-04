/** Text to ASCII art with a built-in 5 x 7 block font (no dependencies). Lowercase letters use the capital shapes. */

const GLYPHS: Record<string, string[]> = {
  A: [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  B: ["#### ", "#   #", "#   #", "#### ", "#   #", "#   #", "#### "],
  C: [" ####", "#    ", "#    ", "#    ", "#    ", "#    ", " ####"],
  D: ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  F: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
  G: [" ####", "#    ", "#    ", "#  ##", "#   #", "#   #", " ####"],
  H: ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
  J: ["  ###", "   # ", "   # ", "   # ", "   # ", "#  # ", " ##  "],
  K: ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
  L: ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
  N: ["#   #", "##  #", "# # #", "#  ##", "#   #", "#   #", "#   #"],
  O: [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
  Q: [" ### ", "#   #", "#   #", "#   #", "# # #", "#  # ", " ## #"],
  R: ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", "#   #", "#   #", " # # ", "  #  "],
  W: ["#   #", "#   #", "#   #", "# # #", "# # #", "## ##", "#   #"],
  X: ["#   #", "#   #", " # # ", "  #  ", " # # ", "#   #", "#   #"],
  Y: ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
  Z: ["#####", "    #", "   # ", "  #  ", " #   ", "#    ", "#####"],
  "0": [" ### ", "#   #", "#  ##", "# # #", "##  #", "#   #", " ### "],
  "1": ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
  "2": [" ### ", "#   #", "    #", "   # ", "  #  ", " #   ", "#####"],
  "3": [" ### ", "#   #", "    #", "  ## ", "    #", "#   #", " ### "],
  "4": ["   # ", "  ## ", " # # ", "#  # ", "#####", "   # ", "   # "],
  "5": ["#####", "#    ", "#### ", "    #", "    #", "#   #", " ### "],
  "6": [" ### ", "#    ", "#    ", "#### ", "#   #", "#   #", " ### "],
  "7": ["#####", "    #", "   # ", "  #  ", " #   ", " #   ", " #   "],
  "8": [" ### ", "#   #", "#   #", " ### ", "#   #", "#   #", " ### "],
  "9": [" ### ", "#   #", "#   #", " ####", "    #", "    #", " ### "],
  " ": ["   ", "   ", "   ", "   ", "   ", "   ", "   "],
  ".": ["  ", "  ", "  ", "  ", "  ", "##", "##"],
  ",": ["  ", "  ", "  ", "  ", "##", " #", "# "],
  "!": ["#", "#", "#", "#", "#", " ", "#"],
  "?": [" ### ", "#   #", "    #", "   # ", "  #  ", "     ", "  #  "],
  "-": ["     ", "     ", "     ", "#####", "     ", "     ", "     "],
  "+": ["     ", "  #  ", "  #  ", "#####", "  #  ", "  #  ", "     "],
  "=": ["     ", "     ", "#####", "     ", "#####", "     ", "     "],
  ":": [" ", " ", "#", " ", " ", "#", " "],
  "/": ["    #", "    #", "   # ", "  #  ", " #   ", "#    ", "#    "],
  "'": ["#", "#", "#", " ", " ", " ", " "],
  "(": ["  #", " # ", "#  ", "#  ", "#  ", " # ", "  #"],
  ")": ["#  ", " # ", "  #", "  #", "  #", " # ", "#  "],
};

const ROWS = 7;
/** Accented capitals and letters fall back to their base letter. */
const base = (ch: string) => ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export interface AsciiOptions {
  /** Character drawn for lit pixels. */
  fill: string;
  /** Horizontal and vertical stretch, 1 to 3. */
  scale: number;
  /** Blank columns between letters. */
  spacing: number;
  /** Draw the background instead of the letters. */
  invert: boolean;
}

export const renderLine = (line: string, { fill, scale, spacing, invert }: AsciiOptions): string => {
  const glyphs = Array.from(line).map((ch) => GLYPHS[base(ch)] ?? GLYPHS["?"]);
  if (!glyphs.length) return "";
  const out: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    let text = "";
    glyphs.forEach((glyph, i) => {
      const cells = glyph[row] + " ".repeat(i < glyphs.length - 1 ? spacing : 0);
      for (const c of cells) text += (invert ? c === " " : c === "#") ? fill.repeat(scale) : " ".repeat(scale);
    });
    for (let v = 0; v < scale; v++) out.push(text.replace(/\s+$/, ""));
  }
  return out.join("\n");
};

/** One block of art per input line, separated by a blank line. */
export const asciiArt = (text: string, options: AsciiOptions): string =>
  text
    .split("\n")
    .map((line) => renderLine(line, options))
    .filter((block) => block !== "")
    .join("\n\n");
