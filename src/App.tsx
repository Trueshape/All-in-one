import type React from "react";
import { useState, useEffect } from "react";
import { TOOLS } from "./tools/registry";
import { getThemeClasses, type Theme } from "./theme";
import Landing from "./Landing";
import ToolModal from "./ToolModal";
import { I18nContext, LOCALES, makeI18n, type Lang } from "./i18n";

const THEMES: Theme[] = ["artistic", "immersive", "sophisticated"];

// Storage can be blocked (private modes, embedded browsers) or full: the app must still start.
const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // blocked or full: settings last for this session only
  }
};

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Theme Switching State
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = readStorage("utilita365_theme");
    return THEMES.find((t) => t === saved) ?? "artistic";
  });

  // Info notices: off by default, switched on/off from the modal header for every tool
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // Interface language, remembered between visits
  const [lang, setLang] = useState<Lang>(() => {
    const saved = readStorage("utilita365_lang");
    return saved === "en" || saved === "es" || saved === "de" || saved === "fr" ? saved : "it";
  });
  useEffect(() => {
    writeStorage("utilita365_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const i18n = makeI18n(lang, setLang);

  // Favorite Tools State
  const [favoriteTools, setFavoriteTools] = useState<Record<string, boolean>>(() => {
    const saved = readStorage("utilita365_favorite_tools");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Custom Tool Names State
  const [customToolNames, setCustomToolNames] = useState<Record<string, string>>(() => {
    const saved = readStorage("utilita365_custom_tool_names");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const [editingToolName, setEditingToolName] = useState<boolean>(false);
  const [tempToolName, setTempToolName] = useState<string>("");

  useEffect(() => {
    writeStorage("utilita365_custom_tool_names", JSON.stringify(customToolNames));
  }, [customToolNames]);

  useEffect(() => {
    if (activeToolId) {
      const activeTool = TOOLS.find((t) => t.id === activeToolId);
      if (activeTool) {
        setTempToolName(customToolNames[activeToolId] || i18n.toolText(activeTool).name);
      }
    }
    setEditingToolName(false);
  }, [activeToolId]);

  // Save changes to localStorage
  useEffect(() => {
    writeStorage("utilita365_theme", activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    writeStorage("utilita365_favorite_tools", JSON.stringify(favoriteTools));
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
    const nameA = customToolNames[a.id] || i18n.toolText(a).name;
    const nameB = customToolNames[b.id] || i18n.toolText(b).name;
    return nameA.localeCompare(nameB, LOCALES[lang]);
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

  // Esc closes the open tool. Arrow keys move between tools, unless focus is inside the tool: there they belong to its controls, and changing tool would lose its state.
  useEffect(() => {
    if (!activeToolId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveToolId(null);
        return;
      }
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-tool-body]")) return;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") handleNextTool();
      else if (e.key === "ArrowLeft") handlePrevTool();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tc = getThemeClasses(activeTheme);

  return (
    <I18nContext.Provider value={i18n}>
    <div className={`min-h-screen ${tc.bg} flex flex-col relative overflow-x-clip transition-colors duration-500`}>

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

      <Landing
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        favoriteTools={favoriteTools}
        toggleFavorite={toggleFavorite}
        customToolNames={customToolNames}
        setCustomToolNames={setCustomToolNames}
        onOpenTool={setActiveToolId}
      />

      <ToolModal
        activeTheme={activeTheme}
        activeTool={activeTool}
        activeToolIndex={activeToolIndex}
        toolCount={orderedTools.length}
        editingToolName={editingToolName}
        setEditingToolName={setEditingToolName}
        tempToolName={tempToolName}
        setTempToolName={setTempToolName}
        customToolNames={customToolNames}
        setCustomToolNames={setCustomToolNames}
        favoriteTools={favoriteTools}
        toggleFavorite={(id) => toggleFavorite(id)}
        onClose={() => setActiveToolId(null)}
        onNext={handleNextTool}
        onPrev={handlePrevTool}
        showInfo={showInfo}
        onToggleInfo={() => setShowInfo((v) => !v)}
      />
    </div>
    </I18nContext.Provider>
  );
}
