import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  Ruler,
  KeyRound,
  Percent,
  Timer,
  QrCode,
  AlignLeft,
  Palette,
  Dices,
  Search,
  Clock,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  GripVertical,
  ChevronDown,
  Check,
  ArrowUp,
  ArrowDown,
  Scale,
  FileText,
  Landmark,
  Braces,
  Globe,
  Gift,
  Calculator,
  Circle,
  Maximize,
  Type,
  TrendingUp,
  GitCompare,
  Image,
  MessageSquare,
  Heart,
  Pencil,
  Fingerprint,
  Lock,
  Unlock,
  Coins,
  ShieldCheck,
  Wand2,
  CheckSquare,
  Languages,
  ListTodo,
  BarChart3,
} from "lucide-react";

// Import Components
import CurrencyConverter from "./components/CurrencyConverter";
import UnitConverter from "./components/UnitConverter";
import PasswordGenerator from "./components/PasswordGenerator";
import TipCalculator from "./components/TipCalculator";
import PomodoroTimer from "./components/PomodoroTimer";
import QrGenerator from "./components/QrGenerator";
import TextCounter from "./components/TextCounter";
import ColorPicker from "./components/ColorPicker";
import DecisionMaker from "./components/DecisionMaker";
import BmiCalculator from "./components/BmiCalculator";
import MarkdownPreviewer from "./components/MarkdownPreviewer";
import WorldClock from "./components/WorldClock";
import AgeCalculator from "./components/AgeCalculator";
import ScientificCalculator from "./components/ScientificCalculator";
import CircleCalculator from "./components/CircleCalculator";
import AspectRatioCalculator from "./components/AspectRatioCalculator";
import CaseConverter from "./components/CaseConverter";
import CompoundInterestCalculator from "./components/CompoundInterestCalculator";
import TextDiff from "./components/TextDiff";
import ImageConverter from "./components/ImageConverter";
import DiscordTimestamp from "./components/DiscordTimestamp";
import CodiceFiscaleCalculator from "./components/CodiceFiscaleCalculator";
import CryptoAndNasdaqTracker from "./components/CryptoAndNasdaqTracker";
import IbanValidator from "./components/IbanValidator";
import BackgroundRemover from "./components/BackgroundRemover";
import TodoList from "./components/TodoList";
import Translator from "./components/Translator";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  glowClass: string;
  iconColor: string;
  category: "convertitori" | "calcolo" | "produttivita" | "creative";
  component: React.ComponentType<any>;
}

const TOOLS: ToolItem[] = [
  {
    id: "currency",
    name: "Convertitore di Valuta",
    description: "Tassi di cambio aggiornati in tempo reale per le principali monete mondiali.",
    icon: ArrowLeftRight,
    colorClass: "border-indigo-900/30 hover:border-indigo-500/50",
    glowClass: "shadow-indigo-950/20 hover:shadow-indigo-500/5",
    iconColor: "text-indigo-400 bg-indigo-500/10",
    category: "convertitori",
    component: CurrencyConverter,
  },
  {
    id: "unit",
    name: "Convertitore di Unità",
    description: "Converti misure di lunghezza, peso, temperatura, area e volume.",
    icon: Ruler,
    colorClass: "border-emerald-900/30 hover:border-emerald-500/50",
    glowClass: "shadow-emerald-950/20 hover:shadow-emerald-500/5",
    iconColor: "text-emerald-400 bg-emerald-500/10",
    category: "convertitori",
    component: UnitConverter,
  },
  {
    id: "password",
    name: "Generatore di Password",
    description: "Crea chiavi d'accesso ad alta sicurezza con parametri e lunghezza regolabili.",
    icon: KeyRound,
    colorClass: "border-purple-900/30 hover:border-purple-500/50",
    glowClass: "shadow-purple-950/20 hover:shadow-purple-500/5",
    iconColor: "text-purple-400 bg-purple-500/10",
    category: "produttivita",
    component: PasswordGenerator,
  },
  {
    id: "tip",
    name: "Mance e Sconti",
    description: "Calcola le percentuali di sconto, la mancia del conto e dividi la quota a persona.",
    icon: Percent,
    colorClass: "border-amber-900/30 hover:border-amber-500/50",
    glowClass: "shadow-amber-950/20 hover:shadow-amber-500/5",
    iconColor: "text-amber-400 bg-amber-500/10",
    category: "calcolo",
    component: TipCalculator,
  },
  {
    id: "timer",
    name: "Timer & Pomodoro",
    description: "Gestisci sessioni di focus con la tecnica Pomodoro o usa il cronometro di precisione.",
    icon: Timer,
    colorClass: "border-rose-900/30 hover:border-rose-500/50",
    glowClass: "shadow-rose-950/20 hover:shadow-rose-500/5",
    iconColor: "text-rose-400 bg-rose-500/10",
    category: "produttivita",
    component: PomodoroTimer,
  },
  {
    id: "qr",
    name: "Generatore QR Code",
    description: "Crea al volo codici QR scansionabili per testi, indirizzi web o credenziali Wi-Fi.",
    icon: QrCode,
    colorClass: "border-cyan-900/30 hover:border-cyan-500/50",
    glowClass: "shadow-cyan-950/20 hover:shadow-cyan-500/5",
    iconColor: "text-cyan-400 bg-cyan-500/10",
    category: "creative",
    component: QrGenerator,
  },
  {
    id: "text",
    name: "Contatore & Analisi Testo",
    description: "Analisi di parole, lettere, righe e tempo stimato di lettura con trasformazioni rapide.",
    icon: AlignLeft,
    colorClass: "border-violet-900/30 hover:border-violet-500/50",
    glowClass: "shadow-violet-950/20 hover:shadow-violet-500/5",
    iconColor: "text-violet-400 bg-violet-500/10",
    category: "produttivita",
    component: TextCounter,
  },
  {
    id: "color",
    name: "Tavolozza e Picker Colori",
    description: "Seleziona i colori, visualizza i codici HEX/RGB/HSL e genera scale armoniche.",
    icon: Palette,
    colorClass: "border-pink-900/30 hover:border-pink-500/50",
    glowClass: "shadow-pink-950/20 hover:shadow-pink-500/5",
    iconColor: "text-pink-400 bg-pink-500/10",
    category: "creative",
    component: ColorPicker,
  },
  {
    id: "decision",
    name: "Generatore di Decisioni",
    description: "Risolvi i dubbi tirando i dadi, lanciando una moneta o pescando da una lista casuale.",
    icon: Dices,
    colorClass: "border-sky-900/30 hover:border-sky-500/50",
    glowClass: "shadow-sky-950/20 hover:shadow-sky-500/5",
    iconColor: "text-sky-400 bg-sky-500/10",
    category: "creative",
    component: DecisionMaker,
  },
  {
    id: "bmi",
    name: "Calcolo Indice BMI",
    description: "Misura l'indice di massa corporea, il peso ideale e stima il grasso corporeo in pochi secondi.",
    icon: Scale,
    colorClass: "border-teal-900/30 hover:border-teal-500/50",
    glowClass: "shadow-teal-950/20 hover:shadow-teal-500/5",
    iconColor: "text-teal-400 bg-teal-500/10",
    category: "calcolo",
    component: BmiCalculator,
  },
  {
    id: "markdown",
    name: "Anteprima Markdown Live",
    description: "Scrivi codice in sintassi Markdown e visualizza in tempo reale la resa grafica formattata.",
    icon: FileText,
    colorClass: "border-indigo-900/30 hover:border-indigo-500/50",
    glowClass: "shadow-indigo-950/20 hover:shadow-indigo-500/5",
    iconColor: "text-indigo-400 bg-indigo-500/10",
    category: "creative",
    component: MarkdownPreviewer,
  },
  {
    id: "worldclock",
    name: "Orologio e Fusi Mondiali",
    description: "Visualizza l'ora in tutto il pianeta e simula l'ora futura per pianificare videochiamate.",
    icon: Globe,
    colorClass: "border-rose-900/30 hover:border-rose-500/50",
    glowClass: "shadow-rose-950/20 hover:shadow-rose-500/5",
    iconColor: "text-rose-400 bg-rose-500/10",
    category: "produttivita",
    component: WorldClock,
  },
  {
    id: "age",
    name: "Calcolatore Età e Longevità",
    description: "Scopri la tua età esatta, il giorno in cui sei nato e divertenti statistiche sui tuoi battiti cardiaci.",
    icon: Gift,
    colorClass: "border-pink-900/30 hover:border-pink-500/50",
    glowClass: "shadow-pink-950/20 hover:shadow-pink-500/5",
    iconColor: "text-pink-400 bg-pink-500/10",
    category: "calcolo",
    component: AgeCalculator,
  },
  {
    id: "scientific_calc",
    name: "Calcolatrice Scientifica",
    description: "Esegui calcoli complessi con funzioni trigonometriche, logaritmiche e gestione della memoria integrata.",
    icon: Calculator,
    colorClass: "border-indigo-900/30 hover:border-indigo-500/50",
    glowClass: "shadow-indigo-950/20 hover:shadow-indigo-500/5",
    iconColor: "text-indigo-400 bg-indigo-500/10",
    category: "calcolo",
    component: ScientificCalculator,
  },
  {
    id: "circle_calc",
    name: "Calcolo circonferenza",
    description: "Calcola in tempo reale area, circonferenza, diametro e raggio di un cerchio partendo da una qualsiasi misura.",
    icon: Circle,
    colorClass: "border-emerald-900/30 hover:border-emerald-500/50",
    glowClass: "shadow-emerald-950/20 hover:shadow-emerald-500/5",
    iconColor: "text-emerald-400 bg-emerald-500/10",
    category: "calcolo",
    component: CircleCalculator,
  },
  {
    id: "aspect_ratio_calc",
    name: "Aspect ratio calculator",
    description: "Calcola rapporti d'aspetto, ridimensiona risoluzioni e simula anteprime di schermo in tempo reale.",
    icon: Maximize,
    colorClass: "border-blue-900/30 hover:border-blue-500/50",
    glowClass: "shadow-blue-950/20 hover:shadow-blue-500/5",
    iconColor: "text-blue-400 bg-blue-500/10",
    category: "calcolo",
    component: AspectRatioCalculator,
  },
  {
    id: "case_converter",
    name: "Case converter",
    description: "Modifica al volo il formato maiuscole/minuscole del tuo testo (camelCase, snake_case, UPPERCASE, etc.).",
    icon: Type,
    colorClass: "border-purple-900/30 hover:border-purple-500/50",
    glowClass: "shadow-purple-950/20 hover:shadow-purple-500/5",
    iconColor: "text-purple-400 bg-purple-500/10",
    category: "convertitori",
    component: CaseConverter,
  },
  {
    id: "compound_interest_calc",
    name: "Calcolatore interessi composti",
    description: "Calcola l'interesse composto accumulato nel tempo inserendo versamenti periodici e capitalizzazioni.",
    icon: TrendingUp,
    colorClass: "border-emerald-900/30 hover:border-emerald-500/50",
    glowClass: "shadow-emerald-950/20 hover:shadow-emerald-500/5",
    iconColor: "text-emerald-400 bg-emerald-500/10",
    category: "calcolo",
    component: CompoundInterestCalculator,
  },
  {
    id: "text_diff",
    name: "Confronto differenze",
    description: "Confronta due testi riga per riga evidenziando le parti aggiunte, eliminate o modificate.",
    icon: GitCompare,
    colorClass: "border-rose-900/30 hover:border-rose-500/50",
    glowClass: "shadow-rose-950/20 hover:shadow-rose-500/5",
    iconColor: "text-rose-400 bg-rose-500/10",
    category: "produttivita",
    component: TextDiff,
  },
  {
    id: "image_converter",
    name: "Convertitore immagini",
    description: "Converti al volo immagini tra formati PNG, JPEG, WEBP con opzioni di ridimensionamento e compressione locale.",
    icon: Image,
    colorClass: "border-amber-900/30 hover:border-amber-500/50",
    glowClass: "shadow-amber-950/20 hover:shadow-amber-500/5",
    iconColor: "text-amber-400 bg-amber-500/10",
    category: "convertitori",
    component: ImageConverter,
  },
  {
    id: "discord_timestamp",
    name: "Discord superscript & timestamps",
    description: "Genera marcatori temporali dinamici (Unix), apici superscript e stili di chat speciali per Discord.",
    icon: MessageSquare,
    colorClass: "border-indigo-900/30 hover:border-indigo-500/50",
    glowClass: "shadow-indigo-950/20 hover:shadow-indigo-500/5",
    iconColor: "text-indigo-400 bg-indigo-500/10",
    category: "creative",
    component: DiscordTimestamp,
  },
  {
    id: "codice_fiscale_calc",
    name: "Calcolo Codice Fiscale",
    description: "Genera il codice fiscale italiano ufficiale inserendo dati anagrafici e comune di nascita.",
    icon: Fingerprint,
    colorClass: "border-indigo-900/30 hover:border-indigo-500/50",
    glowClass: "shadow-indigo-950/20 hover:shadow-indigo-500/5",
    iconColor: "text-indigo-400 bg-indigo-500/10",
    category: "calcolo",
    component: CodiceFiscaleCalculator,
  },
  {
    id: "crypto_nasdaq",
    name: "Crypto Top 100 & Nasdaq",
    description: "Andamento in tempo reale delle prime 100 criptovalute e i principali titoli azionari del NASDAQ.",
    icon: Coins,
    colorClass: "border-amber-900/30 hover:border-amber-500/50",
    glowClass: "shadow-amber-950/20 hover:shadow-amber-500/5",
    iconColor: "text-amber-400 bg-amber-500/10",
    category: "calcolo",
    component: CryptoAndNasdaqTracker,
  },
  {
    id: "iban_validator",
    name: "Validatore IBAN",
    description: "Verifica e convalida la correttezza formale e le cifre di controllo MOD-97 di un IBAN bancario.",
    icon: ShieldCheck,
    colorClass: "border-emerald-900/30 hover:border-emerald-500/50",
    glowClass: "shadow-emerald-950/20 hover:shadow-emerald-500/5",
    iconColor: "text-emerald-400 bg-emerald-500/10",
    category: "calcolo",
    component: IbanValidator,
  },
  {
    id: "bg_remover",
    name: "Rimozione Sfondo IA",
    description: "Isola soggetti dalle immagini, rimuovi sfondi e sostituiscili con trasparenza o colori personalizzati.",
    icon: Wand2,
    colorClass: "border-purple-900/30 hover:border-purple-500/50",
    glowClass: "shadow-purple-950/20 hover:shadow-purple-500/5",
    iconColor: "text-purple-400 bg-purple-500/10",
    category: "creative",
    component: BackgroundRemover,
  },
  {
    id: "todo_checklist",
    name: "To Do List & Checklist",
    description: "Organizza le tue attività quotidiane, mansioni, sotto-check e scadenze con priorità e progresso.",
    icon: CheckSquare,
    colorClass: "border-emerald-900/30 hover:border-emerald-500/50",
    glowClass: "shadow-emerald-950/20 hover:shadow-emerald-500/5",
    iconColor: "text-emerald-400 bg-emerald-500/10",
    category: "produttivita",
    component: TodoList,
  },
  {
    id: "translator",
    name: "Traduttore Multilingua",
    description: "Traduci testi in oltre 35 lingue con selezione del tono di voce, pronuncia vocale e rilevamento automatico.",
    icon: Languages,
    colorClass: "border-cyan-900/30 hover:border-cyan-500/50",
    glowClass: "shadow-cyan-950/20 hover:shadow-cyan-500/5",
    iconColor: "text-cyan-400 bg-cyan-500/10",
    category: "convertitori",
    component: Translator,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "Tutti i Tool",
  calcolo: "Calcoli",
  convertitori: "Convertitori",
  produttivita: "Produttività",
  creative: "Utilità",
  preferiti: "Preferiti",
};

type Theme = "artistic" | "immersive" | "sophisticated";

const getThemeClasses = (theme: Theme) => {
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

const getToolModalSize = (toolId: string): string => {
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

export default function App() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  
  // Real-time Clock State
  const [time, setTime] = useState<Date>(new Date());

  // Theme Switching State
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("utilita365_theme");
    return (saved as Theme) || "artistic";
  });
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);

  // Editor mode state for buttons sizing/ordering
  const [isEditorMode, setIsEditorMode] = useState<boolean>(false);

  // Reset editor mode when changing or closing active tool
  useEffect(() => {
    if (!activeToolId) {
      setIsEditorMode(false);
    }
  }, [activeToolId]);

  // Favorite Tools State
  const [favoriteTools, setFavoriteTools] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("utilita365_favorite_tools");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Custom Tool Names State
  const [customToolNames, setCustomToolNames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("utilita365_custom_tool_names");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const [editingToolName, setEditingToolName] = useState<boolean>(false);
  const [tempToolName, setTempToolName] = useState<string>("");

  const [editingCardToolId, setEditingCardToolId] = useState<string | null>(null);
  const [tempCardToolName, setTempCardToolName] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("utilita365_custom_tool_names", JSON.stringify(customToolNames));
  }, [customToolNames]);

  useEffect(() => {
    if (activeToolId) {
      const activeTool = TOOLS.find((t) => t.id === activeToolId);
      if (activeTool) {
        setTempToolName(customToolNames[activeToolId] || activeTool.name);
      }
    }
    setEditingToolName(false);
  }, [activeToolId]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("utilita365_theme", activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    localStorage.setItem("utilita365_favorite_tools", JSON.stringify(favoriteTools));
  }, [favoriteTools]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteTools((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Always sort the tools alphabetically by name (taking custom names into account)
  const orderedTools = [...TOOLS].sort((a, b) => {
    const nameA = customToolNames[a.id] || a.name;
    const nameB = customToolNames[b.id] || b.name;
    return nameA.localeCompare(nameB, "it");
  });

  // Filter tools based on query and selected category tab
  const filteredTools = orderedTools.filter((tool) => {
    const displayName = customToolNames[tool.id] || tool.name;
    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "preferiti" ? !!favoriteTools[tool.id] : tool.category === activeTab);
    return matchesSearch && matchesTab;
  });

  const activeToolIndex = activeToolId
    ? orderedTools.findIndex((t) => t.id === activeToolId)
    : -1;
  const activeTool = activeToolIndex !== -1 ? orderedTools[activeToolIndex] : null;

  const handleNextTool = () => {
    if (activeToolIndex !== -1) {
      const nextIndex = (activeToolIndex + 1) % orderedTools.length;
      setActiveToolId(orderedTools[nextIndex].id);
    }
  };

  const handlePrevTool = () => {
    if (activeToolIndex !== -1) {
      const prevIndex = (activeToolIndex - 1 + orderedTools.length) % orderedTools.length;
      setActiveToolId(orderedTools[prevIndex].id);
    }
  };

  const tc = getThemeClasses(activeTheme);

  return (
    <div className={`min-h-screen ${tc.bg} flex flex-col relative transition-colors duration-500`}>
      
      {/* Background decoration elements */}
      {activeTheme === "immersive" && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      )}
      {activeTheme === "sophisticated" && (
        <>
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
        </>
      )}

      {/* Header Section */}
      <header className={`h-20 ${tc.headerBg} flex items-center justify-between px-6 sm:px-8 shrink-0 z-30`}>
        <div className="flex items-baseline gap-4">
          <h1 className={tc.headerTitle}>
            {activeTheme === "immersive" ? "IL SITO È MIO" : "Il sito è mio"}
          </h1>
          <span className={`${tc.headerSubtitle} hidden sm:inline-block`}>
            {activeTheme === "artistic" ? "Sistemi Quotidiani v1.0" : activeTheme === "immersive" ? "KERNEL_V1.0 // ONLINE" : "Elegant Suite v1.0"}
          </span>
        </div>
        
        <nav className="flex gap-6 text-[10px] font-medium tracking-[0.2em] uppercase overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
          {Object.keys(CATEGORY_LABELS).map((catKey) => (
            <button
              key={catKey}
              onClick={() => setActiveTab(catKey)}
              className={`hover:text-zinc-100 transition-all cursor-pointer whitespace-nowrap pb-1 ${
                activeTab === catKey ? tc.navActive : tc.navInactive
              }`}
              id={`tab-cat-${catKey}`}
            >
              {CATEGORY_LABELS[catKey]}
            </button>
          ))}
        </nav>
      </header>

      {/* Search, Time and Theme Selector Panel */}
      <div className={`h-auto sm:h-14 border-b ${tc.borderClass} ${tc.panelBg} flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-3 sm:py-0 gap-4 shrink-0 z-20`}>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cerca strumento o funzione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${tc.searchInput}`}
              id="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                id="btn-search-clear"
              >
                <X className="w-3" />
              </button>
            )}
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 text-[10px] font-mono border ${tc.borderClass} ${tc.btnClassic} transition-all uppercase tracking-wider h-[30px]`}
              id="theme-dropdown-btn"
              style={{ height: "30px" }}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden md:inline-block">Stile:</span>
                <span className="font-bold">
                  {activeTheme === "artistic" ? "Artistic Flair" : activeTheme === "immersive" ? "Immersive UI" : "Sophisticated"}
                </span>
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform ${isThemeDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            <AnimatePresence>
              {isThemeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsThemeDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute left-0 mt-2 w-64 z-50 rounded shadow-2xl border ${tc.borderClass} ${
                      activeTheme === "immersive" ? "bg-[#030812]" : activeTheme === "sophisticated" ? "bg-slate-900" : "bg-[#0a0a0a]"
                    } overflow-hidden`}
                  >
                    <div className={`p-2 border-b ${tc.borderClass} bg-zinc-950/20 text-[9px] font-mono tracking-widest text-zinc-500 uppercase`}>
                      Seleziona Interfaccia
                    </div>
                    <div className="p-1.5 flex flex-col gap-1">
                      {[
                        {
                          id: "artistic",
                          name: "Artistic Flair",
                          desc: "Minimale, stampo editoriale",
                          accent: "bg-zinc-100",
                        },
                        {
                          id: "immersive",
                          name: "Immersive UI",
                          desc: "Terminale cyber, dettagli neon, fosfori",
                          accent: "bg-emerald-500",
                        },
                        {
                          id: "sophisticated",
                          name: "Sophisticated Dark",
                          desc: "Premium dark, angoli morbidi, sfumature",
                          accent: "bg-violet-500",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setActiveTheme(t.id as Theme);
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded transition-colors flex items-start gap-3 ${
                            activeTheme === t.id
                              ? activeTheme === "immersive"
                                ? "bg-emerald-950/30 text-emerald-300"
                                : activeTheme === "sophisticated"
                                ? "bg-slate-800 text-violet-200"
                                : "bg-zinc-900 text-zinc-100"
                              : "hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-200"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${t.accent}`} />
                          <div className="flex-1">
                            <div className="text-xs font-bold font-mono tracking-wide">{t.name}</div>
                            <div className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">{t.desc}</div>
                          </div>
                          {activeTheme === t.id && (
                            <Check className="w-3.5 h-3.5 self-center text-zinc-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className={`flex items-center gap-6 text-[10px] font-mono ${tc.clockText} uppercase tracking-wider`}>
          <div className="hidden md:flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            <span>
              {time.toLocaleDateString("it-IT", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <div className={`h-4 w-px bg-zinc-800 hidden md:block ${tc.borderClass}`} />
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            <span className={`tabular-nums ${tc.clockTime}`}>
              {time.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 no-scrollbar z-10">
        {activeTab === "all" && searchQuery === "" ? (
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1 select-none">
              <h2 className={`text-xs font-mono uppercase tracking-[0.25em] ${
                activeTheme === "immersive" ? "text-emerald-500" : activeTheme === "sophisticated" ? "text-violet-400" : "text-zinc-400"
              }`}>
                {activeTheme === "immersive" ? "01 // SELEZIONA CATEGORIA" : "Seleziona Categoria"}
              </h2>
              <p className="text-xs text-zinc-500 font-sans">
                Esplora i diversi strumenti raggruppati per tipologia di utilizzo.
              </p>
            </div>

            <div className={tc.gridContainer}>
              {[
                {
                  id: "calcolo",
                  name: "Calcoli",
                  description: "Formule scientifiche, conteggi di precisione e calcolo delle mance.",
                  icon: Calculator,
                  count: TOOLS.filter(t => t.category === "calcolo").length,
                },
                {
                  id: "convertitori",
                  name: "Convertitori",
                  description: "Tassi di cambio valute, unità di misura, maiuscole e immagini.",
                  icon: ArrowLeftRight,
                  count: TOOLS.filter(t => t.category === "convertitori").length,
                },
                {
                  id: "produttivita",
                  name: "Produttività",
                  description: "Pomodoro, timer, orologi mondiali, generatori e analisi testi.",
                  icon: Timer,
                  count: TOOLS.filter(t => t.category === "produttivita").length,
                },
                {
                  id: "creative",
                  name: "Utilità",
                  description: "Decisioni casuali, picker colori, markdown e tag per Discord.",
                  icon: Palette,
                  count: TOOLS.filter(t => t.category === "creative").length,
                },
                {
                  id: "preferiti",
                  name: "Preferiti",
                  description: "I tuoi strumenti preferiti salvati per un accesso rapido.",
                  icon: Heart,
                  count: Object.keys(favoriteTools).filter(id => !!favoriteTools[id]).length,
                }
              ].map((category, index) => {
                const Icon = category.icon;
                const formattedIndex = String(index + 1).padStart(2, "0");
                const isPreferiti = category.id === "preferiti";
                const categoryTools = (isPreferiti
                  ? TOOLS.filter(t => !!favoriteTools[t.id])
                  : TOOLS.filter(t => t.category === category.id)
                ).sort((a, b) => {
                  const nameA = customToolNames[a.id] || a.name;
                  const nameB = customToolNames[b.id] || b.name;
                  return nameA.localeCompare(nameB, "it");
                });
                return (
                  <motion.div
                    key={category.id}
                    layoutId={`cat-${category.id}`}
                    onClick={() => setActiveTab(category.id)}
                    className={`${tc.card} flex flex-col justify-between h-auto min-h-[160px] cursor-pointer group`}
                    id={`card-category-${category.id}`}
                    whileHover={{ 
                      backgroundColor: activeTheme === "immersive" ? "rgba(16, 185, 129, 0.05)" : activeTheme === "sophisticated" ? "rgba(139, 92, 246, 0.04)" : "rgba(24, 24, 27, 0.2)",
                      y: -2
                    }}
                  >
                    <div className="flex justify-between items-start select-none relative z-20 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className={tc.cardIndex}>
                          {formattedIndex} / {isPreferiti ? "PERSONAL" : "CATEGORY"}
                        </span>
                        <h2 className={tc.cardTitle}>
                          {category.name}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500 opacity-80 group-hover:opacity-100 transition-opacity">
                          {category.count} {category.count === 1 ? "tool" : "tools"}
                        </span>
                        <Icon className={`w-4 h-4 ${tc.iconAccent} group-hover:text-zinc-200 transition-colors`} />
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 z-20">
                      {categoryTools.length > 0 ? (
                        categoryTools.map(tool => (
                          <div 
                            key={tool.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveToolId(tool.id);
                            }}
                            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-100 flex items-center gap-1.5 transition-colors cursor-pointer group/item"
                          >
                            <span className={`transition-transform duration-200 group-hover/item:translate-x-0.5 text-[8px] ${
                              activeTheme === "immersive" ? "text-emerald-500/70" : activeTheme === "sophisticated" ? "text-violet-400/70" : "text-zinc-500"
                            }`}>
                              →
                            </span>
                            <span className="group-hover/item:underline">
                              {customToolNames[tool.id] || tool.name}
                            </span>
                          </div>
                        ))
                      ) : isPreferiti ? (
                        <p className="text-[10px] font-mono text-zinc-500/80 leading-normal">
                          Clicca sul cuore sui tool per salvarli qui.
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Show Breadcrumb / Header when a specific category is active */}
            {activeTab !== "all" && searchQuery === "" && (
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono border ${tc.borderClass} ${tc.btnClassic} transition-all uppercase tracking-wider cursor-pointer`}
                    id="btn-back-to-categories"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Indietro</span>
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Categoria</span>
                    <span className={`text-[11px] font-bold font-mono tracking-wider uppercase mt-1 ${
                      activeTheme === "immersive" ? "text-emerald-400" : activeTheme === "sophisticated" ? "text-violet-300" : "text-zinc-200"
                    }`}>
                      {CATEGORY_LABELS[activeTab]}
                    </span>
                  </div>
                </div>
                {/* Total tools count */}
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  {filteredTools.length} {filteredTools.length === 1 ? "STRUMENTO" : "STRUMENTI"}
                </div>
              </div>
            )}

            <div className={tc.gridContainer}>
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool, index) => {
                  const getCategoryIcon = (category: string) => {
                    switch (category) {
                      case "convertitori":
                        return ArrowLeftRight;
                      case "calcolo":
                        return Calculator;
                      case "produttivita":
                        return Timer;
                      case "creative":
                        return Palette;
                      default:
                        return Timer;
                    }
                  };
                  const CategoryIcon = getCategoryIcon(tool.category);
                  const formattedIndex = String(index + 1).padStart(2, "0");

                  return (
                    <motion.div
                      key={tool.id}
                      layoutId={`card-${tool.id}`}
                      onClick={() => {
                        if (editingCardToolId !== tool.id) {
                          setActiveToolId(tool.id);
                        }
                      }}
                      className={`${tc.card} flex flex-col justify-between h-36 cursor-pointer group`}
                      id={`card-tool-${tool.id}`}
                      whileHover={editingCardToolId === tool.id ? undefined : { 
                        backgroundColor: activeTheme === "immersive" ? "rgba(16, 185, 129, 0.05)" : activeTheme === "sophisticated" ? "rgba(139, 92, 246, 0.04)" : "rgba(24, 24, 27, 0.2)",
                        y: -2
                      }}
                    >
                      <div className="flex justify-between items-start select-none relative z-20">
                        <span className={`${tc.cardIndex} flex items-center gap-1`}>
                          {formattedIndex} / {tool.category}
                          {!!favoriteTools[tool.id] && (
                            <Heart className="w-2.5 h-2.5 text-red-500 fill-current animate-pulse ml-0.5" />
                          )}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          {/* Control group */}
                          <div 
                            className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity rounded px-1 py-0.5 border ${
                              activeTheme === "immersive" ? "bg-[#030812]/90 border-emerald-900/60" : activeTheme === "sophisticated" ? "bg-slate-950/80 border-slate-800" : "bg-zinc-950/80 border-zinc-800"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Pencil button (Rename) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCardToolId(tool.id);
                                setTempCardToolName(customToolNames[tool.id] || tool.name);
                              }}
                              className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded cursor-pointer"
                              title="Rinomina"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Favorite button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(tool.id);
                              }}
                              className={`p-1 transition-colors rounded cursor-pointer ${
                                !!favoriteTools[tool.id]
                                  ? "text-red-500 hover:text-red-400 bg-red-500/10"
                                  : "text-zinc-500 hover:text-zinc-200"
                              }`}
                              title={!!favoriteTools[tool.id] ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                            >
                              <Heart className={`w-3.5 h-3.5 ${!!favoriteTools[tool.id] ? "fill-current text-red-500" : ""}`} />
                            </button>
                          </div>
 
                          <CategoryIcon className={`w-4 h-4 ${tc.iconAccent} group-hover:text-zinc-200 transition-colors`} />
                        </div>
                      </div>
 
                      <div className="mt-1 flex-1 flex flex-col justify-end">
                        {editingCardToolId === tool.id ? (
                          <div 
                            className="mb-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={tempCardToolName}
                              onChange={(e) => setTempCardToolName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setCustomToolNames((prev) => ({
                                    ...prev,
                                    [tool.id]: tempCardToolName.trim() || tool.name,
                                  }));
                                  setEditingCardToolId(null);
                                } else if (e.key === "Escape") {
                                  setEditingCardToolId(null);
                                }
                              }}
                              className={`w-full text-base font-medium font-mono bg-zinc-900 border ${tc.borderClass} px-2 py-0.5 rounded text-zinc-100 focus:outline-none focus:border-zinc-500`}
                              autoFocus
                              onBlur={() => {
                                setCustomToolNames((prev) => ({
                                  ...prev,
                                  [tool.id]: tempCardToolName.trim() || tool.name,
                                }));
                                setEditingCardToolId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <h2 className={`${tc.cardTitle} mb-1 select-none`}>
                            {customToolNames[tool.id] || tool.name}
                          </h2>
                        )}
                        <p className={`${tc.cardDesc} select-none`}>
                          {tool.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredTools.length === 0 && (
                <div className={`col-span-full py-24 text-center ${activeTheme === "immersive" ? "bg-[#030812]" : activeTheme === "sophisticated" ? "bg-slate-900/40" : "bg-[#0a0a0a]"}`}>
                  <p className="text-sm text-zinc-500 font-mono">NESSUNO STRUMENTO TROVATO NEL SISTEMA.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("all");
                    }}
                    className={`mt-4 px-4 py-2 border ${tc.borderClass} ${tc.btnClassic} text-xs font-mono transition-all`}
                    id="btn-reset-filters"
                  >
                    RIPRISTINA FILTRI
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`h-12 border-t ${tc.borderClass} flex items-center justify-between px-6 sm:px-8 ${tc.footer} text-[9px] uppercase tracking-[0.3em] shrink-0 z-10`}>
        <div className="flex-1 hidden sm:block">CPU: 4% — MEM: 124MB — LAT: 12ms</div>
        <div className="text-zinc-500 font-mono">© 2026 Design Minimalista • Built for Productivity</div>
      </footer>

      {/* Expanded Interactive tool Modal Overlay */}
      <AnimatePresence>
        {activeToolId && activeTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveToolId(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal container content */}
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className={tc.modalContainer.replace("max-w-xl", getToolModalSize(activeTool.id))}
              id="expanded-tool-container"
            >
              {/* Modal header details */}
              <div className={tc.modalHeader}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  <div>
                    {editingToolName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempToolName}
                          onChange={(e) => setTempToolName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setCustomToolNames((prev) => ({
                                ...prev,
                                [activeTool.id]: tempToolName.trim() || activeTool.name,
                              }));
                              setEditingToolName(false);
                            } else if (e.key === "Escape") {
                              setEditingToolName(false);
                            }
                          }}
                          className={`text-xl font-light font-display bg-zinc-900 border ${tc.borderClass} px-2 py-0.5 rounded text-zinc-100 focus:outline-none focus:border-zinc-500 max-w-[200px] sm:max-w-[350px]`}
                          autoFocus
                          onBlur={() => {
                            setCustomToolNames((prev) => ({
                              ...prev,
                              [activeTool.id]: tempToolName.trim() || activeTool.name,
                            }));
                            setEditingToolName(false);
                          }}
                        />
                        <button
                          onMouseDown={(e) => {
                            // Previene il blur prima che l'onClick si attivi
                            e.preventDefault();
                          }}
                          onClick={() => {
                            setCustomToolNames((prev) => ({
                              ...prev,
                              [activeTool.id]: tempToolName.trim() || activeTool.name,
                            }));
                            setEditingToolName(false);
                          }}
                          className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors"
                          title="Salva"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/title">
                        <h2 className="text-xl font-light font-display text-zinc-100">
                          {customToolNames[activeTool.id] || activeTool.name}
                        </h2>
                        <button
                          onClick={() => {
                            setTempToolName(customToolNames[activeTool.id] || activeTool.name);
                            setEditingToolName(true);
                          }}
                          className="p-1 opacity-0 group-hover/title:opacity-100 focus:opacity-100 text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                          title="Rinomina strumento"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 font-mono tracking-wider mt-0.5 uppercase">
                      {activeTool.category}
                    </p>
                  </div>
                </div>

                {/* Close Button and Favorite Toggle */}
                <div className="flex items-center gap-2">
                  {activeTool.id === "scientific_calc" && (
                    <button
                      onClick={() => setIsEditorMode(!isEditorMode)}
                      className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic} ${
                        isEditorMode ? "bg-amber-500/10 border-amber-500/40 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title={isEditorMode ? "Blocca modifiche" : "Abilita modifiche (Editor)"}
                      id="btn-toggle-editor"
                    >
                      {isEditorMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => toggleFavorite(activeTool.id)}
                    className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic}`}
                    title={!!favoriteTools[activeTool.id] ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                    id="btn-toggle-favorite-modal"
                  >
                    <Heart className={`w-4 h-4 ${!!favoriteTools[activeTool.id] ? "fill-current text-red-500" : "text-zinc-400"}`} />
                  </button>

                  <button
                    onClick={() => {
                      setActiveToolId(null);
                      setIsEditorMode(false);
                    }}
                    className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic}`}
                    id="btn-close-modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Content Workspace */}
              <div className={tc.modalBody}>
                <activeTool.component isEditorMode={isEditorMode} />
              </div>

              {/* Modal Footer */}
              <div className={tc.modalFooter}>
                <button
                  onClick={handlePrevTool}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors font-mono uppercase text-[10px] tracking-wider"
                  id="btn-prev-tool"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Precedente</span>
                </button>
                
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest">
                  STRUMENTO {activeToolIndex + 1} / {orderedTools.length}
                </span>

                <button
                  onClick={handleNextTool}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors font-mono uppercase text-[10px] tracking-wider"
                  id="btn-next-tool"
                >
                  <span>Successivo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
