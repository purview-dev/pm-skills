import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkFormat, fixFormat } from "./format.ts";
import { fix, hookSnippet, lint, main } from "./lint.ts";
import { RULES } from "./rules.ts";
import { buildContext, checkStructure, fixStructure, KEYS } from "./structure.ts";

const SKILLS = join(import.meta.dir, "..", "..");
// The synthetic repository pm-export's tests use: every PM file, written as the skills write them.
const FIXTURE = join(SKILLS, "pm-export", "scripts", "__fixtures__", "repo");

const temps: string[] = [];
const temp = () => {
  const dir = mkdtempSync(join(tmpdir(), "pm-lint-"));
  temps.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A copy of the fixture repository, with some PM files replaced. */
function repo(changes: Record<string, (text: string) => string> = {}, without: string[] = []): string {
  const root = temp();
  cpSync(FIXTURE, root, { recursive: true });
  for (const rel of without) rmSync(join(root, "planning", rel), { recursive: true, force: true });
  for (const [rel, change] of Object.entries(changes)) {
    const path = join(root, "planning", rel);
    let text = "";
    try {
      text = readFileSync(path, "utf8");
    } catch {}
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, change(text));
  }
  return root;
}

/** As repo, without the fixture's own ADRs, so a test's ADR IDs never collide with them. */
function adrRepo(changes: Record<string, (text: string) => string> = {}): string {
  return repo(changes, ["decisions"]);
}

const rulesOf = async (root: string) => (await lint({ root, pmRoot: "planning/", noExport: true })).map((f) => f.rule);

/** The pm-init templates as pm-init writes them into a fresh PM root. */
function initRoot(): string {
  const root = temp();
  const templates = join(SKILLS, "pm-init", "templates");
  for (const dir of ["inbox", "briefs", "research", "decisions"]) mkdirSync(join(root, "planning", dir), { recursive: true });
  for (const file of readdirSync(templates)) {
    const text = readFileSync(join(templates, file), "utf8").replaceAll("{{PM_ROOT}}", "planning/");
    const target = file.endsWith("-README.md") ? join("planning", file.replace("-README.md", ""), "README.md") : join("planning", file);
    writeFileSync(join(root, target), text);
  }
  return root;
}

describe("clean PM state", () => {
  it("passes for a fresh pm-init install", async () => {
    expect(await lint({ root: initRoot(), pmRoot: "planning/" })).toEqual([]);
  });

  it("writes ENGINEERING.md on a fresh install", () => {
    expect(existsSync(join(initRoot(), "planning", "ENGINEERING.md"))).toBe(true);
  });

  it("passes for the fixture project, with the export built and validated", async () => {
    const findings = await lint({ root: repo(), pmRoot: "planning/" });
    expect(findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(findings.map((f) => f.rule)).toEqual(["roadmap/later-order"]);
  });
});

describe("format rules", () => {
  const messy = "#Title\nText\n* one\n+ two\nafter\n```\ncode  \n```\n\n\n## Next ##\n- a\t\n\n";

  it("names each formatting problem", () => {
    const rules = checkFormat(messy).map((issue) => issue.rule);
    for (const rule of ["format/heading-space", "format/heading-blank", "format/list-marker", "format/list-blank", "format/fence-blank", "format/blank-lines", "format/trailing-space", "format/tabs", "format/final-newline", "format/first-heading"]) {
      expect(rules).toContain(rule);
    }
  });

  it("fixes every fixable problem, idempotently, and leaves code alone", () => {
    const fixed = fixFormat(messy);
    expect(fixed).toBe("# Title\n\nText\n\n- one\n- two\n\nafter\n\n```\ncode  \n```\n\n## Next\n\n- a\n");
    expect(fixFormat(fixed)).toBe(fixed);
    expect(checkFormat(fixed)).toEqual([]);
  });

  it("does not touch HTML comments, and reports what it cannot fix", () => {
    const text = "# A\n\n<!--\n### R-007 <Title>\n- Status: x\n-->\n\n### Skipped level\n\n# Second\n\n```\nopen\n";
    const rules = checkFormat(text).map((issue) => issue.rule);
    expect(rules).toEqual(["format/heading-increment", "format/single-h1", "format/unclosed"]);
    expect(fixFormat("# A\n\n<!--\n### X\n- y\n-->\n")).toBe("# A\n\n<!--\n### X\n- y\n-->\n");
  });
});

describe("structure rules", () => {
  it("checks roadmap items: fields, values, references, cycles, and limits", async () => {
    const root = repo({
      "ROADMAP.md": (text) =>
        text
          .replace("- Size: S\n- Depends on: none\n- Status: ready\n\n### R-009", "- Size: XL\n- Depends on: R-404\n- Status: ready\n\n### R-009")
          .replace("- Owner: user", "- Owner: someone")
          .replace("- Status: blocked (waiting on the design review, since 2026-11-03)", "- Status: blocked")
          .replace("- Serves: V2\n- Milestone: M2", "- Serves: V9\n- Milestone: M7\n- Colour: blue")
          .replace("### R-013 Tenant notes", "### R-13 Tenant notes")
          .replace("- Depends on: R-009 Open a Stripe account", "- Depends on: R-010")
          .replace("- Revisits: R-006 Tenant model", "- Revisits: R-011"),
    });
    const rules = await rulesOf(root);
    for (const rule of ["roadmap/size", "roadmap/depends", "roadmap/owner", "roadmap/status", "roadmap/serves", "roadmap/milestone", "fields/unknown", "roadmap/item", "roadmap/revisits"]) {
      expect(rules).toContain(rule);
    }
  });

  it("reports a roadmap item's Depends on or Revisits when present but blank, not just when invalid", async () => {
    const root = repo({
      "ROADMAP.md": (text) =>
        text.replace("- Depends on: none\n- Status: ready\n\n### R-009", "- Depends on:\n- Status: ready\n\n### R-009").replace("- Revisits: R-006 Tenant model", "- Revisits:"),
    });
    const rules = await rulesOf(root);
    expect(rules).toContain("roadmap/depends");
    expect(rules).toContain("roadmap/revisits");
  });

  it("finds a reused ID, an active item still queued, and a full Next", async () => {
    const extra = (id: string) => `\n### ${id} Extra\n\n- Serves: V1\n- Done when: x\n- Size: S\n- Status: ready\n`;
    const root = repo({
      "ROADMAP.md": (text) => text.replace("## Later", `${extra("R-006")}${extra("R-007")}${extra("R-020")}\n## Later`),
    });
    const findings = await lint({ root, pmRoot: "planning/", noExport: true });
    expect(findings.filter((f) => f.rule === "roadmap/id-unique").map((f) => f.message)).toEqual(["R-006 is in ROADMAP.md and in LOG.md; IDs are never reused."]);
    expect(findings.some((f) => f.rule === "now/not-in-roadmap")).toBe(true);
    expect(findings.some((f) => f.rule === "roadmap/next-max")).toBe(true);
  });

  it("checks NOW.md, LOG.md, inbox files, and briefs", async () => {
    const root = repo({
      "NOW.md": (text) => text.replace("- Stage: execute", "- Stage: coding").replace("## Checkpoint 2026-11-08 14:10", "## Checkpoint yesterday"),
      "LOG.md": (text) => text.replace("- 2026-10-01 R-002", "- 2026-12-01 R-002").replace(". Reason: No pilot uses it.", "."),
      "inbox/2026-11-05-1402-invoice-total-wrong.md": (text) => text.replace("- Severity: major\n", "").replace("- Discuss: no", "- Discuss: maybe"),
      "inbox/Dark Mode.md": () => "# Dark mode\n\n- Captured: today\n- Source: me\n- Kind: wish\n\n## Idea\n\nDark.\n",
      "briefs/R-007-tenant-billing.md": (text) => text.replace("## Ramifications", "## Risks").replace("- Updated: 2026-11-08", "- Updated: soon"),
    });
    const rules = await rulesOf(root);
    for (const rule of ["now/active", "now/checkpoint", "log/order", "log/line", "inbox/fields", "inbox/filename", "brief/sections", "brief/header"]) expect(rules).toContain(rule);
  });

  it("accepts NOW.md with or without the item fields", async () => {
    // roadmap/later-order is a pre-existing, unrelated warning on this fixture (see "passes for the fixture project" above).
    const withoutLaterOrder = (rules: string[]) => rules.filter((r) => r !== "roadmap/later-order");
    expect(withoutLaterOrder(await rulesOf(repo({})))).toEqual([]); // the export fixture now has them (Task 1)
    const without = repo({ "NOW.md": (t) => t.replace("- Serves: V1\n- Owner: both\n- Size: M\n- Depends on: R-006\n- Revisits:\n", "") });
    expect(withoutLaterOrder(await rulesOf(without))).toEqual([]);
  });

  it("checks the item fields of an active NOW.md", async () => {
    const root = repo({ "NOW.md": (t) => t.replace("- Owner: both", "- Owner: someone").replace("- Size: M", "- Size: XL").replace("- Depends on: R-006", "- Depends on: R-404") });
    expect(await rulesOf(root)).toContain("now/item");
  });

  it("keeps the item fields empty when idle", async () => {
    const idle = (owner: string) => `# Now\n\n- Status: idle\n- Item:\n- Session:\n- Stage:\n- Brief:\n- Milestone:\n- Serves:\n- Owner:${owner}\n- Size:\n- Depends on:\n- Revisits:\n- Spec:\n- Plan:\n- Started:\n\n## Done when\n\n## Checkpoint\n`;
    expect((await rulesOf(repo({ "NOW.md": () => idle("") }))).filter((r) => r.startsWith("now/"))).toEqual([]);
    expect(await rulesOf(repo({ "NOW.md": () => idle(" agent") }))).toContain("now/idle");
  });

  it("accepts a Note after Revisits in NOW.md", async () => {
    const root = repo({ "NOW.md": (t) => t.replace("- Revisits:\n", "- Revisits:\n- Note: Started as is: only item in Next.\n") });
    expect((await rulesOf(root)).filter((r) => r !== "roadmap/later-order")).toEqual([]);
  });

  it("rejects a Note out of place in NOW.md", async () => {
    const root = repo({ "NOW.md": (t) => t.replace("- Serves: V1\n", "- Note: x\n- Serves: V1\n") });
    expect(await rulesOf(root)).toContain("now/fields");
  });

  it("reports a Note on an idle NOW.md", async () => {
    const idle = `# Now\n\n- Status: idle\n- Item:\n- Session:\n- Stage:\n- Brief:\n- Milestone:\n- Serves:\n- Owner:\n- Size:\n- Depends on:\n- Revisits:\n- Note: x\n- Spec:\n- Plan:\n- Started:\n\n## Done when\n\n## Checkpoint\n`;
    const rules = await rulesOf(repo({ "NOW.md": () => idle }));
    expect(rules).toContain("now/idle");
    expect(rules).not.toContain("now/fields");
  });

  it("accepts stack entries with and without Note", async () => {
    const checkpoint = "- Checkpoint:\n  - Stopped at: step 2\n  - Next action: step 3\n  - Start with: plan\n  - Decisions: none\n  - Context: none\n";
    const stack =
      "# Stack\n\n" +
      "### R-012 With a note\n\n- Pushed: 2026-11-20 10:00\n- Branch: feat/r-012-with-a-note\n- Stage: execute\n- Brief: none\n- Spec: none\n- Plan: none\n- Milestone: none\n- Serves: V1\n- Owner: agent\n- Size: S\n- Depends on: none\n- Revisits:\n- Note: kept\n- Started: 2026-11-19\n- Reason: emergency\n- Done when:\n  - a check\n" +
      checkpoint +
      "\n### R-011 Rules 19 entry\n\n- Pushed: 2026-11-18 10:00\n- Branch: feat/r-011-rules-19-entry\n- Stage: plan\n- Brief: none\n- Spec: none\n- Plan: none\n- Milestone: none\n- Started: 2026-11-17\n- Reason: emergency\n- Done when:\n  - a check\n" +
      checkpoint;
    const rules = await rulesOf(repo({ "STACK.md": () => stack }));
    expect(rules.filter((r) => r.startsWith("stack/") || r === "fields/unknown")).toEqual([]);
  });

  it("checks the risk register: values, RAG, section status, order, and removed lines", async () => {
    const root = repo({
      "RISKS.md": (text) =>
        text
          .replace("- RAG: amber\n- RAG override: none\n- Status: open", "- RAG: red\n- RAG override: none\n- Status: closed")
          // RK-002 becomes green by override, so it no longer belongs before the amber RK-003.
          .replace("- RAG: red\n- RAG override: none", "- RAG: green\n- RAG override: the provider guarantees 12 months notice")
          .replace("- 2026-11-02 RK-004 Duplicate of RK-002. Reason: duplicate.", "- RK-004 removed")
          .replace("- Likelihood: low", "- Likelihood: tiny"),
    });
    const rules = await rulesOf(root);
    for (const rule of ["risks/rag", "risks/section-status", "risks/order", "risks/removed", "risks/values"]) expect(rules).toContain(rule);
  });

  it("checks config.md, VISION.md, and STRATEGY.md", async () => {
    const root = repo({
      "config.md": (text) => text.replace("- PM state commit: always", "- PM state commit: sometimes").replace("- Max items in Next: 5", "- Max items in Next: five"),
      "VISION.md": (text) => text.replace("- V2: A new tenant", "- V1: A new tenant"),
      "STRATEGY.md": (text) => text.replace("- Status: planned", "- Status: soon").replace("- Milestone: M1", "- Milestone: M9").replace("- 2026-10-29 Bill", "- Bill"),
    });
    const rules = await rulesOf(root);
    for (const rule of ["config/commits", "config/limits", "vision/outcome", "strategy/milestone-status", "strategy/focus", "strategy/decision"]) expect(rules).toContain(rule);
  });
});

const adr = (id: string, title: string, fields: Partial<Record<string, string>> = {}, sections = ["Context", "Decision", "Alternatives", "Consequences"]) =>
  () => `# ${id} ${title}\n\n` +
    ["Status", "Date", "Category", "Supersedes", "Item", "Source"].map((k) => `- ${k}: ${fields[k] ?? { Status: "accepted", Date: "2026-11-22", Category: "architecture", Supersedes: "none", Item: "none", Source: "none" }[k]}`).join("\n") +
    "\n\n" + sections.map((s) => `## ${s}\n\nText.\n`).join("\n");

describe("ADR rules", () => {
  it("accepts the default ADR format", async () => {
    const root = adrRepo({
      "decisions/ADR-001-use-bun.md": adr("ADR-001", "Use Bun", { Item: "R-008" }),
      "decisions/ADR-1000-big-id.md": adr("ADR-1000", "Big id"),
    });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
  it("ignores the decisions README", async () => {
    const root = adrRepo({ "decisions/README.md": () => "# Decisions\n\nFree text.\n" });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
  it("accepts a CRLF ADR", async () => {
    const root = adrRepo({ "decisions/ADR-001-use-bun.md": () => adr("ADR-001", "Use Bun")().replaceAll("\n", "\r\n") });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
  it("accepts Item IDs from LOG.md", async () => {
    // In the fixture's LOG.md, R-006 is in ## Done and R-004 in ## Dropped; neither is in ROADMAP.md.
    const root = adrRepo({ "decisions/ADR-001-a.md": adr("ADR-001", "A", { Item: "R-006" }), "decisions/ADR-002-b.md": adr("ADR-002", "B", { Item: "R-004" }) });
    expect(await rulesOf(root)).not.toContain("adr/links");
  });
  it("checks the header and sections", async () => {
    const root = adrRepo({
      "decisions/ADR-001-a.md": adr("ADR-001", "A", { Status: "maybe", Date: "today", Item: "R-7" }),
      "decisions/ADR-002-b.md": adr("ADR-002", "B", {}, ["Context", "Decision", "Consequences"]),
    });
    const rules = await rulesOf(root);
    expect(rules).toContain("adr/header");
    expect(rules).toContain("adr/sections");
  });
  it("checks ADR IDs", async () => {
    const root = adrRepo({
      "decisions/ADR-001-a.md": adr("ADR-002", "A"),
      "decisions/ADR-003-b.md": adr("ADR-003", "B"),
      "decisions/ADR-003-c.md": adr("ADR-003", "C"),
      "decisions/use-bun.md": adr("ADR-004", "D"),
    });
    expect((await rulesOf(root)).filter((r) => r === "adr/id").length).toBeGreaterThanOrEqual(3);
  });
  it("checks ADR links", async () => {
    const root = adrRepo({
      "decisions/ADR-001-a.md": adr("ADR-001", "A", { Status: "superseded by ADR-002" }),
      "decisions/ADR-002-b.md": adr("ADR-002", "B"), // one-sided: Supersedes none
      "decisions/ADR-003-c.md": adr("ADR-003", "C", { Supersedes: "ADR-009" }),
      "decisions/ADR-004-d.md": adr("ADR-004", "D", { Item: "R-999" }),
    });
    expect((await rulesOf(root)).filter((r) => r === "adr/links").length).toBeGreaterThanOrEqual(3);
  });
  it("accepts a two-sided supersede", async () => {
    const root = adrRepo({
      "decisions/ADR-001-a.md": adr("ADR-001", "A", { Status: "superseded by ADR-002" }),
      "decisions/ADR-002-b.md": adr("ADR-002", "B", { Supersedes: "ADR-001" }),
    });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
});

const tech = (name: string, f: Partial<Record<string, string>> = {}) =>
  `### ${name}\n\n` +
  ["Kind", "Version", "Reason", "Decision", "Source", "Added"]
    .filter((k) => f[k] !== "OMIT")
    .map((k) => `- ${k}: ${f[k] ?? { Kind: "runtime", Version: "1.3", Reason: "Fast scripts", Decision: "ADR-002", Source: "package.json", Added: "2026-11-24" }[k]}`)
    .join("\n") + "\n";
const principle = (id: string, title: string, f: Partial<Record<string, string>> = {}) =>
  `### ${id ? `${id} ` : ""}${title}\n\n` +
  ["Rule", "Applies to", "Check", "Decision", "Source", "Added"]
    .map((k) => `- ${k}: ${f[k] ?? { Rule: "Scripts are TypeScript.", "Applies to": "scripts/**", Check: "`bun test`", Decision: "none", Source: "AGENTS.md Repository conventions", Added: "2026-11-24" }[k]}`)
    .join("\n") + "\n";
const engineering = (technology: string[], principles: string[], removed: string[] = []) =>
  `# Engineering\n\n## Technology\n\n${technology.map((t) => t + "\n").join("")}## Principles\n\n${principles.map((p) => p + "\n").join("")}## Removed\n${removed.length ? "\n" + removed.join("\n") + "\n" : ""}`;
const engFindings = async (text: string) =>
  (await lint({ root: repo({ "ENGINEERING.md": () => text }), pmRoot: "planning/", noExport: true })).filter((f) => f.file.endsWith("ENGINEERING.md"));
const engRules = async (text: string) => (await engFindings(text)).map((f) => f.rule);
const validEngineering = () =>
  engineering(
    [tech("Bun"), tech("Zod", { Kind: "library", Decision: "none" })],
    [principle("EP-001", "TypeScript for every script"), principle("EP-002", "Reviewed docs", { Check: "review" })],
    ["- 2026-11-24 Jest. Reason: replaced by bun test."],
  );

describe("engineering rules", () => {
  it("accepts a valid file", async () => {
    expect(await engFindings(validEngineering())).toEqual([]);
  });
  it("accepts a CRLF file", async () => {
    expect(await engFindings(validEngineering().replaceAll("\n", "\r\n"))).toEqual([]);
  });
  it("accepts the empty sections", async () => {
    expect(await engFindings(engineering([], []))).toEqual([]);
  });
  it("checks sections", async () => {
    expect(await engRules("# Engineering\n\n## Principles\n\n## Technology\n")).toContain("engineering/sections");
  });
  it("checks a duplicate technology name, ignoring case", async () => {
    expect(await engRules(engineering([tech("Bun"), tech("bun")], []))).toContain("engineering/technology");
  });
  it("checks missing technology fields", async () => {
    expect(await engRules(engineering([tech("Bun", { Reason: "OMIT" })], []))).toContain("engineering/technology");
  });
  it("checks technology field order", async () => {
    const text = engineering([tech("Bun").replace("- Kind: runtime\n- Version: 1.3", "- Version: 1.3\n- Kind: runtime")], []);
    expect(await engRules(text)).toContain("engineering/technology");
  });
  it("checks principle headings and titles", async () => {
    expect(await engRules(engineering([], [principle("", "Use TypeScript")]))).toContain("engineering/principle");
    expect(await engRules(engineering([], [principle("EP-1", "Use TypeScript")]))).toContain("engineering/principle");
    expect(await engRules(engineering([], [principle("EP-001", "one two three four five six seven eight nine")]))).toContain("title/length");
  });
  it("checks values", async () => {
    for (const text of [
      engineering([], [principle("EP-001", "A", { Check: "bun test" })]),
      engineering([tech("Bun", { Decision: "ADR-009" })], []),
      engineering([tech("Bun", { Decision: "ADR-002, ADR-001" })], []),
      engineering([tech("Bun", { Source: "" })], []),
      engineering([tech("Bun", { Added: "today" })], []),
    ]) expect(await engRules(text)).toContain("engineering/values");
  });
  it("warns on a superseded decision", async () => {
    const findings = await engFindings(engineering([tech("Bun", { Decision: "ADR-001" })], []));
    expect(findings.map((f) => [f.rule, f.severity])).toEqual([["engineering/decision-current", "warning"]]);
  });
  it("checks principle IDs across Principles and Removed", async () => {
    const text = engineering([], [principle("EP-001", "A")], ["- 2026-11-20 EP-001 Old rule. Reason: dropped."]);
    expect(await engRules(text)).toContain("engineering/id-unique");
  });
  it("checks removed lines", async () => {
    expect(await engRules(engineering([], [], ["- Jest removed"]))).toContain("engineering/removed");
  });
  it("checks and fixes order", async () => {
    const text = engineering(
      [tech("Zod"), tech("Bun")],
      [principle("EP-002", "B"), principle("EP-001", "A")],
      ["- 2026-11-01 Jest. Reason: old.", "- 2026-11-20 Mocha. Reason: older."],
    );
    expect(await engRules(text)).toContain("engineering/order");
    const fixed = fixStructure("ENGINEERING.md", text);
    expect(await engRules(fixed)).not.toContain("engineering/order");
    expect(fixed.indexOf("### Bun")).toBeLessThan(fixed.indexOf("### Zod"));
    expect(fixed.indexOf("### EP-001")).toBeLessThan(fixed.indexOf("### EP-002"));
    expect(fixed.indexOf("Mocha")).toBeLessThan(fixed.indexOf("Jest"));
  });
});

describe("item fields ride NOW.md and the stack", () => {
  it("carries every roadmap item field through NOW.md and the push template", () => {
    const carried = KEYS.item.filter((k) => !["Status", "Paused checkpoint"].includes(k));
    for (const key of carried.filter((k) => k !== "Done when")) expect(KEYS.now as readonly string[]).toContain(key);
    for (const key of carried) expect(KEYS.stack as readonly string[]).toContain(key);
    const skill = readFileSync(join(SKILLS, "pm-checkpoint", "SKILL.md"), "utf8");
    const template = /```markdown\n\s*### <ID> <Title>\n([\s\S]*?)```/.exec(skill)?.[1] ?? "";
    const keys = [...template.matchAll(/^\s*- ([A-Z][A-Za-z ]*):/gm)].map((m) => m[1]!);
    for (const key of carried) expect(keys).toContain(key);
    expect(keys.indexOf("Note")).toBe(keys.indexOf("Revisits") + 1);
  });
});

describe("fix", () => {
  it("repairs key case, RAG, risk order, and log order, then checks clean", async () => {
    const root = repo({
      "RISKS.md": (text) => {
        const [head, rest] = text.split("### RK-002");
        const [red, amber] = `### RK-002${rest}`.split("### RK-003");
        const closedAt = amber!.indexOf("## Closed");
        return `${head}### RK-003${amber!.slice(0, closedAt)}${red!.trimEnd()}\n\n${amber!.slice(closedAt)}`.replace("- RAG: amber\n- RAG override: none\n- Status: open", "- RAG: green\n- RAG override: none\n- Status: open");
      },
      "LOG.md": (text) => text.replace("- 2026-10-01 R-002", "- 2026-12-01 R-002"),
      "ROADMAP.md": (text) => text.replace("- Done when: A tenant receives", "- done when: A tenant receives").replace("### R-009", "\n\n\n### R-009"),
    });
    const before = await rulesOf(root);
    for (const rule of ["risks/order", "risks/rag", "log/order", "fields/key-case", "format/blank-lines"]) expect(before).toContain(rule);
    const changed = fix({ root, pmRoot: "planning/" });
    expect(changed.sort()).toEqual(["LOG.md", "RISKS.md", "ROADMAP.md"]);
    expect((await rulesOf(root)).filter((rule) => rule !== "roadmap/later-order")).toEqual([]);
    expect(fix({ root, pmRoot: "planning/" })).toEqual([]);
    const risks = readFileSync(join(root, "planning", "RISKS.md"), "utf8");
    expect(risks.indexOf("RK-002")).toBeLessThan(risks.indexOf("RK-003"));
  });

  it("keeps CRLF files CRLF", () => {
    const root = repo({ "LOG.md": (text) => text.replace(/\n/g, "\r\n") + "\r\n" });
    fix({ root, pmRoot: "planning/" });
    const text = readFileSync(join(root, "planning", "LOG.md"), "utf8");
    expect(text.endsWith("\r\n")).toBe(true);
    expect(text.endsWith("\r\n\r\n")).toBe(false);
  });

  it("never changes a value through fixStructure except the fixable rules", () => {
    const text = readFileSync(join(FIXTURE, "planning", "ROADMAP.md"), "utf8");
    expect(fixStructure("ROADMAP.md", text)).toBe(text);
  });
});

describe("the command line and hooks", () => {
  const quiet = () => {
    const log = spyOn(console, "log").mockImplementation(() => {});
    const error = spyOn(console, "error").mockImplementation(() => {});
    return () => {
      log.mockRestore();
      error.mockRestore();
    };
  };
  const git = (root: string, ...args: string[]) => Bun.spawnSync(["git", "-C", root, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args]).exitCode;

  it("--staged lints the staged content, not the working tree", async () => {
    const root = repo();
    expect(git(root, "init", "-q")).toBe(0);
    git(root, "add", "-A");
    expect(git(root, "commit", "-q", "-m", "init")).toBe(0);
    const restore = quiet();
    try {
      expect(await main(["check", "--staged", "--root", root, "--no-export"])).toBe(0); // nothing staged

      const roadmap = join(root, "planning", "ROADMAP.md");
      const good = readFileSync(roadmap, "utf8");
      writeFileSync(roadmap, good.replace("- Size: S", "- Size: XL"));
      git(root, "add", "planning/ROADMAP.md");
      writeFileSync(roadmap, good); // the working tree is clean again; the index is not
      expect(await main(["check", "--staged", "--root", root, "--no-export"])).toBe(1);

      git(root, "add", "planning/ROADMAP.md");
      writeFileSync(roadmap, good.replace("- Size: S", "- Size: XL")); // now only the working tree is wrong
      expect(await main(["check", "--staged", "--root", root, "--no-export"])).toBe(0);
    } finally {
      restore();
    }
  });

  it("ignores paths outside the PM root, and fails only on errors", async () => {
    const root = repo();
    const restore = quiet();
    try {
      expect(await main(["check", "README.md", "src/index.ts", "--root", root])).toBe(0);
      expect(await main(["check", "planning/ROADMAP.md", "--root", root, "--no-export"])).toBe(0); // a warning only
      expect(await main(["check", "planning/ROADMAP.md", "--root", root, "--no-export", "--strict"])).toBe(1);
      expect(await main(["nonsense"])).toBe(2);
    } finally {
      restore();
    }
  });

  it("expands a folder argument into the PM files under it", async () => {
    const root = repo({ "decisions/ADR-009-bad.md": adr("ADR-009", "Bad", { Status: "maybe" }) });
    const restore = quiet();
    try {
      expect(await main(["check", "planning/decisions", "--root", root, "--no-export"])).toBe(1);
    } finally {
      restore();
    }
  });

  it("prints hook configuration for lefthook, husky, and plain git", () => {
    for (const kind of ["lefthook", "husky", "git"]) expect(hookSnippet(kind, SKILLS)).toContain("check --staged");
    expect(hookSnippet("lefthook", join(SKILLS, ".."))).toContain("bun skills/pm-lint/scripts/lint.ts check --staged");
    expect(hookSnippet("svn", SKILLS)).toBeNull();
  });
});

describe("rules.md", () => {
  it("documents every rule in the catalogue, and no other", () => {
    const doc = readFileSync(join(import.meta.dir, "..", "references", "rules.md"), "utf8");
    const documented = new Set([...doc.matchAll(/^\| `([a-z0-9-]+\/[a-z0-9-]+)` \|/gm)].map((match) => match[1]));
    expect([...documented].sort()).toEqual(RULES.map((rule) => rule.id).sort());
    for (const rule of RULES) {
      const row = new RegExp(`^\\| \`${rule.id}\` \\| ${rule.severity} \\| ${rule.fixable ? "yes" : "no"} \\|`, "m");
      expect(doc).toMatch(row);
    }
  });

  it("states every rule in the same words as rules.md", () => {
    const doc = readFileSync(join(import.meta.dir, "..", "references", "rules.md"), "utf8");
    for (const rule of RULES) {
      const row = doc.split(/\r?\n/).find((line) => line.startsWith(`| \`${rule.id}\` |`));
      const description = row?.split(" | ").slice(3).join(" | ").replace(/ \|$/, "");
      expect({ id: rule.id, text: description }).toEqual({ id: rule.id, text: rule.summary });
    }
  });

  it("every rule the checks report is in the catalogue", () => {
    const ids = new Set(RULES.map((rule) => rule.id));
    const context = buildContext(new Map([["NOW.md", "# Now\n\n- Status: maybe\n"]]));
    for (const finding of checkStructure(context)) expect(ids.has(finding.rule)).toBe(true);
  });
});
