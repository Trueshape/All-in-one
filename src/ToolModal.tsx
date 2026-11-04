import type React from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Heart, Info, Pencil, Settings, X } from "lucide-react";
import { getThemeClasses, getToolModalSize, type Theme } from "./theme";
import type { ToolItem } from "./tools/registry";
import { UiContext, UI_TOKENS } from "./ui/tokens";
import { InfoContext } from "./ui/kit";
import { useI18n } from "./i18n";

/** Fixed-width sizes replace the default max width; a size that starts with w-fit also drops w-full so the window can follow its content. */
const sizeClass = (container: string, size: string) =>
  size.startsWith("w-fit") ? container.replace("w-full max-w-xl", size) : container.replace("max-w-xl", size);

interface ToolModalProps {
  activeTheme: Theme;
  activeTool: ToolItem | null;
  activeToolIndex: number;
  toolCount: number;
  editingToolName: boolean;
  setEditingToolName: (value: boolean) => void;
  tempToolName: string;
  setTempToolName: (value: string) => void;
  customToolNames: Record<string, string>;
  setCustomToolNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  favoriteTools: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  showInfo: boolean;
  onToggleInfo: () => void;
}

export default function ToolModal({
  activeTheme,
  activeTool,
  activeToolIndex,
  toolCount,
  editingToolName,
  setEditingToolName,
  tempToolName,
  setTempToolName,
  customToolNames,
  setCustomToolNames,
  favoriteTools,
  toggleFavorite,
  onClose,
  onNext,
  onPrev,
  showInfo,
  onToggleInfo,
}: ToolModalProps) {
  const tc = getThemeClasses(activeTheme);
  const { t, toolText } = useI18n();

  // An empty name, or the default one, removes the custom name instead of freezing the default in the current language.
  const commitName = () => {
    if (!activeTool) return;
    const id = activeTool.id;
    const name = tempToolName.trim();
    setCustomToolNames((prev) => {
      const next = { ...prev };
      if (!name || name === toolText(activeTool).name) delete next[id];
      else next[id] = name;
      return next;
    });
    setEditingToolName(false);
  };
  const [showSettings, setShowSettings] = useState(false);
  // Settings belong to one tool: close them when the open tool changes.
  useEffect(() => setShowSettings(false), [activeTool?.id]);

  // Focus enters the window when it opens and goes back where it was when it closes.
  const box = useRef<HTMLDivElement>(null);
  const isOpen = !!activeTool;
  useEffect(() => {
    if (!isOpen) return;
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus({ preventScroll: true });
    return () => before?.focus?.({ preventScroll: true });
  }, [isOpen]);

  // Tab stays inside the window.
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')].filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    if (e.shiftKey && (current === first || current === box.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">

          {/* Modal backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal container content */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className={`${sizeClass(tc.modalContainer, getToolModalSize(activeTool.id))} outline-none`}
            id="expanded-tool-container"
            ref={box}
            role="dialog"
            aria-modal="true"
            aria-label={customToolNames[activeTool.id] || toolText(activeTool).name}
            tabIndex={-1}
            onKeyDown={trapTab}
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
                            commitName();
                          } else if (e.key === "Escape") {
                            // Only cancel the rename: the window stays open.
                            e.stopPropagation();
                            setEditingToolName(false);
                          }
                        }}
                        className={`text-xl font-light font-display bg-zinc-900 border ${tc.borderClass} px-2 py-0.5 rounded text-zinc-100 focus:outline-none focus:border-zinc-500 max-w-[200px] sm:max-w-[350px]`}
                        autoFocus
                        onBlur={() => {
                          commitName();
                        }}
                      />
                      <button
                        onMouseDown={(e) => {
                          // Previene il blur prima che l'onClick si attivi
                          e.preventDefault();
                        }}
                        onClick={() => {
                          commitName();
                        }}
                        className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors"
                        title={t("save")}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/title">
                      <h2 className="text-xl font-light font-display text-zinc-100">
                        {customToolNames[activeTool.id] || toolText(activeTool).name}
                      </h2>
                      <button
                        onClick={() => {
                          setTempToolName(customToolNames[activeTool.id] || toolText(activeTool).name);
                          setEditingToolName(true);
                        }}
                        className="p-1 opacity-0 group-hover/title:opacity-100 focus:opacity-100 text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                        title={t("rename_tool")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider mt-0.5 uppercase">
                    {t(`nav_${activeTool.category}`)}
                  </p>
                </div>
              </div>

              {/* Close Button and Favorite Toggle */}
              <div className="flex items-center gap-2">
                {activeTool.id === "scientific_calc" && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic} ${showSettings ? `${UI_TOKENS[activeTheme].accent} border-current` : ""}`}
                    title={showSettings ? t("settings_close") : t("settings")}
                    aria-pressed={showSettings}
                    id="btn-toggle-settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onToggleInfo}
                  className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic} ${showInfo ? `${UI_TOKENS[activeTheme].accent} border-current` : ""}`}
                  title={showInfo ? t("info_hide") : t("info_show")}
                  aria-pressed={showInfo}
                  id="btn-toggle-info"
                >
                  <Info className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleFavorite(activeTool.id)}
                  className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic}`}
                  title={!!favoriteTools[activeTool.id] ? t("fav_remove") : t("fav_add")}
                  id="btn-toggle-favorite-modal"
                >
                  <Heart className={`w-4 h-4 ${!!favoriteTools[activeTool.id] ? "fill-current text-red-500" : "text-zinc-400"}`} />
                </button>

                <button
                  onClick={onClose}
                  className={`p-1.5 transition-colors border ${tc.borderClass} ${tc.btnClassic}`}
                  id="btn-close-modal"
                  aria-label={t("close")}
                  title={t("close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content Workspace */}
            <div className={tc.modalBody} data-tool-body>
              <UiContext.Provider value={UI_TOKENS[activeTheme]}>
               <InfoContext.Provider value={showInfo}>
                <Suspense fallback={<div className="p-8 font-mono text-sm text-zinc-500">Caricamento…</div>}>
                  <activeTool.component showSettings={showSettings} />
                </Suspense>
               </InfoContext.Provider>
              </UiContext.Provider>
            </div>

            {/* Modal Footer */}
            <div className={tc.modalFooter}>
              <button
                onClick={onPrev}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors font-mono uppercase text-[10px] tracking-wider"
                id="btn-prev-tool"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t("prev")}</span>
              </button>

              <span className="text-[10px] text-zinc-500 font-mono tracking-widest">
                {t("tool_of")} {activeToolIndex + 1} / {toolCount}
              </span>

              <button
                onClick={onNext}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors font-mono uppercase text-[10px] tracking-wider"
                id="btn-next-tool"
              >
                <span>{t("next")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
