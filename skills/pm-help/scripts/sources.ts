// Measuring the text a session loads: the agent file by section, skill
// folders, and the reference files that skills and the agent file cite.
// Estimated tokens are characters / 4 (ADR-008).

import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export interface Contributor {
  name: string;
  chars: number;
  tokens: number;
  partial: boolean;
  handoff?: boolean;
}

export const countChars = (text: string): number => text.replace(/\r\n/g, "\n").length;
export const toTokens = (chars: number): number => Math.ceil(chars / 4);

export const readText = (path: string): string => readFileSync(path, "utf8");

/** The agent instructions files that exist in the root: AGENTS.md, then CLAUDE.md. */
export function agentFiles(root: string): string[] {
  return ["AGENTS.md", "CLAUDE.md"].map((file) => join(root, file)).filter((path) => existsSync(path));
}

const START = /^<!-- pm-skills:start[^>]*-->\s*$/;
const END = /^<!-- pm-skills:end[^>]*-->\s*$/;

/**
 * The agent file as contributors: `<file>#preamble` for text before the first
 * `##`, `<file>#pm-skills` for the managed block between its markers, and
 * `<file>#<heading>` for each `##` section outside it. Their chars sum to the file's.
 */
export function agentSections(file: string, text: string): Contributor[] {
  const lines = text.replace(/\r\n/g, "\n").split(/(?<=\n)/);
  const parts: { name: string; text: string }[] = [];
  let current: { name: string; text: string } | null = null;
  let inManaged = false;
  const open = (name: string) => {
    current = { name: `${file}#${name}`, text: "" };
    parts.push(current);
  };
  for (const line of lines) {
    const bare = line.replace(/\n$/, "");
    if (!inManaged && START.test(bare)) {
      inManaged = true;
      open("pm-skills");
    } else if (inManaged) {
      if (END.test(bare)) {
        current!.text += line;
        inManaged = false;
        current = null;
        continue;
      }
    } else if (/^## /.test(bare)) {
      open(bare.slice(3).trim());
    } else if (current === null) {
      const last = parts.at(-1);
      if (parts.length === 0) open("preamble");
      else if (bare.trim() === "") {
        // Blank lines after the managed block stay with it.
        last!.text += line;
        continue;
      } else open("after pm-skills");
    }
    current!.text += line;
  }
  return parts.map(({ name, text: body }) => {
    const chars = countChars(body);
    return { name, chars, tokens: toTokens(chars), partial: false };
  });
}

const ROOT_SKILL_DIRS = ["skills", ".agents/skills", ".claude/skills", ".copilot/skills", ".github/skills"];
const HOME_SKILL_DIRS = [".agents/skills", ".claude/skills", ".copilot/skills", ".github/skills"];

/** The folder of an installed skill, or null. Plugin-qualified names (`plugin:skill`) also search Claude Code plugins. */
export function findSkill(name: string, root: string, home: string): string | null {
  const [plugin, skill] = name.includes(":") ? [name.slice(0, name.lastIndexOf(":")), name.slice(name.lastIndexOf(":") + 1)] : [null, name];
  const candidates = [...ROOT_SKILL_DIRS.map((dir) => join(root, dir, skill)), ...HOME_SKILL_DIRS.map((dir) => join(home, dir, skill))];
  for (const dir of candidates) if (existsSync(join(dir, "SKILL.md"))) return dir;
  if (plugin === null) return null;
  const plugins = join(home, ".claude", "plugins");
  if (!existsSync(plugins)) return null;
  let best: { dir: string; mtime: number } | null = null;
  try {
    for (const match of new Bun.Glob(`**/skills/${skill}/SKILL.md`).scanSync({ cwd: plugins, onlyFiles: true })) {
      const path = match.replace(/\\/g, "/");
      if (!path.split("/").includes(plugin)) continue;
      const full = join(plugins, match);
      const mtime = statSync(full).mtimeMs;
      if (best === null || mtime > best.mtime) best = { dir: dirname(full), mtime };
    }
  } catch {
    // An unreadable plugins folder means the skill is not found there.
  }
  return best?.dir ?? null;
}

const CITATION = /(?:<([\w:-]+) skill>\/)?references\/([\w.-]+\.md)/g;

/** The skill folder a file belongs to: `<dir>/SKILL.md` and `<dir>/references/*.md` give `<dir>`; anything else null. */
function skillDirOf(path: string): string | null {
  if (basename(path) === "SKILL.md") return dirname(path);
  if (basename(dirname(path)) === "references") return dirname(dirname(path));
  return null;
}

/**
 * Reference paths cited in a text. With a `<name skill>/` prefix the file is
 * in that skill's folder; without one, in the citing skill's folder (ignored
 * when the citing file is not in a skill). Returns resolved paths, found or not.
 */
export function citedReferences(text: string, citingSkillDir: string | null, root: string, home: string): string[] {
  const out: string[] = [];
  for (const [, skill, file] of text.matchAll(CITATION)) {
    const dir = skill ? (findSkill(skill, root, home) ?? join(root, "skills", skill)) : citingSkillDir;
    if (dir !== null) out.push(join(dir, "references", file!));
  }
  return out;
}

/** Every reference reachable from the start files, depth-first, each once. Start files themselves are not listed. */
export function followReferences(start: string[], root: string, home: string): { files: string[]; missing: string[] } {
  const files: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>(start);
  const visit = (path: string) => {
    for (const ref of citedReferences(readText(path), skillDirOf(path), root, home)) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      if (!existsSync(ref)) {
        missing.push(ref);
        continue;
      }
      files.push(ref);
      visit(ref);
    }
  };
  for (const path of start) if (existsSync(path)) visit(path);
  return { files, missing };
}
