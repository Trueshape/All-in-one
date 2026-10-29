import type React from "react";
import { useState, useEffect } from "react";
import { TOOLS } from "./tools/registry";
import { getThemeClasses, type Theme } from "./theme";
import Landing from "./Landing";
import ToolModal from "./ToolModal";

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Real-time Clock State
  const [time, setTime] = useState<Date>(new Date());

  // Theme Switching State
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("utilita365_theme");
    return (saved as Theme) || "artistic";
  });

  // Editor mode state for buttons sizing/ordering
  const [isEditorMode, setIsEditorMode] = useState<boolean>(false);

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

  // Reset editor mode when closing the active tool
  useEffect(() => {
    if (!activeToolId) {
      setIsEditorMode(false);
    }
  }, [activeToolId]);

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

      <Landing
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        favoriteTools={favoriteTools}
        toggleFavorite={toggleFavorite}
        customToolNames={customToolNames}
        setCustomToolNames={setCustomToolNames}
        time={time}
        onOpenTool={setActiveToolId}
      />

      <ToolModal
        activeTheme={activeTheme}
        activeTool={activeTool}
        activeToolIndex={activeToolIndex}
        toolCount={orderedTools.length}
        isEditorMode={isEditorMode}
        setIsEditorMode={setIsEditorMode}
        editingToolName={editingToolName}
        setEditingToolName={setEditingToolName}
        tempToolName={tempToolName}
        setTempToolName={setTempToolName}
        customToolNames={customToolNames}
        setCustomToolNames={setCustomToolNames}
        favoriteTools={favoriteTools}
        toggleFavorite={(id) => toggleFavorite(id)}
        onClose={() => {
          setActiveToolId(null);
          setIsEditorMode(false);
        }}
        onNext={handleNextTool}
        onPrev={handlePrevTool}
      />
    </div>
  );
}
