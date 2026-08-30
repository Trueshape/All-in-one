import React, { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Star,
  Tag,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  ListTodo,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Sparkles,
} from "lucide-react";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  category: "lavoro" | "personale" | "spesa" | "studio" | "progetti";
  priority: "alta" | "media" | "bassa";
  dueDate?: string;
  completed: boolean;
  favorite: boolean;
  subtasks: Subtask[];
  createdAt: number;
}

const DEFAULT_CATEGORIES: { id: TaskItem["category"]; label: string; color: string }[] = [
  { id: "lavoro", label: "Lavoro", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { id: "personale", label: "Personale", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { id: "spesa", label: "Spesa & Casa", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "studio", label: "Studio", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { id: "progetti", label: "Progetti", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "1",
    title: "Completare la presentazione del progetto Utilita365",
    notes: "Aggiungere i nuovi tool per crypto, traduttore e checklist.",
    category: "lavoro",
    priority: "alta",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    completed: false,
    favorite: true,
    subtasks: [
      { id: "101", title: "Testare la validazione IBAN", completed: true },
      { id: "102", title: "Verificare la tabella crypto e Nasdaq", completed: true },
      { id: "103", title: "Aggiungere esportazione resoconto", completed: false },
    ],
    createdAt: Date.now() - 3600000,
  },
  {
    id: "2",
    title: "Fare la spesa settimanale al supermercato",
    notes: "Latte di avena, frutta fresca, verdure di stagione, caffe.",
    category: "spesa",
    priority: "media",
    completed: false,
    favorite: false,
    subtasks: [
      { id: "201", title: "Caffè in grani", completed: false },
      { id: "202", title: "Frutta e verdura", completed: true },
    ],
    createdAt: Date.now() - 7200000,
  },
  {
    id: "3",
    title: "Sessione di allenamento in palestra",
    category: "personale",
    priority: "bassa",
    completed: true,
    favorite: false,
    subtasks: [],
    createdAt: Date.now() - 86400000,
  },
];

export default function TodoList() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("utilita365_todolist_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("utilita365_todolist_data", JSON.stringify(tasks));
  }, [tasks]);

  // New task form state
  const [newTitle, setNewTitle] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [newCategory, setNewCategory] = useState<TaskItem["category"]>("lavoro");
  const [newPriority, setNewPriority] = useState<TaskItem["priority"]>("media");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [newSubtaskInput, setNewSubtaskInput] = useState<string>("");
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "favorite">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      completed: false,
      favorite: false,
      subtasks: newSubtasks.map((st, idx) => ({
        id: `${Date.now()}-${idx}`,
        title: st,
        completed: false,
      })),
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewNotes("");
    setNewDueDate("");
    setNewSubtasks([]);
    setShowAddForm(false);
  };

  // Subtask adding in form
  const handleAddSubtaskTemp = () => {
    if (!newSubtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput("");
  };

  // Toggle Task Completion
  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Toggle Favorite
  const toggleFavorite = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t))
    );
  };

  // Toggle Subtask inside Task
  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
  };

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Add Subtask to Existing Task
  const [existingSubtaskInputs, setExistingSubtaskInputs] = useState<Record<string, string>>({});

  const handleAddSubtaskToTask = (taskId: string) => {
    const text = (existingSubtaskInputs[taskId] || "").trim();
    if (!text) return;

    const newSub: Subtask = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: text,
      completed: false,
    };

    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSub] } : t
      )
    );

    setExistingSubtaskInputs({ ...existingSubtaskInputs, [taskId]: "" });
  };

  // Delete Subtask from Existing Task
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t
      )
    );
  };

  // Delete Completed Tasks
  const deleteCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  // Mark All Completed
  const markAllCompleted = () => {
    setTasks(tasks.map((t) => ({ ...t, completed: true })));
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status
      if (filterStatus === "active" && t.completed) return false;
      if (filterStatus === "completed" && !t.completed) return false;
      if (filterStatus === "favorite" && !t.favorite) return false;

      // Category
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;

      return true;
    });
  }, [tasks, filterStatus, selectedCategory, searchQuery]);

  // Statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Copy Summary text
  const handleCopySummary = () => {
    let summary = `📋 *CHECKLIST - PRODUTTIVITÀ*\n`;
    summary += `Completati: ${completedCount}/${totalCount} (${percentComplete}%)\n\n`;

    tasks.forEach((t, i) => {
      summary += `${t.completed ? "☑" : "☐"} ${t.title} [${t.category.toUpperCase()}]\n`;
      t.subtasks.forEach((st) => {
        summary += `   ${st.completed ? "✓" : "-"} ${st.title}\n`;
      });
    });

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>To Do List & Gestore Attività</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Organizza mansioni, checklist, scadenze e priorità con salvataggio automatico.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Attività</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded transition-all text-xs font-mono flex items-center gap-1 cursor-pointer"
              title="Copia Resoconto Testo"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Copia Testo</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-850">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>
              Avanzamento: <strong className="text-emerald-400">{completedCount}</strong> di {totalCount} completati
            </span>
            <span className="font-bold text-zinc-200">{percentComplete}%</span>
          </div>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Task Form Modal / Slide-down */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="bg-zinc-950/80 border border-emerald-500/30 rounded-lg p-4 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Crea Nuova Attività
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
            >
              Annulla ✕
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Titolo dell'attività (es. Inviare report mensile)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              autoFocus
            />

            <textarea
              placeholder="Note aggiuntive o descrizione facoltativa..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 block uppercase mb-1">Categoria</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block uppercase mb-1">Priorità</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
              >
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta 🔥</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block uppercase mb-1">Scadenza</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="space-y-2 pt-2 border-t border-zinc-850">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Sotto-elementi / Checklist</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Aggiungi punto di verifica (es. allegare PDF)..."
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtaskTemp();
                  }
                }}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtaskTemp}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded"
              >
                +
              </button>
            </div>

            {newSubtasks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {newSubtasks.map((st, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    • {st}
                    <button
                      type="button"
                      onClick={() => setNewSubtasks(newSubtasks.filter((_, i) => i !== idx))}
                      className="text-zinc-500 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold rounded transition-colors cursor-pointer"
          >
            Aggiungi alla Lista
          </button>
        </form>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 text-[11px] font-mono rounded border transition-all ${
              filterStatus === "all"
                ? "bg-zinc-100 text-zinc-950 font-bold border-zinc-100"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tutti ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-3 py-1 text-[11px] font-mono rounded border transition-all ${
              filterStatus === "active"
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            In corso ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus("completed")}
            className={`px-3 py-1 text-[11px] font-mono rounded border transition-all ${
              filterStatus === "completed"
                ? "bg-zinc-800 border-zinc-700 text-zinc-300 font-bold"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Completati ({completedCount})
          </button>
          <button
            onClick={() => setFilterStatus("favorite")}
            className={`px-3 py-1 text-[11px] font-mono rounded border transition-all flex items-center gap-1 ${
              filterStatus === "favorite"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Star className="w-3 h-3 fill-current text-amber-400" />
            Preferiti
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Cerca tra le mansioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded pl-8 pr-2.5 py-1 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/20 border border-zinc-850 rounded-lg space-y-2">
            <ListTodo className="w-8 h-8 text-zinc-600 mx-auto" />
            <span className="text-xs font-mono text-zinc-500 block">
              Nessuna attività trovata per questo filtro.
            </span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const categoryMeta = DEFAULT_CATEGORIES.find((c) => c.id === task.category);
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-zinc-950/50 border rounded-lg p-3.5 transition-all space-y-2 ${
                  task.completed
                    ? "border-zinc-850 opacity-60"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Checkbox & Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-zinc-400 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-mono font-medium ${
                            task.completed ? "line-through text-zinc-500" : "text-zinc-100"
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        {task.priority === "alta" && (
                          <span className="text-[9px] font-mono bg-rose-500/20 border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                            ALTA
                          </span>
                        )}

                        {/* Category Badge */}
                        {categoryMeta && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${categoryMeta.color}`}
                          >
                            {categoryMeta.label}
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-xs font-mono text-zinc-400 mt-1 line-clamp-2">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleFavorite(task.id)}
                      className="p-1 text-zinc-500 hover:text-amber-400 transition-colors"
                      title="Preferito"
                    >
                      <Star
                        className={`w-4 h-4 ${task.favorite ? "fill-current text-amber-400" : ""}`}
                      />
                    </button>

                    <button
                      onClick={() =>
                        setExpandedTaskId(isExpanded ? null : task.id)
                      }
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Dettagli & Sotto-elementi"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Progress / Detailed Checklist */}
                {(task.subtasks.length > 0 || isExpanded) && (
                  <div className="pt-2 border-t border-zinc-850 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>
                        Sotto-elementi (
                        {task.subtasks.filter((s) => s.completed).length}/
                        {task.subtasks.length})
                      </span>
                    </div>

                    {task.subtasks.length > 0 && (
                      <div className="space-y-1.5 pl-2 sm:pl-4">
                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between gap-2 group/sub py-0.5"
                          >
                            <div
                              onClick={() => toggleSubtask(task.id, st.id)}
                              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                            >
                              <span className="text-zinc-500 group-hover/sub:text-emerald-400 shrink-0">
                                {st.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5" />
                                )}
                              </span>
                              <span
                                className={`text-xs font-mono truncate ${
                                  st.completed
                                    ? "line-through text-zinc-500"
                                    : "text-zinc-300"
                                }`}
                              >
                                {st.title}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteSubtask(task.id, st.id)}
                              className="text-zinc-600 hover:text-rose-400 p-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity text-xs font-mono"
                              title="Elimina sotto-elemento"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new subtask input form for existing task */}
                    <div className="flex items-center gap-2 pt-1 pl-2 sm:pl-4">
                      <input
                        type="text"
                        placeholder="+ Aggiungi sotto-elemento..."
                        value={existingSubtaskInputs[task.id] || ""}
                        onChange={(e) =>
                          setExistingSubtaskInputs({
                            ...existingSubtaskInputs,
                            [task.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubtaskToTask(task.id);
                          }
                        }}
                        className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubtaskToTask(task.id)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 text-xs font-mono font-bold rounded transition-all cursor-pointer"
                        title="Aggiungi punto di verifica"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bulk Footer Actions */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-3 border-t border-zinc-850">
          <button
            onClick={markAllCompleted}
            className="hover:text-emerald-400 transition-colors"
          >
            Segna tutti come completati
          </button>
          <button
            onClick={deleteCompleted}
            className="hover:text-rose-400 transition-colors"
          >
            Rimuovi completati
          </button>
        </div>
      )}
    </div>
  );
}
