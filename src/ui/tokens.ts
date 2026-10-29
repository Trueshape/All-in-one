import { createContext, useContext } from "react";
import type { Theme } from "../theme";

/**
 * Design tokens for the tool UI kit. One set per landing theme, so every tool
 * inherits the same colors, fonts, radius and spacing as the landing page.
 * Status colors (success / error / warning) are fixed across themes on purpose.
 */
export interface Ui {
  id: Theme;
  /** Hex accent for canvas / SVG / native controls (accent-color). */
  accentHex: string;
  /** Hex for muted lines in canvas / SVG. */
  mutedHex: string;
  font: string;
  text: string;
  subtle: string;
  muted: string;
  accent: string;
  divider: string;
  label: string;
  input: string;
  btnBase: string;
  btnPrimary: string;
  btnSecondary: string;
  btnGhost: string;
  btnDanger: string;
  chip: string;
  chipActive: string;
  panel: string;
  panelInset: string;
  statLabel: string;
  statValue: string;
  heading: string;
  segmentWrap: string;
  segment: string;
  segmentActive: string;
}

const common = {
  btnDanger: "text-red-400 border-red-500/30 hover:bg-red-500/10",
};

const artistic: Ui = {
  ...common,
  id: "artistic",
  accentHex: "#e4e4e7",
  mutedHex: "#52525b",
  font: "font-mono",
  text: "text-zinc-100",
  subtle: "text-zinc-400",
  muted: "text-zinc-500",
  accent: "text-zinc-100",
  divider: "border-zinc-800",
  label: "block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5",
  input:
    "w-full bg-zinc-900/40 border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-50",
  btnBase:
    "inline-flex items-center justify-center gap-2 border rounded font-mono uppercase tracking-wider text-[10px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
  btnPrimary: "bg-zinc-100 text-zinc-900 border-zinc-100 hover:bg-white",
  btnSecondary: "bg-zinc-900/40 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-zinc-100",
  btnGhost: "border-transparent text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/60",
  chip: "px-2.5 py-1 text-[10px] font-mono border rounded border-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer",
  chipActive: "px-2.5 py-1 text-[10px] font-mono border rounded border-zinc-100 text-zinc-100 bg-zinc-100/5 cursor-pointer",
  panel: "bg-zinc-900/30 border border-zinc-800 rounded",
  panelInset: "bg-zinc-950/60 border border-zinc-900 rounded",
  statLabel: "text-[10px] font-mono uppercase tracking-widest text-zinc-500",
  statValue: "font-mono font-bold text-zinc-100",
  heading: "text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400",
  segmentWrap: "inline-flex border border-zinc-800 rounded overflow-hidden",
  segment: "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer",
  segmentActive: "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-zinc-100 text-zinc-900 cursor-pointer",
};

const immersive: Ui = {
  ...common,
  id: "immersive",
  accentHex: "#10b981",
  mutedHex: "#064e3b",
  font: "font-mono",
  text: "text-emerald-300",
  subtle: "text-emerald-500/80",
  muted: "text-emerald-700",
  accent: "text-emerald-400",
  divider: "border-emerald-900/40",
  label: "block text-[10px] font-mono uppercase tracking-widest text-emerald-600 mb-1.5",
  input:
    "w-full bg-emerald-950/10 border border-emerald-900/40 rounded-none px-3 py-2 text-sm font-mono text-emerald-300 placeholder-emerald-800 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50",
  btnBase:
    "inline-flex items-center justify-center gap-2 border rounded-none font-mono uppercase tracking-wider text-[10px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
  btnPrimary: "bg-emerald-500/15 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/25",
  btnSecondary: "bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:border-emerald-500/40",
  btnGhost: "border-transparent text-emerald-700 hover:text-emerald-400 hover:bg-emerald-950/30",
  chip: "px-2.5 py-1 text-[10px] font-mono border rounded-none border-emerald-900/40 text-emerald-700 hover:text-emerald-400 transition-colors cursor-pointer",
  chipActive: "px-2.5 py-1 text-[10px] font-mono border rounded-none border-emerald-400 text-emerald-300 bg-emerald-500/10 cursor-pointer",
  panel: "bg-emerald-950/10 border border-emerald-900/40 rounded-none",
  panelInset: "bg-[#02050a] border border-emerald-950 rounded-none",
  statLabel: "text-[10px] font-mono uppercase tracking-widest text-emerald-600",
  statValue: "font-mono font-bold text-emerald-300",
  heading: "text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-500",
  segmentWrap: "inline-flex border border-emerald-900/40 rounded-none overflow-hidden",
  segment: "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-700 hover:text-emerald-400 transition-colors cursor-pointer",
  segmentActive: "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 cursor-pointer",
};

const sophisticated: Ui = {
  ...common,
  id: "sophisticated",
  accentHex: "#8b5cf6",
  mutedHex: "#334155",
  font: "font-sans",
  text: "text-slate-100",
  subtle: "text-slate-300",
  muted: "text-slate-400",
  accent: "text-violet-400",
  divider: "border-slate-800/60",
  label: "block text-xs font-medium text-slate-400 mb-1.5",
  input:
    "w-full bg-slate-900/50 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50",
  btnBase:
    "inline-flex items-center justify-center gap-2 border rounded-xl font-sans font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
  btnPrimary: "bg-violet-500 text-white border-violet-500 hover:bg-violet-400",
  btnSecondary: "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-violet-500/40 hover:text-white",
  btnGhost: "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60",
  chip: "px-3 py-1 text-xs font-medium border rounded-lg border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer",
  chipActive: "px-3 py-1 text-xs font-medium border rounded-lg border-violet-500 text-violet-300 bg-violet-500/10 cursor-pointer",
  panel: "bg-slate-900/45 border border-slate-800/50 rounded-2xl",
  panelInset: "bg-slate-950/50 border border-slate-800/60 rounded-xl",
  statLabel: "text-xs font-medium text-slate-400",
  statValue: "font-sans font-semibold text-slate-100",
  heading: "text-xs font-semibold text-violet-400 tracking-wide uppercase",
  segmentWrap: "inline-flex border border-slate-800 rounded-xl overflow-hidden",
  segment: "px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer",
  segmentActive: "px-3.5 py-1.5 text-xs font-medium bg-violet-500 text-white cursor-pointer",
};

export const UI_TOKENS: Record<Theme, Ui> = { artistic, immersive, sophisticated };

export const UiContext = createContext<Ui>(artistic);

export const useUi = (): Ui => useContext(UiContext);
