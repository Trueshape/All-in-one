import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Eye, FileText, PenLine, Trash2, Check, Copy } from "lucide-react";
import { Segmented, Button, TextArea, Panel, SectionTitle, Stack, useCopy, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import type { Ui } from "../ui/tokens";
import { parseMarkdown, toHtml } from "../lib/markdown";
import type { Block, Inline } from "../lib/markdown";

const SAMPLE = `# Anteprima Markdown

Scrivi a sinistra e guarda la resa a destra.

## Funzionalità

1. **Grassetto** e *corsivo*
2. Liste puntate e numerate
3. Blocchi di codice
4. Citazioni e [collegamenti](https://example.com)

> Il design minimale non è la mancanza di elementi, ma la perfetta armonia di ciò che rimane.

---

### Esempio di codice

\`\`\`
const saluta = (nome) => \`Ciao \${nome}!\`;
saluta("Utente");
\`\`\`
`;

type ViewMode = "split" | "edit" | "preview";

function renderInline(nodes: Inline[], u: Ui): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "code":
        return (
          <code key={i} className={cx("px-1.5 py-0.5 text-[0.85em] font-mono border", u.panel, u.accent)}>
            {n.v}
          </code>
        );
      case "strong":
        return <strong key={i} className={cx("font-bold", u.text)}>{renderInline(n.c, u)}</strong>;
      case "em":
        return <em key={i}>{renderInline(n.c, u)}</em>;
      case "link":
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className={cx("underline underline-offset-2", u.accent)}>
            {renderInline(n.c, u)}
          </a>
        );
    }
  });
}

function renderBlock(b: Block, i: number, u: Ui): ReactNode {
  switch (b.t) {
    case "h": {
      const size = ["text-2xl", "text-xl", "text-lg", "text-base", "text-sm", "text-sm"][b.level - 1];
      return (
        <div key={i} role="heading" aria-level={b.level} className={cx(size, "font-semibold mt-4 mb-2", u.text, b.level === 1 && cx("pb-2 border-b", u.divider))}>
          {renderInline(b.c, u)}
        </div>
      );
    }
    case "p":
      return <p key={i} className={cx("text-sm leading-relaxed mb-3", u.subtle)}>{renderInline(b.c, u)}</p>;
    case "hr":
      return <hr key={i} className={cx("my-5 border-t", u.divider)} />;
    case "quote":
      return (
        <blockquote key={i} className={cx("my-3 pl-4 border-l-2 text-sm italic", u.muted)} style={{ borderColor: u.accentHex }}>
          {renderInline(b.c, u)}
        </blockquote>
      );
    case "ul":
    case "ol": {
      const List = b.t;
      return (
        <List key={i} className={cx("mb-3 pl-5 space-y-1 text-sm", u.subtle, b.t === "ul" ? "list-disc" : "list-decimal")}>
          {b.items.map((it, j) => <li key={j}>{renderInline(it, u)}</li>)}
        </List>
      );
    }
    case "pre":
      return (
        <pre key={i} className={cx("my-3 p-3 overflow-x-auto text-xs font-mono", u.panelInset, u.accent)}>
          <code>{b.v}</code>
        </pre>
      );
  }
}

export default function MarkdownPreviewer() {
  const u = useUi();
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [view, setView] = useState<ViewMode>("split");
  const { copied, copy } = useCopy();

  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <Stack className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "split", label: <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Split</span> },
            { value: "edit", label: <span className="inline-flex items-center gap-1.5"><PenLine className="w-3.5 h-3.5" /> Editor</span> },
            { value: "preview", label: <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Anteprima</span> },
          ]}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="danger" disabled={!markdown} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setMarkdown("")}>
            Pulisci
          </Button>
          <Button size="sm" disabled={!markdown} icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} onClick={() => copy(toHtml(blocks))}>
            {copied ? "Copiato" : "Copia HTML"}
          </Button>
        </div>
      </div>

      <div className={cx("grid gap-4", view === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
        {view !== "preview" && (
          <div className="space-y-2">
            <SectionTitle>Sorgente</SectionTitle>
            <TextArea className="h-80 resize-none text-xs leading-relaxed" value={markdown} onChange={(e) => setMarkdown(e.target.value)} placeholder="# Inizia a scrivere qui..." />
          </div>
        )}
        {view !== "edit" && (
          <div className="space-y-2">
            <SectionTitle>Anteprima</SectionTitle>
            <Panel className="h-80 overflow-y-auto">
              {blocks.length ? blocks.map((b, i) => renderBlock(b, i, u)) : <p className={cx("text-xs", u.muted)}>Nessun testo da mostrare.</p>}
            </Panel>
          </div>
        )}
      </div>
    </Stack>
  );
}
