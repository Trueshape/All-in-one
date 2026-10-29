import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, Circle, ListTodo, Plus, Star, Trash2, X } from "lucide-react";
import { Field, TextInput, TextArea, Select, Chips, Button, IconButton, CopyButton, Panel, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Category = "lavoro" | "personale" | "spesa" | "studio" | "progetti";
type Priority = "alta" | "media" | "bassa";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  category: Category;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  favorite: boolean;
  subtasks: Subtask[];
  createdAt: number;
}

const STORAGE_KEY = "utilita365_todolist_data";

const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "lavoro", label: "Lavoro" },
  { id: "personale", label: "Personale" },
  { id: "spesa", label: "Spesa e casa" },
  { id: "studio", label: "Studio" },
  { id: "progetti", label: "Progetti" },
];

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

function loadTasks(): Task[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.id === "string" && typeof t.title === "string")
      .map((t) => ({ ...t, subtasks: Array.isArray(t.subtasks) ? t.subtasks : [] }));
  } catch {
    return [];
  }
}

type StatusFilter = "all" | "active" | "completed" | "favorite";

export default function TodoList() {
  const u = useUi();
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New task form
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("lavoro");
  const [priority, setPriority] = useState<Priority>("media");
  const [dueDate, setDueDate] = useState("");
  const [subDraft, setSubDraft] = useState("");
  const [newSubs, setNewSubs] = useState<string[]>([]);
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // storage full or blocked: the list keeps working for this session
    }
  }, [tasks]);

  const update = (id: string, patch: (t: Task) => Task) => setTasks((prev) => prev.map((t) => (t.id === id ? patch(t) : t)));

  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((prev) => [
      {
        id: uid(),
        title: title.trim(),
        notes: notes.trim() || undefined,
        category: newCategory,
        priority,
        dueDate: dueDate || undefined,
        completed: false,
        favorite: false,
        subtasks: newSubs.map((s) => ({ id: uid(), title: s, completed: false })),
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setTitle(""); setNotes(""); setDueDate(""); setNewSubs([]); setSubDraft(""); setShowForm(false);
  };

  const addNewSub = () => {
    if (subDraft.trim()) {
      setNewSubs((prev) => [...prev, subDraft.trim()]);
      setSubDraft("");
    }
  };

  const addSubtask = (taskId: string) => {
    const text = (subInputs[taskId] ?? "").trim();
    if (!text) return;
    update(taskId, (t) => ({ ...t, subtasks: [...t.subtasks, { id: uid(), title: text, completed: false }] }));
    setSubInputs((prev) => ({ ...prev, [taskId]: "" }));
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !(t.notes ?? "").toLowerCase().includes(q)) return false;
      if (status === "active" && t.completed) return false;
      if (status === "completed" && !t.completed) return false;
      if (status === "favorite" && !t.favorite) return false;
      return category === "all" || t.category === category;
    });
  }, [tasks, status, category, query]);

  const done = tasks.filter((t) => t.completed).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const summary = [
    `CHECKLIST — ${done}/${tasks.length} completati (${percent}%)`,
    "",
    ...tasks.flatMap((t) => [
      `${t.completed ? "[x]" : "[ ]"} ${t.title} (${CATEGORIES.find((c) => c.id === t.category)?.label})${t.dueDate ? ` — scadenza ${t.dueDate}` : ""}`,
      ...t.subtasks.map((s) => `    ${s.completed ? "[x]" : "[ ]"} ${s.title}`),
    ]),
  ].join("\n");

  return (
    <Stack>
      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className={cx("text-xs", u.subtle)}>
            <strong className={u.text}>{done}</strong> di {tasks.length} completati · {percent}%
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm((s) => !s)}>Nuova attività</Button>
            <CopyButton text={summary} label="Copia riepilogo" />
          </div>
        </div>
        <div className="h-1.5 w-full bg-zinc-800/60 overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${percent}%`, background: u.accentHex }} />
        </div>
      </Panel>

      {showForm && (
        <form onSubmit={addTask}>
          <Panel className="space-y-3">
            <Field label="Titolo"><TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="es. Inviare il report mensile" /></Field>
            <Field label="Note"><TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Facoltative" /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Categoria">
                <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value as Category)}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="Priorità">
                <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </Select>
              </Field>
              <Field label="Scadenza"><TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            </div>
            <Field label="Sotto-attività">
              <div className="flex gap-2">
                <TextInput value={subDraft} onChange={(e) => setSubDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewSub(); } }} placeholder="Aggiungi un punto della checklist" />
                <Button className="shrink-0" onClick={addNewSub} aria-label="Aggiungi sotto-attività"><Plus className="w-4 h-4" /></Button>
              </div>
            </Field>
            {newSubs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {newSubs.map((s, i) => (
                  <span key={`${s}-${i}`} className={cx("inline-flex items-center gap-1 px-2 py-1 text-[11px]", u.panel, u.subtle)}>
                    {s}
                    <button type="button" className="cursor-pointer hover:text-red-400" onClick={() => setNewSubs(newSubs.filter((_, j) => j !== i))} aria-label={`Rimuovi ${s}`}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="flex-1" disabled={!title.trim()}>Aggiungi alla lista</Button>
              <Button onClick={() => setShowForm(false)}>Annulla</Button>
            </div>
          </Panel>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Chips value={status} onChange={setStatus} options={[
            { value: "all", label: `Tutti (${tasks.length})` },
            { value: "active", label: `In corso (${tasks.length - done})` },
            { value: "completed", label: `Completati (${done})` },
            { value: "favorite", label: "Preferiti" },
          ]} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca tra le attività..." />
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category | "all")}>
            <option value="all">Tutte le categorie</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? (
          <Panel className="py-8 text-center space-y-2">
            <ListTodo className={cx("w-7 h-7 mx-auto", u.muted)} />
            <p className={cx("text-xs", u.muted)}>{tasks.length ? "Nessuna attività per questo filtro." : "Nessuna attività: creane una con \"Nuova attività\"."}</p>
          </Panel>
        ) : (
          visible.map((task) => {
            const isOpen = expanded === task.id;
            const overdue = !!task.dueDate && !task.completed && task.dueDate < today();
            const subDone = task.subtasks.filter((s) => s.completed).length;
            return (
              <Panel key={task.id} className={cx("space-y-2 p-3", task.completed && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => update(task.id, (t) => ({ ...t, completed: !t.completed }))} className={cx("mt-0.5 shrink-0 cursor-pointer", task.completed ? "text-emerald-400" : u.muted)} aria-label={task.completed ? "Segna come da fare" : "Segna come completata"}>
                    {task.completed ? <Check className="w-5 h-5 border border-emerald-400" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx("text-sm font-medium break-words", task.completed ? cx("line-through", u.muted) : u.text)}>{task.title}</span>
                      {task.priority === "alta" && <span className="text-[10px] font-bold px-1.5 py-0.5 border border-red-500/40 text-red-300 bg-red-500/10">ALTA</span>}
                      <span className={cx("text-[10px] px-1.5 py-0.5 border", u.divider, u.muted)}>{CATEGORIES.find((c) => c.id === task.category)?.label}</span>
                      {task.dueDate && <span className={cx("text-[10px] px-1.5 py-0.5 border", overdue ? "border-red-500/40 text-red-300" : cx(u.divider, u.muted))}>{overdue ? "Scaduta " : "Scade "}{new Date(task.dueDate).toLocaleDateString("it-IT")}</span>}
                    </div>
                    {task.notes && <p className={cx("text-xs line-clamp-2", u.muted)}>{task.notes}</p>}
                    {task.subtasks.length > 0 && !isOpen && <p className={cx("text-[11px]", u.muted)}>Sotto-attività {subDone}/{task.subtasks.length}</p>}
                  </div>
                  <div className="flex items-center shrink-0">
                    <IconButton onClick={() => update(task.id, (t) => ({ ...t, favorite: !t.favorite }))} title="Preferito"><Star className={cx("w-4 h-4", task.favorite && "fill-current text-amber-400")} /></IconButton>
                    <IconButton onClick={() => setExpanded(isOpen ? null : task.id)} title="Dettagli">{isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</IconButton>
                    <IconButton onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))} title="Elimina" className="hover:text-red-400"><Trash2 className="w-4 h-4" /></IconButton>
                  </div>
                </div>

                {isOpen && (
                  <div className={cx("pt-2 border-t space-y-2", u.divider)}>
                    {task.subtasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 pl-8">
                        <button type="button" onClick={() => update(task.id, (t) => ({ ...t, subtasks: t.subtasks.map((x) => (x.id === s.id ? { ...x, completed: !x.completed } : x)) }))} className={cx("cursor-pointer", s.completed ? "text-emerald-400" : u.muted)} aria-label={s.completed ? "Riapri" : "Completa"}>
                          {s.completed ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                        </button>
                        <span className={cx("flex-1 text-xs break-words", s.completed ? cx("line-through", u.muted) : u.subtle)}>{s.title}</span>
                        <button type="button" onClick={() => update(task.id, (t) => ({ ...t, subtasks: t.subtasks.filter((x) => x.id !== s.id) }))} className={cx("cursor-pointer hover:text-red-400", u.muted)} aria-label="Elimina sotto-attività"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2 pl-8">
                      <TextInput value={subInputs[task.id] ?? ""} onChange={(e) => setSubInputs((prev) => ({ ...prev, [task.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(task.id); } }} placeholder="Nuova sotto-attività" className="py-1.5" />
                      <Button size="sm" className="shrink-0" onClick={() => addSubtask(task.id)} aria-label="Aggiungi sotto-attività"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </Panel>
            );
          })
        )}
      </div>

      {tasks.length > 0 && (
        <div className={cx("flex items-center justify-between pt-3 border-t", u.divider)}>
          <Button size="sm" variant="ghost" onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, completed: true })))}>Segna tutte completate</Button>
          <Button size="sm" variant="ghost" disabled={!done} onClick={() => setTasks((prev) => prev.filter((t) => !t.completed))}>Rimuovi completate</Button>
        </div>
      )}

      <Notice>Le attività sono salvate solo in questo browser.</Notice>
    </Stack>
  );
}
