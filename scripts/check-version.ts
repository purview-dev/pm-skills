import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { compare, format, isPrerelease, parse } from "./semver.ts";

// Compares HEAD with the version already merged to main, so a released version
// is never merged twice. CI passes the pull request's base commit; the
// pre-push hook defaults to the merge base with origin/main.
//
// - The version only moves forward (SemVer precedence: 19.0.0-pre.1 <
//   19.0.0-pre.2 < 19.0.0 < 19.0.1-pre.1), to a version with no tag.
// - A change under skills/ ships in a release, so it must raise the rules
//   version (the version=N marker, package.json's major) past main's. The one
//   exception is a prerelease line: while main is an unreleased N.0.0-<pre>,
//   rules vN are still in flight, and a skills change may stay on vN as long
//   as package.json moves forward (to N.0.0-<pre>.next, or N.0.0 itself).
// - Anything else (docs, CI, scripts, package metadata) may keep the version,
//   or move it forward within the same rules version.

const root = join(import.meta.dir, "..");
const section = "skills/pm-setup/references/AGENTS-section.md";
const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const tryGit = (...args: string[]) => {
  try {
    return git(...args);
  } catch {
    return "";
  }
};

let base = process.argv[2];
if (!base) {
  if (!tryGit("rev-parse", "-q", "--verify", "origin/main")) {
    console.log("check-version: no origin/main; skipped (CI runs it).");
    process.exit(0);
  }
  base = git("merge-base", "HEAD", "origin/main");
}

const marker = (text: string) => {
  const found = /<!-- pm-skills:start version=(\d+) -->/.exec(text)?.[1];
  return found === undefined ? null : Number(found);
};
const versionOf = (text: string) => JSON.parse(text).version as string;
const tagged = (version: string) => tryGit("tag", "--list", `v${version}`) !== "";

const errors: string[] = [];
const current = { version: versionOf(git("show", "HEAD:package.json")), marker: marker(git("show", `HEAD:${section}`)) };
const merged = { version: versionOf(git("show", `${base}:package.json`)), marker: marker(tryGit("show", `${base}:${section}`)) };
const now = parse(current.version);
const was = parse(merged.version);
if (!now) errors.push(`package.json: version "${current.version}" is not SemVer (MAJOR.MINOR.PATCH, optionally -<prerelease>)`);
if (current.marker === null) errors.push(`${section}: no version=N start marker`);

const changed = git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);
const skills = changed.some((p) => p.startsWith("skills/"));
const bumped = current.version !== merged.version;

// main is on an unreleased N.0.0 prerelease: rules vN are not final yet.
const prereleaseLine = !!was && isPrerelease(was) && was.minor === 0 && was.patch === 0 && !tagged(`${was.major}.0.0`) && merged.marker === was.major;

if (now && was && compare(now, was) < 0) errors.push(`package.json: v${current.version} is older than v${merged.version} on main.`);
if (skills && current.marker !== null && merged.marker !== null) {
  const sameLine = prereleaseLine && current.marker === merged.marker && now?.major === was!.major;
  if (current.marker <= merged.marker && !sameLine) {
    errors.push(
      `skills changed but rules v${current.marker} is already on main. Run 'just bump major' (or 'just bump premajor') then pm-setup, so this release is v${merged.marker + 1}.`,
    );
  }
  if (!bumped) {
    errors.push(
      `skills changed but package.json is still v${current.version}, the version on main.${sameLine || prereleaseLine ? " Run 'just bump prerelease' or 'just bump release'." : ""}`,
    );
  }
}
if (bumped && now && tagged(format(now))) errors.push(`package.json is v${current.version}, but tag v${current.version} already exists.`);
if (bumped && now && isPrerelease(now) && tagged(`${now.major}.${now.minor}.${now.patch}`)) {
  errors.push(`v${now.major}.${now.minor}.${now.patch} is already released, so the prerelease v${current.version} comes before it.`);
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
const kind = now && isPrerelease(now) ? " (prerelease)" : "";
console.log(
  skills
    ? `check-version: skills changed; v${merged.version} -> v${current.version}${kind}, rules v${merged.marker} -> v${current.marker}.`
    : `check-version: no skills changed; v${current.version}${kind}${bumped ? ` (was v${merged.version})` : ""}.`,
);
