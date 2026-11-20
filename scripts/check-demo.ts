// The demo site's content check: every page in examples/demo/expected-pages.txt
// is built, nothing else is, and no page under plan/ shows a view's empty state
// (the `plan-empty` class every view uses), apart from the allowed uses below.
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
  {
    page: /^plan\/features\/r-\d+\//,
    text: "Nothing links here yet.",
    reason: "LinkedFrom on a feature that no other page links to; the feature page itself has content",
  },
];

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

/** The text of every element whose class list holds the word `plan-empty`. */
function emptyStates(html: string): string[] {
  const texts: string[] = [];
  const open = /<([a-z][a-z0-9]*)\b[^>]*\bclass="([^"]*)"[^>]*>/gi;
  for (let match = open.exec(html); match; match = open.exec(html)) {
    if (!match[2]!.split(/\s+/).includes("plan-empty")) continue;
    const tag = match[1]!.toLowerCase();
    const tags = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
    tags.lastIndex = open.lastIndex;
    let depth = 1;
    let end = html.length;
    for (let next = tags.exec(html); next; next = tags.exec(html)) {
      depth += next[1] ? -1 : 1;
      if (depth === 0) {
        end = next.index;
        break;
      }
    }
    const inner = html.slice(open.lastIndex, end).replace(/<[^>]*>/g, "");
    texts.push(decode(inner).replace(/\s+/g, " ").trim());
  }
  return texts;
}

/** Failure lines for a built demo: missing, unexpected, and empty pages. Empty when clean. */
export function checkDemo(distDir: string, expectedPages: string[]): string[] {
  const pages = htmlPages(distDir);
  const expected = [...expectedPages].sort();
  const failures = [
    ...expected.filter((page) => !pages.includes(page)).map((page) => `missing page: ${page}`),
    ...pages.filter((page) => !expected.includes(page)).map((page) => `unexpected page: ${page}`),
  ];
  for (const page of pages.filter((path) => path.startsWith("plan/"))) {
    for (const text of emptyStates(readFileSync(join(distDir, page), "utf8"))) {
      if (ALLOWED.some((entry) => entry.page.test(page) && entry.text === text)) continue;
      failures.push(`${page}: empty state "${text}"`);
    }
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
