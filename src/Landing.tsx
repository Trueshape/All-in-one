import type React from "react";
import { useEffect, useState } from "react";
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
  Pencil,
  ChevronLeft,
  Image as ImageIcon,
  Type as TypeIcon,
} from "lucide-react";
import { TOOLS, type ToolItem } from "./tools/registry";
import { CATEGORY_LABELS, getThemeClasses, type Theme } from "./theme";
import { LANGS, LOCALES, useI18n } from "./i18n";
import { LangMenu } from "./ui/kit";

interface LandingProps {
  activeTheme: Theme;
  setActiveTheme: (theme: Theme) => void;
  customToolNames: Record<string, string>;
  setCustomToolNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onOpenTool: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "convertitori":
      return ArrowLeftRight;
    case "immagini":
      return ImageIcon;
    case "testo":
      return TypeIcon;
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

/** Date and time in the header: owns its one-second tick so the rest of the page does not re-render. */
function HeaderClock({ tc }: { tc: ReturnType<typeof getThemeClasses> }) {
  const { lang } = useI18n();
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex items-center gap-6 text-[10px] font-mono ${tc.clockText} uppercase tracking-wider`}>
      <div className="hidden md:flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
        <span>
          {time.toLocaleDateString(LOCALES[lang], {
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
          {time.toLocaleTimeString(LOCALES[lang], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export default function Landing({
  activeTheme,
  setActiveTheme,
  customToolNames,
  setCustomToolNames,
  onOpenTool,
}: LandingProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  const [editingCardToolId, setEditingCardToolId] = useState<string | null>(null);
  const [tempCardToolName, setTempCardToolName] = useState<string>("");

  const { t, lang, setLang, toolText } = useI18n();
  const tc = getThemeClasses(activeTheme);
  const nameOf = (tool: ToolItem) => customToolNames[tool.id] || toolText(tool).name;
  const byName = (a: ToolItem, b: ToolItem) => nameOf(a).localeCompare(nameOf(b), LOCALES[lang]);

  // An empty name, or the default one, removes the custom name instead of freezing the default in the current language.
  const commitCardName = (tool: ToolItem) => {
    const name = tempCardToolName.trim();
    setCustomToolNames((prev) => {
      const next = { ...prev };
      if (!name || name === toolText(tool).name) delete next[tool.id];
      else next[tool.id] = name;
      return next;
    });
    setEditingCardToolId(null);
  };

  // Cards are real controls for the keyboard too: Enter or Space on the card itself runs the click action.
  const keyActivate = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      action();
    }
  };
  const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500";

  // Always sort the tools alphabetically by name (taking custom names into account)
  const orderedTools = [...TOOLS].sort(byName);

  // Filter tools based on query and selected category tab
  const filteredTools = orderedTools.filter((tool) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = nameOf(tool).toLowerCase().includes(query) || toolText(tool).description.toLowerCase().includes(query);
    const matchesTab = activeTab === "all" || tool.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <>
      {/* Header Section */}
      <header className={`min-h-20 py-3 ${tc.headerBg} relative flex flex-wrap md:flex-nowrap items-center justify-between gap-x-4 gap-y-3 px-6 sm:px-8 shrink-0 z-30`}>
        <div className="flex flex-none items-baseline gap-4 whitespace-nowrap">
          <h1 className={tc.headerTitle}>
            {activeTheme === "immersive" ? "IL SITO È MIO" : "Il sito è mio"}
          </h1>
          <span className={`${tc.headerSubtitle} hidden min-[1700px]:inline-block`}>
            {activeTheme === "artistic" ? "Sistemi Quotidiani v1.0" : activeTheme === "immersive" ? "KERNEL_V1.0 // ONLINE" : "Elegant Suite v1.0"}
          </span>
        </div>

        <nav className="flex min-w-0 justify-center-safe gap-4 text-[10px] xl:absolute xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 xl:w-max font-medium tracking-[0.2em] uppercase overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
          {Object.keys(CATEGORY_LABELS).map((catKey) => (
            <button
              key={catKey}
              onClick={() => setActiveTab(catKey)}
              className={`hover:text-zinc-100 transition-all cursor-pointer whitespace-nowrap pb-1 ${
                activeTab === catKey ? tc.navActive : tc.navInactive
              }`}
              id={`tab-cat-${catKey}`}
            >
              {t(`nav_${catKey}`)}
            </button>
          ))}
        </nav>
        <div className="flex justify-end items-center gap-3 shrink-0 md:ml-auto">
          <LangMenu
            value={lang}
            onChange={(v) => setLang(v)}
            options={LANGS.map((l) => ({ value: l.code, label: l.label, flag: l.flag }))}
            ariaLabel={t("language")}
            triggerClassName="h-[30px] w-[30px] opacity-80 hover:opacity-100 transition-opacity"
            listClassName={`rounded border ${tc.borderClass} ${activeTheme === "immersive" ? "bg-[#030812]" : activeTheme === "sophisticated" ? "bg-slate-900" : "bg-[#0a0a0a]"}`}
            itemClassName={(active) =>
              `rounded ${
                active
                  ? activeTheme === "immersive"
                    ? "bg-emerald-950/30 text-emerald-300"
                    : activeTheme === "sophisticated"
                    ? "bg-slate-800 text-violet-200"
                    : "bg-zinc-900 text-zinc-100"
                  : "hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-200"
              }`
            }
          />
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
            <span className="hidden md:inline-block">{t("style")}</span>
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
                className={`absolute right-0 mt-2 w-64 z-50 rounded shadow-2xl border ${tc.borderClass} ${
                  activeTheme === "immersive" ? "bg-[#030812]" : activeTheme === "sophisticated" ? "bg-slate-900" : "bg-[#0a0a0a]"
                } overflow-hidden`}
              >
                <div className={`p-2 border-b ${tc.borderClass} bg-zinc-950/20 text-[9px] font-mono tracking-widest text-zinc-500 uppercase`}>
                  {t("select_interface")}
                </div>
                <div className="p-1.5 flex flex-col gap-1">
                  {[
                    {
                      id: "artistic",
                      name: "Artistic Flair",
                      desc: t("theme_artistic"),
                      accent: "bg-zinc-100",
                    },
                    {
                      id: "immersive",
                      name: "Immersive UI",
                      desc: t("theme_immersive"),
                      accent: "bg-emerald-500",
                    },
                    {
                      id: "sophisticated",
                      name: "Sophisticated Dark",
                      desc: t("theme_sophisticated"),
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
      </header>

      {/* Search, Time and Theme Selector Panel */}
      <div className={`h-auto sm:h-14 border-b ${tc.borderClass} ${tc.panelBg} relative flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-3 sm:py-0 gap-4 shrink-0 z-20`}>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-72 shrink-0 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder={t("search")}
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

        </div>

        <HeaderClock tc={tc} />
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 no-scrollbar z-10">
        {activeTab === "all" && searchQuery === "" ? (
          <div className="max-w-7xl min-[1500px]:max-w-[1900px]! mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1 select-none invisible" aria-hidden="true">
              <h2 className={`text-xs font-mono uppercase tracking-[0.25em] ${
                activeTheme === "immersive" ? "text-emerald-500" : activeTheme === "sophisticated" ? "text-violet-400" : "text-zinc-400"
              }`}>
                {activeTheme === "immersive" ? `01 // ${t("select_category").toUpperCase()}` : t("select_category")}
              </h2>
              <p className="text-xs text-zinc-500 font-sans">
                {t("select_category_sub")}
              </p>
            </div>

            <div className={`${tc.gridContainer} min-[1500px]:grid-cols-7! min-[1500px]:w-full min-[1500px]:max-w-none!`}>
              {[
                {
                  id: "calcolo",
                  name: t("nav_calcolo"),
                  description: "Formule scientifiche, conteggi di precisione e calcolo delle mance.",
                  icon: Calculator,
                  count: TOOLS.filter(t => t.category === "calcolo").length,
                },
                {
                  id: "convertitori",
                  name: t("nav_convertitori"),
                  description: "Tassi di cambio valute, unità di misura, numeri romani, formati audio.",
                  icon: ArrowLeftRight,
                  count: TOOLS.filter(t => t.category === "convertitori").length,
                },
                {
                  id: "immagini",
                  name: t("nav_immagini"),
                  description: "Converti, ridimensiona e ingrandisci immagini; colori, palette e pattern.",
                  icon: ImageIcon,
                  count: TOOLS.filter(t => t.category === "immagini").length,
                },
                {
                  id: "testo",
                  name: t("nav_testo"),
                  description: "Maiuscole, differenze, markdown, trova e sostituisci, lettura ad alta voce e codifiche di testo.",
                  icon: TypeIcon,
                  count: TOOLS.filter(t => t.category === "testo").length,
                },
                {
                  id: "produttivita",
                  name: t("nav_produttivita"),
                  description: "Pomodoro, timer, orologi mondiali, tornei, segnapunti e liste.",
                  icon: Timer,
                  count: TOOLS.filter(t => t.category === "produttivita").length,
                },
                {
                  id: "creative",
                  name: t("nav_creative"),
                  description: "Decisioni casuali, QR e codici a barre, piano, grafici e prefissi.",
                  icon: Palette,
                  count: TOOLS.filter(t => t.category === "creative").length,
                },
              ].map((category, index) => {
                const Icon = category.icon;
                const formattedIndex = String(index + 1).padStart(2, "0");
                const categoryTools = TOOLS.filter(t => t.category === category.id).sort(byName);
                return (
                  <motion.div
                    key={category.id}
                    layoutId={`cat-${category.id}`}
                    onClick={() => setActiveTab(category.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={keyActivate(() => setActiveTab(category.id))}
                    className={`${tc.card} ${focusRing} flex flex-col justify-start h-auto min-h-[160px] cursor-pointer group`}
                    id={`card-category-${category.id}`}
                    whileHover={{
                      backgroundColor: activeTheme === "immersive" ? "rgba(16, 185, 129, 0.05)" : activeTheme === "sophisticated" ? "rgba(139, 92, 246, 0.04)" : "rgba(24, 24, 27, 0.2)",
                      y: -2
                    }}
                  >
                    <div className="flex justify-between items-start select-none relative z-20 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className={tc.cardIndex}>
                          {formattedIndex} / CATEGORY
                        </span>
                        <h2 className={tc.cardTitle}>
                          {category.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500 opacity-80 group-hover:opacity-100 transition-opacity">
                          {category.count} {(category.count === 1 ? t("tool_one") : t("tool_many")).toLowerCase()}
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
                            role="button"
                            tabIndex={0}
                            onKeyDown={keyActivate(() => onOpenTool(tool.id))}
                            className={`text-[11px] font-mono text-zinc-400 hover:text-zinc-100 flex items-center gap-1.5 transition-colors cursor-pointer group/item ${focusRing}`}
                          >
                            <span className={`transition-transform duration-200 group-hover/item:translate-x-0.5 text-[8px] ${
                              activeTheme === "immersive" ? "text-emerald-500/70" : activeTheme === "sophisticated" ? "text-violet-400/70" : "text-zinc-500"
                            }`}>
                              →
                            </span>
                            <span className="group-hover/item:underline">
                              {nameOf(tool)}
                            </span>
                          </div>
                        ))
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
                    <span>{t("back")}</span>
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">{t("category")}</span>
                    <span className={`text-[11px] font-bold font-mono tracking-wider uppercase mt-1 ${
                      activeTheme === "immersive" ? "text-emerald-400" : activeTheme === "sophisticated" ? "text-violet-300" : "text-zinc-200"
                    }`}>
                      {t(`nav_${activeTab}`)}
                    </span>
                  </div>
                </div>
                {/* Total tools count */}
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  {filteredTools.length} {filteredTools.length === 1 ? t("tool_one") : t("tool_many")}
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
                      role="button"
                      tabIndex={0}
                      onKeyDown={keyActivate(() => { if (editingCardToolId !== tool.id) onOpenTool(tool.id); })}
                      className={`${tc.card} ${focusRing} flex flex-col justify-start! h-auto! gap-1 pb-3! cursor-pointer group`}
                      id={`card-tool-${tool.id}`}
                      whileHover={editingCardToolId === tool.id ? undefined : {
                        backgroundColor: activeTheme === "immersive" ? "rgba(16, 185, 129, 0.05)" : activeTheme === "sophisticated" ? "rgba(139, 92, 246, 0.04)" : "rgba(24, 24, 27, 0.2)",
                        y: -2
                      }}
                    >
                      <div className="flex justify-between items-start select-none relative z-20">
                        <span className={`${tc.cardIndex} flex items-center gap-1`}>
                          {formattedIndex} / {tool.category}
                        </span>

                        <div className="absolute right-4 top-3 flex items-center gap-3">
                          {/* Control group */}
                          <div
                            className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity rounded px-1 py-0.5 border ${
                              activeTheme === "immersive" ? "bg-[#030812]/90 border-emerald-900/60" : activeTheme === "sophisticated" ? "bg-slate-950/80 border-slate-800" : "bg-zinc-900 border-zinc-800"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Pencil button (Rename) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCardToolId(tool.id);
                                setTempCardToolName(nameOf(tool));
                              }}
                              className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded cursor-pointer"
                              title={t("rename")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                          </div>

                          <CategoryIcon className={`w-4 h-4 ${tc.iconAccent} group-hover:text-zinc-200 transition-colors`} />
                        </div>
                      </div>

                      <div className="flex flex-col">
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
                                  commitCardName(tool);
                                } else if (e.key === "Escape") {
                                  setEditingCardToolId(null);
                                }
                              }}
                              className={`w-full text-base font-medium font-mono bg-zinc-900 border ${tc.borderClass} px-2 py-0.5 rounded text-zinc-100 focus:outline-none focus:border-zinc-500`}
                              autoFocus
                              onBlur={() => {
                                commitCardName(tool);
                              }}
                            />
                          </div>
                        ) : (
                          <h2 className={`${tc.cardTitle} mb-1 select-none`}>
                            {nameOf(tool)}
                          </h2>
                        )}
                        <p className={`${tc.cardDesc} select-none`}>
                          {toolText(tool).description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredTools.length === 0 && (
                <div className={`col-span-full py-24 text-center ${activeTheme === "immersive" ? "bg-[#030812]" : activeTheme === "sophisticated" ? "bg-slate-900/40" : "bg-[#0a0a0a]"}`}>
                  <p className="text-sm text-zinc-500 font-mono">{t("none_found")}</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("all");
                    }}
                    className={`mt-4 px-4 py-2 border ${tc.borderClass} ${tc.btnClassic} text-xs font-mono transition-all`}
                    id="btn-reset-filters"
                  >
                    {t("reset_filters")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`h-12 border-t ${tc.borderClass} flex items-center justify-end px-6 sm:px-8 ${tc.footer} text-[9px] uppercase tracking-[0.3em] shrink-0 z-10`}>
        <div className="text-zinc-500 font-mono">© 2026 Design Minimalista • Built for Productivity</div>
      </footer>
    </>
  );
}
