import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Check, Copy } from "lucide-react";
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

export function Field({ label, hint, children, className }: { label?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  const u = useUi();
  return (
    <div className={className}>
      {label && <span className={u.label}>{label}</span>}
      {children}
      {hint && <p className={cx("mt-1.5 text-[11px]", u.muted)}>{hint}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { prefixText?: string; suffixText?: string };

export function TextInput({ prefixText, suffixText, className, ...rest }: InputProps) {
  const u = useUi();
  if (!prefixText && !suffixText) return <input {...rest} className={cx(u.input, className)} />;
  return (
    <div className="relative">
      {prefixText && <span className={cx("absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none", u.muted)}>{prefixText}</span>}
      <input {...rest} className={cx(u.input, prefixText && "pl-8", suffixText && "pr-10", className)} />
      {suffixText && <span className={cx("absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none", u.muted)}>{suffixText}</span>}
    </div>
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const u = useUi();
  return <textarea {...rest} className={cx(u.input, "resize-y", className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  const u = useUi();
  return (
    <select {...rest} className={cx(u.input, "appearance-none cursor-pointer pr-8", className)}>
      {children}
    </select>
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
    <button type="button" {...rest} className={cx(u.btnBase, variants[variant], size === "sm" ? "px-2.5 py-1.5" : "px-4 py-2.5", className)}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const u = useUi();
  return (
    <button type="button" {...rest} className={cx(u.btnBase, u.btnGhost, "p-1.5", className)}>
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
}: {
  options: Array<{ value: NoInfer<T>; label: ReactNode }>;
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
}) {
  const u = useUi();
  return (
    <div className={cx("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => (
        <button type="button" key={String(o.value)} onClick={() => onChange(o.value)} className={o.value === value ? u.chipActive : u.chip}>
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
}: {
  options: Array<{ value: NoInfer<T>; label: ReactNode }>;
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
}) {
  const u = useUi();
  return (
    <div className={cx(u.segmentWrap, className)}>
      {options.map((o) => (
        <button type="button" key={String(o.value)} onClick={() => onChange(o.value)} className={o.value === value ? u.segmentActive : u.segment}>
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
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className={u.label.replace("block", "").replace("mb-1.5", "")}>{label}</span>
        <span className={cx("text-sm font-mono font-semibold", u.accent)}>{display ?? value}</span>
      </div>
      <input
        type="range"
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
    <Panel className="space-y-3">
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
      <span className={cx("font-mono text-right break-all", toneClass)}>{value}</span>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success" | "warn"; children: ReactNode }) {
  const u = useUi();
  const tones = {
    info: cx(u.panel, u.subtle),
    error: "bg-red-500/10 border border-red-500/30 text-red-300 rounded",
    success: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded",
    warn: "bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded",
  };
  return <div className={cx("px-3 py-2 text-xs", tones[tone], u.id === "sophisticated" && "rounded-xl")}>{children}</div>;
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
