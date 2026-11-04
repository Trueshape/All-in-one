/** Text to ASCII art with two built-in bitmap fonts (no dependencies). Lowercase letters use the capital shapes. */

const BLOCK: Record<string, string[]> = {
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

const SLIM: Record<string, string[]> = {
  A: ["###", "# #", "###", "# #", "# #"],
  B: ["## ", "# #", "## ", "# #", "## "],
  C: ["###", "#  ", "#  ", "#  ", "###"],
  D: ["## ", "# #", "# #", "# #", "## "],
  E: ["###", "#  ", "## ", "#  ", "###"],
  F: ["###", "#  ", "## ", "#  ", "#  "],
  G: ["###", "#  ", "# #", "# #", "###"],
  H: ["# #", "# #", "###", "# #", "# #"],
  I: ["###", " # ", " # ", " # ", "###"],
  J: ["  #", "  #", "  #", "# #", "###"],
  K: ["# #", "# #", "## ", "# #", "# #"],
  L: ["#  ", "#  ", "#  ", "#  ", "###"],
  M: ["# #", "###", "###", "# #", "# #"],
  N: ["## ", "# #", "# #", "# #", "# #"],
  O: ["###", "# #", "# #", "# #", "###"],
  P: ["###", "# #", "###", "#  ", "#  "],
  Q: ["###", "# #", "# #", "###", "  #"],
  R: ["###", "# #", "## ", "# #", "# #"],
  S: ["###", "#  ", "###", "  #", "###"],
  T: ["###", " # ", " # ", " # ", " # "],
  U: ["# #", "# #", "# #", "# #", "###"],
  V: ["# #", "# #", "# #", "# #", " # "],
  W: ["# #", "# #", "###", "###", "# #"],
  X: ["# #", "# #", " # ", "# #", "# #"],
  Y: ["# #", "# #", " # ", " # ", " # "],
  Z: ["###", "  #", " # ", "#  ", "###"],
  "0": ["###", "# #", "# #", "# #", "###"],
  "1": [" # ", "## ", " # ", " # ", "###"],
  "2": ["###", "  #", "###", "#  ", "###"],
  "3": ["###", "  #", "###", "  #", "###"],
  "4": ["# #", "# #", "###", "  #", "  #"],
  "5": ["###", "#  ", "###", "  #", "###"],
  "6": ["###", "#  ", "###", "# #", "###"],
  "7": ["###", "  #", "  #", " # ", " # "],
  "8": ["###", "# #", "###", "# #", "###"],
  "9": ["###", "# #", "###", "  #", "###"],
  " ": ["  ", "  ", "  ", "  ", "  "],
  ".": [" ", " ", " ", " ", "#"],
  ",": ["  ", "  ", "  ", " #", "# "],
  "!": ["#", "#", "#", " ", "#"],
  "?": ["###", "  #", " ##", "   ", " # "],
  "-": ["   ", "   ", "###", "   ", "   "],
  "+": ["   ", " # ", "###", " # ", "   "],
  "=": ["   ", "###", "   ", "###", "   "],
  ":": [" ", "#", " ", "#", " "],
  "/": ["  #", "  #", " # ", "#  ", "#  "],
  "'": ["#", "#", " ", " ", " "],
  "(": [" #", "# ", "# ", "# ", " #"],
  ")": ["# ", " #", " #", " #", "# "],
};

export type AsciiFont = "block" | "slim";
export type AsciiStyle = "solid" | "outline" | "shadow";
export type AsciiAlign = "left" | "center" | "right";
export type AsciiFrame = "none" | "simple" | "double";
export type AsciiComment = "none" | "slashes" | "hash" | "block";

const FONTS: Record<AsciiFont, Record<string, string[]>> = { block: BLOCK, slim: SLIM };

export interface AsciiOptions {
  /** Character drawn for lit pixels. */
  fill: string;
  /** Horizontal and vertical stretch, 1 to 3. */
  scale: number;
  /** Blank columns between letters. */
  spacing: number;
  /** Draw the background instead of the letters. */
  invert: boolean;
  font: AsciiFont;
  style: AsciiStyle;
  align: AsciiAlign;
  frame: AsciiFrame;
  comment: AsciiComment;
}

export const DEFAULT_OPTIONS: AsciiOptions = { fill: "#", scale: 1, spacing: 1, invert: false, font: "block", style: "solid", align: "left", frame: "none", comment: "none" };

/** Accented capitals and letters fall back to their base letter. */
const base = (ch: string) => ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

/** Pixel values: 0 empty, 1 letter, 2 shadow. */
type Grid = number[][];

function bitmap(line: string, font: AsciiFont, spacing: number): Grid {
  const table = FONTS[font];
  const glyphs = Array.from(line).map((ch) => table[base(ch)] ?? table["?"]);
  const rows = table["A"].length;
  return Array.from({ length: rows }, (_, row) => {
    const cells: number[] = [];
    glyphs.forEach((glyph, i) => {
      for (const c of glyph[row]) cells.push(c === "#" ? 1 : 0);
      if (i < glyphs.length - 1) for (let s = 0; s < spacing; s++) cells.push(0);
    });
    return cells;
  });
}

const stretch = (grid: Grid, k: number): Grid => grid.flatMap((row) => Array.from({ length: k }, () => row.flatMap((v) => Array.from({ length: k }, () => v))));

function restyle(grid: Grid, style: AsciiStyle, offset: number): Grid {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const on = (r: number, c: number) => r >= 0 && r < h && c >= 0 && c < w && grid[r][c] === 1;
  if (style === "outline") return grid.map((row, r) => row.map((v, c) => (v === 1 && !(on(r - 1, c) && on(r + 1, c) && on(r, c - 1) && on(r, c + 1)) ? 1 : 0)));
  if (style === "shadow") {
    // Grow the canvas so the shadow is never cut off, then drop it down and to the right of every lit pixel.
    const out: Grid = Array.from({ length: h + offset }, () => new Array<number>(w + offset).fill(0));
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (grid[r][c] === 1) out[r + offset][c + offset] = 2;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (grid[r][c] === 1) out[r][c] = 1;
    return out;
  }
  return grid;
}

export const renderLine = (line: string, o: AsciiOptions = DEFAULT_OPTIONS): string => {
  if (!line) return "";
  let grid = stretch(bitmap(line, o.font, o.spacing), o.scale);
  grid = restyle(grid, o.style, o.scale);
  const shadow = /^[\x20-\x7e]$/.test(o.fill) ? "." : "░";
  const fillWidth = Array.from(o.fill).length || 1;
  const pad = " ".repeat(fillWidth);
  return grid
    .map((row) => row.map((v) => (o.invert ? (v === 0 ? o.fill : pad) : v === 1 ? o.fill : v === 2 ? shadow : pad)).join("").replace(/\s+$/, ""))
    .join("\n");
};

const FRAMES = {
  simple: { tl: "+", t: "-", tr: "+", l: "|", r: "|", bl: "+", b: "-", br: "+" },
  double: { tl: "╔", t: "═", tr: "╗", l: "║", r: "║", bl: "╚", b: "═", br: "╝" },
};

function withFrame(lines: string[], frame: AsciiFrame): string[] {
  if (frame === "none") return lines;
  const f = FRAMES[frame];
  const width = Math.max(0, ...lines.map((l) => Array.from(l).length));
  const body = lines.map((l) => `${f.l} ${l}${" ".repeat(width - Array.from(l).length)} ${f.r}`);
  return [f.tl + f.t.repeat(width + 2) + f.tr, ...body, f.bl + f.b.repeat(width + 2) + f.br];
}

function withComment(lines: string[], comment: AsciiComment): string[] {
  if (comment === "slashes") return lines.map((l) => `// ${l}`.trimEnd());
  if (comment === "hash") return lines.map((l) => `# ${l}`.trimEnd());
  if (comment === "block") return ["/*", ...lines.map((l) => ` * ${l}`.trimEnd()), " */"];
  return lines;
}

/** One block of art per input line, separated by a blank line, then aligned, framed and optionally wrapped in a code comment. */
export function asciiArt(text: string, options: AsciiOptions = DEFAULT_OPTIONS): string {
  const blocks = text
    .split("\n")
    .map((line) => renderLine(line, options))
    .filter((block) => block !== "")
    .map((block) => block.split("\n"));
  if (!blocks.length) return "";
  const width = Math.max(...blocks.flat().map((l) => Array.from(l).length));
  const align = (l: string) => {
    const gap = width - Array.from(l).length;
    return options.align === "center" ? " ".repeat(Math.floor(gap / 2)) + l : options.align === "right" ? " ".repeat(gap) + l : l;
  };
  const lines = blocks.flatMap((block, i) => [...(i ? [""] : []), ...block.map(align)]);
  return withComment(withFrame(lines, options.frame), options.comment).join("\n");
}
