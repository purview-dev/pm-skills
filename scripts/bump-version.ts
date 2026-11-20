import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { bump, compare, DEFAULT_PREID, format, isPrerelease, parse, PARTS, type Part, type Version } from "./semver.ts";

// Bump package.json's version, the version of record for a release.
//
//   bun scripts/bump-version.ts <patch | minor | major>                stable bumps (a prerelease is released)
//   bun scripts/bump-version.ts <prepatch | preminor | premajor> [--preid <id>]   start a prerelease
//   bun scripts/bump-version.ts prerelease [--preid <id>]              next prerelease (pre.1 -> pre.2, pre -> rc)
//   bun scripts/bump-version.ts release                                prerelease -> stable (2.5.0-pre.3 -> 2.5.0)
//   bun scripts/bump-version.ts set <version>                          an exact later version
//
// The major is the rules/skills version (the version=N marker), so a bump
// that raises the major (major, premajor, or set) moves the marker and the
// config template with it; releasing 19.0.0-pre.3 as 19.0.0 does not.

const root = join(import.meta.dir, "..");
const pkgPath = join(root, "package.json");
const sectionPath = join(root, "skills", "pm-setup", "references", "AGENTS-section.md");
const configPath = join(root, "skills", "pm-init", "templates", "config.md");
const demoConfigPath = join(root, "examples", "demo", "planning", "config.md");

const usage = `usage: bun scripts/bump-version.ts <${PARTS.join(" | ")}> [--preid <id>]
       bun scripts/bump-version.ts set <version>`;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const part = args[0];
const preidAt = args.indexOf("--preid");
const preid = preidAt === -1 ? DEFAULT_PREID : args[preidAt + 1];
if (!part || (part !== "set" && !(PARTS as readonly string[]).includes(part)) || preid === undefined) {
  console.error(usage);
  process.exit(2);
}
if (preidAt !== -1 && !["prepatch", "preminor", "premajor", "prerelease"].includes(part)) fail(`--preid applies only to a pre* part or prerelease, not ${part}.`);

const text = readFileSync(pkgPath, "utf8");
const match = /^(\s*"version":\s*")([^"]+)(")/m.exec(text);
if (!match) fail("package.json: no version field");
const current = parse(match[2]!);
if (!current) fail(`package.json: version "${match[2]}" is not SemVer (MAJOR.MINOR.PATCH, optionally -<prerelease>)`);

const section = readFileSync(sectionPath, "utf8");
const marker = /<!-- pm-skills:start version=(\d+) -->/.exec(section);
if (!marker) fail("AGENTS-section.md: no version=N start marker");
const rules = Number(marker[1]);
if (current.major !== rules) fail(`package.json major ${current.major} != rules version ${rules}. Set package.json to ${rules}.0.0 (or ${rules}.0.0-${DEFAULT_PREID}.1) first.`);

let next: Version;
try {
  if (part === "set") {
    const target = args[1] ? parse(args[1]) : null;
    if (!target) fail(`set needs a SemVer version, for example 19.0.0-${DEFAULT_PREID}.1 or 19.0.0.\n${usage}`);
    if (compare(target, current) <= 0) fail(`v${format(target)} is not after v${format(current)}. A version only moves forward.`);
    next = target;
  } else {
    next = bump(current, part as Part, preid);
  }
} catch (error) {
  fail((error as Error).message);
}

if (next.major > current.major + 1) fail(`v${format(next)} skips a major: the major is the rules version, which moves one at a time (next: ${current.major + 1}).`);

// The Release workflow tags v{version}, so an existing tag means the version
// is spent and the merge would be a no-op release.
const spent = (v: Version) =>
  execFileSync("git", ["tag", "--list", `v${format(v)}`], { cwd: root, encoding: "utf8" }).trim() !== "";
if (spent(next)) fail(`v${format(next)} already exists. Bump a larger part, or choose another version with set.`);
if (isPrerelease(next) && spent({ ...next, prerelease: [] })) {
  fail(`v${next.major}.${next.minor}.${next.patch} is already released, so v${format(next)} would come before it. Start the prerelease on a later version.`);
}

writeFileSync(pkgPath, text.replace(match[0], `${match[1]}${format(next)}${match[3]}`));
console.log(`v${format(current)} -> v${format(next)}${isPrerelease(next) ? " (prerelease)" : ""}`);

if (next.major > current.major) {
  writeFileSync(sectionPath, section.replace(marker[0], `<!-- pm-skills:start version=${next.major} -->`));
  const config = readFileSync(configPath, "utf8");
  writeFileSync(configPath, config.replace(/^- Rules version: \d+$/m, `- Rules version: ${next.major}`));
  console.log(`rules v${rules} -> v${next.major}. Run pm-setup to install them here (AGENTS.md and planning/config.md).`);

  // The demo's plan runs the rules the repository ships, and its export records
  // the skills version, so a major leaves it stale until it is rewritten.
  if (existsSync(demoConfigPath)) {
    const demoConfig = readFileSync(demoConfigPath, "utf8");
    writeFileSync(demoConfigPath, demoConfig.replace(/^- Rules version: \d+$/m, `- Rules version: ${next.major}`));
    try {
      execFileSync("bun", ["skills/pm-export/scripts/export.ts", "write", "--frozen", "--root", "examples/demo", "--pm-root", "planning/"], { cwd: root, encoding: "utf8" });
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
      fail(`demo: export.ts write failed; the bump itself is written. Fix the demo, then run: bun skills/pm-export/scripts/export.ts write --frozen --root examples/demo --pm-root planning/\n${failure.stdout ?? ""}${failure.stderr ?? ""}`);
    }
    console.log("demo: refreshed examples/demo/planning/planning.json");
  }
}
