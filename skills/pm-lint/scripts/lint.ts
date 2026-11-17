// pm-lint's script: check and fix the format of every file in the PM root.
//
//   bun <skill>/scripts/lint.ts check [<path>...] [--staged] [--root <dir>] [--pm-root <dir>] [--format text|json] [--strict] [--no-export]
//   bun <skill>/scripts/lint.ts fix   [<path>...] [--staged] [--root <dir>] [--pm-root <dir>]
//   bun <skill>/scripts/lint.ts rules
//   bun <skill>/scripts/lint.ts hook  [lefthook | husky | git]
//
// `check` is read-only. `fix` rewrites only what a fixable rule names (see
// references/rules.md) and never changes a value's meaning. Paths outside the
// PM root are ignored, so a hook can pass every staged file.
// Exit codes: 0 clean (warnings allowed unless --strict), 1 findings, 2 usage.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { checkFormat, fixFormat } from "./format.ts";
import { RULE, RULES, type Severity } from "./rules.ts";
import { buildContext, checkStructure, fixStructure, kindOf } from "./structure.ts";

export interface Finding {
  /** Repository-relative path, `/`-separated. */
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  message: string;
  fixable: boolean;
}

export interface LintOptions {
  root: string;
  pmRoot: string;
  /** PM-root-relative paths to report on; all PM files when missing. */
  targets?: string[];
  /** File contents to use instead of the working tree (the staged versions), by PM-root-relative path. */
  contents?: Map<string, string>;
  /** Skip the export rules (pm-export's build and schema). */
  noExport?: boolean;
}

const toPosix = (path: string) => path.split(sep).join("/");

/** The PM root named in the agent instructions (`- PM state directory: \`planning/\``), else `planning/`. */
export function detectPmRoot(root: string): string {
  for (const file of ["AGENTS.md", "CLAUDE.md"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const match = /PM state directory:\s*`([^`]+)`/.exec(readFileSync(path, "utf8"));
    if (match) return normalisePmRoot(match[1]!);
  }
  return "planning/";
}

export const normalisePmRoot = (pmRoot: string) => pmRoot.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/*$/, "/");

/** Every Markdown file the PM skills write, and the export: the top level, inbox/, briefs/, and research/. */
export function pmFiles(root: string, pmRoot: string): string[] {
  const dir = join(root, pmRoot);
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name.endsWith(".md") || entry.name === "planning.json")) out.push(entry.name);
    if (entry.isDirectory() && ["inbox", "briefs", "research"].includes(entry.name)) {
      for (const file of readdirSync(join(dir, entry.name))) if (file.endsWith(".md")) out.push(`${entry.name}/${file}`);
    }
  }
  return out.sort();
}

function git(root: string, ...args: string[]): string | null {
  try {
    const result = Bun.spawnSync(["git", "-C", root, ...args], { stdout: "pipe", stderr: "pipe" });
    return result.exitCode === 0 ? result.stdout.toString() : null;
  } catch {
    return null;
  }
}

/** The staged PM files (added, copied, modified, renamed) and their staged contents. */
export function staged(root: string, pmRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  const names = git(root, "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z", "--", pmRoot) ?? "";
  for (const path of names.split("\0").filter(Boolean)) {
    const rel = path.slice(pmRoot.length);
    if (!(rel.endsWith(".md") || rel === "planning.json")) continue;
    const text = git(root, "show", `:${path}`);
    if (text !== null) out.set(rel, text);
  }
  return out;
}

/** A path given on the command line, as PM-root-relative, or null when it is outside the PM root. */
export function toPmRelative(root: string, pmRoot: string, path: string): string | null {
  const absolute = isAbsolute(path) ? path : resolve(root, path);
  const rel = toPosix(relative(join(root, pmRoot), absolute));
  return rel.startsWith("..") || rel === "" ? null : rel;
}

const sibling = (skill: string, file: string) => join(import.meta.dir, "..", "..", skill, "scripts", file);

export async function lint(options: LintOptions): Promise<Finding[]> {
  const { root, pmRoot } = options;
  const all = pmFiles(root, pmRoot);
  const files = new Map<string, string>();
  for (const rel of all) files.set(rel, readFileSync(join(root, pmRoot, rel), "utf8"));
  for (const [rel, text] of options.contents ?? []) files.set(rel, text);
  const targets = new Set(options.targets ?? [...files.keys()]);
  const findings: Finding[] = [];
  const add = (rel: string, line: number, rule: string, message: string) => {
    const entry = RULE.get(rule);
    if (!entry) throw new Error(`pm-lint: unknown rule ${rule}`);
    findings.push({ file: `${pmRoot}${rel}`, line, severity: entry.severity, rule, message, fixable: entry.fixable });
  };

  for (const rel of targets) {
    const text = files.get(rel);
    if (text === undefined || !rel.endsWith(".md")) continue;
    for (const issue of checkFormat(text)) add(rel, issue.line, issue.rule, issue.message);
  }
  const context = buildContext(files);
  for (const finding of checkStructure(context)) if (targets.has(finding.file)) add(finding.file, finding.line, finding.rule, finding.message);

  // The export rules use pm-export's own code when it is installed beside this skill.
  if (!options.noExport && existsSync(sibling("pm-export", "schema.ts"))) {
    const { validate, formatErrors } = await import(sibling("pm-export", "schema.ts"));
    const schemaPath = join(import.meta.dir, "..", "..", "pm-export", "references", "planning.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    const structured = [...targets].some((rel) => rel.endsWith(".md") && kindOf(rel) !== "markdown");
    // Only when the structure rules pass: the export catches what they miss, not what they already report.
    const structureErrors = findings.some((f) => f.severity === "error" && !f.rule.startsWith("format/"));
    if (structured && files.has("config.md") && !structureErrors) {
      try {
        const { build } = await import(sibling("pm-export", "planning.ts"));
        const { document } = build({ root, pmRoot, branch: null, head: null });
        for (const line of formatErrors(validate(document, schema)) as string[]) add("", 0, "export/build", `The export would not match the schema: ${line}`);
      } catch (error) {
        add("", 0, "export/build", `The export could not be built: ${(error as Error).message}`);
      }
    }
    if (targets.has("planning.json") && files.has("planning.json")) {
      try {
        const own = join(root, pmRoot, "planning.schema.json");
        const fileSchema = existsSync(own) ? JSON.parse(readFileSync(own, "utf8")) : schema;
        for (const line of formatErrors(validate(JSON.parse(files.get("planning.json")!), fileSchema)) as string[]) add("planning.json", 1, "export/file", line);
      } catch (error) {
        add("planning.json", 1, "export/file", `planning.json is not valid JSON (${(error as Error).message}).`);
      }
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
}

/** Fix the target Markdown files in place. Returns the PM-root-relative paths it changed. */
export function fix(options: LintOptions): string[] {
  const { root, pmRoot } = options;
  const changed: string[] = [];
  for (const rel of options.targets ?? pmFiles(root, pmRoot)) {
    if (!rel.endsWith(".md")) continue;
    const path = join(root, pmRoot, rel);
    if (!existsSync(path)) continue;
    const original = readFileSync(path, "utf8");
    const crlf = original.includes("\r\n");
    const fixed = fixFormat(fixStructure(rel, original.replace(/\r\n/g, "\n")));
    const written = crlf ? fixed.replace(/\n/g, "\r\n") : fixed;
    if (written !== original) {
      writeFileSync(path, written);
      changed.push(rel);
    }
  }
  return changed;
}

export function report(findings: Finding[], format: "text" | "json"): string {
  if (format === "json") return JSON.stringify(findings, null, 2);
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;
  const fixable = findings.filter((f) => f.fixable).length;
  const lines = findings.map((f) => `${f.file}${f.line ? `:${f.line}` : ""}  ${f.severity.padEnd(7)}  ${f.rule}  ${f.message}`);
  const files = new Set(findings.map((f) => f.file)).size;
  lines.push(
    findings.length
      ? `pm-lint: ${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"} in ${files} file${files === 1 ? "" : "s"}${fixable ? ` (${fixable} fixable: run pm-lint fix)` : ""}`
      : "pm-lint: clean",
  );
  return lines.join("\n");
}

/** Hook configuration that runs this script before every commit. */
export function hookSnippet(kind: string, root: string): string | null {
  const script = toPosix(relative(root, join(import.meta.dir, "lint.ts")));
  const path = script.startsWith("..") ? toPosix(join(import.meta.dir, "lint.ts")) : script;
  const note = script.startsWith("..")
    ? "# pm-lint is installed outside this repository; this path works on this machine only.\n# Install the skills into the repository (npx skills add) for a path every clone shares.\n"
    : "";
  switch (kind) {
    case "lefthook":
      return `${note}# .config/lefthook.yml or lefthook.yml: lint the staged PM files before each commit.
pre-commit:
  jobs:
    - name: pm-lint
      run: bun ${path} check --staged
      # Or fix what it can and re-stage it:
      # run: bun ${path} fix --staged && bun ${path} check --staged
      # stage_fixed: true
`;
    case "husky":
      return `${note}# .husky/pre-commit
bun ${path} check --staged
`;
    case "git":
      return `${note}#!/bin/sh
# .git/hooks/pre-commit (make it executable: chmod +x .git/hooks/pre-commit)
exec bun ${path} check --staged
`;
    default:
      return null;
  }
}

export async function main(argv: string[]): Promise<number> {
  const [command = "", ...rest] = argv;
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    if (!arg.startsWith("--")) positional.push(arg);
    else if (["--root", "--pm-root", "--format"].includes(arg)) flags.set(arg, rest[++i] ?? "");
    else flags.set(arg, true);
  }
  const root = resolve(String(flags.get("--root") ?? "."));
  const pmFlag = flags.get("--pm-root");
  const pmRoot = typeof pmFlag === "string" && pmFlag ? normalisePmRoot(pmFlag) : detectPmRoot(root);

  if (command === "rules") {
    console.log(RULES.map((r) => `${r.id.padEnd(28)} ${r.severity.padEnd(7)} ${r.fixable ? "fix" : "   "}  ${r.summary}`).join("\n"));
    return 0;
  }
  if (command === "hook") {
    const snippet = hookSnippet(positional[0] ?? "lefthook", root);
    if (!snippet) {
      console.error("usage: bun lint.ts hook [lefthook | husky | git]");
      return 2;
    }
    process.stdout.write(snippet);
    return 0;
  }
  if (command !== "check" && command !== "fix") {
    console.error(`usage: bun lint.ts <check | fix | rules | hook> [<path>...] [--staged] [--root <dir>] [--pm-root <dir>] [--format text|json] [--strict] [--no-export]`);
    return 2;
  }
  if (!existsSync(join(root, pmRoot, "config.md"))) {
    console.log(`pm-lint: no ${pmRoot}config.md; nothing to lint.`);
    return 0;
  }

  let contents: Map<string, string> | undefined;
  let targets: string[] | undefined;
  if (flags.has("--staged")) {
    contents = staged(root, pmRoot);
    targets = [...contents.keys()];
    if (!targets.length) {
      console.log("pm-lint: no PM files staged");
      return 0;
    }
  }
  if (positional.length) {
    const given = positional.map((path) => toPmRelative(root, pmRoot, path)).filter((rel): rel is string => rel !== null);
    targets = targets ? targets.filter((rel) => given.includes(rel)) : given;
    if (!targets.length) {
      console.log("pm-lint: no PM files given");
      return 0;
    }
  }

  if (command === "fix") {
    const changed = fix({ root, pmRoot, targets });
    for (const rel of changed) console.log(`fixed: ${pmRoot}${rel}`);
    // After a fix the working tree is the truth, also under --staged.
    contents = undefined;
  }
  const findings = await lint({ root, pmRoot, targets, contents, noExport: flags.has("--no-export") });
  const format = flags.get("--format") === "json" ? "json" : "text";
  console.log(report(findings, format));
  const failing = findings.filter((f) => f.severity === "error" || flags.has("--strict"));
  return failing.length ? 1 : 0;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
