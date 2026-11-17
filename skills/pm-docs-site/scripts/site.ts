import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

// Render the pm-docs-site templates for one site, from its manifest
// (<site root>/pm-docs-site.json), then write them or compare them.
//
//   bun <skill>/scripts/site.ts check <site root>               # read-only; exit 1 on a difference
//   bun <skill>/scripts/site.ts write <site root> [--keep <path>]...
//
// Template-owned files are rewritten on every write. Site-owned files are
// written only when missing and never compared: package.json (Bun adds the
// dependencies) and src/docs-sources.ts (the repository's own sources).
// The manifest's optional `views` list picks the plan views (all when it is
// missing); write removes the pages of a view the list leaves out.

export const MODULES = ["repo-docs", "architecture", "aspire"] as const;
export const SITE_OWNED = ["package.json", "src/docs-sources.ts"];
export const MANIFEST = "pm-docs-site.json";

/**
 * The optional plan views and the template files each one owns. A manifest
 * without `views` gets every view; a view left out is not rendered, and its
 * files are reported by `check` and removed by `write`.
 */
export const VIEWS: Record<string, string[]> = {
  now: ["src/pages/plan/now.astro"],
  milestones: ["src/pages/plan/milestones/"],
  features: ["src/pages/plan/features/"],
  inbox: ["src/pages/plan/inbox.astro"],
  briefs: ["src/pages/plan/briefs.astro"],
  strategy: ["src/pages/plan/strategy.astro"],
};

export interface Manifest {
  schemaVersion: number;
  modules: string[];
  /** The optional plan views to render (`VIEWS`); missing means all of them. */
  views?: string[];
  values: Record<string, string>;
}

export const viewsOf = (manifest: Manifest) => manifest.views ?? Object.keys(VIEWS);

/** The view that owns a template file, or null for a file every site has. */
const viewOf = (file: string) => Object.entries(VIEWS).find(([, paths]) => paths.some((path) => (path.endsWith("/") ? file.startsWith(path) : file === path)))?.[0] ?? null;

const templates = join(import.meta.dir, "..", "templates");

/** Every file under `dir`, as `/`-separated paths relative to it. */
function files(dir: string): string[] {
  return (readdirSync(dir, { recursive: true, withFileTypes: true }) as any[])
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"));
}

export function readManifest(siteRoot: string): Manifest {
  const path = join(siteRoot, MANIFEST);
  if (!existsSync(path)) throw new Error(`No ${MANIFEST} in ${siteRoot}. Run pm-docs-site scaffold.`);
  const manifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  const unknown = manifest.modules.filter((module) => !(MODULES as readonly string[]).includes(module));
  if (unknown.length) throw new Error(`${MANIFEST}: unknown modules ${unknown.join(", ")}`);
  const unknownViews = (manifest.views ?? []).filter((view) => !(view in VIEWS));
  if (unknownViews.length) throw new Error(`${MANIFEST}: unknown views ${unknownViews.join(", ")} (known: ${Object.keys(VIEWS).join(", ")})`);
  return manifest;
}

/** The site's files as the templates render them: core first, each module's files replacing or adding. */
export function render(manifest: Manifest): Map<string, string> {
  const views = viewsOf(manifest);
  const values: Record<string, string> = {
    ...manifest.values,
    MODULE_REPO_DOCS: String(manifest.modules.includes("repo-docs")),
    MODULE_ARCHITECTURE: String(manifest.modules.includes("architecture")),
    ...Object.fromEntries(Object.keys(VIEWS).map((view) => [`VIEW_${view.toUpperCase()}`, String(views.includes(view))])),
  };
  const sources = [join(templates, "site"), ...manifest.modules.map((module) => join(templates, module))];
  const out = new Map<string, string>();

  for (const source of sources) {
    for (const file of files(source)) {
      // MODULE.md is the module's instructions, and C# goes into the AppHost, not the site.
      if (file === "MODULE.md" || file.endsWith(".cs")) continue;
      const view = viewOf(file);
      if (view && !views.includes(view)) continue;
      const text = readFileSync(join(source, file), "utf8").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, name: string) => {
        if (!(name in values)) throw new Error(`${MANIFEST}: no value for {{${name}}} (${relative(templates, join(source, file))})`);
        return values[name]!;
      });
      out.set(file === "gitignore" ? ".gitignore" : file, text);
    }
  }
  return out;
}

const normalise = (text: string) => text.replace(/\r\n/g, "\n");

/** The files of the views the manifest leaves out that are still in the site. */
export function extraneous(siteRoot: string): string[] {
  const views = viewsOf(readManifest(siteRoot));
  const pages = join(siteRoot, "src", "pages");
  const present = existsSync(pages) ? files(pages).map((file) => `src/pages/${file}`) : [];
  return present.filter((file) => {
    const view = viewOf(file);
    return view !== null && !views.includes(view);
  }).sort();
}

/** The template-owned files that are missing or differ from the render, then the files of views left out. */
export function differences(siteRoot: string): string[] {
  const rendered = render(readManifest(siteRoot));
  return [
    ...[...rendered]
      .filter(([file]) => !SITE_OWNED.includes(file))
      .filter(([file, text]) => {
        const path = join(siteRoot, file);
        return !existsSync(path) || normalise(readFileSync(path, "utf8")) !== text;
      })
      .map(([file]) => file),
    ...extraneous(siteRoot),
  ].sort();
}

export function write(siteRoot: string, keep: string[] = []): string[] {
  const written: string[] = [];
  for (const [file, text] of render(readManifest(siteRoot))) {
    const path = join(siteRoot, file);
    if (keep.includes(file) || (SITE_OWNED.includes(file) && existsSync(path))) continue;
    if (existsSync(path) && normalise(readFileSync(path, "utf8")) === text) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    written.push(file);
  }
  return written.sort();
}

/** Remove the template-owned files of the views the manifest leaves out, except kept ones. */
export function prune(siteRoot: string, keep: string[] = []): string[] {
  const removed = extraneous(siteRoot).filter((file) => !keep.includes(file));
  for (const file of removed) rmSync(join(siteRoot, file));
  return removed;
}

if (import.meta.main) {
  const [command, root, ...rest] = process.argv.slice(2);
  if ((command !== "check" && command !== "write") || !root) {
    console.error("usage: bun site.ts check <site root> | write <site root> [--keep <path>]...");
    process.exit(2);
  }
  const siteRoot = resolve(root);
  try {
    if (command === "check") {
      const diff = differences(siteRoot);
      console.log(diff.length ? diff.map((file) => `differs: ${file}`).join("\n") : "current");
      process.exit(diff.length ? 1 : 0);
    }
    const keep = rest.flatMap((arg, i) => (rest[i - 1] === "--keep" ? [arg] : []));
    const written = write(siteRoot, keep);
    const removed = prune(siteRoot, keep);
    const lines = [...written.map((file) => `wrote: ${file}`), ...removed.map((file) => `removed: ${file}`)];
    console.log(lines.length ? lines.join("\n") : "unchanged");
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
