import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMarkdown, toHtml } from "./markdown";

const html = (src: string) => toHtml(parseMarkdown(src));

test("raw HTML is escaped, never passed through", () => {
  const out = html("<script>alert(1)</script>");
  assert.ok(!out.includes("<script"));
  assert.ok(out.includes("&lt;script&gt;"));
});

test("links with an unsafe scheme stay plain text", () => {
  const out = html("[click](javascript:alert(1))");
  assert.ok(!out.includes("<a "));
  assert.ok(!out.includes("href="));
});

test("quotes in a link target cannot open a new attribute", () => {
  const out = html('[x](https://example.com/"onmouseover="alert(1))');
  assert.ok(out.includes("&quot;"));
  assert.ok(!out.includes('"onmouseover'));
});

test("basic blocks are rendered", () => {
  assert.equal(html("# Title"), "<h1>Title</h1>");
  assert.equal(html("**bold** and *em*"), "<p><strong>bold</strong> and <em>em</em></p>");
  assert.ok(html("- a\n- b").includes("<li>a</li>"));
});

test("code fences keep their content escaped", () => {
  assert.equal(html("```\n<b>x</b>\n```"), "<pre><code>&lt;b&gt;x&lt;/b&gt;</code></pre>");
});
