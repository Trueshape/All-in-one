export const CATEGORY_LABELS: Record<string, string> = {
  all: "Tutti i Tool",
  calcolo: "Calcoli",
  convertitori: "Convertitori",
  produttivita: "Produttività",
  creative: "Utilità",
  preferiti: "Preferiti",
};

export type Theme = "artistic" | "immersive" | "sophisticated";

export const getThemeClasses = (theme: Theme) => {
  switch (theme) {
    case "immersive":
      return {
        bg: "bg-[#02050a] text-emerald-400 font-mono relative overflow-hidden select-none selection:bg-emerald-500/20 selection:text-emerald-300",
        headerBg: "bg-[#02050a] border-b border-emerald-900/40",
        headerTitle: "text-2xl font-black tracking-widest uppercase text-emerald-400 animate-pulse",
        headerSubtitle: "text-[10px] text-emerald-600 font-mono tracking-widest uppercase",
        navText: "text-emerald-600",
        navActive: "text-emerald-400 border-b border-emerald-400 font-bold",
        navInactive: "text-emerald-700 border-b border-transparent hover:text-emerald-500",
        panelBg: "bg-[#02050a] border-b border-emerald-900/40",
        searchInput: "w-full bg-emerald-950/10 border border-emerald-900/40 rounded-none px-9 pr-8 py-1.5 text-xs font-mono text-emerald-300 placeholder-emerald-800 focus:outline-none focus:border-emerald-500/50 transition-colors",
        clockText: "text-emerald-600",
        clockTime: "text-emerald-400 font-bold",
        gridContainer: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 bg-emerald-950/10 border border-emerald-900/30 rounded-none overflow-hidden max-w-7xl mx-auto",
        card: "bg-[#030812] pt-3 pb-2 px-4 border border-emerald-950 hover:border-emerald-500/40 rounded-none transition-all duration-300 relative",
        cardIndex: "text-[10px] font-mono text-emerald-600 tracking-widest uppercase",
        cardTitle: "text-xl font-bold tracking-wider uppercase text-emerald-300 group-hover:text-emerald-400 transition-colors",
        cardDesc: "text-xs text-emerald-500/70 leading-relaxed font-mono opacity-80 group-hover:opacity-100 transition-opacity",
        cardFooter: "border-t border-emerald-950/80 text-emerald-600 group-hover:text-emerald-450 font-mono tracking-widest uppercase",
        footer: "border-t border-emerald-900/40 bg-[#02050a] text-emerald-700 font-mono",
        modalContainer: "bg-[#030812] border border-emerald-500/40 rounded-none text-emerald-400 font-mono w-full max-w-xl overflow-hidden z-10 flex flex-col max-h-[90vh] relative shadow-2xl",
        modalHeader: "border-b border-emerald-950 bg-[#030812] flex items-center justify-between px-6 py-5 shrink-0",
        modalBody: "p-6 overflow-y-auto max-h-[calc(90vh-140px)] no-scrollbar bg-[#030812]",
        modalFooter: "px-6 py-4 border-t border-emerald-950 bg-[#030812] flex items-center justify-between shrink-0 text-xs",
        btnClassic: "bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 rounded-none",
        iconAccent: "text-emerald-500",
        borderClass: "border-emerald-900/40",
      };
    case "sophisticated":
      return {
        bg: "bg-[#090d16] text-slate-200 font-sans relative selection:bg-indigo-500/30 selection:text-indigo-200",
        headerBg: "bg-slate-950/40 backdrop-blur-md border-b border-slate-800/40",
        headerTitle: "text-2xl font-extrabold tracking-tight text-white bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent",
        headerSubtitle: "text-[10px] text-slate-400 font-sans tracking-wide uppercase",
        navText: "text-slate-400",
        navActive: "text-violet-400 border-b border-violet-400 font-bold",
        navInactive: "text-slate-500 border-b border-transparent hover:text-slate-350",
        panelBg: "bg-slate-950/40 backdrop-blur-md border-b border-slate-800/40",
        searchInput: "w-full bg-slate-900/50 border border-slate-800/60 rounded-xl px-9 pr-8 py-1.5 text-xs font-sans text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/40 transition-colors",
        clockText: "text-slate-500",
        clockTime: "text-slate-350 font-bold",
        gridContainer: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-transparent border-0 rounded-none p-1 max-w-7xl mx-auto",
        card: "bg-slate-900/45 backdrop-blur-md border border-slate-800/50 hover:border-violet-500/30 hover:shadow-[0_10px_30px_rgba(139,92,246,0.03)] rounded-2xl pt-3 pb-2 px-4 transition-all duration-350 relative",
        cardIndex: "text-[10px] font-sans font-bold text-violet-400/85 tracking-widest uppercase",
        cardTitle: "text-xl font-semibold tracking-tight text-slate-100 group-hover:text-white transition-colors",
        cardDesc: "text-xs text-slate-400 leading-relaxed font-sans opacity-75 group-hover:opacity-100 transition-opacity",
        cardFooter: "border-t border-slate-800/60 text-slate-500 group-hover:text-slate-300 font-sans tracking-wider uppercase",
        footer: "border-t border-slate-800/40 bg-slate-950/40 backdrop-blur-md text-slate-500",
        modalContainer: "bg-slate-900 border border-slate-800/80 rounded-2xl text-slate-100 w-full max-w-xl overflow-hidden z-10 flex flex-col max-h-[90vh] relative shadow-2xl font-sans",
        modalHeader: "border-b border-slate-850 bg-slate-900 flex items-center justify-between px-6 py-5 shrink-0",
        modalBody: "p-6 overflow-y-auto max-h-[calc(90vh-140px)] no-scrollbar bg-slate-900",
        modalFooter: "px-6 py-4 border-t border-slate-850 bg-slate-900 flex items-center justify-between shrink-0 text-xs",
        btnClassic: "bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg",
        iconAccent: "text-violet-400",
        borderClass: "border-slate-800/40",
      };
    case "artistic":
    default:
      return {
        bg: "bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100 relative",
        headerBg: "bg-[#0a0a0a] border-b border-zinc-800",
        headerTitle: "text-2xl font-bold tracking-tighter uppercase text-zinc-100",
        headerSubtitle: "text-[10px] text-zinc-500 font-mono tracking-widest uppercase",
        navText: "text-zinc-400",
        navActive: "text-zinc-100 border-b border-zinc-100 font-bold",
        navInactive: "text-zinc-500 border-b border-transparent hover:text-zinc-100",
        panelBg: "bg-[#0a0a0a] border-b border-zinc-800",
        searchInput: "w-full bg-zinc-900/40 border border-zinc-800 rounded px-9 pr-8 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors",
        clockText: "text-zinc-500",
        clockTime: "text-zinc-400 font-bold",
        gridContainer: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-zinc-850 border border-zinc-800 rounded-lg overflow-hidden max-w-7xl mx-auto",
        card: "bg-[#0a0a0a] pt-3 pb-2 px-4 flex flex-col justify-between group h-36 cursor-pointer hover:bg-zinc-900/10 transition-all duration-300 relative",
        cardIndex: "text-[10px] font-mono text-zinc-500 tracking-wider uppercase",
        cardTitle: "text-2xl font-light text-zinc-100 group-hover:text-white transition-colors",
        cardDesc: "text-xs text-zinc-400 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity",
        cardFooter: "border-t border-zinc-900 text-zinc-500 group-hover:text-zinc-300 font-mono tracking-widest uppercase",
        footer: "border-t border-zinc-800 bg-[#0a0a0a] text-zinc-600",
        modalContainer: "bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl w-full max-w-xl overflow-hidden z-10 flex flex-col max-h-[90vh] relative",
        modalHeader: "border-b border-zinc-900 bg-[#0a0a0a] flex items-center justify-between px-6 py-5 shrink-0",
        modalBody: "p-6 overflow-y-auto max-h-[calc(90vh-140px)] no-scrollbar bg-[#0a0a0a]",
        modalFooter: "px-6 py-4 border-t border-zinc-900 bg-[#0a0a0a] flex items-center justify-between shrink-0 text-xs",
        btnClassic: "bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 rounded",
        iconAccent: "text-zinc-500",
        borderClass: "border-zinc-800",
      };
  }
};

export const getToolModalSize = (toolId: string): string => {
  switch (toolId) {
    case "aspect_ratio_calc":
      return "max-w-[640px] w-[90vw]";
    case "case_converter":
    case "text_diff":
    case "markdown":
      return "max-w-4xl";
    case "compound_interest_calc":
    case "circle_calc":
    case "age":
    case "scientific_calc":
    case "image_converter":
    case "discord_timestamp":
      return "max-w-3xl";
    case "currency":
    case "unit":
    case "timer":
    case "password":
    case "tip":
    case "text":
    case "bmi":
    case "worldclock":
    case "codice_fiscale_calc":
    case "codice_fiscale_inv":
      return "max-w-2xl";
    default:
      return "max-w-xl";
  }
};
