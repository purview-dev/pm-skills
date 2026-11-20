import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { at, findId, firstDifference, main } from "./export.ts";
import { build, bullets, SCHEMA_PATH, serialise, stripComments, value } from "./planning.ts";
import { validate } from "./schema.ts";

// A synthetic repository, never this project's own PM state: the tests must not change when the plan does.
const FIXTURE = join(import.meta.dir, "__fixtures__", "repo");
const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const EXAMPLE = JSON.parse(readFileSync(join(import.meta.dir, "..", "references", "planning.example.json"), "utf8"));

const fixed = { now: new Date("2026-11-09T12:00:00Z"), today: "2026-11-09", branch: "feat/r-007-tenant-billing", head: "c32db71ba89f66260d678e5f9f843f557459b7b4", skillsVersion: 18 };
const { document: doc, assumptions } = build({ root: FIXTURE, ...fixed });

/** Every object's keys in the order of its schema `properties`, following $ref and oneOf. */
function keyOrderErrors(value: unknown, node: any, path = ""): string[] {
  const resolve = (n: any): any => (n?.$ref ? resolve(n.$ref.slice(2).split("/").reduce((o: any, k: string) => o[k], schema)) : n);
  node = resolve(node);
  if (node?.oneOf) {
    const option = node.oneOf.map(resolve).find((o: any) => validate(value, { ...o, $defs: schema.$defs }).length === 0);
    return option ? keyOrderErrors(value, option, path) : [];
  }
  if (Array.isArray(value)) return value.flatMap((child, i) => keyOrderErrors(child, node?.items, `${path}[${i}]`));
  if (value && typeof value === "object" && node?.properties) {
    const expected = Object.keys(node.properties).join(",");
    const actual = Object.keys(value).join(",");
    const own = expected === actual ? [] : [`${path || "/"}: ${actual} != ${expected}`];
    return [...own, ...Object.entries(value).flatMap(([key, child]) => keyOrderErrors(child, node.properties[key], `${path}.${key}`))];
  }
  return [];
}

describe("build", () => {
  it("writes a document the schema accepts, keys in schema order", () => {
    expect(validate(doc, schema)).toEqual([]);
    expect(keyOrderErrors(doc, schema)).toEqual([]);
    expect(serialise(doc).endsWith("}\n")).toBe(true);
  });

  it("changes only generatedAt between two runs over the same state", () => {
    const later = build({ root: FIXTURE, ...fixed, now: new Date("2026-11-09T18:30:00Z") }).document;
    expect(firstDifference(doc, later)?.path).toBe("generatedAt");
    expect(firstDifference({ ...doc, generatedAt: later.generatedAt }, later)).toBeNull();
  });

  it("reads the PM root from AGENTS.md and the versions from config.md", () => {
    expect(doc.project).toEqual({ pmRoot: "planning/", defaultBranch: "main", branchPattern: "feat/<id>-<slug>" });
    expect(doc.generator).toEqual({ skill: "pm-export", skillsVersion: 18, rulesVersion: 18 });
    expect(doc.source).toEqual({ branch: fixed.branch, head: fixed.head });
  });

  it("skips HTML comments and template placeholders", () => {
    expect(doc.vision.outcomes.map((o: any) => o.id)).toEqual(["V1", "V2"]);
    expect(doc.vision.constraints.stack).toBeNull();
    expect(doc.strategy.milestones.map((m: any) => m.id)).toEqual(["M1", "M2"]);
    expect(doc.log.done.map((d: any) => d.id)).toEqual(["R-006", "R-002"]);
    expect(doc.briefs[0].doneWhen).toBeNull();
    expect(doc.briefs[0].decision).toBeNull();
  });

  it("splits strategy lines on their markers and keeps the words", () => {
    expect(doc.strategy.bets[0]).toEqual({
      id: "B1",
      statement: "We believe in-app invoicing will stop churn for small teams.",
      evidence: "Three pilots asked for invoices last month.",
      signal: "A tenant pays a second invoice without asking us.",
      status: "open",
    });
    expect(doc.strategy.assumptions[0].status).toBe("holds (2026-11-01)");
    expect(doc.strategy.notDoing[0].thing).toBe("Multi-tenant SSO");
    expect(doc.strategy.decisions[0].date).toBe("2026-10-29");
    expect(doc.strategy.milestones[1].target).toBeNull();
  });

  it("reads NOW.md, its checkpoint, and the plan's tasks, skipping fenced checkboxes", () => {
    expect(doc.now.item).toEqual({ id: "R-007", title: "Tenant billing", serves: ["V1"], owner: "both", size: "M", dependsOn: ["R-006"], revisits: null });
    expect(doc.schemaVersion).toBe(4);
    expect(doc.now.doneWhen).toHaveLength(2);
    expect(doc.now.checkpoint.at).toBe("2026-11-08 14:10");
    expect(doc.now.checkpoint.openQuestion).toBeNull();
    expect(doc.plan.tasks.map((t: any) => [t.number, t.checked, t.total])).toEqual([[1, 1, 2], [2, 2, 2], [3, 0, 1]]);
    expect([doc.plan.checked, doc.plan.total]).toEqual([3, 5]);
  });

  it("labels, splits, and orders roadmap items", () => {
    const byId = Object.fromEntries([...doc.roadmap.next, ...doc.roadmap.later].map((item: any) => [item.id, item]));
    expect(doc.roadmap.next.map((item: any) => [item.id, item.label, item.claimable])).toEqual([
      ["R-008", "next", true],
      ["R-009", "next", false],
      ["R-010", "waiting", false],
      ["R-011", "blocked", false],
    ]);
    expect(byId["R-011"].status).toEqual({ value: "blocked", reason: "waiting on the design review", since: "2026-11-03" });
    expect(byId["R-010"].dependsOn).toEqual(["R-009"]);
    expect(byId["R-012"].doneWhen).toBe("A new visitor creates a tenant without our help.");
    expect(byId["R-012"].revisits).toBe("R-006");
    // Later follows the milestone order (M2 before Unassigned); positions stay the file's.
    expect(doc.roadmap.later.map((item: any) => [item.id, item.position])).toEqual([["R-012", 2], ["R-013", 1]]);
    expect(assumptions.some((line) => line.startsWith("Later in ROADMAP.md is not grouped"))).toBe(true);
  });

  it("builds the board columns pm-board renders", () => {
    const columns = doc.board.columns;
    expect(columns.now[0]).toMatchObject({ owner: "both", size: "M" });
    expect(columns.now[0].detail).toBe("execute, 3/5 plan steps");
    expect(columns.next.map((c: any) => c.id)).toEqual(["R-008"]);
    expect(columns.foryou[0].detail).toBe("blocks R-010 Charge the first invoice");
    expect(columns.waiting.map((c: any) => c.detail)).toEqual(["needs R-009 Open a Stripe account", "blocked: waiting on the design review, since 2026-11-03"]);
    expect(columns.done.map((d: any) => d.id)).toEqual(["R-006"]);
    expect(doc.board.activity.map((a: any) => a.kind)).toEqual(["done", "dropped", "review", "done"]);
  });

  it("reads the inbox, briefs, and risk register", () => {
    expect(doc.inbox.map((entry: any) => entry.file)).toEqual(["planning/inbox/2026-11-05-1402-invoice-total-wrong.md", "planning/inbox/2026-11-06-0900-dark-mode.md"]);
    expect(doc.inbox[1]).toMatchObject({ kind: "inspiration", severity: null, affects: null, related: [], discuss: "yes" });
    expect(doc.briefs[1]).toMatchObject({ id: "R-007", revisions: [{ date: "2026-11-06" }] });
    expect(doc.risks.open.map((r: any) => [r.id, r.rag])).toEqual([["RK-002", "red"], ["RK-003", "amber"]]);
    expect(doc.risks.closed[0].closed).toBe("2026-11-06: the contract is signed");
    expect(doc.risks.removed).toEqual([{ date: "2026-11-02", id: "RK-004", title: "Duplicate of RK-002", reason: "duplicate" }]);
  });

  it("derives counts and checks from the files", () => {
    expect(doc.counts).toEqual({
      next: 4, later: 2, nextMax: 5, openInbox: 2, discuss: 1, shapingBriefs: 1, done: 2, dropped: 1, blockers: 1,
      openRisks: 2, redRisks: 1, amberRisks: 1, greenRisks: 0,
    });
    expect(doc.checks).toEqual({ reviewDue: false, lastReview: "2026-11-04", claimable: ["R-008"], drift: false });
    expect(build({ root: FIXTURE, ...fixed, today: "2026-11-20" }).document.checks.reviewDue).toBe(true);
    expect(build({ root: FIXTURE, ...fixed, branch: "feat/r-012-self-serve-signup" }).document.checks.drift).toBe(false);
    expect(build({ root: FIXTURE, ...fixed, branch: "feat/r-007-other-session" }).document.checks.drift).toBe(true);
  });

  it("exports a rules 19 NOW.md without the item fields as nulls, with assumptions", () => {
    const dir = mkdtempSync(join(tmpdir(), "pm-export-strip-"));
    cpSync(FIXTURE, dir, { recursive: true });
    const nowPath = join(dir, "planning", "NOW.md");
    const stripped = readFileSync(nowPath, "utf8")
      .split("\n")
      .filter((line) => !/^- (Serves|Owner|Size|Depends on|Revisits):/.test(line))
      .join("\n");
    writeFileSync(nowPath, stripped);
    try {
      const { document, assumptions: stripAssumptions } = build({ root: dir, ...fixed });
      expect(document.now.item).toEqual({ id: "R-007", title: "Tenant billing", serves: [], owner: null, size: null, dependsOn: [], revisits: null });
      expect(document.board.columns.now[0]).toMatchObject({ owner: null, size: null });
      expect(stripAssumptions.filter((a) => a.startsWith("NOW.md has no Owner") || a.startsWith("NOW.md has no Size"))).toHaveLength(2);
      expect(validate(document, schema)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exports an idle NOW.md with all 14 keys present but empty", () => {
    const dir = mkdtempSync(join(tmpdir(), "pm-export-idle-"));
    cpSync(FIXTURE, dir, { recursive: true });
    const nowPath = join(dir, "planning", "NOW.md");
    writeFileSync(
      nowPath,
      [
        "# Now",
        "",
        "- Status: idle",
        "- Item:",
        "- Session:",
        "- Stage:",
        "- Brief:",
        "- Milestone:",
        "- Serves:",
        "- Owner:",
        "- Size:",
        "- Depends on:",
        "- Revisits:",
        "- Spec:",
        "- Plan:",
        "- Started:",
        "",
        "## Done when",
        "",
        "## Checkpoint",
        "",
      ].join("\n"),
    );
    try {
      const { document, assumptions: idleAssumptions } = build({ root: dir, ...fixed });
      expect(document.now.item).toBeNull();
      expect(document.board.columns.now).toEqual([]);
      expect(idleAssumptions.some((a) => a.startsWith("NOW.md has no Owner") || a.startsWith("NOW.md has no Size"))).toBe(false);
      expect(validate(document, schema)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("flags an invalid Owner or Size in NOW.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "pm-export-invalid-"));
    cpSync(FIXTURE, dir, { recursive: true });
    const nowPath = join(dir, "planning", "NOW.md");
    const invalid = readFileSync(nowPath, "utf8").replace("- Owner: both", "- Owner: someone").replace("- Size: M", "- Size: XL");
    writeFileSync(nowPath, invalid);
    try {
      const { document, assumptions: invalidAssumptions } = build({ root: dir, ...fixed });
      expect(document.now.item).toMatchObject({ owner: null, size: null });
      expect(invalidAssumptions.some((a) => a.includes('Owner "someone"'))).toBe(true);
      expect(invalidAssumptions.some((a) => a.includes('Size "XL"'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("Markdown helpers", () => {
  it("joins continuation lines and drops nested bullets", () => {
    expect(bullets("- a\n  b\n  - nested\n- c\n")).toEqual(["a b", "c"]);
  });

  it("treats placeholders and empty values as null", () => {
    expect([value("[M1]"), value("<path>"), value(" "), value("M1")]).toEqual([null, null, null, "M1"]);
    expect(stripComments("a<!-- b\nc -->d")).toBe("ad");
  });
});

describe("schema", () => {
  it("accepts the shipped example and names each failure by path", () => {
    expect(validate(EXAMPLE, schema)).toEqual([]);
    const broken = structuredClone(EXAMPLE);
    broken.roadmap.next[0].size = "XL";
    broken.extra = true;
    expect(validate(broken, schema).map((e) => e.path)).toEqual(["/roadmap/next/0/size", ""]);
  });
});

describe("queries", () => {
  it("reads a path and finds an ID wherever it is defined", () => {
    expect(at(doc, "roadmap.next[1].title")).toBe("Open a Stripe account");
    expect(at(doc, "counts.nextMax")).toBe(5);
    expect(at(doc, "roadmap.nowhere")).toBeUndefined();
    expect(findId(doc, "r-006").map((hit) => hit.at)).toEqual(["log.done[0]"]);
    expect(findId(doc, "M2").map((hit) => hit.at)).toEqual(["strategy.milestones[1]"]);
    expect(findId(doc, "RK-001").map((hit) => hit.at)).toEqual(["risks.closed[0]"]);
  });
});

describe("export.ts", () => {
  let root: string;
  let log: ReturnType<typeof spyOn>;
  const run = (...args: string[]) => main([...args, "--root", root]);
  const printed = () => log.mock.calls.map((call: unknown[]) => String(call[0])).join("\n");

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "pm-export-"));
    cpSync(FIXTURE, root, { recursive: true });
    log = spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    (console.log as any).mockRestore?.();
    (console.error as any).mockRestore?.();
  });

  it("check fails before the first write", () => {
    expect(run("check")).toBe(1);
    expect(printed()).toContain("No export at planning/planning.json");
  });

  it("writes, then checks current, then reports the first stale value", () => {
    expect(run("write")).toBe(0);
    expect(readFileSync(join(root, "planning", "planning.schema.json"), "utf8").replace(/\r\n/g, "\n")).toBe(readFileSync(SCHEMA_PATH, "utf8").replace(/\r\n/g, "\n"));
    expect(run("check")).toBe(0);
    expect(printed()).toContain("current");

    const roadmap = join(root, "planning", "ROADMAP.md");
    writeFileSync(roadmap, readFileSync(roadmap, "utf8").replace("### R-008 Invoice email", "### R-008 Invoice emails"));
    log.mockClear();
    expect(run("check")).toBe(1);
    expect(printed()).toBe("roadmap.next[0].title is Invoice emails from the Markdown and Invoice email in planning/planning.json.");
  });

  it("write --frozen keeps the export's time and source, and takes the new Markdown", () => {
    expect(run("write")).toBe(0);
    const exportPath = join(root, "planning", "planning.json");
    const pinned = JSON.parse(readFileSync(exportPath, "utf8"));
    pinned.generatedAt = "2026-01-05T09:00:00+00:00";
    pinned.source = { ...pinned.source, branch: "demo", head: "0000000000000000000000000000000000000000" };
    writeFileSync(exportPath, JSON.stringify(pinned, null, 2));
    const roadmap = join(root, "planning", "ROADMAP.md");
    writeFileSync(roadmap, readFileSync(roadmap, "utf8").replace("### R-008 Invoice email", "### R-008 Invoice emails"));

    expect(run("write", "--frozen")).toBe(0);
    const written = JSON.parse(readFileSync(exportPath, "utf8"));

    expect(written.generatedAt).toBe("2026-01-05T09:00:00+00:00");
    expect(written.source).toMatchObject({ branch: "demo", head: "0000000000000000000000000000000000000000" });
    expect(written.roadmap.next[0].title).toBe("Invoice emails");
    expect(run("check")).toBe(0);
  });

  it("write --frozen fails without an export to freeze", () => {
    expect(run("write", "--frozen")).toBe(1);
    expect(() => readFileSync(join(root, "planning", "planning.json"))).toThrow();
  });

  it("refuses to write a document the schema rejects", () => {
    const roadmap = join(root, "planning", "ROADMAP.md");
    writeFileSync(roadmap, readFileSync(roadmap, "utf8").replace("- Size: S", "- Size: XL"));
    expect(run("write")).toBe(1);
    expect(() => readFileSync(join(root, "planning", "planning.json"))).toThrow();
  });

  it("validates any file and answers get, find, and summary", () => {
    expect(run("write")).toBe(0);
    expect(run("validate")).toBe(0);
    expect(main(["validate", join(import.meta.dir, "..", "references", "planning.example.json")])).toBe(0);
    log.mockClear();
    expect(run("get", "now.item.id")).toBe(0);
    expect(printed()).toBe("R-007");
    expect(run("find", "R-404")).toBe(1);
    expect(run("summary", "--fresh")).toBe(0);
    expect(main(["nonsense"])).toBe(2);
  });
});
