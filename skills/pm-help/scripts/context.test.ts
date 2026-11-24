import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

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