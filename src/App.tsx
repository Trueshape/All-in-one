import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CATEGORY_ORDER, TOOLS } from "./tools/registry";
import { getThemeClasses, type Theme } from "./theme";
import Landing from "./Landing";
import ToolModal from "./ToolModal";
import { I18nContext, LOCALES, makeI18n, type Lang } from "./i18n";
import { UnsavedContext } from "./ui/unsaved";

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

  // Tools with work in progress (a file being edited) register here; leaving the page then asks first.
  const dirtyKeys = useRef(new Set<string>());
  const mark = useCallback((key: string, dirty: boolean) => {
    if (dirty) dirtyKeys.current.add(key);
    else dirtyKeys.current.delete(key);
  }, []);
  const unsaved = useMemo(() => ({ mark }), [mark]);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const guard = (action: () => void) => {
    if (dirtyKeys.current.size > 0) setPending(() => action);
    else action();
  };
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyKeys.current.size === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

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

  // Always sort the tools alphabetically by name (taking custom names into account)
  const orderedTools = [...TOOLS].sort((a, b) => {
    const byCategory = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (byCategory) return byCategory;
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
        if (pending) setPending(null);
        else guard(() => setActiveToolId(null));
        return;
      }
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-tool-body]")) return;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") guard(handleNextTool);
      else if (e.key === "ArrowLeft") guard(handlePrevTool);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tc = getThemeClasses(activeTheme);

  return (
    <I18nContext.Provider value={i18n}>
    <UnsavedContext.Provider value={unsaved}>
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
        onClose={() => guard(() => setActiveToolId(null))}
        onNext={() => guard(handleNextTool)}
        onPrev={() => guard(handlePrevTool)}
        showInfo={showInfo}
        onToggleInfo={() => setShowInfo((v) => !v)}
      />

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title">
          <div className={`w-full max-w-md p-6 space-y-4 border ${tc.borderClass} bg-zinc-950 text-zinc-200 rounded-lg shadow-2xl`}>
            <h2 id="unsaved-title" className="text-base font-semibold">Modifiche non salvate</h2>
            <p className="text-sm text-zinc-400">Se cambi pagina ora puoi perdere il lavoro fatto su questo file. Vuoi uscire lo stesso?</p>
            <div className="flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setPending(null)} className={`px-4 py-2 text-sm border ${tc.borderClass} ${tc.btnClassic}`}>Resta qui</button>
              <button type="button" onClick={() => { const go = pending; dirtyKeys.current.clear(); setPending(null); go(); }} className="px-4 py-2 text-sm border border-red-500/50 text-red-300 hover:bg-red-500/10">Cambia pagina</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </UnsavedContext.Provider>
    </I18nContext.Provider>
  );
}
