import { useState, useCallback, useRef, useEffect, useId, createContext, useContext, Children, isValidElement } from "react";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Info, X } from "lucide-react";
import { useUi } from "./tokens";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** Copy-to-clipboard with a short "copied" flag. */
export function useCopy(duration = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), duration);
      } catch {
        setCopied(false);
      }
    },
    [duration],
  );
  return { copied, copy };
}

/** Id of the enclosing Field's label, so the control inside is named by it. */
const FieldLabel = createContext<string | undefined>(undefined);

/** `actions`: buttons for the field (Esempio, Svuota, Copia), always in the top right corner of its label row. */
export function Field({ label, hint, actions, children, className }: { label?: ReactNode; hint?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  const u = useUi();
  const labelId = useId();
  return (
    <div className={className}>
      {label && (actions ? (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span id={labelId} className={u.label.replace("block", "").replace("mb-1.5", "")}>{label}</span>
          <div className="flex items-center gap-1">{actions}</div>
        </div>
      ) : <span id={labelId} className={u.label}>{label}</span>)}
      <FieldLabel.Provider value={label ? labelId : undefined}>{children}</FieldLabel.Provider>
      {hint && <p className={cx("mt-1.5 text-[11px]", u.muted)}>{hint}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { prefixText?: string; suffixText?: string };

export function TextInput({ prefixText, suffixText, className, ...rest }: InputProps) {
  const u = useUi();
  const labelledBy = useContext(FieldLabel);
  if (!prefixText && !suffixText) return <input aria-labelledby={rest["aria-label"] ? undefined : labelledBy} {...rest} className={cx(u.input, className)} />;
  return (
    <div className="relative">
      {prefixText && <span className={cx("absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none", u.muted)}>{prefixText}</span>}
      <input aria-labelledby={rest["aria-label"] ? undefined : labelledBy} {...rest} className={cx(u.input, prefixText && "pl-8", suffixText && "pr-10", className)} />
      {suffixText && <span className={cx("absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none", u.muted)}>{suffixText}</span>}
    </div>
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const u = useUi();
  const labelledBy = useContext(FieldLabel);
  return <textarea aria-labelledby={rest["aria-label"] ? undefined : labelledBy} {...rest} className={cx(u.input, "resize-y", className)} />;
}

type SelectProps = {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  /** <option value="...">label</option> elements, like a native select. */
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

/** Background of the open list: the same as the tool modal of each theme, so the list reads as part of it. */
const LIST_BG = { artistic: "bg-[#0a0a0a]", immersive: "bg-[#030812]", sophisticated: "bg-slate-900" } as const;
const LIST_MAX = 280;

/**
 * Drop-down drawn with the site's own tokens instead of the browser's native list. It takes <option>
 * children and calls onChange with { target: { value } }, so it is a drop-in for <select>.
 * The list is a portal on <body>: it is not clipped by the modal's scroll area.
 */
export function Select({ value, onChange, children, className, disabled, id, "aria-label": ariaLabel }: SelectProps) {
  const u = useUi();
  const labelledBy = useContext(FieldLabel);
  const listId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);

  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((el) => {
      const props = el.props as { value?: string | number; disabled?: boolean; children?: ReactNode };
      return { value: String(props.value ?? ""), label: props.children, disabled: !!props.disabled };
    });
  const selected = options.find((o) => o.value === value);
  // The radius of the site's fields (square, soft or round), reused for the list.
  const radius = /rounded(?:-[a-z0-9]+)?/.exec(u.input)?.[0] ?? "";

  const show = () => {
    const el = button.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 180 && above > below;
    setBox({ left: r.left, width: r.width, maxHeight: Math.min(LIST_MAX, up ? above : below), ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const close = () => setOpen(false);

  const choose = (i: number) => {
    const option = options[i];
    if (!option || option.disabled) return;
    onChange({ target: { value: option.value } });
    close();
    button.current?.focus();
  };

  // Close when the pointer goes elsewhere, or when the page moves under the list.
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!list.current?.contains(target) && !button.current?.contains(target)) close();
    };
    const moved = (e: Event) => {
      if (!list.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", outside);
    window.addEventListener("scroll", moved, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("scroll", moved, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const move = (from: number, step: 1 | -1) => {
    for (let i = from + step; i >= 0 && i < options.length; i += step) if (!options[i].disabled) return i;
    return from;
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        // Only close the list: the tool window must stay open.
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        close();
        return;
      case "ArrowDown": e.preventDefault(); setActive((a) => move(a, 1)); return;
      case "ArrowUp": e.preventDefault(); setActive((a) => move(a, -1)); return;
      case "Home": e.preventDefault(); setActive(move(-1, 1)); return;
      case "End": e.preventDefault(); setActive(move(options.length, -1)); return;
      case "Enter":
      case " ": e.preventDefault(); choose(active); return;
      case "Tab": close(); return;
    }
    // Typing letters jumps to the next option that starts with them.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 700 ? e.key : typed.current.text + e.key, at: now };
      const text = typed.current.text.toLowerCase();
      const hit = options.findIndex((o) => !o.disabled && String(typeof o.label === "string" ? o.label : o.value).toLowerCase().startsWith(text));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <>
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : labelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={cx(u.input, "flex items-center justify-between gap-2 text-left", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown className={cx("w-4 h-4 shrink-0 transition-transform", u.muted, open && "rotate-180")} aria-hidden />
      </button>
      {open && box && createPortal(
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={cx("fixed z-[70] overflow-y-auto border shadow-2xl py-1", u.divider, LIST_BG[u.id], radius, u.font)}
          style={{ left: box.left, width: box.width, top: box.top, bottom: box.bottom, maxHeight: box.maxHeight }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              className={cx(
                "flex items-center justify-between gap-2 px-3 py-2 text-sm",
                o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                i === active && !o.disabled && "bg-white/10",
                o.value === value ? u.accent : u.text,
              )}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
};

export function Button({ variant = "secondary", size = "md", icon, className, children, ...rest }: ButtonProps) {
  const u = useUi();
  const variants = { primary: u.btnPrimary, secondary: u.btnSecondary, ghost: u.btnGhost, danger: u.btnDanger };
  return (
    <button type="button" {...rest} className={cx(u.btnBase, variants[variant], size === "sm" ? "h-8 px-3" : "h-10 px-4", "[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0", className)}>
      {icon}
      {children}
    </button>
  );
}

/** Square button with one icon: 32 px, or 40 px (`md`) when it sits beside a normal Button. */
export function IconButton({ size = "sm", className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" }) {
  const u = useUi();
  return (
    <button type="button" {...rest} className={cx(u.btnBase, u.btnGhost, size === "md" ? "h-10 w-10" : "h-8 w-8", "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0", className)}>
      {children}
    </button>
  );
}

export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <IconButton onClick={() => copy(text)} disabled={!text} title={label ?? "Copia"} className={className}>
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </IconButton>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  className,
  fill = false,
}: {
  options: Array<{ value: NoInfer<T>; label: ReactNode }>;
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
  /** Stretch the chips to fill the container width (equal columns). */
  fill?: boolean;
}) {
  const u = useUi();
  const labelledBy = useContext(FieldLabel);
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={cx(fill ? "grid gap-1.5" : "flex flex-wrap gap-1.5", className)}
      style={fill ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => (
        <button type="button" aria-pressed={o.value === value} key={String(o.value)} onClick={() => onChange(o.value)} className={cx(o.value === value ? u.chipActive : u.chip, fill && "w-full text-center")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
  fill = false,
}: {
  options: Array<{ value: NoInfer<T>; label: ReactNode }>;
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
  /** Stretch the control to the container width, with equal segments. */
  fill?: boolean;
}) {
  const u = useUi();
  const labelledBy = useContext(FieldLabel);
  return (
    <div role="group" aria-labelledby={labelledBy} className={cx(u.segmentWrap, fill && "w-full", className)}>
      {options.map((o) => (
        <button type="button" aria-pressed={o.value === value} key={String(o.value)} onClick={() => onChange(o.value)} className={cx(o.value === value ? u.segmentActive : u.segment, fill && "flex-1 flex items-center justify-center")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  display?: ReactNode;
}) {
  const u = useUi();
  const labelId = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span id={labelId} className={u.label.replace("block", "").replace("mb-1.5", "")}>{label}</span>
        <span className={cx("text-sm font-mono font-semibold", u.accent)}>{display ?? value}</span>
      </div>
      <input
        type="range"
        aria-labelledby={labelId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 cursor-pointer"
        style={{ accentColor: u.accentHex }}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode }) {
  const u = useUi();
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 cursor-pointer" style={{ accentColor: u.accentHex }} />
      <span className={cx("text-xs", u.subtle, u.font)}>{label}</span>
    </label>
  );
}

export function Panel({ children, inset, className }: { children: ReactNode; inset?: boolean; className?: string }) {
  const u = useUi();
  return <div className={cx(inset ? u.panelInset : u.panel, "p-4", className)}>{children}</div>;
}

export function Stat({ label, value, tone, className }: { label: ReactNode; value: ReactNode; tone?: "accent" | "good" | "bad" | "warn"; className?: string }) {
  const u = useUi();
  const toneClass = { accent: u.accent, good: "text-emerald-400", bad: "text-red-400", warn: "text-amber-400" }[tone ?? "accent"];
  return (
    <div className={cx(u.panel, "p-3 flex flex-col items-center justify-center text-center gap-1", className)}>
      <span className={u.statLabel}>{label}</span>
      <span className={cx("text-xl font-mono font-bold", toneClass)}>{value}</span>
    </div>
  );
}

/** Main result block: big value, optional copy button, optional detail rows below. */
export function ResultCard({ label, value, copyText, children }: { label: ReactNode; value: ReactNode; copyText?: string; children?: ReactNode }) {
  const u = useUi();
  return (
    <Panel className="relative overflow-hidden space-y-3">
      <span aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ background: u.accentHex }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={u.statLabel}>{label}</span>
          <div className={cx("text-3xl font-bold break-words mt-1", u.statValue)}>{value}</div>
        </div>
        {copyText !== undefined && <CopyButton text={copyText} />}
      </div>
      {children && <div className={cx("pt-3 border-t space-y-1.5", u.divider)}>{children}</div>}
    </Panel>
  );
}

export function Row({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: "good" | "bad" | "warn" }) {
  const u = useUi();
  const toneClass = tone ? { good: "text-emerald-400", bad: "text-red-400", warn: "text-amber-400" }[tone] : u.text;
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className={u.muted}>{label}</span>
      <span className={cx("font-mono text-right whitespace-normal break-words", toneClass)}>{value}</span>
    </div>
  );
}

/** Whether the info notices are visible; toggled from the modal header and shared by every tool. */
export const InfoContext = createContext(false);

export function Notice({ tone = "info", children }: { tone?: "info" | "empty" | "error" | "success" | "warn"; children: ReactNode }) {
  const u = useUi();
  const showInfo = useContext(InfoContext);
  // Only explanations hide behind the (i) button: errors, warnings and "why there is no result yet" must always be seen.
  if (tone === "info" && !showInfo) return null;
  const tones = {
    info: cx(u.panel, u.subtle),
    empty: cx(u.panel, u.subtle),
    error: "bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl",
    success: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl",
    warn: "bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl",
  };
  return (
    <div className={cx("flex items-start gap-2.5 px-3 py-2 text-xs", tones[tone], u.id === "sophisticated" && "rounded-xl")}>
      <Info aria-hidden className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const u = useUi();
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className={u.heading}>{children}</h3>
      {right}
    </div>
  );
}

export function Stack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("space-y-5", className)}>{children}</div>;
}

export const fmtNumber = (n: number, maxDecimals = 2) =>
  new Intl.NumberFormat("it-IT", { maximumFractionDigits: maxDecimals }).format(n);

export { cx };

/** Text tabs with a filled pill for the active option (no outer frame). */
export function Tabs<T extends string | number>({
  options,
  value,
  onChange,
  className,
  fill = false,
}: {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Spread the tabs across the whole width. */
  fill?: boolean;
}) {
  const u = useUi();
  return (
    <div role="tablist" className={cx("flex flex-wrap gap-1", className)}>
      {options.map((o) => (
        <button type="button" role="tab" aria-selected={o.value === value} key={String(o.value)} onClick={() => onChange(o.value)} className={cx(o.value === value ? u.segmentActive : u.segment, fill && "flex-1 text-center")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Removable tag: a small rounded badge with an X to remove it. */
export function Tag({ label, onRemove }: { label: ReactNode; onRemove: () => void }) {
  const u = useUi();
  return (
    <span className={cx("inline-flex items-center gap-2", u.tag)}>
      {label}
      <button type="button" onClick={onRemove} className={cx("cursor-pointer hover:text-red-400 transition-colors", u.muted)} aria-label={typeof label === "string" ? `Rimuovi ${label}` : "Rimuovi"}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

const WEEKDAYS = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseIso = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** Date picker in the theme's colors: a field that opens a month calendar. Values are YYYY-MM-DD. */
export function DatePicker({ value, onChange, max }: { value: string; onChange: (value: string) => void; max?: string }) {
  const u = useUi();
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const [view, setView] = useState(() => selected ?? new Date());
  const root = useRef<HTMLDivElement>(null);
  const today = toIso(new Date());
  const maxIso = max ?? "";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const label = view.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const shown = selected ? selected.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "Seleziona una data";

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => { setView(selected ?? new Date()); setOpen((o) => !o); }} className={cx(u.input, "flex items-center justify-between gap-2 text-left cursor-pointer")}>
        <span className={selected ? "" : u.muted}>{shown}</span>
        <Calendar className={cx("h-4 w-4 shrink-0", u.accent)} />
      </button>
      {open && (
        <div className={cx("absolute left-0 right-0 z-50 mt-2 p-3 shadow-2xl", u.panel, "bg-zinc-950 rounded-2xl")} style={{ maxWidth: 300 }}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className={cx("p-1 cursor-pointer rounded-lg hover:bg-white/5", u.muted)} aria-label="Mese precedente"><ChevronLeft className="h-4 w-4" /></button>
            <span className={cx("text-xs font-semibold capitalize", u.text)}>{label}</span>
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className={cx("p-1 cursor-pointer rounded-lg hover:bg-white/5", u.muted)} aria-label="Mese successivo"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 pb-1">
            {WEEKDAYS.map((w) => <span key={w} className={cx("text-center text-[10px] font-mono", u.muted)}>{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const iso = toIso(d);
              const isSel = iso === value;
              const disabled = !!maxIso && iso > maxIso;
              const isToday = iso === today;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={cx("h-8 rounded-lg text-xs font-mono cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed", !isSel && "hover:bg-white/5", !isSel && (isToday ? u.accent : u.text))}
                  style={isSel ? { background: u.accentHex, color: "#fff" } : isToday ? { boxShadow: `inset 0 0 0 1px ${u.accentHex}` } : undefined}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Language menu: the closed button shows only the flag of the language in use; the open list shows each flag with its name. The caller styles both to match the current theme. */
export function LangMenu<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  triggerClassName,
  listClassName,
  itemClassName,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; flag: string }>;
  ariaLabel: string;
  triggerClassName: string;
  listClassName: string;
  itemClassName: (active: boolean) => string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={ariaLabel}
        className={cx("flex items-center justify-center cursor-pointer", triggerClassName)}
      >
        <Flag code={current.flag} />
      </button>
      {open && (
        <ul role="listbox" className={cx("absolute left-0 md:left-auto md:right-0 z-50 mt-2 w-48 overflow-hidden p-1.5 shadow-2xl", listClassName)}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={cx("flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors cursor-pointer", itemClassName(active))}
                >
                  <Flag code={o.flag} />
                  <span className="flex-1">{o.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-zinc-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const STRIPE_FLAGS: Record<string, { colors: string[]; vertical: boolean; weights?: number[] }> = {
  it: { colors: ["#009246", "#ffffff", "#ce2b37"], vertical: true },
  fr: { colors: ["#0055a4", "#ffffff", "#ef4135"], vertical: true },
  de: { colors: ["#000000", "#dd0000", "#ffce00"], vertical: false },
  es: { colors: ["#aa151b", "#f1bf00", "#aa151b"], vertical: false, weights: [1, 2, 1] },
};

/** Small inline flag (it, fr, de, es, gb): no external request, and it looks the same on every OS. */
function Flag({ code }: { code: string }) {
  const cls = "h-3.5 w-5 shrink-0 rounded-[3px]";
  const stripes = STRIPE_FLAGS[code];
  if (stripes) {
    const weights = stripes.weights ?? stripes.colors.map(() => 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let at = 0;
    return (
      <svg viewBox="0 0 30 20" preserveAspectRatio="none" className={cls} aria-hidden>
        {stripes.colors.map((color, i) => {
          const size = (weights[i] / total) * (stripes.vertical ? 30 : 20);
          const start = at;
          at += size;
          return <rect key={i} fill={color} x={stripes.vertical ? start : 0} y={stripes.vertical ? 0 : start} width={stripes.vertical ? size : 30} height={stripes.vertical ? 20 : size} />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" className={cls} aria-hidden>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#ffffff" strokeWidth="6" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#c8102e" strokeWidth="2" />
      <path d="M30 0V30M0 15H60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30 0V30M0 15H60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}
