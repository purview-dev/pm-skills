// pm-help's context report: estimated tokens each session type loads.
//
//   bun <pm-help skill>/scripts/context.ts [--root <dir>] [--pm-root <dir>] [--format text|json]
//
// Read-only: it never writes a file and never runs git. Estimated tokens are
// characters / 4 (ADR-008). The session map is ../references/sessions.json.
// Exit codes: 0 report (missing skills or files included), 2 usage or an invalid map.

import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { MapError, type SessionId, type SessionMap, type SessionSpec, loadMap } from "./map.ts";
import { agentFiles, agentSections, type Contributor, countChars, findSkill, followReferences, readText, toTokens } from "./sources.ts";

export interface SessionReport {
  id: SessionId;
  chars: number;
  tokens: number;
  tokensWithoutHandoff?: number;
  contributors: Contributor[];
  missing: string[];
}

export interface TidyEntry {
  file: string;
  chars: number;
  limit: number;
}

export interface Report {
  version: 1;
  date: string;
  sessions: SessionReport[];
  tidy: TidyEntry[];
}

export interface ReportOptions {
  root: string;
  pmRoot: string;
  home: string;
  map: SessionMap;
  date: string;
}

const toPosix = (path: string) => path.split(sep).join("/");

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

/** A repository-relative name, or `~/...` for a file under the home folder. */
export function nameOf(path: string, root: string, home: string): string {
  const inRoot = relative(root, path);
  if (!inRoot.startsWith("..") && !isAbsolute(inRoot)) return toPosix(inRoot);
  return `~/${toPosix(relative(home, path))}`;
}

const contributor = (name: string, text: string, partial = false, handoff = false): Contributor => {
  const chars = countChars(text);
  return { name, chars, tokens: toTokens(chars), partial, ...(handoff ? { handoff: true } : {}) };
};

const markdownIn = (dir: string, keep: (file: string) => boolean): string[] =>
  existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith(".md") && keep(file)).sort().map((file) => join(dir, file)) : [];

/** The handoff skill named for a stage in the config.md Handoffs table. */
function handoffSkill(configText: string, stage: string): string | null {
  const row = new RegExp(`^\\|\\s*${stage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*\`([^\`]+)\``, "m").exec(configText);
  return row ? row[1]! : null;
}

const field = (text: string, name: string): string => new RegExp(`^- ${name}:[ \\t]*(.*)$`, "m").exec(text)?.[1]?.trim() ?? "";

/** The brief of the first Next item pm-next could take: Owner agent or both, Status ready or paused. */
function nextBrief(roadmap: string): string {
  const next = roadmap.split(/^## Later/m)[0]!.split(/^## Next/m)[1] ?? "";
  for (const block of next.split(/^### /m).slice(1)) {
    const owner = field(block, "Owner") || "agent";
    const status = field(block, "Status");
    if ((owner === "agent" || owner === "both") && (status === "ready" || status === "paused")) return field(block, "Brief");
  }
  return "";
}

/** The brief a session reads, as a repository-relative path, or "". */
function briefFor(id: SessionId, pm: string): string {
  const now = existsSync(join(pm, "NOW.md")) ? readText(join(pm, "NOW.md")) : "";
  const roadmap = existsSync(join(pm, "ROADMAP.md")) ? readText(join(pm, "ROADMAP.md")) : "";
  const nowBrief = field(now, "Brief");
  if (id === "claim") return field(now, "Status") === "active" ? nowBrief : nextBrief(roadmap);
  return nowBrief || nextBrief(roadmap);
}

function buildSession(spec: SessionSpec, opts: ReportOptions, agents: string[]): SessionReport {
  const { root, home } = opts;
  const pm = join(root, opts.pmRoot);
  const contributors: Contributor[] = [];
  const missing: string[] = [];
  const add = (path: string, partial = false, handoff = false) => {
    const name = nameOf(path, root, home);
    if (contributors.some((c) => c.name === name)) return;
    try {
      contributors.push(contributor(name, readText(path), partial, handoff));
    } catch {
      missing.push(`unreadable ${name}`);
    }
  };

  if (spec.agentFile) {
    for (const path of agents) contributors.push(...agentSections(nameOf(path, root, home), readText(path)));
  } else {
    for (const path of agents) add(path);
    const skillFiles: string[] = [];
    for (const skill of spec.skills ?? []) {
      const dir = findSkill(skill, root, home);
      if (dir === null) missing.push(`skill ${skill}`);
      else skillFiles.push(join(dir, "SKILL.md"));
    }
    for (const path of skillFiles) add(path);
    const refs = followReferences([...agents, ...skillFiles], root, home);
    for (const path of refs.files) add(path);
    missing.push(...refs.missing.map((path) => `reference ${nameOf(path, root, home)}`));

    for (const file of spec.pmFiles ?? []) if (existsSync(join(pm, file))) add(join(pm, file));
    for (const file of spec.partial ?? []) if (existsSync(join(pm, file))) add(join(pm, file), true);
    if (spec.brief) {
      const brief = briefFor(spec.id, pm);
      if (brief && isFile(join(root, brief))) add(join(root, brief));
    }
    if (spec.decisions) for (const path of markdownIn(join(pm, "decisions"), (f) => /^ADR-/.test(f))) add(path, true);
    if (spec.inbox) for (const path of markdownIn(join(pm, "inbox"), (f) => f !== "README.md")) add(path);
    if (spec.handoff) {
      const config = existsSync(join(pm, "config.md")) ? readText(join(pm, "config.md")) : "";
      const skill = handoffSkill(config, spec.handoff);
      if (skill !== null) {
        const dir = findSkill(skill, root, home);
        if (dir === null) missing.push(`handoff ${skill} not installed`);
        else add(join(dir, "SKILL.md"), false, true);
      }
    }
  }

  contributors.sort((a, b) => b.chars - a.chars || a.name.localeCompare(b.name));
  const chars = contributors.reduce((sum, c) => sum + c.chars, 0);
  const handoffChars = contributors.filter((c) => c.handoff).reduce((sum, c) => sum + c.chars, 0);
  return {
    id: spec.id,
    chars,
    tokens: toTokens(chars),
    ...(handoffChars > 0 ? { tokensWithoutHandoff: toTokens(chars - handoffChars) } : {}),
    contributors,
    missing,
  };
}

function tidyEntries(opts: ReportOptions): TidyEntry[] {
  const pm = join(opts.root, opts.pmRoot);
  const checks: [string, number][] = [
    [join(pm, "LOG.md"), opts.map.tidy["LOG.md"]],
    [join(pm, "ROADMAP.md"), opts.map.tidy["ROADMAP.md"]],
    ...markdownIn(join(pm, "briefs"), (f) => f !== "README.md").map((path): [string, number] => [path, opts.map.tidy.brief]),
  ];
  const out: TidyEntry[] = [];
  for (const [path, limit] of checks) {
    if (!existsSync(path)) continue;
    const chars = countChars(readText(path));
    if (chars >= limit) out.push({ file: nameOf(path, opts.root, opts.home), chars, limit });
  }
  return out;
}

/** The report for every session in the map. */
export function buildReport(opts: ReportOptions): Report {
  const agents = agentFiles(opts.root);
  return {
    version: 1,
    date: opts.date,
    sessions: opts.map.sessions.map((spec) => buildSession(spec, opts, agents)),
    tidy: tidyEntries(opts),
  };
}

const thousands = (n: number) => n.toLocaleString("en-GB");
const hundreds = (n: number) => thousands(Math.round(n / 100) * 100);

/** The report as Markdown: one row per session with its three largest contributors. */
export function renderText(report: Report): string {
  const rows = report.sessions.map((s) => {
    const top = [...s.contributors]
      .sort((a, b) => b.chars - a.chars || a.name.localeCompare(b.name))
      .slice(0, 3)
      .map((c) => `${c.partial ? "≤ " : ""}${c.handoff ? "handoff: " : ""}${c.name} ${hundreds(c.tokens)}`)
      .join("; ");
    return `| ${s.id} | ${hundreds(s.tokens)} | ${top} |`;
  });
  const pmState =
    report.tidy.length === 0
      ? "- PM state: no tidy needed"
      : `- Tidy recommended: ${report.tidy.map((t) => `${t.file} ${thousands(t.chars)} characters (limit ${thousands(t.limit)})`).join("; ")}`;
  return [
    `## Context ${report.date}`,
    "",
    "| Session | Est. tokens | Largest |",
    "| --- | --- | --- |",
    ...rows,
    "",
    ...report.sessions.filter((s) => s.missing.length > 0).map((s) => `- Missing: ${s.id}: ${s.missing.join(", ")}`),
    pmState,
    "- Estimated tokens are characters / 4; ≤ marks files read in part, counted whole.",
    "",
  ].join("\n");
}

/** Copied from pm-lint's lint.ts: skills install separately, so one skill's script never imports another's. */
export const normalisePmRoot = (pmRoot: string) => pmRoot.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/*$/, "/");

/** The PM root named in the agent instructions (`- PM state directory: \`planning/\``), else `planning/`. */
export function detectPmRoot(root: string): string {
  for (const file of ["AGENTS.md", "CLAUDE.md"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const match = /PM state directory:\s*`([^`]+)`/.exec(readText(path));
    if (match) return normalisePmRoot(match[1]!);
  }
  return "planning/";
}

const USAGE = "usage: context.ts [--root <dir>] [--pm-root <dir>] [--format text|json]";

/** The CLI. `mapPath` replaces the shipped sessions.json (tests). */
export function main(argv: string[], env: { cwd: string; home: string; mapPath?: string } = { cwd: process.cwd(), home: homedir() }): { code: 0 | 2; out: string } {
  let root = env.cwd;
  let pmRoot: string | null = null;
  let format = "text";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const value = argv[i + 1];
    if ((arg === "--root" || arg === "--pm-root" || arg === "--format") && value === undefined) return { code: 2, out: `${arg} needs a value\n${USAGE}` };
    if (arg === "--root") root = resolve(env.cwd, value!);
    else if (arg === "--pm-root") pmRoot = normalisePmRoot(value!);
    else if (arg === "--format") format = value!;
    else return { code: 2, out: `unknown argument ${arg}\n${USAGE}` };
    i++;
  }
  if (format !== "text" && format !== "json") return { code: 2, out: `unknown format ${format}\n${USAGE}` };
  let map: SessionMap;
  try {
    map = env.mapPath ? loadMap(env.mapPath) : loadMap();
  } catch (error) {
    if (error instanceof MapError) return { code: 2, out: `invalid session map: ${error.message}` };
    throw error;
  }
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const report = buildReport({ root, pmRoot: pmRoot ?? detectPmRoot(root), home: env.home, map, date });
  return { code: 0, out: format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderText(report) };
}

if (import.meta.main) {
  const { code, out } = main(process.argv.slice(2));
  (code === 0 ? process.stdout : process.stderr).write(out.endsWith("\n") ? out : `${out}\n`);
  process.exit(code);
}
