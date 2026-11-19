import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkFormat, fixFormat } from "./format.ts";
import { fix, hookSnippet, lint, main } from "./lint.ts";
import { RULES } from "./rules.ts";
import { buildContext, checkStructure, fixStructure } from "./structure.ts";

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
function repo(changes: Record<string, (text: string) => string> = {}): string {
  const root = temp();
  cpSync(FIXTURE, root, { recursive: true });
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

const rulesOf = async (root: string) => (await lint({ root, pmRoot: "planning/", noExport: true })).map((f) => f.rule);

/** The pm-init templates as pm-init writes them into a fresh PM root. */
function initRoot(): string {
  const root = temp();
  const templates = join(SKILLS, "pm-init", "templates");
  for (const dir of ["inbox", "briefs", "research"]) mkdirSync(join(root, "planning", dir), { recursive: true });
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

  it("every rule the checks report is in the catalogue", () => {
    const ids = new Set(RULES.map((rule) => rule.id));
    const context = buildContext(new Map([["NOW.md", "# Now\n\n- Status: maybe\n"]]));
    for (const finding of checkStructure(context)) expect(ids.has(finding.rule)).toBe(true);
  });
});
