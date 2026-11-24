// The demo site's content check: every page in examples/demo/expected-pages.txt
// is built, nothing else is, and neither the home page nor any page under plan/
// shows a view's empty state (the `plan-empty` class every view uses) or a
// placeholder, apart from the allowed uses below.
//
//   bun scripts/check-demo.ts [<demo dir>]   (default: examples/demo)

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/** `plan-empty` uses that are not a view's empty state. Each needs its reason. */
export const ALLOWED: { page: RegExp; text: string; reason: string }[] = [
  { page: /^plan\/risks\//, text: "–", reason: "an empty cell of the risk matrix; the other cells hold risks" },
  {
    page: /^plan\/risks\//,
    text: "A cell's colour is the RAG its likelihood and impact derive; a risk's own RAG can differ when it is overridden.",
    reason: "the risk matrix legend, styled as plan-empty text",
  },
];

/**
 * Placeholders a view prints without the plan-empty class: the whole text of an
 * element, never a part of a sentence. A demo page holds none of them.
 */
export const PLACEHOLDERS: { text: string; reason: string }[] = [
  { text: "No focus set", reason: "strategy.astro: STRATEGY.md has no Current focus" },
  { text: "No plan", reason: "now.astro: the active item's plan is not in the export" },
  { text: "No target", reason: "Timeline.tsx: a milestone without a Target date" },
  { text: "No status", reason: "milestones/index.astro: a milestone without a Status" },
];

/**
 * Pages whose purview:likec4 marker must render astroc4's fence, not fall back
 * to the Mermaid pair it wraps: a fallback means the marker failed to resolve.
 */
export const RENDERED_DIAGRAMS: string[] = ["docs/guide/diagrams/index.html"];

function placeholderCount(html: string, text: string): number {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (html.match(new RegExp(`>\\s*${escaped}\\s*<`, "g")) ?? []).length;
}

function htmlPages(distDir: string): string[] {
  return (readdirSync(distDir, { recursive: true }) as string[])
    .filter((file) => file.endsWith(".html"))
    .map((file) => relative(distDir, join(distDir, file)).split(sep).join("/"))
    .sort();
}

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * The text of every element whose `class` attribute (not `data-class`) holds the
 * word `plan-empty`. An element whose closing tag is missing, or comes after the
 * next `plan-empty` element, ends where that next one starts, so it never takes
 * the rest of the page as its text.
 */
function emptyStates(html: string): string[] {
  const open = /<([a-z][a-z0-9]*)\b[^>]*?\sclass="([^"]*)"[^>]*>/gi;
  const starts: { tag: string; index: number; contentStart: number }[] = [];
  for (let match = open.exec(html); match; match = open.exec(html)) {
    if (match[2]!.split(/\s+/).includes("plan-empty")) {
      starts.push({ tag: match[1]!.toLowerCase(), index: match.index, contentStart: open.lastIndex });
    }
  }
  return starts.map(({ tag, contentStart }, position) => {
    const limit = starts[position + 1]?.index ?? html.length;
    const tags = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
    tags.lastIndex = contentStart;
    let depth = 1;
    let end = limit;
    for (let next = tags.exec(html); next && next.index < limit; next = tags.exec(html)) {
      depth += next[1] ? -1 : 1;
      if (depth === 0) {
        end = next.index;
        break;
      }
    }
    const inner = html.slice(contentStart, end).replace(/<[^>]*>/g, "");
    return decode(inner).replace(/\s+/g, " ").trim();
  });
}

/** Failure lines for a built demo: missing, unexpected, and empty pages. Empty when clean. */
export function checkDemo(distDir: string, expectedPages: string[]): string[] {
  const pages = htmlPages(distDir);
  const expected = [...expectedPages].sort();
  const failures = [
    ...expected.filter((page) => !pages.includes(page)).map((page) => `missing page: ${page}`),
    ...pages.filter((page) => !expected.includes(page)).map((page) => `unexpected page: ${page}`),
  ];
  for (const page of pages.filter((path) => path === "index.html" || path.startsWith("plan/"))) {
    const html = readFileSync(join(distDir, page), "utf8");
    for (const text of emptyStates(html)) {
      if (ALLOWED.some((entry) => entry.page.test(page) && entry.text === text)) continue;
      failures.push(`${page}: empty state "${text}"`);
    }
    for (const entry of PLACEHOLDERS) {
      if (placeholderCount(html, entry.text) > 0) failures.push(`${page}: placeholder "${entry.text}"`);
    }
  }
  for (const page of pages.filter((path) => RENDERED_DIAGRAMS.includes(path))) {
    const html = readFileSync(join(distDir, page), "utf8");
    if (!html.includes("data-astroc4-fence")) failures.push(`${page}: missing data-astroc4-fence (marker did not render)`);
    if (html.includes("language-mermaid")) failures.push(`${page}: language-mermaid fallback still present`);
  }
  return failures;
}

if (import.meta.main) {
  const demo = resolve(process.argv[2] ?? "examples/demo");
  const distDir = join(demo, "dist");
  const listFile = join(demo, "expected-pages.txt");
  if (!existsSync(distDir) || !existsSync(listFile)) {
    console.error(`demo: ${existsSync(distDir) ? listFile : distDir} is missing. Build the demo first (just demo-check).`);
    process.exit(1);
  }
  const expected = readFileSync(listFile, "utf8").split(/\r?\n/).filter(Boolean);
  const failures = checkDemo(distDir, expected);
  if (failures.length) {
    for (const line of failures) console.error(line);
    process.exit(1);
  }
  console.log(`demo: ${expected.length} pages, none empty`);
}
