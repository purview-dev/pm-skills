// The PM file schemas: what each file in the PM root must hold, per the
// Shared definitions and the pm-init templates, and the references between
// files (IDs, V lines, milestones, dependencies). Placeholders and HTML
// comments are the templates' examples and are never checked.

import {
  bullets,
  type Field,
  fieldMap,
  fields,
  findSection,
  headings,
  isContent,
  isPlaceholder,
  type Line,
  parseLines,
  type Section,
  sections,
  sectionText,
} from "./markdown.ts";

export interface Finding {
  /** PM-root-relative path, `/`-separated. */
  file: string;
  line: number;
  rule: string;
  message: string;
}

export type Kind = "config" | "vision" | "strategy" | "now" | "roadmap" | "log" | "risks" | "engineering" | "stack" | "pause" | "inbox" | "brief" | "adr" | "markdown";

const TOP_FILES: Record<string, Kind> = {
  "config.md": "config",
  "VISION.md": "vision",
  "STRATEGY.md": "strategy",
  "NOW.md": "now",
  "ROADMAP.md": "roadmap",
  "LOG.md": "log",
  "RISKS.md": "risks",
  "ENGINEERING.md": "engineering",
  "STACK.md": "stack",
  "PAUSE.md": "pause",
};

/** The format a PM-root-relative Markdown path follows; `markdown` is formatting only (READMEs, research reports). */
export function kindOf(rel: string): Kind {
  if (rel in TOP_FILES) return TOP_FILES[rel]!;
  const [folder, name, extra] = rel.split("/");
  if (extra === undefined && name && name.toLowerCase() !== "readme.md") {
    if (folder === "inbox") return "inbox";
    if (folder === "briefs") return "brief";
    if (folder === "decisions") return "adr";
  }
  return "markdown";
}

// The field keys each block defines, as written in the templates.
export const KEYS = {
  now: ["Status", "Item", "Session", "Stage", "Brief", "Milestone", "Serves", "Owner", "Size", "Depends on", "Revisits", "Note", "Spec", "Plan", "Started"],
  checkpoint: ["Stopped at", "Next action", "Start with", "Decisions", "Context", "Open question"],
  item: ["Serves", "Milestone", "Owner", "Done when", "Size", "Depends on", "Status", "Brief", "Paused checkpoint", "Note", "Revisits"],
  milestone: ["Serves", "Exit criteria", "Target", "Status"],
  focus: ["Milestone", "Why now"],
  risk: ["Likelihood", "Impact", "RAG", "RAG override", "Status", "Owner", "Affects", "Trigger", "Mitigation", "Raised", "Reviewed", "Closed"],
  technology: ["Kind", "Version", "Reason", "Decision", "Source", "Added"],
  principle: ["Rule", "Applies to", "Check", "Decision", "Source", "Added"],
  inbox: ["Captured", "Source", "Kind", "Severity", "Affects", "Context", "Discuss", "Related", "Brief", "Reviewed"],
  brief: ["Status", "Origin", "Updated"],
  adr: ["Status", "Date", "Category", "Supersedes", "Item", "Source"],
  stack: ["Pushed", "Branch", "Stage", "Brief", "Spec", "Plan", "Milestone", "Serves", "Owner", "Size", "Depends on", "Revisits", "Note", "Started", "Reason", "Done when", "Checkpoint"],
  pause: ["Paused", "Session", "Item", "Running", "Files", "Uncommitted outside PM root"],
  resume: ["Next action", "Start with", "Open question"],
  install: ["Rules version"],
  limits: ["Max items in Next", "Review cadence", "Inbox size that triggers a review prompt", "Blocked item is stale after", "Board shows items done in the last", "Branch name pattern"],
  commits: ["PM state commit", "PM branch", "Export on commit"],
  lastReview: ["Date"],
  constraints: ["Time available", "Budget", "Stack"],
} as const;

/** Every known key of a file kind, for `fields/key-case`. */
const FILE_KEYS: Partial<Record<Kind, readonly string[]>> = {
  now: [...KEYS.now, ...KEYS.checkpoint],
  roadmap: KEYS.item,
  strategy: [...KEYS.milestone, ...KEYS.focus],
  risks: KEYS.risk,
  engineering: [...KEYS.technology, ...KEYS.principle],
  inbox: KEYS.inbox,
  brief: KEYS.brief,
  adr: KEYS.adr,
  stack: KEYS.stack,
  pause: [...KEYS.pause, ...KEYS.resume],
  config: [...KEYS.install, ...KEYS.limits, ...KEYS.commits, ...KEYS.lastReview],
  vision: KEYS.constraints,
};

export const BRIEF_HEADINGS = [
  "Problem",
  "Who and evidence",
  "Original idea",
  "Proposal",
  "Alternatives considered",
  "Challenges and answers",
  "Ramifications",
  "Done when",
  "Size and slicing",
  "Open questions",
  "Decision",
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (text: string) => DATE.test(text) && !Number.isNaN(Date.parse(text));
const DATE_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const ITEM_ID = /\bR-\d{3,}\b/g;
const idNumber = (id: string) => Number(/\d+/.exec(id)?.[0] ?? 0);
const LEVELS = ["low", "medium", "high"];
const RAG_RANK: Record<string, number> = { red: 0, amber: 1, green: 2 };

// The item fields NOW.md and the stack carry alongside the roadmap: optional
// everywhere, checked like a roadmap item's fields when present.
const NOW_ITEM_FIELDS = ["Serves", "Owner", "Size", "Depends on", "Revisits"];
/** The item's `Note`, optional after `Revisits` (rules 22). */
const NOW_NOTE = "Note";
/** The rules 20 shape: `KEYS.now` without `Note`. */
const NOW_ITEM_SHAPE = KEYS.now.filter((key) => key !== NOW_NOTE);
/** The rules 19 shape: `KEYS.now` without the item fields or `Note`. */
const NOW_LEGACY_FIELDS = NOW_ITEM_SHAPE.filter((key) => !NOW_ITEM_FIELDS.includes(key));
/** The key sequences `now/fields` accepts. */
const NOW_SHAPES = [KEYS.now, NOW_ITEM_SHAPE, NOW_LEGACY_FIELDS].map((shape) => shape.join("|").toLowerCase());
const OWNER_VALUES = /^(agent|user|both)$/;
const SIZE_VALUES = /^(S|M|L)$/;

/** Every ID known anywhere in the PM state (ROADMAP.md, NOW.md, LOG.md), for `Depends on`. */
const knownIds = (context: Context) => new Set([...context.items.map((i) => i.id), ...(context.now ? [context.now.id] : []), ...context.done.map((d) => d.id), ...context.dropped.map((d) => d.id)]);

/** Every ID in the LOG.md `## Done` lines, for `Revisits`. */
const doneIdSet = (context: Context) => new Set(context.done.map((d) => d.id));

/** `Owner` is agent, user, or both, when present. Exactly `checkRoadmap`'s original check, reused by `checkNow`. */
function checkOwnerField(field: Field | undefined, add: Add, rule: string) {
  if (field && !OWNER_VALUES.test(field.value)) add(field.n, rule, `Owner "${field.value}" is not agent, user, or both.`);
}

/** `Size` is S, M, or L, when present. Exactly `checkRoadmap`'s original check, reused by `checkNow`. */
function checkSizeField(field: Field | undefined, add: Add, rule: string) {
  if (field && !SIZE_VALUES.test(field.value)) add(field.n, rule, `Size "${field.value}" is not S, M, or L.`);
}

/**
 * `Depends on`: every ID named exists, is not `selfId`, and the field names at least one when it
 * is not `none`. A present-but-blank value is not `none`, so it reports too, exactly as
 * `checkRoadmap`'s original inline check did; reused by `checkNow`.
 */
function checkDependsOnField(field: Field | undefined, selfId: string | undefined, known: Set<string>, add: Add, rule: string) {
  if (!field || /^none$/i.test(field.value)) return;
  const deps = field.value.match(ITEM_ID) ?? [];
  if (!deps.length) {
    add(field.n, rule, `Depends on "${field.value}" names no R-NNN ID.`);
    return;
  }
  for (const dep of deps) {
    if (selfId && dep === selfId) add(field.n, rule, `${selfId} depends on itself.`);
    else if (!known.has(dep)) add(field.n, rule, `${dep} is not an item in ROADMAP.md, NOW.md, or LOG.md.`);
  }
}

/**
 * `Revisits`: one ID in the LOG.md Done lines. A present-but-blank value is not `none`, so it
 * reports too, exactly as `checkRoadmap`'s original inline check did; reused by `checkNow`.
 */
function checkRevisitsField(field: Field | undefined, doneIds: Set<string>, add: Add, rule: string) {
  if (!field || /^none$/i.test(field.value)) return;
  const ids = field.value.match(ITEM_ID) ?? [];
  if (!ids.length || ids.some((id) => !doneIds.has(id))) add(field.n, rule, `Revisits "${field.value}" is not an item in the LOG.md Done lines.`);
}

export function derivedRag(likelihood: string, impact: string): string | null {
  const l = LEVELS.indexOf(likelihood);
  const i = LEVELS.indexOf(impact);
  if (l < 0 || i < 0) return null;
  const score = (l + 1) * (i + 1);
  return score >= 6 ? "red" : score >= 3 ? "amber" : "green";
}

interface Doc {
  rel: string;
  kind: Kind;
  lines: Line[];
  h2: Section[];
}

interface Item {
  id: string;
  title: string;
  n: number;
  section: "next" | "later";
  fields: Map<string, Field>;
  /** The heading's position among all items, for `later-order`. */
  index: number;
}

/** The parsed PM root and the facts other files refer to. */
export interface Context {
  docs: Map<string, Doc>;
  vLines: Set<string>;
  hasVision: boolean;
  milestones: string[];
  hasStrategy: boolean;
  items: Item[];
  now: { id: string; n: number } | null;
  done: { id: string; n: number }[];
  dropped: { id: string; n: number }[];
  nextMax: number | null;
  adrs: { id: string; rel: string; status: string; supersedes: string; n: number }[];
}

const blockFields = (lines: Line[], block: Section) => fields(lines, block);

export function buildContext(files: Map<string, string>): Context {
  const docs = new Map<string, Doc>();
  for (const [rel, text] of files) {
    if (!rel.endsWith(".md")) continue;
    const lines = parseLines(text);
    docs.set(rel, { rel, kind: kindOf(rel), lines, h2: sections(lines, 2) });
  }
  const vision = docs.get("VISION.md");
  const vLines = new Set<string>();
  if (vision) {
    const outcomes = findSection(vision.h2, /done when|outcomes/i);
    if (outcomes) for (const b of bullets(vision.lines, outcomes)) {
      const id = /^(V\d+):/.exec(b.text)?.[1];
      if (id) vLines.add(id);
    }
  }
  const strategy = docs.get("STRATEGY.md");
  const milestones: string[] = [];
  if (strategy) {
    const section = findSection(strategy.h2, /^Milestones/i);
    if (section) for (const block of sections(strategy.lines, 3, section).slice(1)) {
      const id = /^(M\d+)\b/.exec(block.heading!.text)?.[1];
      if (id) milestones.push(id);
    }
  }
  const items: Item[] = [];
  const roadmap = docs.get("ROADMAP.md");
  if (roadmap) {
    for (const name of ["next", "later"] as const) {
      const section = findSection(roadmap.h2, name === "next" ? /^Next\b/i : /^Later\b/i);
      if (!section) continue;
      for (const block of sections(roadmap.lines, 3, section).slice(1)) {
        const match = /^(R-\d{3,})\s+(.+)$/.exec(block.heading!.text);
        if (match) items.push({ id: match[1]!, title: match[2]!, n: block.heading!.n, section: name, fields: fieldMap(blockFields(roadmap.lines, block)), index: items.length });
      }
    }
  }
  let now: Context["now"] = null;
  const nowDoc = docs.get("NOW.md");
  if (nowDoc) {
    const item = fieldMap(fields(nowDoc.lines, nowDoc.h2[0]!)).get("item");
    const id = /^(R-\d{3,})\b/.exec(item?.value ?? "")?.[1];
    if (id && item) now = { id, n: item.n };
  }
  const logIds = (heading: RegExp) => {
    const log = docs.get("LOG.md");
    const section = log && findSection(log.h2, heading);
    if (!log || !section) return [];
    return bullets(log.lines, section).flatMap((b) => {
      const id = /^\d{4}-\d{2}-\d{2}\s+(R-\d{3,})\b/.exec(b.text)?.[1];
      return id ? [{ id, n: b.n }] : [];
    });
  };
  const config = docs.get("config.md");
  const limits = config && findSection(config.h2, /^Limits/i);
  const max = limits ? fieldMap(fields(config.lines, limits)).get("max items in next") : undefined;
  const adrs: Context["adrs"] = [];
  for (const adrDoc of docs.values()) {
    if (adrDoc.kind !== "adr") continue;
    const h1 = headings(adrDoc.lines).find((h) => h.level === 1);
    const id = h1 && /^(ADR-\d{3,})\b/.exec(h1.text)?.[1];
    if (!h1 || !id) continue;
    const map = fieldMap(fields(adrDoc.lines, adrDoc.h2[0]!));
    adrs.push({ id, rel: adrDoc.rel, status: map.get("status")?.value ?? "", supersedes: map.get("supersedes")?.value ?? "", n: h1.n });
  }
  return {
    docs,
    vLines,
    hasVision: vLines.size > 0,
    milestones,
    hasStrategy: !!strategy,
    items,
    now,
    done: logIds(/^Done/i),
    dropped: logIds(/^Dropped/i),
    nextMax: max && /\d+/.test(max.value) ? Number(/\d+/.exec(max.value)![0]) : null,
    adrs,
  };
}

/** Check the structure of every PM file in the context. */
export function checkStructure(context: Context): Finding[] {
  const out: Finding[] = [];
  for (const doc of context.docs.values()) {
    const add = (line: number, rule: string, message: string) => out.push({ file: doc.rel, line, rule, message });
    const checkers: Partial<Record<Kind, (doc: Doc, add: Add, context: Context) => void>> = {
      config: checkConfig,
      vision: checkVision,
      strategy: checkStrategy,
      now: checkNow,
      roadmap: checkRoadmap,
      log: checkLog,
      risks: checkRisks,
      engineering: checkEngineering,
      inbox: checkInbox,
      brief: checkBrief,
      adr: checkAdr,
      stack: checkStack,
      pause: checkPause,
    };
    checkers[doc.kind]?.(doc, add, context);
    const known = FILE_KEYS[doc.kind];
    if (known) {
      for (const field of fields(doc.lines, { start: 1, end: doc.lines.length })) {
        const canonical = known.find((key) => key.toLowerCase() === field.key.toLowerCase());
        if (canonical && canonical !== field.key) add(field.n, "fields/key-case", `Write \`${canonical}\`, not \`${field.key}\`.`);
      }
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
}

type Add = (line: number, rule: string, message: string) => void;

/** Duplicate and unknown keys in one block. When `exact` names a rule, also checks the keys and their order under it. */
function checkBlockFields(list: Field[], known: readonly string[], add: Add, at: number, exact?: string) {
  const seen = new Set<string>();
  for (const field of list) {
    const key = field.key.toLowerCase();
    if (seen.has(key)) add(field.n, "fields/duplicate", `\`${field.key}\` appears twice.`);
    seen.add(key);
    if (!known.some((k) => k.toLowerCase() === key)) add(field.n, "fields/unknown", `\`${field.key}\` is not a field here (known: ${known.join(", ")}).`);
  }
  if (exact) {
    const keys = list.map((field) => field.key.toLowerCase()).join("|");
    const wanted = known.map((key) => key.toLowerCase()).join("|");
    if (keys !== wanted) add(at, exact, `The fields are ${list.map((field) => field.key).join(", ") || "missing"}; they must be ${known.join(", ")}, in order.`);
  }
}

const missing = (map: Map<string, Field>, keys: readonly string[]) => keys.filter((key) => !map.has(key.toLowerCase()));
const val = (map: Map<string, Field>, key: string) => map.get(key.toLowerCase())?.value ?? "";
const lineOf = (map: Map<string, Field>, key: string, fallback: number) => map.get(key.toLowerCase())?.n ?? fallback;

function requireSections(doc: Doc, add: Add, rule: string, wanted: [string, RegExp][], ordered: boolean) {
  const present = doc.h2.slice(1).map((section) => section.heading!);
  let last = -1;
  for (const [name, test] of wanted) {
    const index = present.findIndex((h) => test.test(h.text));
    if (index === -1) add(1, rule, `Missing \`## ${name}\`.`);
    else if (ordered && index < last) add(present[index]!.n, rule, `\`## ${name}\` is out of order.`);
    else last = index;
  }
}

function checkConfig(doc: Doc, add: Add) {
  requireSections(doc, add, "config/sections", [["Install", /^Install/i], ["Limits", /^Limits/i]], false);
  for (const [name, test] of [["Handoffs", /^Handoffs/i], ["Commits", /^Commits/i], ["Last review", /^Last review/i]] as const) {
    if (!findSection(doc.h2, test)) add(1, "config/optional-sections", `Missing \`## ${name}\`; the skills use its defaults (pm-setup adds it on upgrade).`);
  }
  const install = findSection(doc.h2, /^Install/i);
  if (install) {
    const map = fieldMap(fields(doc.lines, install));
    const version = map.get("rules version");
    if (version && !/^\d+$/.test(version.value)) add(version.n, "config/rules-version", `Rules version "${version.value}" is not a whole number.`);
  }
  const limits = findSection(doc.h2, /^Limits/i);
  if (limits) {
    for (const field of fields(doc.lines, limits)) {
      if (/^branch name pattern$/i.test(field.key)) {
        if (!/`[^`]*<id>[^`]*`/.test(field.value)) add(field.n, "config/limits", "Branch name pattern is a backticked pattern with `<id>`, for example `feat/<id>-<slug>`.");
      } else if (KEYS.limits.some((key) => key.toLowerCase() === field.key.toLowerCase()) && !/^\d+\b/.test(field.value)) {
        add(field.n, "config/limits", `${field.key} "${field.value}" does not start with a number.`);
      }
    }
  }
  const commits = findSection(doc.h2, /^Commits/i);
  if (commits) {
    const map = fieldMap(fields(doc.lines, commits));
    const policy = map.get("pm state commit");
    if (policy && !/^(always|ask|never)$/.test(policy.value)) add(policy.n, "config/commits", `PM state commit "${policy.value}" is not always, ask, or never.`);
    const exportPolicy = map.get("export on commit");
    if (exportPolicy && !/^(always|if present|never)$/.test(exportPolicy.value)) add(exportPolicy.n, "config/commits", `Export on commit "${exportPolicy.value}" is not always, if present, or never.`);
    const branch = map.get("pm branch");
    if (branch && branch.value === "") add(branch.n, "config/commits", "PM branch is empty.");
  }
  const review = findSection(doc.h2, /^Last review/i);
  if (review) {
    const date = fieldMap(fields(doc.lines, review)).get("date");
    if (date && date.value !== "never" && !isDate(date.value)) add(date.n, "config/last-review", `Date "${date.value}" is not never or YYYY-MM-DD.`);
  }
}

function checkVision(doc: Doc, add: Add) {
  requireSections(
    doc,
    add,
    "vision/sections",
    [["Problem", /^Problem/i], ["Customer", /^Customer/i], ["v1 is done when", /done when|outcomes/i], ["Out of scope for v1", /out of scope/i], ["Constraints", /^Constraints/i]],
    false,
  );
  const outcomes = findSection(doc.h2, /done when|outcomes/i);
  if (outcomes) {
    const seen = new Set<string>();
    for (const b of bullets(doc.lines, outcomes)) {
      const match = /^(V\d+):\s+\S/.exec(b.text);
      if (!match) add(b.n, "vision/outcome", "An outcome is `V<n>: <text>`.");
      else if (seen.has(match[1]!)) add(b.n, "vision/outcome", `${match[1]} is used twice.`);
      else seen.add(match[1]!);
    }
  }
  const constraints = findSection(doc.h2, /^Constraints/i);
  if (constraints) {
    const map = fieldMap(fields(doc.lines, constraints));
    for (const key of missing(map, KEYS.constraints)) add(constraints.start - 1, "vision/constraints", `Constraints has no \`${key}\`.`);
  }
}

const servesCheck = (field: Field | undefined, context: Context, add: Add, rule: string) => {
  if (!field || isPlaceholder(field.value) || /^none$/i.test(field.value)) return;
  for (const part of field.value.split(",").map((p) => p.trim()).filter(Boolean)) {
    const id = /^(V\d+)\b/.exec(part)?.[1];
    if (!id) add(field.n, rule, `Serves "${part}" is not a V line.`);
    else if (context.hasVision && !context.vLines.has(id)) add(field.n, rule, `${id} is not a V line in VISION.md.`);
  }
};

const namesMilestone = (value: string, milestones: string[]) => milestones.some((id) => value === id || value.startsWith(`${id} `));

function checkStrategy(doc: Doc, add: Add, context: Context) {
  requireSections(
    doc,
    add,
    "strategy/sections",
    [["Current focus", /^Current focus/i], ["Milestones", /^Milestones/i], ["Bets", /^Bets/i], ["Assumptions and risks", /^Assumptions/i], ["Not doing", /^Not doing/i], ["Decisions", /^Decisions/i]],
    true,
  );
  const focus = findSection(doc.h2, /^Current focus/i);
  if (focus) {
    const map = fieldMap(fields(doc.lines, focus));
    for (const key of missing(map, KEYS.focus)) add(focus.start - 1, "strategy/focus", `Current focus has no \`${key}\`.`);
    const milestone = map.get("milestone");
    if (milestone && !isPlaceholder(milestone.value) && !/^none$/i.test(milestone.value) && !namesMilestone(milestone.value, context.milestones)) {
      add(milestone.n, "strategy/focus", `Focus "${milestone.value}" is not a milestone in \`## Milestones\`.`);
    }
  }
  const milestonesSection = findSection(doc.h2, /^Milestones/i);
  if (milestonesSection) {
    const seen = new Set<string>();
    for (const block of sections(doc.lines, 3, milestonesSection).slice(1)) {
      const h = block.heading!;
      const match = /^(M\d+)\s+\S/.exec(h.text);
      if (!match) {
        add(h.n, "strategy/milestone", `"${h.text}" is not \`M<n> <Name>\`.`);
        continue;
      }
      if (seen.has(match[1]!)) add(h.n, "strategy/milestone", `${match[1]} is used twice.`);
      seen.add(match[1]!);
      const list = fields(doc.lines, block);
      const map = fieldMap(list);
      checkBlockFields(list, KEYS.milestone, add, h.n);
      for (const key of missing(map, KEYS.milestone)) add(h.n, "strategy/milestone", `${match[1]} has no \`${key}\`.`);
      const status = map.get("status");
      if (status && !isPlaceholder(status.value) && !/^(active|planned|done \(\d{4}-\d{2}-\d{2}\))$/.test(status.value)) {
        add(status.n, "strategy/milestone-status", `Status "${status.value}" is not active, planned, or done (YYYY-MM-DD).`);
      }
      const target = map.get("target");
      if (target && !isPlaceholder(target.value) && !/^none$/i.test(target.value) && !isDate(target.value)) {
        add(target.n, "strategy/milestone-status", `Target "${target.value}" is not none or YYYY-MM-DD.`);
      }
      servesCheck(map.get("serves"), context, add, "strategy/serves");
    }
  }
  const lines = (test: RegExp) => {
    const section = findSection(doc.h2, test);
    return section ? bullets(doc.lines, section) : [];
  };
  for (const b of lines(/^Bets/i)) {
    if (!/^B\d+:\s+\S/.test(b.text)) add(b.n, "strategy/bet", "A bet is `B<n>: <statement>`.");
    else if (!/Evidence:/.test(b.text) || !/We will know when:/.test(b.text) || !/Status:/.test(b.text)) add(b.n, "strategy/bet", "A bet has Evidence, We will know when, and Status.");
    else if (!/Status:\s*(open|won|lost)\b/.test(b.text)) add(b.n, "strategy/bet", "A bet's Status is open, won, or lost.");
  }
  for (const b of lines(/^Assumptions/i)) {
    if (!/^A\d+:\s+\S/.test(b.text)) add(b.n, "strategy/assumption", "An assumption is `A<n>: <statement>`.");
    else if (!/Test:/.test(b.text) || !/Status:/.test(b.text)) add(b.n, "strategy/assumption", "An assumption has Test and Status.");
    else if (!/Status:\s*(untested|holds|broken)\b/.test(b.text)) add(b.n, "strategy/assumption", "An assumption's Status is untested, holds, or broken.");
  }
  for (const b of lines(/^Not doing/i)) {
    if (!/Why:/.test(b.text) || !/Revisit:/.test(b.text)) add(b.n, "strategy/not-doing", "A Not doing line has `Why:` and `Revisit:`.");
  }
  const decisions = lines(/^Decisions/i);
  for (const b of decisions) {
    if (!/^\d{4}-\d{2}-\d{2}\s/.test(b.text) || !/Why:/.test(b.text)) add(b.n, "strategy/decision", "A decision is `<YYYY-MM-DD> <decision>. Why: <reason>. Rejected: <alternatives>.`");
  }
  outOfOrder(decisions, add, "strategy/decision-order", "Decisions are newest first.");
}

/** Report the first bullet dated after the one before it (lists are newest first). */
function outOfOrder(list: { n: number; text: string }[], add: Add, rule: string, message: string) {
  const dated = list.map((b) => ({ n: b.n, date: /^(\d{4}-\d{2}-\d{2})/.exec(b.text)?.[1] })).filter((b) => b.date);
  const bad = dated.find((b, i) => i > 0 && b.date! > dated[i - 1]!.date!);
  if (bad) add(bad.n, rule, message);
}

function checkNow(doc: Doc, add: Add, context: Context) {
  const top = fields(doc.lines, doc.h2[0]!);
  const keys = top.map((field) => field.key);
  const keyLine = keys.join("|").toLowerCase();
  if (!NOW_SHAPES.includes(keyLine)) {
    add(
      top[0]?.n ?? 1,
      "now/fields",
      `The fields are ${keys.join(", ") || "missing"}; they must be ${NOW_LEGACY_FIELDS.join(", ")}, optionally with ${NOW_ITEM_FIELDS.join(", ")} after Milestone, and then an optional ${NOW_NOTE}.`,
    );
  }
  requireSections(doc, add, "now/sections", [["Done when", /^Done when/i], ["Checkpoint", /^Checkpoint\b/i]], true);
  const map = fieldMap(top);
  const status = map.get("status");
  const doneWhen = findSection(doc.h2, /^Done when/i);
  const checks = doneWhen ? bullets(doc.lines, doneWhen) : [];
  const checkpoint = findSection(doc.h2, /^Checkpoint\b/i);
  const checkpointFields = checkpoint ? fields(doc.lines, checkpoint) : [];
  if (!status || !/^(idle|active)$/.test(status.value)) {
    add(status?.n ?? 1, "now/status", `Status "${status?.value ?? ""}" is not idle or active.`);
    return;
  }
  if (status.value === "idle") {
    for (const field of top) if (field.key.toLowerCase() !== "status" && field.value !== "") add(field.n, "now/idle", `${field.key} is set while NOW.md is idle.`);
    if (checks.length) add(checks[0]!.n, "now/idle", "Done when has checks while NOW.md is idle.");
    if (checkpointFields.length) add(checkpointFields[0]!.n, "now/idle", "Checkpoint is filled while NOW.md is idle.");
    return;
  }
  const item = map.get("item");
  if (!/^R-\d{3,}\s+\S/.test(item?.value ?? "")) add(item?.n ?? status.n, "now/active", "Item is `R-NNN <Title>`.");
  if (!val(map, "session")) add(lineOf(map, "session", status.n), "now/active", "Session is empty.");
  if (!/^(design|plan|execute|finish)$/.test(val(map, "stage"))) add(lineOf(map, "stage", status.n), "now/active", `Stage "${val(map, "stage")}" is not design, plan, execute, or finish.`);
  if (!isDate(val(map, "started"))) add(lineOf(map, "started", status.n), "now/active", `Started "${val(map, "started")}" is not YYYY-MM-DD.`);
  if (!checks.length) add(doneWhen ? doneWhen.start - 1 : status.n, "now/active", "Done when has no check.");
  if (checkpoint && checkpointFields.length) {
    const h = checkpoint.heading!;
    if (!/^Checkpoint \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(h.text)) add(h.n, "now/checkpoint", "The heading is `## Checkpoint YYYY-MM-DD HH:MM`.");
    const cmap = fieldMap(checkpointFields);
    checkBlockFields(checkpointFields, KEYS.checkpoint, add, h.n);
    for (const key of missing(cmap, KEYS.checkpoint.slice(0, 5))) add(h.n, "now/checkpoint", `The checkpoint has no \`${key}\`.`);
  }
  if (context.now && context.items.some((i) => i.id === context.now!.id)) add(context.now.n, "now/not-in-roadmap", `${context.now.id} is active and also in ROADMAP.md.`);
  const selfId = /^(R-\d{3,})\b/.exec(item?.value ?? "")?.[1];
  checkOwnerField(map.get("owner"), add, "now/item");
  checkSizeField(map.get("size"), add, "now/item");
  servesCheck(map.get("serves"), context, add, "now/item");
  checkDependsOnField(map.get("depends on"), selfId, knownIds(context), add, "now/item");
  // Unlike Depends on (default "none", literal), a roadmap item's Revisits is often absent rather
  // than "none"; pm-next then has nothing to copy, so NOW.md leaves it blank for "not a revision".
  // Blank is only valid here, on the NOW.md path: checkRevisitsField itself still reports a
  // present-but-blank Revisits on a roadmap item (roadmap/revisits is unchanged).
  const revisits = map.get("revisits");
  if (revisits && !isPlaceholder(revisits.value)) checkRevisitsField(revisits, doneIdSet(context), add, "now/item");
}

function checkRoadmap(doc: Doc, add: Add, context: Context) {
  const h2 = doc.h2.slice(1).map((s) => s.heading!);
  const names = h2.map((h) => h.text);
  if (!(names.length === 2 && /^Next\b/i.test(names[0]!) && /^Later\b/i.test(names[1]!))) {
    add(h2[0]?.n ?? 1, "roadmap/sections", `The sections are ${names.map((n) => `\`## ${n}\``).join(", ") || "missing"}; they must be \`## Next\` then \`## Later\`.`);
  }
  for (const section of doc.h2.slice(1)) {
    for (const block of sections(doc.lines, 3, section).slice(1)) {
      if (!/^R-\d{3,}\s+\S/.test(block.heading!.text)) add(block.heading!.n, "roadmap/item", `"${block.heading!.text}" is not \`R-NNN <Title>\` (at least 3 digits).`);
    }
  }
  const known = knownIds(context);
  const doneIds = doneIdSet(context);
  const roadmapDoc = context.docs.get("ROADMAP.md")!;
  for (const item of context.items) {
    const block = sections(roadmapDoc.lines, 3).find((s) => s.heading?.n === item.n)!;
    const list = fields(roadmapDoc.lines, block);
    checkBlockFields(list, KEYS.item, add, item.n);
    const map = item.fields;
    for (const key of missing(map, ["Serves", "Done when", "Size", "Status"])) add(item.n, "roadmap/item", `${item.id} has no \`${key}\`.`);
    checkOwnerField(map.get("owner"), add, "roadmap/owner");
    checkSizeField(map.get("size"), add, "roadmap/size");
    const status = map.get("status");
    if (status && !/^(ready|paused|blocked \(.+, since \d{4}-\d{2}-\d{2}\))$/.test(status.value)) {
      add(status.n, "roadmap/status", `Status "${status.value}" is not ready, paused, or blocked (<reason>, since YYYY-MM-DD).`);
    }
    servesCheck(map.get("serves"), context, add, "roadmap/serves");
    const milestone = map.get("milestone");
    if (milestone && !isPlaceholder(milestone.value) && !/^(none|unassigned)$/i.test(milestone.value) && !namesMilestone(milestone.value, context.milestones)) {
      add(milestone.n, "roadmap/milestone", `Milestone "${milestone.value}" is not in STRATEGY.md${context.milestones.length ? ` (${context.milestones.join(", ")})` : ", which has no milestones"}.`);
    }
    checkDependsOnField(map.get("depends on"), item.id, known, add, "roadmap/depends");
    checkRevisitsField(map.get("revisits"), doneIds, add, "roadmap/revisits");
  }
  // Cycles in Depends on, among the open items.
  const graph = new Map(context.items.map((i) => [i.id, (i.fields.get("depends on")?.value.match(ITEM_ID) ?? []).filter((d) => d !== i.id)]));
  const state = new Map<string, number>();
  const visit = (id: string, path: string[]): string[] | null => {
    if (state.get(id) === 1) return [...path.slice(path.indexOf(id)), id];
    if (state.get(id) === 2 || !graph.has(id)) return null;
    state.set(id, 1);
    for (const dep of graph.get(id)!) {
      const cycle = visit(dep, [...path, id]);
      if (cycle) return cycle;
    }
    state.set(id, 2);
    return null;
  };
  for (const item of context.items) {
    const cycle = visit(item.id, []);
    if (cycle) {
      add(item.n, "roadmap/depends", `Depends on forms a cycle: ${cycle.join(" -> ")}.`);
      break;
    }
  }
  const next = context.items.filter((i) => i.section === "next");
  if (context.nextMax !== null && next.length > context.nextMax) add(next[context.nextMax]!.n, "roadmap/next-max", `Next has ${next.length} items; config.md allows ${context.nextMax}.`);
  const rank = (item: Item) => {
    const value = item.fields.get("milestone")?.value ?? "";
    const index = context.milestones.findIndex((id) => value === id || value.startsWith(`${id} `));
    return index === -1 ? context.milestones.length : index;
  };
  const later = context.items.filter((i) => i.section === "later");
  const bad = later.find((item, i) => i > 0 && rank(item) < rank(later[i - 1]!));
  if (bad) add(bad.n, "roadmap/later-order", `${bad.id} is out of milestone order in Later.`);
  // IDs are never reused.
  const seen = new Map<string, string>();
  const occurrences = [
    ...context.items.map((i) => ({ id: i.id, file: "ROADMAP.md", n: i.n })),
    ...(context.now ? [{ id: context.now.id, file: "NOW.md", n: context.now.n }] : []),
    ...context.done.map((d) => ({ id: d.id, file: "LOG.md", n: d.n })),
    ...context.dropped.map((d) => ({ id: d.id, file: "LOG.md", n: d.n })),
  ];
  for (const occurrence of occurrences) {
    const first = seen.get(occurrence.id);
    // NOW.md and ROADMAP.md together are now/not-in-roadmap; a second Done line is log/id-unique.
    if (first && occurrence.file === "ROADMAP.md") add(occurrence.n, "roadmap/id-unique", `${occurrence.id} is also in ${first}.`);
    else if (first && first === "ROADMAP.md" && occurrence.file === "LOG.md") {
      const item = context.items.find((i) => i.id === occurrence.id)!;
      add(item.n, "roadmap/id-unique", `${occurrence.id} is in ROADMAP.md and in LOG.md; IDs are never reused.`);
    }
    if (!first) seen.set(occurrence.id, occurrence.file);
  }
}

function checkLog(doc: Doc, add: Add, context: Context) {
  requireSections(doc, add, "log/sections", [["Done", /^Done/i], ["Dropped", /^Dropped/i], ["Reviews", /^Reviews/i]], true);
  for (const [name, test] of [["Done", /^Done/i], ["Dropped", /^Dropped/i], ["Reviews", /^Reviews/i]] as const) {
    const section = findSection(doc.h2, test);
    if (!section) continue;
    const list = bullets(doc.lines, section);
    for (const b of list) {
      if (!/^\d{4}-\d{2}-\d{2}\s+\S/.test(b.text)) {
        add(b.n, "log/line", "A log line starts with YYYY-MM-DD.");
        continue;
      }
      if (name === "Done") {
        if (!/^\S+\s+R-\d{3,}\s+\S/.test(b.text)) add(b.n, "log/line", "A Done line names its item: `<date> R-NNN <Title>. ...`.");
        const absent = ["Milestone", "Owner", "Plan", "Result"].filter((key) => !new RegExp(`(^|\\s)${key}:`).test(b.text));
        if (absent.length) add(b.n, "log/line", `The Done line has no ${absent.map((k) => `\`${k}:\``).join(", ")}.`);
      }
      if (name === "Dropped" && !/(^|\s)Reason:/.test(b.text)) add(b.n, "log/line", "A Dropped line has `Reason:`.");
    }
    outOfOrder(list, add, "log/order", `\`## ${name}\` is newest first.`);
  }
  const seen = new Set<string>();
  for (const d of context.done) {
    if (seen.has(d.id)) add(d.n, "log/id-unique", `${d.id} has a second Done line.`);
    seen.add(d.id);
  }
}

export interface RiskBlock {
  id: string;
  title: string;
  /** The full heading text after `### `, which names a technology. */
  name: string;
  heading: number;
  start: number;
  end: number;
  fields: Map<string, Field>;
  list: Field[];
}

export function riskBlocks(lines: Line[], section: Section): RiskBlock[] {
  return sections(lines, 3, section)
    .slice(1)
    .map((block) => {
      const match = /^(RK-\d{3,})\s+(.+)$/.exec(block.heading!.text);
      const list = fields(lines, block);
      return { id: match?.[1] ?? "", title: match?.[2] ?? block.heading!.text, name: block.heading!.text, heading: block.heading!.n, start: block.start, end: block.end, fields: fieldMap(list), list };
    });
}

function checkRisks(doc: Doc, add: Add) {
  requireSections(doc, add, "risks/sections", [["Open", /^Open/i], ["Closed", /^Closed/i], ["Removed", /^Removed/i]], true);
  const ids = new Map<string, number>();
  const seenId = (id: string, n: number) => {
    if (ids.has(id)) add(n, "risks/id-unique", `${id} is also on line ${ids.get(id)}.`);
    else ids.set(id, n);
  };
  for (const [name, test] of [["Open", /^Open/i], ["Closed", /^Closed/i]] as const) {
    const section = findSection(doc.h2, test);
    if (!section) continue;
    const blocks = riskBlocks(doc.lines, section);
    for (const risk of blocks) {
      if (!risk.id) {
        add(risk.heading, "risks/risk", `"${risk.title}" is not \`RK-NNN <Title>\`.`);
        continue;
      }
      seenId(risk.id, risk.heading);
      if (risk.title.split(/\s+/).length > 8) add(risk.heading, "title/length", `The title has ${risk.title.split(/\s+/).length} words; the limit is 8.`);
      checkBlockFields(risk.list, KEYS.risk, add, risk.heading);
      const required = name === "Closed" ? KEYS.risk : KEYS.risk.slice(0, -1);
      const absent = missing(risk.fields, required);
      if (absent.length) add(risk.heading, "risks/risk", `${risk.id} has no ${absent.map((k) => `\`${k}\``).join(", ")}.`);
      const order = risk.list.map((f) => KEYS.risk.findIndex((k) => k.toLowerCase() === f.key.toLowerCase())).filter((i) => i >= 0);
      if (order.some((index, i) => i > 0 && index < order[i - 1]!)) add(risk.heading, "risks/risk", `${risk.id}'s fields are out of order (${KEYS.risk.join(", ")}).`);
      const get = (key: string) => val(risk.fields, key);
      const at = (key: string) => lineOf(risk.fields, key, risk.heading);
      for (const key of ["Likelihood", "Impact"]) if (risk.fields.has(key.toLowerCase()) && !LEVELS.includes(get(key))) add(at(key), "risks/values", `${key} "${get(key)}" is not low, medium, or high.`);
      if (risk.fields.has("rag") && !(get("RAG") in RAG_RANK)) add(at("RAG"), "risks/values", `RAG "${get("RAG")}" is not red, amber, or green.`);
      if (risk.fields.has("owner") && !/^(agent|user|both)$/.test(get("Owner"))) add(at("Owner"), "risks/values", `Owner "${get("Owner")}" is not agent, user, or both.`);
      if (risk.fields.has("raised") && !/^\d{4}-\d{2}-\d{2}\b/.test(get("Raised"))) add(at("Raised"), "risks/values", "Raised starts with YYYY-MM-DD.");
      if (risk.fields.has("reviewed") && get("Reviewed") !== "never" && !isDate(get("Reviewed"))) add(at("Reviewed"), "risks/values", `Reviewed "${get("Reviewed")}" is not never or YYYY-MM-DD.`);
      const derived = derivedRag(get("Likelihood"), get("Impact"));
      const override = get("RAG override");
      if (derived && get("RAG") in RAG_RANK && /^(none)?$/i.test(override) && get("RAG") !== derived) {
        add(at("RAG"), "risks/rag", `RAG is ${get("RAG")}; ${get("Likelihood")} × ${get("Impact")} derives ${derived} and there is no RAG override.`);
      }
      const status = get("Status");
      if (name === "Open") {
        if (!/^(open|mitigating|accepted)$/.test(status)) add(at("Status"), "risks/section-status", `An open risk's Status is open, mitigating, or accepted, not "${status}".`);
        if (risk.fields.has("closed")) add(at("Closed"), "risks/section-status", "An open risk has no `Closed`.");
      } else {
        if (status !== "closed") add(at("Status"), "risks/section-status", `A closed risk's Status is closed, not "${status}".`);
        if (risk.fields.has("closed") && !/^\d{4}-\d{2}-\d{2}: \S/.test(get("Closed"))) add(at("Closed"), "risks/section-status", "Closed is `YYYY-MM-DD: <reason>`.");
      }
    }
    if (name === "Open") {
      const key = (r: RiskBlock) => [RAG_RANK[val(r.fields, "RAG")] ?? 3, idNumber(r.id)] as const;
      const bad = blocks.find((r, i) => {
        if (i === 0) return false;
        const [a, b] = [key(blocks[i - 1]!), key(r)];
        return b[0] < a[0] || (b[0] === a[0] && b[1] < a[1]);
      });
      if (bad) add(bad.heading, "risks/order", "Open is ordered red, amber, green, then by ID.");
    }
  }
  const removed = findSection(doc.h2, /^Removed/i);
  if (removed) {
    for (const b of bullets(doc.lines, removed)) {
      const match = /^(\d{4}-\d{2}-\d{2}) (RK-\d{3,}) .+\. Reason: .+$/.exec(b.text);
      if (!match) add(b.n, "risks/removed", "A removed risk is `- YYYY-MM-DD RK-NNN <title>. Reason: <reason>.`");
      else seenId(match[2]!, b.n);
    }
  }
}

/** One `###` block in ENGINEERING.md: a technology (`id` empty) or a principle (`id` is EP-NNN when the heading has one). */
export interface EngineeringBlock {
  id: string;
  title: string;
  /** The full heading text after `### `, which names a technology. */
  name: string;
  heading: number;
  start: number;
  end: number;
  fields: Map<string, Field>;
  list: Field[];
}

const PRINCIPLE_ID = /^(EP-\d{3,})\s+(.+)$/;
const REMOVED_ENGINEERING = /^\d{4}-\d{2}-\d{2} .+\. Reason: .+\.$/;
const REMOVED_EP = /^\d{4}-\d{2}-\d{2} (EP-\d{3,})\b/;

export function engineeringBlocks(lines: Line[], section: Section): EngineeringBlock[] {
  return sections(lines, 3, section)
    .slice(1)
    .map((block) => {
      const match = PRINCIPLE_ID.exec(block.heading!.text);
      const list = fields(lines, block);
      return { id: match?.[1] ?? "", title: match?.[2] ?? block.heading!.text, name: block.heading!.text, heading: block.heading!.n, start: block.start, end: block.end, fields: fieldMap(list), list };
    });
}

/** Lowercased technology names, compared for order and duplicates. */
const techKey = (block: EngineeringBlock) => block.name.toLowerCase();

function checkEngineeringValues(block: EngineeringBlock, add: Add, context: Context) {
  const get = (key: string) => val(block.fields, key);
  const at = (key: string) => lineOf(block.fields, key, block.heading);
  const name = block.id || block.title;
  if (block.fields.has("check") && !/^`[^`]+`$|^review$/.test(get("Check"))) add(at("Check"), "engineering/values", `${name}: Check is a backticked command or review, not "${get("Check")}".`);
  if (block.fields.has("decision")) {
    const decision = get("Decision");
    if (!/^none$/i.test(decision)) {
      const adr = /^ADR-\d{3,}$/.test(decision) ? context.adrs.find((a) => a.id === decision) : undefined;
      if (!adr) add(at("Decision"), "engineering/values", `${name}: Decision is none or one ADR in the decisions folder, not "${decision}".`);
      else if (/^superseded\b/i.test(adr.status) || /^deprecated$/i.test(adr.status)) {
        add(at("Decision"), "engineering/decision-current", `${name}: ${adr.id} is ${adr.status}; run pm-engineering change.`);
      }
    }
  }
  if (block.fields.has("source") && get("Source") === "") add(at("Source"), "engineering/values", `${name}: Source is empty.`);
  if (block.fields.has("added") && !isDate(get("Added"))) add(at("Added"), "engineering/values", `${name}: Added "${get("Added")}" is not YYYY-MM-DD.`);
}

function checkEngineering(doc: Doc, add: Add, context: Context) {
  requireSections(doc, add, "engineering/sections", [["Technology", /^Technology/i], ["Principles", /^Principles/i], ["Removed", /^Removed/i]], true);
  const technology = findSection(doc.h2, /^Technology/i);
  if (technology) {
    const blocks = engineeringBlocks(doc.lines, technology);
    const seen = new Map<string, number>();
    for (const block of blocks) {
      const key = techKey(block);
      if (seen.has(key)) add(block.heading, "engineering/technology", `${block.name} is also on line ${seen.get(key)}.`);
      else seen.set(key, block.heading);
      checkBlockFields(block.list, KEYS.technology, add, block.heading, "engineering/technology");
      checkEngineeringValues(block, add, context);
    }
    const bad = blocks.find((b, i) => i > 0 && techKey(b).localeCompare(techKey(blocks[i - 1]!), "en") < 0);
    if (bad) add(bad.heading, "engineering/order", "Technology is ordered alphabetically.");
  }
  const ids = new Map<string, number>();
  const seenId = (id: string, n: number) => {
    if (ids.has(id)) add(n, "engineering/id-unique", `${id} is also on line ${ids.get(id)}.`);
    else ids.set(id, n);
  };
  const principles = findSection(doc.h2, /^Principles/i);
  if (principles) {
    const blocks = engineeringBlocks(doc.lines, principles);
    for (const block of blocks) {
      if (!block.id) {
        add(block.heading, "engineering/principle", `"${block.title}" is not \`EP-NNN <Title>\`.`);
        continue;
      }
      seenId(block.id, block.heading);
      const words = block.title.split(/\s+/).length;
      if (words > 8) add(block.heading, "title/length", `The title has ${words} words; the limit is 8.`);
      checkBlockFields(block.list, KEYS.principle, add, block.heading, "engineering/principle");
      checkEngineeringValues(block, add, context);
    }
    const numbered = blocks.filter((b) => b.id);
    const bad = numbered.find((b, i) => i > 0 && idNumber(b.id) < idNumber(numbered[i - 1]!.id));
    if (bad) add(bad.heading, "engineering/order", "Principles are ordered by ID.");
  }
  const removed = findSection(doc.h2, /^Removed/i);
  if (removed) {
    const list = bullets(doc.lines, removed);
    for (const b of list) {
      if (!REMOVED_ENGINEERING.test(b.text)) add(b.n, "engineering/removed", "A removed entry is `- YYYY-MM-DD <Name or EP-NNN title>. Reason: <reason>.`");
      const id = REMOVED_EP.exec(b.text)?.[1];
      if (id) seenId(id, b.n);
    }
    const date = (text: string) => /^(\d{4}-\d{2}-\d{2})/.exec(text)?.[1] ?? "";
    const bad = list.find((b, i) => i > 0 && date(b.text) > date(list[i - 1]!.text));
    if (bad) add(bad.n, "engineering/order", "Removed is newest first.");
  }
}

function checkInbox(doc: Doc, add: Add) {
  const name = doc.rel.split("/").at(-1)!;
  if (!/^\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(name)) add(1, "inbox/filename", `"${name}" is not YYYY-MM-DD-HHMM-<slug>.md.`);
  const title = headings(doc.lines).find((h) => h.level === 1);
  if (title && title.text.split(/\s+/).length > 8) add(title.n, "title/length", `The title has ${title.text.split(/\s+/).length} words; the limit is 8.`);
  const list = fields(doc.lines, doc.h2[0]!);
  const map = fieldMap(list);
  checkBlockFields(list, KEYS.inbox, add, 1);
  const get = (key: string) => val(map, key);
  const at = (key: string) => lineOf(map, key, title?.n ?? 1);
  for (const key of missing(map, ["Captured", "Source", "Kind"])) add(title?.n ?? 1, "inbox/fields", `The inbox file has no \`${key}\`.`);
  if (map.has("captured") && !DATE_TIME.test(get("Captured"))) add(at("Captured"), "inbox/fields", `Captured "${get("Captured")}" is not YYYY-MM-DD HH:MM.`);
  if (map.has("source") && !/^(user|agent( \(.+\))?)$/.test(get("Source"))) add(at("Source"), "inbox/fields", `Source "${get("Source")}" is not user or agent (<skill or item ID and stage>).`);
  const kind = get("Kind");
  if (map.has("kind") && !/^(feature|bug|improvement|question|inspiration|tech-debt)$/.test(kind)) add(at("Kind"), "inbox/fields", `Kind "${kind}" is not feature, bug, improvement, question, inspiration, or tech-debt.`);
  if (map.has("discuss") && !/^(yes|no)$/.test(get("Discuss"))) add(at("Discuss"), "inbox/fields", `Discuss "${get("Discuss")}" is not yes or no.`);
  if (map.has("reviewed") && get("Reviewed") !== "never" && !isDate(get("Reviewed"))) add(at("Reviewed"), "inbox/fields", `Reviewed "${get("Reviewed")}" is not never or YYYY-MM-DD.`);
  if (kind === "bug" && !map.has("severity")) add(at("Kind"), "inbox/fields", "A bug has a `Severity`.");
  if (map.has("severity") && !/^(blocker|major|minor|cosmetic)$/.test(get("Severity"))) add(at("Severity"), "inbox/fields", `Severity "${get("Severity")}" is not blocker, major, minor, or cosmetic.`);
  if (kind !== "bug" && map.has("severity")) add(at("Severity"), "inbox/bug", "Only a bug has a Severity.");
  const idea = findSection(doc.h2, /^Idea$/i);
  if (!idea || sectionText(doc.lines, idea) === "") add(idea?.heading?.n ?? 1, "inbox/idea", "`## Idea` holds the idea, verbatim.");
  if (kind === "bug" && !findSection(doc.h2, /^Reproduction$/i)) add(1, "inbox/bug", "A bug has a `## Reproduction` section.");
  for (const section of doc.h2.slice(1)) {
    if (!/^(Idea|Reproduction|Links|Notes)$/i.test(section.heading!.text)) add(section.heading!.n, "inbox/sections", `\`## ${section.heading!.text}\` is not an inbox section (Idea, Reproduction, Links, Notes).`);
  }
}

function checkBrief(doc: Doc, add: Add) {
  const name = doc.rel.split("/").at(-1)!;
  if (!/^(R-\d{3,}|\d{4}-\d{2}-\d{2})-[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(name)) add(1, "brief/filename", `"${name}" is not R-NNN-<slug>.md or YYYY-MM-DD-<slug>.md.`);
  const list = fields(doc.lines, doc.h2[0]!);
  const map = fieldMap(list);
  checkBlockFields(list, KEYS.brief, add, 1);
  for (const key of missing(map, KEYS.brief)) add(1, "brief/header", `The brief has no \`${key}\`.`);
  const status = map.get("status");
  if (status && !/^(shaping|parked|on roadmap \([^)]+\)|done|dropped)(?=$|[\s,;.])/.test(status.value)) add(status.n, "brief/header", `Status "${status.value}" is not shaping, parked, on roadmap (<IDs>), done, or dropped.`);
  const updated = map.get("updated");
  if (updated && !isDate(updated.value)) add(updated.n, "brief/header", `Updated "${updated.value}" is not YYYY-MM-DD.`);
  const present = doc.h2.slice(1).map((s) => s.heading!);
  const wanted = [...BRIEF_HEADINGS];
  if (present.at(-1)?.text === "Revisions") wanted.push("Revisions");
  const first = present.findIndex((h, i) => h.text !== wanted[i]);
  if (first !== -1 || present.length !== wanted.length) {
    const at = present[first === -1 ? present.length - 1 : first];
    const expected = wanted[first === -1 ? present.length : first];
    add(at?.n ?? 1, "brief/sections", expected ? `Expected \`## ${expected}\` here; the headings are ${BRIEF_HEADINGS.join(", ")}, then optionally Revisions.` : `\`## ${at?.text}\` is not a brief heading.`);
  }
}

const ADR_ID = /^ADR-\d{3,}$/;
const ADR_STATUS = /^(proposed|accepted|deprecated|superseded by (ADR-\d{3,}))$/;
const ADR_SECTIONS = ["Context", "Decision", "Alternatives", "Consequences"];

function checkAdr(doc: Doc, add: Add, context: Context) {
  const h1 = headings(doc.lines).find((h) => h.level === 1);
  const at = h1?.n ?? 1;
  const titleMatch = h1 && /^(ADR-\d{3,})\s+\S.*$/.exec(h1.text);
  if (!titleMatch) add(at, "adr/header", `"${h1?.text ?? ""}" is not \`ADR-NNN <Title>\`.`);
  const selfId = titleMatch?.[1];

  const list = fields(doc.lines, doc.h2[0]!);
  const map = fieldMap(list);
  checkBlockFields(list, KEYS.adr, add, at, "adr/header");
  const get = (key: string) => val(map, key);
  const fieldAt = (key: string) => lineOf(map, key, at);

  const status = get("Status");
  const statusMatch = ADR_STATUS.exec(status);
  if (map.has("status") && !statusMatch) add(fieldAt("Status"), "adr/header", `Status "${status}" is not proposed, accepted, superseded by ADR-NNN, or deprecated.`);
  if (map.has("date") && !isDate(get("Date"))) add(fieldAt("Date"), "adr/header", `Date "${get("Date")}" is not YYYY-MM-DD.`);
  if (map.has("category") && get("Category").trim() === "") add(fieldAt("Category"), "adr/header", "Category is empty.");
  const supersedes = get("Supersedes");
  const supersedesOk = /^none$/i.test(supersedes) || ADR_ID.test(supersedes);
  if (map.has("supersedes") && !supersedesOk) add(fieldAt("Supersedes"), "adr/header", `Supersedes "${supersedes}" is not ADR-NNN or none.`);
  const item = get("Item");
  const itemMatch = /^(R-\d{3,})$/.exec(item);
  if (map.has("item") && !/^none$/i.test(item) && !itemMatch) add(fieldAt("Item"), "adr/header", `Item "${item}" is not R-NNN or none.`);
  if (map.has("source") && get("Source").trim() === "") add(fieldAt("Source"), "adr/header", "Source is empty.");

  // adr/sections
  const names = doc.h2.slice(1).map((section) => section.heading!.text);
  if (names.join("|") !== ADR_SECTIONS.join("|")) {
    add(
      doc.h2[1]?.heading?.n ?? at,
      "adr/sections",
      `The sections are ${names.map((name) => `\`## ${name}\``).join(", ") || "missing"}; they must be ${ADR_SECTIONS.map((name) => `\`## ${name}\``).join(", ")}.`,
    );
  }

  // adr/id
  const name = doc.rel.split("/").at(-1)!;
  const fileMatch = /^ADR-(\d{3,})-[a-z0-9-]+\.md$/.exec(name);
  if (!fileMatch) add(at, "adr/id", `"${name}" is not \`ADR-NNN-<slug>.md\`.`);
  else if (selfId && `ADR-${fileMatch[1]}` !== selfId) add(at, "adr/id", `"${name}"'s heading is ${selfId}, not ADR-${fileMatch[1]}.`);
  if (selfId) {
    const dupes = context.adrs.filter((adr) => adr.id === selfId && adr.rel !== doc.rel);
    if (dupes.length) add(at, "adr/id", `${selfId} is also the heading of ${dupes.map((adr) => adr.rel).join(", ")}.`);
  }

  // adr/links
  if (selfId && map.has("supersedes") && supersedesOk && ADR_ID.test(supersedes)) {
    const target = context.adrs.find((adr) => adr.id === supersedes);
    if (!target || target.status !== `superseded by ${selfId}`) add(fieldAt("Supersedes"), "adr/links", `Supersedes ${supersedes}, but ${supersedes} is not marked superseded by ${selfId}.`);
  }
  if (selfId && statusMatch?.[2]) {
    const target = context.adrs.find((adr) => adr.id === statusMatch[2]);
    if (!target || target.supersedes !== selfId) add(fieldAt("Status"), "adr/links", `Status says superseded by ${statusMatch[2]}, but ${statusMatch[2]} does not supersede ${selfId}.`);
  }
  if (map.has("item") && !/^none$/i.test(item) && itemMatch && !knownIds(context).has(itemMatch[1]!)) {
    add(fieldAt("Item"), "adr/links", `${itemMatch[1]} is not an item in ROADMAP.md, NOW.md, or LOG.md.`);
  }
}

function checkStack(doc: Doc, add: Add) {
  for (const block of sections(doc.lines, 3).slice(1)) {
    const h = block.heading!;
    if (!/^R-\d{3,}\s+\S/.test(h.text)) {
      add(h.n, "stack/entry", `"${h.text}" is not \`R-NNN <Title>\`.`);
      continue;
    }
    const list = fields(doc.lines, block);
    checkBlockFields(list, KEYS.stack, add, h.n);
    for (const key of missing(fieldMap(list), ["Pushed", "Branch", "Stage", "Reason", "Done when", "Checkpoint"])) add(h.n, "stack/entry", `The entry has no \`${key}\`.`);
  }
}

function checkPause(doc: Doc, add: Add) {
  const list = fields(doc.lines, doc.h2[0]!);
  const map = fieldMap(list);
  checkBlockFields(list, KEYS.pause, add, 1);
  for (const key of missing(map, KEYS.pause.slice(0, 5))) add(1, "pause/fields", `PAUSE.md has no \`${key}\`.`);
  if (map.has("paused") && !DATE_TIME.test(val(map, "Paused"))) add(lineOf(map, "paused", 1), "pause/fields", "Paused is YYYY-MM-DD HH:MM.");
  const resume = findSection(doc.h2, /^Resume with$/i);
  if (!resume) add(1, "pause/fields", "PAUSE.md has no `## Resume with`.");
  else for (const key of missing(fieldMap(fields(doc.lines, resume)), KEYS.resume)) add(resume.start - 1, "pause/fields", `\`## Resume with\` has no \`${key}\`.`);
  if (!findSection(doc.h2, /^Context$/i)) add(1, "pause/fields", "PAUSE.md has no `## Context`.");
}

// ---------------------------------------------------------------- Fixes

/** Apply the fixable structure rules to one file: key case, RAG, risk order, log and decision order. */
export function fixStructure(rel: string, text: string): string {
  const kind = kindOf(rel);
  let lines = parseLines(text);
  let out = lines.map((line) => line.text);
  const known = FILE_KEYS[kind];
  if (known) {
    for (const field of fields(lines, { start: 1, end: lines.length })) {
      const canonical = known.find((key) => key.toLowerCase() === field.key.toLowerCase());
      if (canonical && canonical !== field.key) out[field.n - 1] = out[field.n - 1]!.replace(field.key, canonical);
    }
  }
  if (kind === "risks") {
    lines = parseLines(out.join("\n") + "\n");
    for (const section of sections(lines, 2).slice(1)) {
      for (const risk of riskBlocks(lines, section)) {
        const rag = risk.fields.get("rag");
        const derived = derivedRag(val(risk.fields, "Likelihood"), val(risk.fields, "Impact"));
        if (rag && derived && rag.value in RAG_RANK && /^(none)?$/i.test(val(risk.fields, "RAG override")) && rag.value !== derived) {
          out[rag.n - 1] = out[rag.n - 1]!.replace(/(RAG:\s*)\S+/, `$1${derived}`);
        }
      }
    }
    lines = parseLines(out.join("\n") + "\n");
    const open = findSection(sections(lines, 2), /^Open/i);
    if (open) {
      const blocks = riskBlocks(lines, open);
      const sorted = [...blocks].sort((a, b) => (RAG_RANK[val(a.fields, "RAG")] ?? 3) - (RAG_RANK[val(b.fields, "RAG")] ?? 3) || idNumber(a.id) - idNumber(b.id));
      if (blocks.length > 1 && sorted.some((block, i) => block !== blocks[i])) {
        const chunk = (b: RiskBlock) => trimBlank(out.slice(b.heading - 1, b.end));
        const replaced = sorted.flatMap((b, i) => (i ? ["", ...chunk(b)] : chunk(b)));
        out = [...out.slice(0, blocks[0]!.heading - 1), ...replaced, "", ...out.slice(blocks.at(-1)!.end)];
      }
    }
  }
  if (kind === "engineering") {
    // Principles before Technology in the file is a section-order error, not a fix; sort each in place, bottom first.
    lines = parseLines(out.join("\n") + "\n");
    const h2 = sections(lines, 2);
    const targets = [
      { section: findSection(h2, /^Technology/i), compare: (a: EngineeringBlock, b: EngineeringBlock) => techKey(a).localeCompare(techKey(b), "en") },
      { section: findSection(h2, /^Principles/i), compare: (a: EngineeringBlock, b: EngineeringBlock) => Number(!a.id) - Number(!b.id) || (a.id && b.id ? idNumber(a.id) - idNumber(b.id) : 0) },
    ].filter((t): t is { section: Section; compare: (a: EngineeringBlock, b: EngineeringBlock) => number } => !!t.section).sort((a, b) => b.section.start - a.section.start);
    for (const { section, compare } of targets) {
      const blocks = engineeringBlocks(lines, section);
      const sorted = [...blocks].sort(compare);
      if (blocks.length > 1 && sorted.some((block, i) => block !== blocks[i])) {
        const chunk = (b: EngineeringBlock) => trimBlank(out.slice(b.heading - 1, b.end));
        const replaced = sorted.flatMap((b, i) => (i ? ["", ...chunk(b)] : chunk(b)));
        out = [...out.slice(0, blocks[0]!.heading - 1), ...replaced, "", ...out.slice(blocks.at(-1)!.end)];
      }
    }
    lines = parseLines(out.join("\n") + "\n");
    const removed = findSection(sections(lines, 2), /^Removed/i);
    if (removed) out = sortByDate(out, lines, removed);
  }
  if (kind === "log" || kind === "strategy") {
    lines = parseLines(out.join("\n") + "\n");
    const targets = kind === "log" ? [/^Done/i, /^Dropped/i, /^Reviews/i] : [/^Decisions/i];
    // Work from the bottom up so earlier line numbers stay valid.
    const found = targets.map((test) => findSection(sections(lines, 2), test)).filter((s): s is Section => !!s).sort((a, b) => b.start - a.start);
    for (const section of found) out = sortByDate(out, lines, section);
  }
  return out.join("\n") + "\n";
}

const trimBlank = (list: string[]) => {
  const copy = [...list];
  while (copy.length && copy.at(-1)!.trim() === "") copy.pop();
  return copy;
};

/** Sort a section's dated bullets newest first (stable), when they form one run of bullets. */
function sortByDate(out: string[], lines: Line[], section: Section): string[] {
  const list = bullets(lines, section);
  if (list.length < 2) return out;
  const first = list[0]!.n;
  const last = list.at(-1)!.end;
  // Only lines of the bullets themselves (or blanks) between the first and the last.
  for (let n = first; n <= last; n++) {
    const line = lines[n - 1]!;
    if (line.text.trim() !== "" && !list.some((b) => n >= b.n && n <= b.end)) return out;
    if (!isContent(line) && line.text.trim() !== "") return out;
  }
  const date = (b: { text: string }) => /^(\d{4}-\d{2}-\d{2})/.exec(b.text)?.[1] ?? "";
  const sorted = [...list].sort((a, b) => date(b).localeCompare(date(a)));
  if (sorted.every((b, i) => b === list[i])) return out;
  const chunks = sorted.flatMap((b) => out.slice(b.n - 1, b.end));
  return [...out.slice(0, first - 1), ...chunks, ...out.slice(last)];
}
