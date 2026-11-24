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

/**
 * Pages whose own standalone ```mermaid fence (outside any purview:likec4
 * marker) must render through Pele as inline SVG, never fall back to a
 * `language-mermaid` code block. The one page listed here is also in
 * RENDERED_DIAGRAMS, so the one build that produces it proves astroc4 and
 * Mermaid fences coexist (Review Focus 2).
 *
 * Checked by the `class="pele` Pele always writes on its root `<svg>`
 * (`xmlns` comes first, so the class is never the attribute right after
 * `<svg`), not a literal `id="pele-..."` attribute: Pele only writes its
 * idPrefix into the DOM for a diagram type that needs an SVG-referenced
 * `<defs>` (a Sankey diagram's gradient fill), confirmed by rendering a
 * sequenceDiagram fence directly through Pele. A flowchart or sequence
 * diagram's elements carry `data-id`, never a literal `id=` (lib/mermaid.test.ts
 * makes the same observation for both).
 */
export const MERMAID_FENCES: string[] = ["docs/guide/diagrams/index.html"];

/**
 * Architecture pages and the LikeC4 project view id(s) each must render: one
 * page per folder under the architecture project's views/, so the page's
 * title and list come from pm-docs-site's own folder scan (lib/architecture.ts)
 * regardless of whether the project actually compiled. This checks the other
 * half: astroc4's `<LikeC4View project="architecture" viewId="...">` renders
 * as a `LikeC4ProjectView` island naming that same view id, so the project's
 * real LikeC4 workspace resolved it (a page with the right title but a
 * missing or mismatched island means the project failed to load).
 */
export const ARCHITECTURE_VIEWS: Record<string, string[]> = {
  "architecture/overview/index.html": ["overview"],
  "architecture/services/index.html": ["services"],
};

/**
 * This map is hand-kept rather than derived from the `.c4` source files
 * (pm-docs-site's own `viewGroups`/`viewsIn`, lib/architecture.ts): deriving
 * it would need the demo's project folder, which `checkDemo` is not given
 * (it only reads `distDir`, so every existing and new test here builds a
 * synthetic dist/ with no sibling source tree). It would also prove nothing
 * extra: `viewsIn` is the same regex scan the review found insufficient on
 * its own, so deriving the expected ids from it and then checking them
 * against the compiled model (below) is no stronger than listing the ids by
 * hand and checking those — the compiled-model check is what adds the
 * missing evidence, not where the id list comes from.
 */

/**
 * The LikeC4 project id astroc4 registers the `architecture` option's
 * project folder under — hardcoded in packages/pm-docs-site/lib/index.ts
 * (`projects: { architecture: architecture!.project }`), not derived from
 * the folder name.
 */
const ARCHITECTURE_PROJECT_ID = "architecture";

/** The compiled chunk may quote string literals with backticks, `'`, or `"`. */
const QUOTE = `['"\`]`;

/** Every `_astro/*.js` chunk whose compiled LikeC4 model is the `architecture` project. */
function architectureModelChunks(distDir: string): string[] {
  const astroDir = join(distDir, "_astro");
  if (!existsSync(astroDir)) return [];
  const projectMarker = new RegExp(`projectId:${QUOTE}${ARCHITECTURE_PROJECT_ID}${QUOTE}`);
  return readdirSync(astroDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => readFileSync(join(astroDir, file), "utf8"))
    .filter((source) => projectMarker.test(source));
}

/**
 * Whether a compiled LikeC4 project chunk declares `viewId` as a real view
 * (not just a stray matching string, or an element that happens to share the
 * id): its key in the views map, `{viewId}:{...}`, whose object carries a
 * `sourcePath` (only a view has one; an element does not) and an `id` field
 * equal to `viewId`, within the same object. Field order is not assumed;
 * only that both appear within the object's opening span.
 */
function chunkDeclaresView(source: string, viewId: string): boolean {
  const key = new RegExp(`(?<![\\w$])${viewId}:\\{`, "g");

  for (let match = key.exec(source); match; match = key.exec(source)) {
    const window = source.slice(match.index, match.index + 400);
    if (/\bsourcePath:/.test(window) && new RegExp(`\\bid:${QUOTE}${viewId}${QUOTE}`).test(window)) return true;
  }
  return false;
}

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
  for (const page of pages.filter((path) => RENDERED_DIAGRAMS.includes(path) || MERMAID_FENCES.includes(path))) {
    const html = readFileSync(join(distDir, page), "utf8");
    if (RENDERED_DIAGRAMS.includes(page) && !html.includes("data-astroc4-fence")) {
      failures.push(`${page}: missing data-astroc4-fence (marker did not render)`);
    }
    if (MERMAID_FENCES.includes(page) && !html.includes('class="pele')) {
      failures.push(`${page}: missing Pele-rendered mermaid svg`);
    }
    if (html.includes("language-mermaid")) failures.push(`${page}: language-mermaid fallback still present`);
  }
  const architecturePages = pages.filter((path) => path in ARCHITECTURE_VIEWS);
  // Read once: every architecture page shares the same compiled project.
  const modelChunks = architecturePages.length > 0 ? architectureModelChunks(distDir) : [];
  for (const page of architecturePages) {
    const html = readFileSync(join(distDir, page), "utf8");
    for (const viewId of ARCHITECTURE_VIEWS[page]!) {
      if (!html.includes(`&quot;viewId&quot;:[0,&quot;${viewId}&quot;]`)) {
        failures.push(`${page}: missing LikeC4ProjectView island for view "${viewId}"`);
      }
      // The island's props only carry the view id the page asked for (from
      // pm-docs-site's folder scan), not whether that view exists in the
      // compiled LikeC4 project: that's resolved client-side, so a page can
      // look right above and still have nothing to show. Check the server
      // build's own compiled model for the view.
      if (!modelChunks.some((source) => chunkDeclaresView(source, viewId))) {
        failures.push(`${page}: view "${viewId}" missing from the compiled architecture project model`);
      }
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
