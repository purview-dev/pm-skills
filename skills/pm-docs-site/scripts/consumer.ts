import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// Write a site that consumes @purview-dev/pm-docs-site, or migrate a site the
// templates rendered into one. A package site is four files: package.json,
// astro.config.ts, bun.lock (written by `bun add`), and .gitignore.
//
//   bun <skill>/scripts/consumer.ts inspect <site>                       # read-only JSON
//   bun <skill>/scripts/consumer.ts migrate <site> [--include-unlisted]
//   bun <skill>/scripts/consumer.ts write <site> --options <json>
//
// migrate deletes only the paths in references/template-files.md, and stops
// before deleting anything when the site holds a file that list does not name.
// Both write modes drop package.json's dependencies: the caller adds the
// package next (`bun add @purview-dev/pm-docs-site --exact`).

/** One folder of repository Markdown, shown as one sidebar group (a copy of the package's type). */
export interface DocsSource {
  label: string;
  base: string;
  include: string[];
  prefix?: string;
  indexFile?: string;
  order?: "asc" | "desc";
  collapsed?: boolean;
  hidden?: boolean;
}

/** The pmDocsSite() options a consumer's astro.config.ts passes. */
export interface ConsumerOptions {
  title: string;
  description?: string;
  planning?: string;
  docs?: { root: string; sources: DocsSource[] };
  views?: string[];
  architecture?: { project: string };
}

export interface Inspection {
  /** The template files present in the site that migrate deletes (the manifest goes last, separately). */
  listed: string[];
  /** Files in the site that are neither template files nor consumer files. */
  unlisted: string[];
  options: ConsumerOptions;
  /** The site's astro.config.mjs when it differs from the template's render, else null. */
  extraConfig: string | null;
  /** The LikeC4 model folder, repository-relative, for an architecture-module site. */
  architectureDir: string | null;
}

const MANIFEST = "pm-docs-site.json";
/** The package's default export path, relative to the site root. */
const DEFAULT_PLANNING = "../planning/planning.json";
/**
 * Files a template site already has that a package site keeps: migrate rewrites
 * or leaves them, never deletes them. An existing astro.config.ts is not one of
 * them: in a template site it is unlisted, so migrate stops instead of
 * overwriting it.
 */
const CONSUMER_FILES = ["package.json", "bun.lock", ".gitignore"];
/** Installed or built folders, never part of the site's source. */
const GENERATED_DIRS = ["node_modules", "dist", ".astro"];
const GITIGNORE = "node_modules/\ndist/\n.astro/\n";

// The template's astro.config.mjs (core, and the architecture module's
// replacement), frozen with the inventory on 2026-11-24 so extraConfig works
// after the templates are gone.
const CONFIG_HEAD = `// @ts-check
// The {{SITE_TITLE}} site: the plan from {{PM_ROOT}}planning.json, read where it
// lives. Built from the pm-docs-site templates; change it through that skill.
//
//   just docs        # http://localhost:4321
//   just docs-check  # unit tests, astro check, astro build

import starlight from '@astrojs/starlight';
`;
const CONFIG_BODY = `import { defineConfig } from 'astro/config';

import { buildSidebar } from './src/sidebar.ts';

export default defineConfig({
	integrations: [
		starlight({
			title: '{{SITE_TITLE}}',
			description: '{{SITE_DESCRIPTION}}',
			sidebar: buildSidebar(),
			plugins: [
				// pm-docs-site modules add their Starlight plugins here.
`;
const CONFIG_TAIL = `			],
		}),
	],
});
`;
const ASTROC4_PLUGIN = `				astroc4({
					// The model stays where it is; its \`@\` image alias works as it is.
					projects: { architecture: '{{SITE_TO_ROOT}}/{{LIKEC4_DIR}}' },
					// Pinned to the LikeC4 the site builds with, so highlighting never
					// changes under a build; \`warn\` keeps an offline build working.
					highlighting: { ref: 'v{{LIKEC4_VERSION}}', onError: 'warn' },
				}),
`;

function templateConfig(architecture: boolean, values: Record<string, string>): string {
  const text = architecture
    ? `${CONFIG_HEAD}import astroc4 from '@purview-dev/astroc4';\n${CONFIG_BODY}${ASTROC4_PLUGIN}${CONFIG_TAIL}`
    : `${CONFIG_HEAD}${CONFIG_BODY}${CONFIG_TAIL}`;
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, name: string) => values[name] ?? match);
}

/** Every path the templates rendered, from references/template-files.md. */
export function templateFiles(skillDir: string): string[] {
  const text = readFileSync(join(skillDir, "references", "template-files.md"), "utf8");
  return [...text.matchAll(/^- `([^`]+)` `(?:[0-9a-f]{64}|none)`$/gm)].map((match) => match[1]!);
}

/** Every file under `dir` outside the generated folders, as `/`-separated paths relative to it. */
function siteFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true, withFileTypes: true }) as any[])
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"))
    .filter((file) => !GENERATED_DIRS.includes(file.split("/")[0]!))
    .sort();
}

/** The `docsSources` array of a template site's src/docs-sources.ts, evaluated as a TS literal. */
async function readSources(path: string): Promise<DocsSource[]> {
  const code = new Bun.Transpiler({ loader: "ts" }).transformSync(readFileSync(path, "utf8").replace(/^import type .*$/gm, ""));
  const dir = mkdtempSync(join(tmpdir(), "pm-docs-site-sources-"));
  try {
    const copy = join(dir, "docs-sources.mjs");
    writeFileSync(copy, code);
    const module = await import(pathToFileURL(copy).href);
    return module.docsSources as DocsSource[];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function inspect(siteDir: string, skillDir: string): Promise<Inspection> {
  const manifestPath = join(siteDir, MANIFEST);
  if (!existsSync(manifestPath)) throw new Error(`No ${MANIFEST} in ${siteDir}: not a template site.`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { modules?: string[]; views?: string[]; values?: Record<string, string> };
  const modules = manifest.modules ?? [];
  const values = manifest.values ?? {};
  const toRoot = values.SITE_TO_ROOT ?? "..";

  const options: ConsumerOptions = { title: values.SITE_TITLE ?? basename(siteDir) };
  if (values.SITE_DESCRIPTION) options.description = values.SITE_DESCRIPTION;
  const planning = `${toRoot}/${values.PM_ROOT ?? "planning/"}planning.json`;
  if (planning !== DEFAULT_PLANNING) options.planning = planning;
  const sourcesPath = join(siteDir, "src", "docs-sources.ts");
  if (modules.includes("repo-docs") && existsSync(sourcesPath)) options.docs = { root: toRoot, sources: await readSources(sourcesPath) };
  if (manifest.views) options.views = manifest.views;
  const architectureDir = modules.includes("architecture") && values.LIKEC4_DIR ? values.LIKEC4_DIR : null;
  if (architectureDir) options.architecture = { project: `${toRoot}/${architectureDir}` };

  const configPath = join(siteDir, "astro.config.mjs");
  const normalise = (text: string) => text.replace(/\r\n/g, "\n").trimEnd();
  const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : null;
  const extraConfig = config !== null && normalise(config) !== normalise(templateConfig(architectureDir !== null, values)) ? config : null;

  const inventory = new Set(templateFiles(skillDir));
  const present = siteFiles(siteDir);
  return {
    listed: present.filter((file) => inventory.has(file) && file !== MANIFEST && !CONSUMER_FILES.includes(file)),
    unlisted: present.filter((file) => !inventory.has(file) && !CONSUMER_FILES.includes(file)),
    options,
    extraConfig,
    architectureDir,
  };
}

const quote = (text: string) => `'${text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;

/** A value as a one-line JS literal: single quotes, unquoted keys. */
function literal(value: unknown): string {
  if (typeof value === "string") return quote(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return `{ ${entries.map(([key, item]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key)}: ${literal(item)}`).join(", ")} }`;
  }
  return String(value);
}

/** The consumer's astro.config.ts; `extra` goes verbatim beside pmDocsSite(...) in `integrations`. */
export function renderAstroConfig(options: ConsumerOptions, extra?: string): string {
  const lines = [`\t\t\ttitle: ${quote(options.title)},`];
  if (options.description !== undefined) lines.push(`\t\t\tdescription: ${quote(options.description)},`);
  if (options.planning !== undefined) lines.push(`\t\t\tplanning: ${quote(options.planning)},`);
  if (options.docs) {
    lines.push("\t\t\tdocs: {", `\t\t\t\troot: ${quote(options.docs.root)},`, "\t\t\t\tsources: [");
    for (const source of options.docs.sources) lines.push(`\t\t\t\t\t${literal(source)},`);
    lines.push("\t\t\t\t],", "\t\t\t},");
  }
  if (options.views) lines.push(`\t\t\tviews: ${literal(options.views)},`);
  if (options.architecture) lines.push(`\t\t\tarchitecture: ${literal(options.architecture)},`);
  const integrations = ["\t\tpmDocsSite({", ...lines, "\t\t}),"];
  if (extra?.trim()) {
    const carried = extra.trim().split(/\r?\n/).map((line) => `\t\t${line}`);
    if (!carried[carried.length - 1]!.endsWith(",")) carried[carried.length - 1] += ",";
    integrations.push(...carried);
  }
  return [
    "import { defineConfig } from 'astro/config';",
    "import pmDocsSite from '@purview-dev/pm-docs-site';",
    "",
    "export default defineConfig({",
    "\tintegrations: [",
    ...integrations,
    "\t],",
    "});",
    "",
  ].join("\n");
}

const SCRIPTS = { dev: "pm-docs-site dev", build: "pm-docs-site build", preview: "astro preview", check: "pm-docs-site check" };

/** Rewrite (or create) package.json for a package site: no dependencies, the CLI's scripts, every other field kept. */
function writePackage(siteDir: string): void {
  const path = join(siteDir, "package.json");
  const text = existsSync(path) ? readFileSync(path, "utf8") : null;
  const existing = text ? (JSON.parse(text) as Record<string, unknown>) : { name: basename(siteDir).toLowerCase().replace(/[^a-z0-9._-]+/g, "-"), private: true, type: "module" };
  const pkg: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(existing)) {
    if (key === "dependencies" || key === "devDependencies") continue;
    pkg[key] = key === "scripts" ? SCRIPTS : value;
  }
  pkg.scripts ??= SCRIPTS;
  const indent = text && !/^\t/m.test(text) ? 2 : "\t";
  writeFileSync(path, `${JSON.stringify(pkg, null, indent)}\n`);
}

/** Delete one site file, then each parent folder it leaves empty, up to the site root. */
function remove(siteDir: string, file: string): void {
  rmSync(join(siteDir, file));
  for (let dir = dirname(join(siteDir, file)); resolve(dir) !== resolve(siteDir); dir = dirname(dir)) {
    if (readdirSync(dir).length) break;
    rmdirSync(dir);
  }
}

export async function migrate(siteDir: string, skillDir: string, includeUnlisted = false): Promise<{ removed: string[]; inspection: Inspection }> {
  const inspection = await inspect(siteDir, skillDir);
  if (inspection.unlisted.length && !includeUnlisted) return { removed: [], inspection };
  const removed = [...inspection.listed, ...(includeUnlisted ? inspection.unlisted : []), MANIFEST];
  for (const file of removed) remove(siteDir, file);
  writeFileSync(join(siteDir, "astro.config.ts"), renderAstroConfig(inspection.options));
  writePackage(siteDir);
  return { removed, inspection };
}

export function write(siteDir: string, options: ConsumerOptions): string[] {
  mkdirSync(siteDir, { recursive: true });
  writeFileSync(join(siteDir, "astro.config.ts"), renderAstroConfig(options));
  writePackage(siteDir);
  const written = ["astro.config.ts", "package.json"];
  if (!existsSync(join(siteDir, ".gitignore"))) {
    writeFileSync(join(siteDir, ".gitignore"), GITIGNORE);
    written.push(".gitignore");
  }
  return written;
}

if (import.meta.main) {
  const [command, site, ...rest] = process.argv.slice(2);
  const usage = "usage: bun consumer.ts inspect <site> | migrate <site> [--include-unlisted] | write <site> --options <json>";
  if (!site || !["inspect", "migrate", "write"].includes(command ?? "")) {
    console.error(usage);
    process.exit(2);
  }
  const siteDir = resolve(site);
  const skillDir = join(import.meta.dir, "..");
  try {
    if (command === "inspect") {
      console.log(JSON.stringify(await inspect(siteDir, skillDir), null, 2));
    } else if (command === "write") {
      const json = rest[rest.indexOf("--options") + 1];
      if (!rest.includes("--options") || !json) throw new Error(usage);
      for (const file of write(siteDir, JSON.parse(json) as ConsumerOptions)) console.log(`wrote: ${file}`);
    } else {
      const { removed, inspection } = await migrate(siteDir, skillDir, rest.includes("--include-unlisted"));
      if (!removed.length) {
        console.error(`${inspection.unlisted.length} files in ${site} are not template files; nothing was deleted:`);
        for (const file of inspection.unlisted) console.error(`unlisted: ${file}`);
        console.error("Move them, or run again with --include-unlisted to delete them too.");
        process.exit(1);
      }
      const prefix = relative(process.cwd(), siteDir).split(sep).join("/");
      for (const file of removed) console.log(`removed: ${file}`);
      console.log("wrote: astro.config.ts\nwrote: package.json");
      console.log(`Note: a hand edit to a removed file is lost; recover it with git show HEAD:./${prefix ? `${prefix}/` : ""}<path>.`);
      if (inspection.extraConfig !== null) {
        console.log("Note: astro.config.mjs held more than the template; carry the extra integrations and options into astro.config.ts:");
        console.log(inspection.extraConfig);
      }
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
