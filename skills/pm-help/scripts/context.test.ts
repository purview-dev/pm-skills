import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { type Report, buildReport, detectPmRoot, main, normalisePmRoot, renderText } from "./context.ts";
import { MapError, loadMap, parseMap } from "./map.ts";
import { agentFiles, agentSections, countChars, findSkill, followReferences, toTokens } from "./sources.ts";

/** A scratch repository and home directory, removed after each test. */
let root = "";
let home = "";
const put = (base: string, path: string, text: string) => {
  const full = join(base, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
  return full;
};
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ctx-root-"));
  home = mkdtempSync(join(tmpdir(), "ctx-home-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

const REPO = resolve(import.meta.dir, "../../..");
const SHIPPED = join(REPO, "skills/pm-help/references/sessions.json");
/** Session files that no pm-init template creates. */
const SESSION_ONLY = ["PAUSE.md"];

const shipped = () => JSON.parse(readFileSync(SHIPPED, "utf8"));

describe("session map", () => {
  test("shipped map names only existing skills and PM files", () => {
    const map = loadMap(SHIPPED);
    const stages = [...readFileSync(join(REPO, "skills/pm-init/templates/config.md"), "utf8").matchAll(/^\| ([\w-]+) \| `/gm)].map((m) => m[1]);
    for (const session of map.sessions) {
      for (const skill of session.skills ?? []) {
        expect(existsSync(join(REPO, "skills", skill, "SKILL.md")), `${session.id}: skill ${skill}`).toBe(true);
      }
      for (const file of [...(session.pmFiles ?? []), ...(session.partial ?? [])]) {
        const known = existsSync(join(REPO, "skills/pm-init/templates", file)) || SESSION_ONLY.includes(file);
        expect(known, `${session.id}: PM file ${file}`).toBe(true);
      }
      if (session.handoff) expect(stages, `${session.id}: handoff ${session.handoff}`).toContain(session.handoff);
    }
  });

  test("parseMap accepts the shipped map", () => {
    const map = parseMap(shipped());
    expect(map.sessions.map((s) => s.id)).toEqual(["always", "resume", "claim", "checkpoint", "review"]);
  });

  test("parseMap rejects an unknown key", () => {
    expect(() => parseMap({ ...shipped(), foo: 1 })).toThrow(MapError);
  });

  test("parseMap rejects a duplicate id", () => {
    const json = shipped();
    json.sessions[1].id = "always";
    expect(() => parseMap(json)).toThrow(MapError);
  });

  test("parseMap rejects a missing review session", () => {
    const json = shipped();
    json.sessions = json.sessions.filter((s: { id: string }) => s.id !== "review");
    expect(() => parseMap(json)).toThrow(MapError);
  });

  test("parseMap rejects skills that are not an array", () => {
    const json = shipped();
    json.sessions[1].skills = "pm-resume";
    expect(() => parseMap(json)).toThrow(/sessions\[1\]\.skills/);
  });

  test("parseMap rejects a negative tidy limit", () => {
    const json = shipped();
    json.tidy["LOG.md"] = -1;
    expect(() => parseMap(json)).toThrow(MapError);
  });
});

describe("sources", () => {
  test("countChars normalises CRLF", () => {
    expect(countChars("a\r\nb")).toBe(3);
    expect(countChars("a\nb")).toBe(3);
  });

  test("toTokens rounds up", () => {
    expect(toTokens(5)).toBe(2);
    expect(toTokens(0)).toBe(0);
  });

  test("agentSections splits the managed block and the ## sections", () => {
    const text = "# T\n\nintro\n\n## A\n\nx\n\n<!-- pm-skills:start -->\n## B\n\nyy\n<!-- pm-skills:end -->\n\n## C\n\nz\n";
    const sections = agentSections("AGENTS.md", text);
    expect(sections.map((s) => s.name)).toEqual(["AGENTS.md#preamble", "AGENTS.md#A", "AGENTS.md#pm-skills", "AGENTS.md#C"]);
    expect(sections.reduce((sum, s) => sum + s.chars, 0)).toBe(countChars(text));
  });

  test("agentSections without markers has no pm-skills section", () => {
    const names = agentSections("CLAUDE.md", "## A\n\nx\n\n## B\n\ny\n").map((s) => s.name);
    expect(names).toEqual(["CLAUDE.md#A", "CLAUDE.md#B"]);
  });

  test("agentFiles lists AGENTS.md then CLAUDE.md when both exist", () => {
    expect(agentFiles(root)).toEqual([]);
    put(root, "CLAUDE.md", "@AGENTS.md\n");
    put(root, "AGENTS.md", "# A\n");
    expect(agentFiles(root)).toEqual([join(root, "AGENTS.md"), join(root, "CLAUDE.md")]);
  });

  test("findSkill prefers skills/ over .claude/skills/", () => {
    put(root, ".claude/skills/pm-x/SKILL.md", "b");
    expect(findSkill("pm-x", root, home)).toBe(join(root, ".claude/skills/pm-x"));
    put(root, "skills/pm-x/SKILL.md", "a");
    expect(findSkill("pm-x", root, home)).toBe(join(root, "skills/pm-x"));
  });

  test("findSkill finds a plugin skill under the home folder, newest first", () => {
    const old = put(home, ".claude/plugins/cache/m/sp/1.0.0/skills/brain/SKILL.md", "old");
    put(home, ".claude/plugins/cache/m/sp/2.0.0/skills/brain/SKILL.md", "new");
    utimesSync(old, new Date(2000, 0, 1), new Date(2000, 0, 1));
    expect(findSkill("sp:brain", root, home)).toBe(join(home, ".claude/plugins/cache/m/sp/2.0.0/skills/brain"));
  });

  test("findSkill returns null for an unknown skill", () => {
    expect(findSkill("pm-none", root, home)).toBeNull();
  });

  test("followReferences follows skill-prefixed and local citations once, through a cycle", () => {
    const start = put(root, "skills/pm-a/SKILL.md", "Read references/a.md.\n");
    put(root, "skills/pm-a/references/a.md", "See <pm-b skill>/references/b.md.\n");
    put(root, "skills/pm-b/references/b.md", "Back to <pm-a skill>/references/a.md and references/gone.md.\n");
    const { files, missing } = followReferences([start], root, home);
    expect(files).toEqual([join(root, "skills/pm-a/references/a.md"), join(root, "skills/pm-b/references/b.md")]);
    expect(missing).toEqual([join(root, "skills/pm-b/references/gone.md")]);
  });

  test("followReferences resolves a skill-prefixed citation in the agent file", () => {
    const agent = put(root, "AGENTS.md", "Read <pm-setup skill>/references/rules.md. Ignore references/local.md.\n");
    put(root, "skills/pm-setup/references/rules.md", "rules\n");
    expect(followReferences([agent], root, home)).toEqual({ files: [join(root, "skills/pm-setup/references/rules.md")], missing: [] });
  });
});
describe("report", () => {
  const SKILLS = ["pm-resume", "pm-next", "pm-checkpoint", "pm-review"];
  const MANAGED = `## B\n\n${"managed rules text ".repeat(20)}\n`;
  const AGENT = `# Repo\n\n## Build\n\nbuild text\n\n<!-- pm-skills:start -->\n${MANAGED}<!-- pm-skills:end -->\n`;
  const map = () => loadMap(SHIPPED);
  const report = (date = "2026-11-24") => buildReport({ root, pmRoot: "planning/", home, map: map(), date });
  const session = (r: ReturnType<typeof report>, id: string) => r.sessions.find((s) => s.id === id)!;
  const chars = (path: string) => countChars(readFileSync(join(root, path), "utf8"));

  beforeEach(() => {
    put(root, "AGENTS.md", AGENT);
    for (const skill of SKILLS) put(root, `skills/${skill}/SKILL.md`, `# ${skill}\n\nsteps\n`);
    put(root, "planning/config.md", "# Config\n\n## Handoffs\n\n| Stage | Skill | Output |\n| --- | --- | --- |\n| design | `sp:brain` | specs |\n");
    put(root, "planning/NOW.md", "# Now\n\n- Status: idle\n- Brief:\n");
    put(root, "planning/ROADMAP.md", "# Roadmap\n\n## Next\n\n### R-001 One\n\n- Owner: agent\n- Status: ready\n- Brief: planning/briefs/one.md\n\n## Later\n");
    put(root, "planning/briefs/one.md", "# One\n\nbrief text\n");
    put(root, "planning/LOG.md", "# Log\n\n## Done\n");
    put(root, "planning/decisions/ADR-001-x.md", "# ADR-001 X\n");
    put(root, "planning/decisions/README.md", "# Decisions\n");
    put(root, "planning/inbox/2026-01-01-0000-idea.md", "# Idea\n");
    put(root, "planning/inbox/README.md", "# Inbox\n");
  });

  test("resume is always plus its skill and PM files", () => {
    const r = report();
    const resume = session(r, "resume");
    const own = chars("skills/pm-resume/SKILL.md") + ["config.md", "NOW.md", "ROADMAP.md"].reduce((n, f) => n + chars(`planning/${f}`), 0);
    expect(resume.chars).toBe(session(r, "always").chars + own);
  });

  test("LOG.md counts as partial", () => {
    const log = session(report(), "checkpoint").contributors.find((c) => c.name === "planning/LOG.md")!;
    expect(log.partial).toBe(true);
  });

  test("moving managed text into a cited reference lowers always and keeps resume", () => {
    const before = report();
    const pointer = "Read <pm-setup skill>/references/rules.md.\n";
    writeFileSync(join(root, "AGENTS.md"), AGENT.replace(MANAGED, pointer));
    put(root, "skills/pm-setup/references/rules.md", MANAGED);
    const after = report();
    expect(session(after, "always").chars).toBeLessThan(session(before, "always").chars);
    expect(session(after, "resume").chars).toBe(session(before, "resume").chars + countChars(pointer));
  });

  test("claim counts the next item's brief and the ADRs as partial", () => {
    const claim = session(report(), "claim");
    expect(claim.contributors.find((c) => c.name === "planning/briefs/one.md")?.chars).toBe(chars("planning/briefs/one.md"));
    expect(claim.contributors.find((c) => c.name === "planning/decisions/ADR-001-x.md")?.partial).toBe(true);
    expect(claim.contributors.some((c) => c.name.endsWith("decisions/README.md"))).toBe(false);
  });

  test("claim reports a missing handoff skill", () => {
    const claim = session(report(), "claim");
    expect(claim.missing).toContain("handoff sp:brain not installed");
    expect(claim.tokensWithoutHandoff).toBeUndefined();
  });

  test("claim counts an installed handoff skill separately", () => {
    put(home, ".claude/plugins/cache/m/sp/1.0.0/skills/brain/SKILL.md", "# Brain\n\nlots of design text\n");
    const claim = session(report(), "claim");
    expect(claim.contributors.find((c) => c.handoff)?.chars).toBeGreaterThan(0);
    expect(claim.tokensWithoutHandoff!).toBeLessThan(claim.tokens);
  });

  test("review counts inbox files but not the inbox README", () => {
    const names = session(report(), "review").contributors.map((c) => c.name);
    expect(names).toContain("planning/inbox/2026-01-01-0000-idea.md");
    expect(names).not.toContain("planning/inbox/README.md");
  });

  test("a missing skill is reported, not fatal", () => {
    rmSync(join(root, "skills/pm-review"), { recursive: true });
    expect(session(report(), "review").missing).toContain("skill pm-review");
  });

  test("tidy flags a file at its limit and not one character below", () => {
    writeFileSync(join(root, "planning/ROADMAP.md"), "x".repeat(31999));
    expect(report().tidy).toEqual([]);
    writeFileSync(join(root, "planning/ROADMAP.md"), "x".repeat(32000));
    expect(report().tidy).toEqual([{ file: "planning/ROADMAP.md", chars: 32000, limit: 32000 }]);
  });

  test("tidy flags a brief at 24000 characters", () => {
    writeFileSync(join(root, "planning/briefs/one.md"), "y".repeat(24000));
    expect(report().tidy).toEqual([{ file: "planning/briefs/one.md", chars: 24000, limit: 24000 }]);
  });

  test("no PM root still gives five sessions", () => {
    rmSync(join(root, "planning"), { recursive: true });
    const r = report();
    expect(r.sessions.map((s) => s.id)).toEqual(["always", "resume", "claim", "checkpoint", "review"]);
    expect(r.tidy).toEqual([]);
  });

  test("contributors are sorted largest first", () => {
    const list = session(report(), "resume").contributors.map((c) => c.chars);
    expect(list).toEqual([...list].sort((a, b) => b - a));
  });
});
describe("cli", () => {
  const fixed = (): Report => ({
    version: 1,
    date: "2026-11-24",
    sessions: [
      { id: "always", chars: 86844, tokens: 21711, contributors: [
        { name: "AGENTS.md#pm-skills", chars: 69454, tokens: 17364, partial: false },
        { name: "AGENTS.md#Build", chars: 7508, tokens: 1877, partial: false },
        { name: "AGENTS.md#Arch", chars: 7705, tokens: 1927, partial: false },
        { name: "AGENTS.md#Tiny", chars: 40, tokens: 10, partial: false },
      ], missing: [] },
      { id: "resume", chars: 100000, tokens: 25000, contributors: [
        { name: "AGENTS.md", chars: 86844, tokens: 21711, partial: false },
        { name: "planning/LOG.md", chars: 7200, tokens: 1800, partial: true },
      ], missing: [] },
    ],
    tidy: [],
  });

  test("renderText gives the fixed layout", () => {
    expect(renderText(fixed())).toBe(
      "## Context 2026-11-24\n\n" +
        "| Session | Est. tokens | Largest |\n| --- | --- | --- |\n" +
        "| always | 21,700 | AGENTS.md#pm-skills 17,400; AGENTS.md#Arch 1,900; AGENTS.md#Build 1,900 |\n" +
        "| resume | 25,000 | AGENTS.md 21,700; ≤ planning/LOG.md 1,800 |\n\n" +
        "- PM state: no tidy needed\n" +
        "- Estimated tokens are characters / 4; ≤ marks files read in part, counted whole.\n",
    );
  });

  test("renderText names each tidy entry", () => {
    const report = { ...fixed(), tidy: [{ file: "planning/ROADMAP.md", chars: 33100, limit: 32000 }, { file: "planning/LOG.md", chars: 32000, limit: 32000 }] };
    expect(renderText(report)).toContain(
      "- Tidy recommended: planning/ROADMAP.md 33,100 characters (limit 32,000); planning/LOG.md 32,000 characters (limit 32,000)\n",
    );
  });

  test("main prints JSON with five sessions", () => {
    put(root, "AGENTS.md", "# A\n");
    const { code, out } = main(["--root", root, "--format", "json"], { cwd: root, home });
    expect(code).toBe(0);
    const json = JSON.parse(out);
    expect(json.version).toBe(1);
    expect(json.sessions).toHaveLength(5);
  });

  test("main rejects an unknown format and an unknown flag", () => {
    expect(main(["--format", "xml"], { cwd: root, home }).code).toBe(2);
    expect(main(["--bogus"], { cwd: root, home }).code).toBe(2);
  });

  test("main reports an invalid map with exit 2", () => {
    const bad = put(root, "bad.json", "{}");
    const { code, out } = main(["--root", root], { cwd: root, home, mapPath: bad });
    expect(code).toBe(2);
    expect(out).toContain("invalid session map");
  });

  test("pm-root is normalised", () => {
    expect(normalisePmRoot("planning")).toBe("planning/");
    expect(normalisePmRoot(".\\planning\\")).toBe("planning/");
  });

  test("pm-root defaults to the PM state directory in AGENTS.md", () => {
    put(root, "AGENTS.md", "- PM state directory: `pm/`\n");
    expect(detectPmRoot(root)).toBe("pm/");
    expect(detectPmRoot(home)).toBe("planning/");
  });
});