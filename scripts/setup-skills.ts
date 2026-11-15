import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { join, relative } from "node:path";

// Make this repository's own skills usable by the agents working on it: clear the skill folders, then
// link each skills/<name>/ folder back in, so an edit to skills/ is live without reinstalling.
//
//   bun scripts/setup-skills.ts        # link each folder (the default)
//   bun scripts/setup-skills.ts --cli  # install with `bunx skills add ./`
//
// The skills CLI copies a local source into .agents/skills/ and links the
// other agents to that copy, so its skills go stale until the next run; the
// default links straight to skills/ instead.

const root = join(import.meta.dir, "..");
const skillsDir = join(root, "skills");

// The skills CLI's agent IDs and the project folders they install into.
const targets = [
  { agent: "claude-code", dir: join(root, ".claude", "skills") },
  { agent: "universal", dir: join(root, ".agents", "skills") },
];

// Every skill this repository authors is linked, not only the shipped pm-* ones: `release` is
// repo-local (metadata.internal: true), so the CLI would never install it, and an agent working here
// still has to be able to read it.
const authored = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(skillsDir, d.name, "SKILL.md")))
  .map((d) => d.name)
  .sort();

// Both folders are install locations now: gitignored, never committed, and reproducible from
// skills-lock.json - so everything in them is this script's to replace.
function clear() {
  for (const { dir } of targets) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      rmSync(join(dir, name), { recursive: true, force: true });
    }
  }
}

function viaCli(): boolean {
  const args = ["skills", "add", "./", "-y", "--skill", "*", ...targets.flatMap((t) => ["--agent", t.agent])];
  const result = spawnSync("bunx", args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  return result.status === 0;
}

// A junction on Windows needs no administrator rights or developer mode; a
// directory symlink elsewhere.
function viaLinks() {
  for (const { dir } of targets) {
    mkdirSync(dir, { recursive: true });
    for (const name of authored) {
      symlinkSync(join(skillsDir, name), join(dir, name), process.platform === "win32" ? "junction" : "dir");
    }
  }
}

function missing(): string[] {
  return targets.flatMap(({ dir }) =>
    authored
      .filter((name) => !existsSync(join(dir, name, "SKILL.md")))
      .map((name) => relative(root, join(dir, name))),
  );
}

function linked(): boolean {
  return targets.every(({ dir }) => authored.every((name) => lstatSync(join(dir, name)).isSymbolicLink()));
}

clear();
if (process.argv.includes("--cli")) {
  if (!viaCli() || missing().length > 0) {
    console.log("The skills CLI did not install every skill; linking them directly.");
    clear();
    viaLinks();
  }
} else {
  viaLinks();
}

const gaps = missing();
if (gaps.length) {
  console.error(`Not installed:\n${gaps.map((g) => `- ${g}`).join("\n")}`);
  process.exit(1);
}
const kind = linked() ? "linked" : "copied";
console.log(`setup-skills: ${authored.length} skills ${kind} into ${targets.map((t) => relative(root, t.dir)).join(", ")}`);
