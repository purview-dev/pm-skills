import { execFileSync } from "node:child_process";
import { join } from "node:path";

// Compares HEAD with the version already merged to main, so a released version
// is never merged twice. CI passes the pull request's base commit; the
// pre-push hook defaults to the merge base with origin/main.
//
// - A change under skills/ ships in a release: it must raise the rules version
//   (the version=N marker) and package.json, to a version not already tagged.
//   scripts/validate.ts keeps package.json's major equal to the marker and
//   planning/config.md on it, so the bump is dogfooded here first.
// - Anything else (docs, CI, scripts, package metadata) may keep the version,
//   or raise minor or patch within the same rules version.

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

const marker = (text: string) => /<!-- pm-skills:start version=(\d+) -->/.exec(text)?.[1];
const version = (text: string) => JSON.parse(text).version as string;
const parse = (v: string) => /^(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number);
const compare = (a: number[], b: number[]) => a.findIndex((n, i) => n !== b[i]);

const errors: string[] = [];
const current = { version: version(git("show", "HEAD:package.json")), marker: marker(git("show", `HEAD:${section}`)) };
const merged = { version: version(git("show", `${base}:package.json`)), marker: marker(tryGit("show", `${base}:${section}`)) };
const now = parse(current.version);
const was = parse(merged.version);
if (!now) errors.push(`package.json: version "${current.version}" is not MAJOR.MINOR.PATCH`);
if (!current.marker) errors.push(`${section}: no version=N start marker`);

const changed = git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);
const skills = changed.some((p) => p.startsWith("skills/"));
const bumped = current.version !== merged.version;

if (now && was) {
  const i = compare(now, was);
  if (i !== -1 && now[i] < was[i]) errors.push(`package.json: v${current.version} is older than v${merged.version} on main`);
}
if (skills) {
  if (current.marker && merged.marker && Number(current.marker) <= Number(merged.marker)) {
    errors.push(
      `skills changed but rules v${current.marker} is already on main. Run 'just bump major', then pm-setup, so this release is v${Number(merged.marker) + 1}.`,
    );
  }
  if (!bumped) errors.push(`skills changed but package.json is still v${current.version}, the version on main.`);
}
if (bumped && tryGit("tag", "--list", `v${current.version}`)) {
  errors.push(`package.json is v${current.version}, but tag v${current.version} already exists.`);
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(
  skills
    ? `check-version: skills changed; v${merged.version} -> v${current.version}, rules v${merged.marker} -> v${current.marker}.`
    : `check-version: no skills changed; v${current.version}${bumped ? ` (was v${merged.version})` : ""}.`,
);
