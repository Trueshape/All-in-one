import type React from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  X,
  Palette,
  ChevronDown,
  Check,
  Calendar,
  Clock,
  Calculator,
  ArrowLeftRight,
  Timer,
  Heart,
  Pencil,
  ChevronLeft,
} from "lucide-react";
import { TOOLS } from "./tools/registry";
import { CATEGORY_LABELS, getThemeClasses, type Theme } from "./theme";

interface LandingProps {
  activeTheme: Theme;
  setActiveTheme: (theme: Theme) => void;
  favoriteTools: Record<string, boolean>;
  toggleFavorite: (id: string, e?: React.MouseEvent) => void;
  customToolNames: Record<string, string>;
  setCustomToolNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  time: Date;
  onOpenTool: (id: string) => void;
}

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

export default function Landing({
  activeTheme,
  setActiveTheme,
  favoriteTools,
  toggleFavorite,
  customToolNames,
  setCustomToolNames,
  time,
  onOpenTool,
}: LandingProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  const [editingCardToolId, setEditingCardToolId] = useState<string | null>(null);
  const [tempCardToolName, setTempCardToolName] = useState<string>("");

  const tc = getThemeClasses(activeTheme);

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

  return (
    <>
      {/* Header Section */}
      <header className={`min-h-20 py-3 ${tc.headerBg} flex flex-wrap items-center justify-between gap-y-3 px-6 sm:px-8 shrink-0 z-30`}>
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
                              onOpenTool(tool.id);
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
                  const CategoryIcon = getCategoryIcon(tool.category);
                  const formattedIndex = String(index + 1).padStart(2, "0");

                  return (
                    <motion.div
                      key={tool.id}
                      layoutId={`card-${tool.id}`}
                      onClick={() => {
                        if (editingCardToolId !== tool.id) {
                          onOpenTool(tool.id);
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
    </>
  );
}
