import React, { useState } from "react";
import { Eye, Edit2, FileText, Trash2, Copy, Check } from "lucide-react";

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState<string>(
    `# 📓 Anteprima Markdown

Benvenuto nell'editor Markdown! Scrivi a sinistra e guarda la resa stilistica a destra.

## ✨ Funzionalità principali

1. **Grassetto** e *corsivo* immediati
2. Liste puntate e numerate
3. Blocchi di codice evidenziati
4. Citazioni di testo e collegamenti ipertestuali

> "Il design minimale non è la mancanza di elementi, ma la perfetta armonia di ciò che rimane."

---

### Esempio di codice:

\`\`\`javascript
const saluta = (nome) => {
  console.log(\`Ciao \${nome}, benvenuto in Il sito è mio!\`);
};
saluta("Utente");
\`\`\`

Fai clic su **Pulisci** per iniziare un nuovo documento o usa [questo link](https://ai.studio/build) per visitare AI Studio!`
  );

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("split");
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  // Simple, robust regex-based Markdown to HTML parser
  const parseMarkdownToHtml = (md: string) => {
    let html = md;

    // Escape raw HTML tags to prevent XSS in preview
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks (multiline)
    html = html.replace(/```([\s\S]*?)```/gm, (match, code) => {
      return `<pre class="bg-zinc-950/80 p-3 rounded font-mono text-xs text-indigo-300 border border-zinc-800 my-3 overflow-x-auto">${code.trim()}</pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-900 px-1.5 py-0.5 rounded text-rose-400 font-mono text-xs border border-zinc-800">$1</code>');

    // Headers (H1 to H6)
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold tracking-tight text-white mb-4 mt-6 border-b border-zinc-800 pb-2">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold text-zinc-100 mb-3 mt-5">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-medium text-zinc-200 mb-2 mt-4">$1</h3>');

    // Blockquotes (styled)
    html = html.replace(/^&gt;\s?(.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 bg-indigo-500/5 px-4 py-2 text-zinc-400 rounded-r my-4">$1</blockquote>');

    // Bold and Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="not-italic text-zinc-300">$1</em>');

    // Unordered lists
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="list-disc list-inside text-zinc-400 ml-4 mb-1">$1</li>');
    html = html.replace(/^\s*\*\s+(.*?)$/gm, '<li class="list-disc list-inside text-zinc-400 ml-4 mb-1">$1</li>');

    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="list-decimal list-inside text-zinc-400 ml-4 mb-1">$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline hover:text-indigo-300">$2</a>');

    // Horizontal Rule
    html = html.replace(/^---$/gm, '<hr class="border-zinc-800 my-6" />');

    // Paragraph splits (double newlines, filtering out lists & empty ones)
    const lines = html.split(/\n/);
    const processedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("</pre") ||
        trimmed.startsWith("<hr")
      ) {
        return line;
      }
      return `<p class="text-xs text-zinc-350 leading-relaxed mb-3">${line}</p>`;
    });

    return processedLines.join("\n");
  };

  const parsedHtml = parseMarkdownToHtml(markdown);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(parsedHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Editor top controllers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/20 p-2 border border-zinc-800/60 rounded">
        {/* Toggle tabs */}
        <div className="flex bg-zinc-900 p-1 rounded gap-1 border border-zinc-800">
          <button
            onClick={() => setActiveTab("split")}
            className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
              activeTab === "split" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split Screen</span>
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
              activeTab === "edit" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
              activeTab === "preview" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Anteprima</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {markdown && (
            <button
              onClick={() => setMarkdown("")}
              className="text-[10px] font-mono flex items-center gap-1 text-zinc-500 hover:text-rose-400 border border-zinc-850 px-2 py-1 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Pulisci
            </button>
          )}
          <button
            onClick={handleCopyHtml}
            className="text-[10px] font-mono flex items-center gap-1 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2.5 py-1 rounded transition-colors"
          >
            {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copiedHtml ? "Copiato HTML!" : "Copia HTML"}
          </button>
        </div>
      </div>

      {/* Editor & Render Container */}
      <div
        className={`grid gap-4 ${
          activeTab === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* Editing Column */}
        {(activeTab === "split" || activeTab === "edit") && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Codice Sorgente Markdown</span>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Inizia a scrivere qui..."
              className="w-full h-[320px] bg-zinc-950/40 border border-zinc-800 rounded p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Rendering Column */}
        {(activeTab === "split" || activeTab === "preview") && (
          <div className="space-y-1 flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Resa Grafica Live</span>
            <div
              className="w-full h-[320px] bg-zinc-950/20 border border-zinc-800 rounded p-4 overflow-y-auto font-sans text-xs selection:bg-indigo-500/25"
              dangerouslySetInnerHTML={{ __html: parsedHtml || '<p class="text-zinc-600 font-mono text-xs">Nessun testo da formattare. Scrivi qualcosa a sinistra per iniziare.</p>' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
