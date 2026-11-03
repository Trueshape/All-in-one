/** Minimal Markdown parser: text -> AST, plus an HTML serializer. No raw HTML is ever passed through. */

export type Inline =
  | { t: "text"; v: string }
  | { t: "code"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] };

export type Block =
  | { t: "h"; level: number; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | { t: "hr" }
  | { t: "quote"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "pre"; v: string };

const INLINE = /`([^`]+)`|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ t: "text", v: text.slice(last, index) });
    if (m[1] !== undefined) out.push({ t: "code", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "strong", c: parseInline(m[2]) });
    else if (m[3] !== undefined) out.push({ t: "em", c: parseInline(m[3]) });
    else if (SAFE_URL.test(m[5])) out.push({ t: "link", href: m[5], c: parseInline(m[4]) });
    else out.push({ t: "text", v: m[0] });
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

const RE = {
  fence: /^```/,
  heading: /^(#{1,6})\s+(.*)$/,
  hr: /^(-{3,}|\*{3,}|_{3,})\s*$/,
  quote: /^>\s?(.*)$/,
  ul: /^\s*[-*+]\s+(.*)$/,
  ol: /^\s*\d+\.\s+(.*)$/,
};

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const startsBlock = (line: string) =>
    RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) || RE.quote.test(line) || RE.ul.test(line) || RE.ol.test(line);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    if (RE.fence.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !RE.fence.test(lines[i])) body.push(lines[i++]);
      i++; // closing fence
      blocks.push({ t: "pre", v: body.join("\n") });
      continue;
    }

    const h = RE.heading.exec(line);
    if (h) {
      blocks.push({ t: "h", level: h[1].length, c: parseInline(h[2].trim()) });
      i++;
      continue;
    }

    if (RE.hr.test(line)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    if (RE.quote.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && RE.quote.test(lines[i])) parts.push(RE.quote.exec(lines[i++])![1]);
      blocks.push({ t: "quote", c: parseInline(parts.join(" ")) });
      continue;
    }

    const listRe = RE.ul.test(line) ? RE.ul : RE.ol.test(line) ? RE.ol : null;
    if (listRe) {
      const items: Inline[][] = [];
      while (i < lines.length && listRe.test(lines[i])) items.push(parseInline(listRe.exec(lines[i++])![1]));
      blocks.push({ t: listRe === RE.ul ? "ul" : "ol", items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) para.push(lines[i++].trim());
    blocks.push({ t: "p", c: parseInline(para.join(" ")) });
  }
  return blocks;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const inlineHtml = (nodes: Inline[]): string =>
  nodes
    .map((n) => {
      switch (n.t) {
        case "text":
          return esc(n.v);
        case "code":
          return `<code>${esc(n.v)}</code>`;
        case "strong":
          return `<strong>${inlineHtml(n.c)}</strong>`;
        case "em":
          return `<em>${inlineHtml(n.c)}</em>`;
        case "link":
          return `<a href="${esc(n.href)}" target="_blank" rel="noopener noreferrer">${inlineHtml(n.c)}</a>`;
      }
    })
    .join("");

export function toHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.t) {
        case "h":
          return `<h${b.level}>${inlineHtml(b.c)}</h${b.level}>`;
        case "p":
          return `<p>${inlineHtml(b.c)}</p>`;
        case "hr":
          return "<hr />";
        case "quote":
          return `<blockquote>${inlineHtml(b.c)}</blockquote>`;
        case "ul":
        case "ol":
          return `<${b.t}>\n${b.items.map((it) => `  <li>${inlineHtml(it)}</li>`).join("\n")}\n</${b.t}>`;
        case "pre":
          return `<pre><code>${esc(b.v)}</code></pre>`;
      }
    })
    .join("\n");
}
