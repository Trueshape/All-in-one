import { test } from "node:test";
import assert from "node:assert/strict";
import { PATTERN_TYPES, patternSvg } from "./pattern";

const base = { size: 24, weight: 4, rotation: 0, fg: "#112233", bg: "#ffffff", width: 400, height: 300 } as const;

test("every pattern type produces a well-formed SVG with its colours", () => {
  for (const type of PATTERN_TYPES) {
    const svg = patternSvg({ ...base, type });
    assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"), type);
    assert.ok(svg.includes("#112233") && svg.includes('fill="url(#p)"'), type);
  }
});

test("a colour that is not #rrggbb cannot be injected into the markup", () => {
  const svg = patternSvg({ ...base, type: "dots", fg: '"><script>alert(1)</script>' });
  assert.ok(!svg.includes("script"));
});

test("rotation goes into the pattern transform", () => {
  assert.ok(patternSvg({ ...base, type: "grid", rotation: 45 }).includes("rotate(45)"));
});
