// Build the pm-export document (schemaVersion 5) from the Markdown PM state.
//
// This file is the field map in pm-export's SKILL.md, as code: the same
// input always gives the same output, so every project gets one export
// format instead of an agent re-deriving it on every run. It reads the PM
// root, the plan named in NOW.md, and git; it writes nothing.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const SCHEMA_VERSION = 6;

/** The schema this exporter writes, shipped beside it. */
export const SCHEMA_PATH = join(import.meta.dir, "..", "references", "planning.schema.json");

export interface BuildOptions {
  /** The repository (or worktree) root. PM paths resolve inside it. */
  root: string;
  /** The PM root, repository-relative, with a trailing slash. Default: from AGENTS.md or CLAUDE.md, else `planning/`. */
  pmRoot?: string;
  /** The export time. Default: now. */
  now?: Date;
  /** Date-dependent values (board window, review due) use this day. Default: the local date of `now`. */
  today?: string;
  /** The branch to report and to test drift against. Default: `git branch --show-current`. */
  branch?: string | null;
  /** The commit to report. Default: `git rev-parse HEAD`. */
  head?: string | null;
  /** The skills version. Default: the marker in pm-setup's AGENTS-section.md beside this skill. */
  skillsVersion?: number;
}

export interface BuildResult {
  document: Record<string, any>;
  /** Facts the export could not read and filled with null or a default: the skill's `Assumption:` lines. */
  assumptions: string[];
  pmRoot: string;
}

// ---------------------------------------------------------------- Markdown

interface Section {
  heading: string;
  body: string;
}

/** HTML comments hold the templates' examples, never state. */
export const stripComments = (text: string) => text.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");

/** A fenced code block: an opening fence of 3+ backticks or tildes, up to its closing fence or the end of the text. */
const FENCE = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[`~]*[ \t]*(?:\n|$)|(?![\s\S]))/gm;

/** Like stripComments, but an HTML comment inside a code span or fenced block is kept: ADR sections export verbatim (ADR-002). */
export function stripCommentsOutsideCode(text: string): string {
  const clean = text.replace(/\r\n/g, "\n");
  // A code span never crosses a blank line (CommonMark), so a stray backtick cannot shield a later comment.
  const prose = (part: string) => part.replace(/(`+)(?:(?!\n[ \t]*\n)[\s\S])*?\1|<!--[\s\S]*?-->/g, (match) => (match.startsWith("<!--") ? "" : match));
  let out = "";
  let at = 0;
  for (const fence of clean.matchAll(FENCE)) {
    out += prose(clean.slice(at, fence.index)) + fence[0];
    at = fence.index + fence[0].length;
  }
  return out + prose(clean.slice(at));
}

/** Split on headings of exactly `level` `#`s. The text before the first is `""`. */
export function sections(text: string, level: number): Section[] {
  const marker = "#".repeat(level) + " ";
  const out: Section[] = [{ heading: "", body: "" }];
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (!fenced && line.startsWith(marker)) out.push({ heading: line.slice(marker.length).trim(), body: "" });
    else out[out.length - 1]!.body += line + "\n";
  }
  return out;
}

const find = (list: Section[], test: RegExp) => list.find((section) => test.test(section.heading));

/** Top-level `- ` bullets, each with its indented continuation lines joined by a space. */
export function bullets(body: string): string[] {
  const out: string[] = [];
  let open = false;
  for (const line of body.split("\n")) {
    if (/^[-*] /.test(line)) {
      out.push(line.slice(2).trim());
      open = true;
    } else if (open && /^\s+[-*] /.test(line)) {
      // A nested bullet belongs to its parent but is not part of its text.
    } else if (open && /^\s+\S/.test(line)) {
      out[out.length - 1] += " " + line.trim();
    } else {
      open = false;
    }
  }
  return out.filter((text) => text !== "");
}

/** `- Key: value` bullets as a map of lower-case keys. A bullet without a colon is skipped. */
export function fields(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const bullet of bullets(body)) {
    const match = /^([^:]+?):\s*(.*)$/.exec(bullet);
    if (match && !map.has(match[1]!.trim().toLowerCase())) map.set(match[1]!.trim().toLowerCase(), match[2]!.trim());
  }
  return map;
}

/** A template placeholder (`[M1]`, `<path>`) or an empty value is not a value. */
export function value(text: string | undefined | null): string | null {
  const trimmed = text?.trim() ?? "";
  if (trimmed === "" || /^\[[^\]]*\]$/.test(trimmed) || /^<[^>]*>$/.test(trimmed)) return null;
  return trimmed;
}

/** As `value`, and `none` is null too. */
const optional = (text: string | undefined | null) => {
  const result = value(text);
  return result === null || /^none\.?$/i.test(result) ? null : result;
};

/** A comma-separated list; `none` is empty. */
const list = (text: string | undefined | null) => {
  const result = optional(text);
  return result === null ? [] : result.split(",").map((part) => part.trim()).filter((part) => part !== "");
};

const ids = (text: string | null | undefined) => [...new Set((text ?? "").match(/\bR-\d{3,}\b/g) ?? [])];

/** Paragraph or bullet text of a section, as one line per paragraph, without placeholders. */
function prose(body: string | undefined): string | null {
  if (body === undefined) return null;
  const items = bullets(body);
  if (items.length) return value(items.join(" "));
  return value(body.split("\n").map((line) => line.trim()).filter(Boolean).join(" "));
}

/** The first non-empty line of a section, without a list marker. */
function firstLine(body: string | undefined): string | null {
  const line = body?.split("\n").map((text) => text.trim()).find((text) => text !== "");
  return value(line?.replace(/^[-*] /, ""));
}

// ---------------------------------------------------------------- ADRs

export type AdrStatus = "proposed" | "accepted" | "deprecated" | "superseded";

/** One ADR in `<PM root>/decisions/`, whole: the four sections are the Markdown under each heading (ADR-002). */
export interface Adr {
  id: string;
  path: string;
  title: string;
  status: AdrStatus | null;
  supersededBy: string | null;
  date: string | null;
  category: string | null;
  supersedes: string | null;
  item: string | null;
  source: string | null;
  context: string | null;
  decision: string | null;
  alternatives: string | null;
  consequences: string | null;
}

const ADR_FILE = /^(ADR-\d{3,})-.+\.md$/;
const ADR_STATUSES: readonly AdrStatus[] = ["proposed", "accepted", "deprecated", "superseded"];

/** A section's Markdown without its surrounding blank lines; `null` when the heading is missing. */
const sectionText = (parts: Section[], name: string): string | null => {
  const part = parts.find((section) => section.heading.toLowerCase() === name);
  return part ? part.body.replace(/^\s*\n/, "").replace(/\s+$/, "") : null;
};

/** One `##` section of a brief or inbox file: its heading and its Markdown, verbatim (ADR-016). */
export interface RecordSection {
  heading: string;
  markdown: string;
}

/**
 * Every `##` section after the header block, in file order, each body trimmed
 * as `sectionText` trims it. HTML comments go outside code and stay inside it,
 * and a `## ` line inside a fence is not a heading (ADR-016).
 */
export function recordSections(text: string): RecordSection[] {
  return sections(stripCommentsOutsideCode(text), 2)
    .slice(1)
    .map((part) => ({ heading: part.heading, markdown: part.body.replace(/^\s*\n/, "").replace(/\s+$/, "") }));
}

/**
 * One ADR file as an export object; `null` for a file that is not `ADR-NNN-<slug>.md`.
 * The ID is the file name's, so a heading naming another ID never duplicates one
 * (it is reported through `assume`; pm-lint's `adr/id` flags it). Sections keep
 * HTML comments inside code.
 */
export function parseAdr(file: string, text: string, pmRoot: string, assume?: (text: string) => void): Adr | null {
  const named = ADR_FILE.exec(file);
  if (!named) return null;
  const clean = stripComments(text);
  const heading = /^# (.+)$/m.exec(clean)?.[1]?.trim() ?? "";
  const headed = /^(ADR-\d{3,})\s+(.*)$/.exec(heading);
  const id = named[1]!;
  if (headed && headed[1] !== id) assume?.(`${pmRoot}decisions/${file} is headed ${headed[1]}; exported as ${id}.`);
  const f = fields(sections(clean, 2)[0]!.body);
  const parts = sections(stripCommentsOutsideCode(text), 2);
  const rawStatus = (value(f.get("status")) ?? "").toLowerCase();
  const successor = /^superseded by\s+(ADR-\d{3,})/i.exec(rawStatus);
  const status = successor ? "superseded" : (ADR_STATUSES.find((known) => known === rawStatus) ?? null);
  const adrId = (key: string) => /^ADR-\d{3,}$/i.exec(optional(f.get(key)) ?? "")?.[0]?.toUpperCase() ?? null;
  return {
    id,
    path: `${pmRoot}decisions/${file}`,
    title: (headed?.[2] ?? heading).trim(),
    status,
    supersededBy: successor ? successor[1]!.toUpperCase() : null,
    date: value(f.get("date")),
    category: optional(f.get("category"))?.toLowerCase() ?? null,
    supersedes: adrId("supersedes"),
    item: /^R-\d{3,}$/i.exec(optional(f.get("item")) ?? "")?.[0]?.toUpperCase() ?? null,
    source: optional(f.get("source")),
    context: sectionText(parts, "context"),
    decision: sectionText(parts, "decision"),
    alternatives: sectionText(parts, "alternatives"),
    consequences: sectionText(parts, "consequences"),
  };
}

/** ADRs by ID number (file names sort `ADR-1000` before `ADR-200`). */
export const sortAdrs = (adrs: Adr[]): Adr[] => [...adrs].sort((a, b) => Number(a.id.slice(4)) - Number(b.id.slice(4)));

/** The text inside the first pair of backticks, else the whole value. */
const unquote = (text: string | null) => (text ? (/`([^`]+)`/.exec(text)?.[1] ?? text) : null);

const number = (text: string | null | undefined, fallback: number) => {
  const match = /\d+/.exec(text ?? "");
  return match ? Number(match[0]) : fallback;
};

// ---------------------------------------------------------------- Files and git

function git(root: string, ...args: string[]): string | null {
  try {
    const result = Bun.spawnSync(["git", "-C", root, ...args], { stdout: "pipe", stderr: "pipe" });
    return result.exitCode === 0 ? result.stdout.toString().trim() : null;
  } catch {
    return null;
  }
}

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

/** `N` from `<!-- pm-skills:start version=N -->` in pm-setup's reference, installed beside this skill. */
export function installedSkillsVersion(): number | null {
  const path = join(import.meta.dir, "..", "..", "pm-setup", "references", "AGENTS-section.md");
  if (!existsSync(path)) return null;
  const match = /<!-- pm-skills:start version=(\d+) -->/.exec(readFileSync(path, "utf8"));
  return match ? Number(match[1]) : null;
}

/** Local ISO 8601 with offset, the format pm-export writes: `2026-11-17T09:05:00+00:00`. */
export function localIso(date: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`
  );
}

const DAY = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / DAY);
const isDate = (text: string | null) => !!text && /^\d{4}-\d{2}-\d{2}/.test(text) && !Number.isNaN(Date.parse(text.slice(0, 10)));

// ---------------------------------------------------------------- Build

const OWNERS = ["agent", "user", "both"];
const SIZES = ["S", "M", "L"];
const STAGES = ["design", "plan", "execute", "finish"];
const KINDS = ["feature", "bug", "improvement", "question", "inspiration", "tech-debt"];
const SEVERITIES = ["blocker", "major", "minor", "cosmetic"];

export function build(options: BuildOptions): BuildResult {
  const root = options.root;
  const pmRoot = normalisePmRoot(options.pmRoot ?? detectPmRoot(root));
  const pmDir = join(root, pmRoot);
  const assumptions: string[] = [];
  const assume = (text: string) => assumptions.includes(text) || assumptions.push(text);

  const read = (name: string, required = false): string => {
    const path = join(pmDir, name);
    if (existsSync(path)) return stripComments(readFileSync(path, "utf8"));
    if (required) throw new Error(`No ${pmRoot}${name}. Run pm-init.`);
    return "";
  };

  const now = options.now ?? new Date();
  const generatedAt = localIso(now);
  const today = options.today ?? generatedAt.slice(0, 10);

  // config.md
  const config = sections(read("config.md", true), 2);
  const install = fields(find(config, /^Install/i)?.body ?? "");
  const limits = fields(find(config, /^Limits/i)?.body ?? "");
  const commits = fields(find(config, /^Commits/i)?.body ?? "");
  const lastReviewSection = fields(find(config, /^Last review/i)?.body ?? "");
  const rulesVersion = install.has("rules version") ? number(install.get("rules version"), 0) || null : null;
  const nextMax = number(limits.get("max items in next"), 5);
  const cadence = number(limits.get("review cadence"), 7);
  const inboxThreshold = number(limits.get("inbox size that triggers a review prompt"), 10);
  const boardWindow = number(limits.get("board shows items done in the last"), 14);
  const branchPattern = unquote(value(limits.get("branch name pattern")));
  const lastReview = value(lastReviewSection.get("date")) ?? "never";
  if (!limits.has("max items in next")) assume("Max items in Next is missing from config.md; used 5.");

  const branch = options.branch !== undefined ? options.branch : git(root, "branch", "--show-current") || null;
  const head = options.head !== undefined ? options.head : git(root, "rev-parse", "HEAD");
  let defaultBranch = value(commits.get("pm branch"));
  if (!defaultBranch) {
    defaultBranch = branch ?? "main";
    assume(`PM branch is missing from config.md; used ${defaultBranch}.`);
  }

  let skillsVersion = options.skillsVersion ?? installedSkillsVersion();
  if (!skillsVersion) {
    skillsVersion = rulesVersion ?? 1;
    assume(`pm-setup is not installed beside pm-export; skillsVersion is the rules version (${skillsVersion}).`);
  }

  // VISION.md
  const vision = sections(read("VISION.md"), 2);
  const constraints = fields(find(vision, /^Constraints/i)?.body ?? "");
  const visionDoc = {
    problem: prose(find(vision, /^Problem/i)?.body),
    customer: prose(find(vision, /^Customer/i)?.body),
    outcomes: bullets(find(vision, /done when|outcomes/i)?.body ?? "")
      .map((text) => /^(V\d+):\s*(.*)$/.exec(text))
      .filter((match): match is RegExpExecArray => !!match && value(match[2]) !== null)
      .map((match) => ({ id: match[1]!, text: match[2]!.trim() })),
    outOfScope: bullets(find(vision, /out of scope/i)?.body ?? "").map(value).filter((text): text is string => text !== null),
    constraints: {
      timeAvailable: value(constraints.get("time available")),
      budget: value(constraints.get("budget")),
      stack: value(constraints.get("stack")),
    },
  };

  // STRATEGY.md
  const strategy = sections(read("STRATEGY.md"), 2);
  const focus = fields(find(strategy, /^Current focus/i)?.body ?? "");
  const milestones = sections(find(strategy, /^Milestones/i)?.body ?? "", 3)
    .slice(1)
    .map((section) => {
      const match = /^(M\d+)\b[\s:.\-–—]*(.*)$/.exec(section.heading);
      if (!match) return null;
      const f = fields(section.body);
      return {
        id: match[1]!,
        name: match[2]!.trim(),
        serves: list(f.get("serves")),
        exitCriteria: value(f.get("exit criteria")),
        target: optional(f.get("target")),
        status: value(f.get("status")),
      };
    })
    .filter((milestone) => milestone !== null);
  const milestoneRank = (text: string | null) => {
    const id = /^M\d+/.exec(text ?? "")?.[0];
    const index = milestones.findIndex((milestone) => milestone.id === id);
    return index === -1 ? milestones.length : index;
  };

  // `<head>. Key: value. Key: value.` — split on the markers, keeping each value verbatim.
  const markers = (text: string, keys: string[]) => {
    const pattern = new RegExp(`(?:^|\\s)(${keys.join("|")}):\\s*`, "g");
    const found = [...text.matchAll(pattern)];
    const head = (found.length ? text.slice(0, found[0]!.index) : text).trim();
    const out: Record<string, string | null> = {};
    found.forEach((match, i) => {
      const end = i + 1 < found.length ? found[i + 1]!.index : text.length;
      out[match[1]!.toLowerCase()] = value(text.slice(match.index! + match[0].length, end));
    });
    return { head, values: out };
  };
  const listOf = (heading: RegExp) => bullets(find(strategy, heading)?.body ?? "").filter((text) => value(text) !== null);

  const bets = listOf(/^Bets/i).flatMap((text) => {
    const match = /^(B\d+):\s*([\s\S]*)$/.exec(text);
    if (!match) return [];
    const { head, values } = markers(match[2]!, ["Evidence", "We will know when", "Status"]);
    return [{ id: match[1]!, statement: head, evidence: values["evidence"] ?? null, signal: values["we will know when"] ?? null, status: values["status"] ?? null }];
  });
  const assumptionsList = listOf(/^Assumptions/i).flatMap((text) => {
    const match = /^(A\d+):\s*([\s\S]*)$/.exec(text);
    if (!match) return [];
    const { head, values } = markers(match[2]!, ["Test", "Status"]);
    return [{ id: match[1]!, statement: head, test: values["test"] ?? null, status: values["status"] ?? null }];
  });
  const notDoing = listOf(/^Not doing/i).map((text) => {
    const { head, values } = markers(text, ["Why", "Revisit"]);
    return { thing: head.replace(/\.$/, ""), why: values["why"] ?? null, revisit: values["revisit"] ?? null };
  });
  const decisions = listOf(/^Decisions/i).map((text) => {
    const date = /^(\d{4}-\d{2}-\d{2})\s+/.exec(text);
    const { head, values } = markers(date ? text.slice(date[0].length) : text, ["Why", "Rejected"]);
    return { date: date?.[1] ?? null, decision: head, why: values["why"] ?? null, rejected: values["rejected"] ?? null };
  });

  // LOG.md
  const log = sections(read("LOG.md"), 2);
  const logLines = (heading: RegExp) =>
    bullets(find(log, heading)?.body ?? "")
      .map((text) => /^(\d{4}-\d{2}-\d{2})\s+([\s\S]*)$/.exec(text))
      .filter((match): match is RegExpExecArray => !!match);
  const entry = (rest: string, keys: string[]) => {
    const id = /^(R-\d{3,})\s+/.exec(rest);
    const { head, values } = markers(id ? rest.slice(id[0].length) : rest, keys);
    // In a log line `. ` separates the fields, so a value's final `.` is the separator, not the value.
    for (const key of Object.keys(values)) values[key] = values[key]?.replace(/\.$/, "") ?? null;
    return { id: id?.[1] ?? null, title: head.replace(/\.$/, ""), values };
  };
  const done = logLines(/^Done/i).map(([, date, rest]) => {
    const { id, title, values } = entry(rest!, ["Milestone", "Owner", "Plan", "Result"]);
    return { date: date!, id, title, milestone: optional(values["milestone"]), owner: optional(values["owner"]), plan: optional(values["plan"]), result: values["result"] ?? null };
  });
  const dropped = logLines(/^Dropped/i).map(([, date, rest]) => {
    const { id, title, values } = entry(rest!, ["Reason"]);
    return { date: date!, id, title, reason: values["reason"] ?? null };
  });
  const reviews = logLines(/^Reviews/i).map(([, date, rest]) => ({ date: date!, summary: value(rest) }));
  const doneIds = new Set(done.map((line) => line.id).filter(Boolean));

  // NOW.md
  const nowSections = sections(read("NOW.md"), 2);
  const nowFields = fields(nowSections[0]!.body);
  const active = /^active/i.test(nowFields.get("status") ?? "");
  const itemMatch = /^(R-\d{3,})\s+(.*)$/.exec(value(nowFields.get("item")) ?? "");
  if (active && !itemMatch) assume("NOW.md is active without an `R-NNN <title>` Item; now.item is null.");
  const stage = (value(nowFields.get("stage")) ?? "").toLowerCase();
  if (active && stage && !STAGES.includes(stage)) assume(`NOW.md Stage "${stage}" is not a stage; now.stage is null.`);
  const nowText = (key: string) => (active ? optional(nowFields.get(key)) : null);
  const checkpointSection = nowSections.find((section) => /^Checkpoint\b/i.test(section.heading));
  const checkpointFields = fields(checkpointSection?.body ?? "");
  const checkpointAt = value(checkpointSection?.heading.replace(/^Checkpoint\s*/i, ""));
  const checkpoint =
    active && checkpointSection && (checkpointAt || checkpointFields.size)
      ? {
          at: checkpointAt ?? "",
          stoppedAt: value(checkpointFields.get("stopped at")),
          nextAction: value(checkpointFields.get("next action")),
          startWith: value(checkpointFields.get("start with")),
          decisions: value(checkpointFields.get("decisions")),
          context: value(checkpointFields.get("context")),
          openQuestion: optional(checkpointFields.get("open question")),
        }
      : null;
  const nowItem =
    active && itemMatch
      ? (() => {
          const id = itemMatch[1]!;
          const ownerValue = value(nowFields.get("owner"));
          let owner: string | null = null;
          if (ownerValue === null) {
            assume("NOW.md has no Owner; now.item.owner is null.");
          } else {
            const lower = ownerValue.toLowerCase();
            if (OWNERS.includes(lower)) owner = lower;
            else assume(`${id} Owner "${lower}" is not agent, user, or both.`);
          }
          const sizeValue = value(nowFields.get("size"));
          let size: string | null = null;
          if (sizeValue === null) {
            assume("NOW.md has no Size; now.item.size is null.");
          } else {
            const upper = sizeValue.toUpperCase();
            if (SIZES.includes(upper)) size = upper;
            else assume(`${id} Size "${upper}" is not S, M, or L.`);
          }
          return {
            id,
            title: itemMatch[2]!.trim(),
            serves: list(nowFields.get("serves")),
            owner,
            size,
            dependsOn: ids(nowFields.get("depends on")),
            revisits: ids(nowFields.get("revisits"))[0] ?? null,
          };
        })()
      : null;
  const nowDoc = {
    status: active ? "active" : "idle",
    item: nowItem,
    stage: active && STAGES.includes(stage) ? stage : null,
    session: nowText("session"),
    brief: nowText("brief"),
    milestone: nowText("milestone"),
    spec: nowText("spec"),
    plan: nowText("plan"),
    started: nowText("started"),
    doneWhen: active ? bullets(find(nowSections, /^Done when/i)?.body ?? "").map(value).filter((text): text is string => text !== null) : [],
    checkpoint,
  };

  // The plan named in NOW.md: `### Task N: <title>` headings and `- [ ]` steps.
  let plan: Record<string, any> | null = null;
  if (nowDoc.plan) {
    const path = join(root, nowDoc.plan);
    if (!existsSync(path)) {
      assume(`The plan ${nowDoc.plan} is not in this checkout; plan is null.`);
    } else {
      const tasks: { number: number; title: string; checked: number; total: number; steps: { text: string; checked: boolean }[] }[] = [];
      let checked = 0;
      let total = 0;
      let fenced = false;
      for (const line of readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n")) {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        if (fenced) continue;
        const task = /^#{2,4}\s+Task\s+(\d+)\s*[:.\-–—]?\s*(.*)$/i.exec(line);
        if (task) {
          tasks.push({ number: Number(task[1]), title: task[2]!.trim(), checked: 0, total: 0, steps: [] });
          continue;
        }
        const step = /^\s*[-*] \[([ xX])\]\s+(.*)$/.exec(line);
        if (!step) continue;
        const isChecked = step[1] !== " ";
        total++;
        if (isChecked) checked++;
        const current = tasks.at(-1);
        if (current) {
          current.steps.push({ text: step[2]!.trim(), checked: isChecked });
          current.total++;
          if (isChecked) current.checked++;
        }
      }
      plan = { path: nowDoc.plan, checked, total, tasks };
    }
  }

  // ROADMAP.md
  const roadmap = sections(read("ROADMAP.md"), 2);
  const items = (section: "next" | "later") =>
    sections(find(roadmap, section === "next" ? /^Next/i : /^Later/i)?.body ?? "", 3)
      .slice(1)
      .map((block) => ({ heading: /^(R-\d{3,})\s+(.*)$/.exec(block.heading), body: block.body }))
      .filter((block): block is { heading: RegExpExecArray; body: string } => !!block.heading)
      .map((block, index) => {
        const id = block.heading[1]!;
        const f = fields(block.body);
        for (const key of ["serves", "done when", "size", "status"]) {
          if (!value(f.get(key))) assume(`${id} has no ${key[0]!.toUpperCase()}${key.slice(1)} in ROADMAP.md.`);
        }
        const status = /^(\w+)\s*(?:\((.*)\))?/.exec(value(f.get("status")) ?? "ready")!;
        const statusValue = status[1]!.toLowerCase();
        const inner = status[2]?.trim() ?? "";
        const since = /,?\s*since\s+(\S.*)$/i.exec(inner);
        const owner = (value(f.get("owner")) ?? "agent").toLowerCase();
        const dependsOn = ids(f.get("depends on"));
        const label = statusValue === "blocked" ? "blocked" : dependsOn.some((dep) => !doneIds.has(dep)) ? "waiting" : section;
        return {
          id,
          title: block.heading[2]!.trim(),
          section,
          position: index + 1,
          label,
          serves: list(f.get("serves")),
          milestone: optional(f.get("milestone")),
          owner,
          doneWhen: value(f.get("done when")) ?? "",
          size: (value(f.get("size")) ?? "").toUpperCase(),
          dependsOn,
          status: {
            value: statusValue,
            reason: value(since ? inner.slice(0, since.index) : inner),
            since: since ? value(since[1]!.replace(/\)$/, "")) : null,
          },
          brief: optional(f.get("brief")),
          note: optional(f.get("note")),
          revisits: ids(f.get("revisits"))[0] ?? null,
          claimable:
            section === "next" &&
            (statusValue === "ready" || statusValue === "paused") &&
            (owner === "agent" || owner === "both") &&
            dependsOn.every((dep) => doneIds.has(dep)),
        };
      });
  const next = items("next");
  // Later is grouped by milestone in strategy order, Unassigned last; the sort is stable, so position order holds inside a group.
  const later = items("later").sort((a, b) => milestoneRank(a.milestone) - milestoneRank(b.milestone));
  if (later.some((item, index) => item.position !== index + 1)) {
    assume("Later in ROADMAP.md is not grouped by milestone in STRATEGY.md order; exported in milestone order, keeping each item's file position.");
  }
  for (const item of [...next, ...later]) {
    if (!OWNERS.includes(item.owner)) assume(`${item.id} Owner "${item.owner}" is not agent, user, or both.`);
    if (!SIZES.includes(item.size)) assume(`${item.id} Size "${item.size}" is not S, M, or L.`);
  }
  const titles = new Map([...next, ...later].map((item) => [item.id, item.title]));
  if (nowDoc.item) titles.set(nowDoc.item.id, nowDoc.item.title);
  for (const line of done) if (line.id) titles.set(line.id, line.title);
  const named = (id: string) => (titles.has(id) ? `${id} ${titles.get(id)}` : id);

  // board: the columns pm-board renders.
  const card = (item: (typeof next)[number], detail: string | null) => ({ id: item.id, title: item.title, owner: item.owner, size: item.size, detail });
  const blocks = (id: string) => [...next, ...later].filter((other) => other.dependsOn.includes(id)).map((other) => named(other.id));
  const waitingDetail = (item: (typeof next)[number]) =>
    item.label === "blocked"
      ? `blocked${item.status.reason ? `: ${item.status.reason}` : ""}${item.status.since ? `, since ${item.status.since}` : ""}`
      : `needs ${item.dependsOn.filter((dep) => !doneIds.has(dep)).map(named).join(", ")}`;
  const queued = next.filter((item) => item.label === "next");
  const board = {
    columns: {
      now: nowDoc.item
        ? [
            {
              id: nowDoc.item.id,
              title: nowDoc.item.title,
              owner: nowDoc.item.owner,
              size: nowDoc.item.size,
              detail: [nowDoc.stage, plan ? `${plan.checked}/${plan.total} plan steps` : null].filter(Boolean).join(", ") || null,
            },
          ]
        : [],
      next: queued.filter((item) => item.owner !== "user").map((item) => card(item, item.status.value)),
      foryou: queued
        .filter((item) => item.owner === "user")
        .map((item) => card(item, blocks(item.id).length ? `blocks ${blocks(item.id).join(", ")}` : item.status.value)),
      waiting: next.filter((item) => item.label !== "next").map((item) => card(item, waitingDetail(item))),
      done: done.filter((line) => daysBetween(line.date, today) <= boardWindow && daysBetween(line.date, today) >= 0),
    },
    activity: [
      ...done.map((line) => ({ date: line.date, kind: "done", id: line.id, title: line.title, milestone: line.milestone, owner: line.owner, result: line.result })),
      ...dropped.map((line) => ({ date: line.date, kind: "dropped", id: line.id, title: line.title, milestone: null, owner: null, result: line.reason ? `Reason: ${line.reason}` : null })),
      ...reviews.map((line) => ({ date: line.date, kind: "review", id: null, title: null, milestone: null, owner: null, result: line.summary })),
    ].sort((a, b) => b.date.localeCompare(a.date)),
  };

  // inbox/, briefs/, and decisions/: one entry per file, README.md excluded, by file name.
  // Decisions are read raw: parseAdr keeps the comments inside code (ADR-002).
  const folder = (name: string, raw = false) => {
    const dir = join(pmDir, name);
    return existsSync(dir)
      ? readdirSync(dir)
          .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md")
          .sort()
          .map((file) => {
            const text = readFileSync(join(dir, file), "utf8");
            return { file, text: raw ? text : stripComments(text) };
          })
      : [];
  };
  const title = (text: string) => /^# (.+)$/m.exec(text)?.[1]?.trim() ?? "";

  // Read raw: the summary fields strip every comment, `sections` keeps those inside code (ADR-016).
  const inbox = folder("inbox", true).map(({ file, text: raw }) => {
    const text = stripComments(raw);
    const parts = sections(text, 2);
    const f = fields(parts[0]!.body);
    const kind = (value(f.get("kind")) ?? "").toLowerCase();
    const severity = (optional(f.get("severity")) ?? "").toLowerCase();
    if (!title(text)) assume(`${pmRoot}inbox/${file} has no title.`);
    return {
      file: `${pmRoot}inbox/${file}`,
      title: title(text),
      captured: value(f.get("captured")),
      source: value(f.get("source")),
      kind: KINDS.includes(kind) ? kind : null,
      severity: SEVERITIES.includes(severity) ? severity : null,
      affects: optional(f.get("affects")),
      context: optional(f.get("context")),
      discuss: /^yes/i.test(f.get("discuss") ?? "") ? "yes" : "no",
      related: list(f.get("related")),
      brief: optional(f.get("brief")),
      reviewed: value(f.get("reviewed")) ?? "never",
      idea: value(find(parts, /^Idea/i)?.body.trim()),
      sections: recordSections(raw),
    };
  });

  const briefs = folder("briefs", true).map(({ file, text: raw }) => {
    const text = stripComments(raw);
    const parts = sections(text, 2);
    const f = fields(parts[0]!.body);
    const status = value(f.get("status"));
    const id = /^(R-\d{3,})/i.exec(file)?.[1]?.toUpperCase() ?? ids(status)[0] ?? null;
    return {
      path: `${pmRoot}briefs/${file}`,
      id,
      title: title(text).replace(/^Brief:\s*/i, "").replace(/^R-\d{3,}\s+/, ""),
      status,
      origin: value(f.get("origin")),
      updated: value(f.get("updated")),
      decision: firstLine(find(parts, /^Decision/i)?.body),
      problem: firstLine(find(parts, /^Problem/i)?.body),
      doneWhen: firstLine(find(parts, /^Done when/i)?.body),
      revisions: bullets(find(parts, /^Revisions/i)?.body ?? "").map((line) => {
        const date = /^(\d{4}-\d{2}-\d{2})[:\s]+/.exec(line);
        return { date: date?.[1] ?? null, text: date ? line.slice(date[0].length).trim() : line };
      }),
      sections: recordSections(raw),
    };
  });

  // decisions/: every ADR-NNN-<slug>.md, whole, by ID number.
  const adrs = sortAdrs(folder("decisions", true).flatMap(({ file, text }) => parseAdr(file, text, pmRoot, assume) ?? []));

  // RISKS.md
  const riskSections = sections(read("RISKS.md"), 2);
  const risks = (heading: RegExp) =>
    sections(find(riskSections, heading)?.body ?? "", 3)
      .slice(1)
      .map((block) => ({ heading: /^(RK-\d{3,})\s+(.*)$/.exec(block.heading), body: block.body }))
      .filter((block): block is { heading: RegExpExecArray; body: string } => !!block.heading)
      .map((block) => {
        const f = fields(block.body);
        const lower = (key: string) => (value(f.get(key)) ?? "").toLowerCase();
        return {
          id: block.heading[1]!,
          title: block.heading[2]!.trim(),
          likelihood: lower("likelihood"),
          impact: lower("impact"),
          rag: lower("rag"),
          ragOverride: optional(f.get("rag override")),
          status: lower("status"),
          owner: (value(f.get("owner")) ?? "agent").toLowerCase(),
          affects: optional(f.get("affects")),
          trigger: optional(f.get("trigger")),
          mitigation: optional(f.get("mitigation")),
          raised: value(f.get("raised")),
          reviewed: value(f.get("reviewed")),
          closed: optional(f.get("closed")),
        };
      });
  const removed = bullets(find(riskSections, /^Removed/i)?.body ?? "").flatMap((line) => {
    const match = /^(\d{4}-\d{2}-\d{2})\s+(RK-\d{3,})\s+([\s\S]*)$/.exec(line);
    if (!match) return [];
    const { head, values } = markers(match[3]!, ["Reason"]);
    return [{ date: match[1]!, id: match[2]!, title: head.replace(/\.$/, ""), reason: values["reason"]?.replace(/\.$/, "") ?? null }];
  });
  const openRisks = risks(/^Open/i);
  const closedRisks = risks(/^Closed/i);

  // counts and checks
  const openInbox = inbox.filter(
    (entry) => entry.discuss === "yes" || entry.reviewed === "never" || (isDate(lastReview) && isDate(entry.reviewed) && entry.reviewed! < lastReview),
  ).length;
  const reviewDue = (isDate(lastReview) && daysBetween(lastReview, today) >= cadence) || openInbox >= inboxThreshold;

  const counts = {
    next: next.length,
    later: later.length,
    nextMax,
    openInbox,
    discuss: inbox.filter((entry) => entry.discuss === "yes").length,
    shapingBriefs: briefs.filter((brief) => /^shaping/i.test(brief.status ?? "")).length,
    done: done.length,
    dropped: dropped.length,
    blockers: [...next, ...later].filter((item) => item.status.value === "blocked").length,
    openRisks: openRisks.length,
    redRisks: openRisks.filter((risk) => risk.rag === "red").length,
    amberRisks: openRisks.filter((risk) => risk.rag === "amber").length,
    greenRisks: openRisks.filter((risk) => risk.rag === "green").length,
  };

  const checks = {
    reviewDue,
    lastReview,
    claimable: next.filter((item) => item.claimable).map((item) => item.id),
    drift: drift({ root, branch, branchPattern, defaultBranch, active, session: nowDoc.session, itemId: nowDoc.item?.id ?? null }),
  };

  const document = {
    $schema: "./planning.schema.json",
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    generator: { skill: "pm-export", skillsVersion, rulesVersion },
    project: { pmRoot, defaultBranch, branchPattern },
    source: { branch, head },
    vision: visionDoc,
    strategy: {
      focus: { milestone: value(focus.get("milestone")), whyNow: value(focus.get("why now")) },
      milestones,
      bets,
      assumptions: assumptionsList,
      notDoing,
      decisions,
    },
    now: nowDoc,
    plan,
    roadmap: { next, later },
    board,
    log: { done, dropped, reviews },
    inbox,
    briefs,
    risks: { open: openRisks, closed: closedRisks, removed },
    adrs,
    counts,
    checks,
  };

  return { document, assumptions, pmRoot };
}

/** The Drift definition: idle on an item branch, active on another session's item branch, or merged-unclosed. */
function drift(input: {
  root: string;
  branch: string | null;
  branchPattern: string | null;
  defaultBranch: string;
  active: boolean;
  session: string | null;
  itemId: string | null;
}): boolean {
  const { root, branch, branchPattern, defaultBranch, active, session, itemId } = input;
  if (!branch || !branchPattern) return false;
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = (id: string) =>
    new RegExp(`^${escape(branchPattern).replace(escape("<id>"), id).replace(escape("<slug>"), ".+").replace(/<[^>]+>/g, ".+")}$`, "i");
  const onItemBranch = pattern("r-\\d{3,}").test(branch);
  const sessionBranch = session?.split(/\s+/)[0] ?? null;

  if (!active) return onItemBranch;
  if (itemId && pattern(escape(itemId)).test(branch) && sessionBranch !== branch) return true;
  // Merged-unclosed: the session branch has no commit the PM branch lacks. The claim rides the
  // branch as a commit, so a branch still in progress is always ahead.
  if (sessionBranch && sessionBranch !== defaultBranch) {
    return git(root, "rev-list", "--count", `${defaultBranch}..${sessionBranch}`) === "0";
  }
  return false;
}

/** The export as pm-export writes it: two-space indent, LF, one trailing newline. */
export const serialise = (document: unknown) => JSON.stringify(document, null, 2) + "\n";
