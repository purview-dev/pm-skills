import { afterEach, describe, expect, it } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { bump, compare, format, parse, type Part } from "./semver.ts";

const v = (text: string) => {
  const parsed = parse(text);
  if (!parsed) throw new Error(`not a version: ${text}`);
  return parsed;
};
const next = (from: string, part: Part, preid?: string) => format(bump(v(from), part, preid));

describe("parse and format", () => {
  it("reads stable and prerelease versions, and rejects the rest", () => {
    for (const text of ["2.4.2", "19.0.0-pre.1", "2.4.3-prerelease", "1.0.0-rc.1.2", "1.0.0-x-y.0"]) expect(format(v(text))).toBe(text);
    expect(format(v("v2.4.2"))).toBe("2.4.2");
    for (const text of ["2.4", "02.4.2", "2.4.2-", "2.4.2-pre.01", "2.4.2-pre..1", "2.4.2+build"]) expect(parse(text)).toBeNull();
  });
});

describe("compare", () => {
  it("orders by SemVer precedence", () => {
    const ordered = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0", "1.0.1-pre.1", "1.0.1", "1.1.0-pre.1", "2.0.0-pre.1", "2.0.0"];
    const shuffled = [...ordered].reverse().map(v);
    expect(shuffled.sort(compare).map(format)).toEqual(ordered);
    expect(compare(v("19.0.0-pre.2"), v("19.0.0-pre.2"))).toBe(0);
  });
});

describe("bump", () => {
  it("bumps a stable version, stable or into a prerelease", () => {
    expect(next("2.4.2", "patch")).toBe("2.4.3");
    expect(next("2.4.2", "minor")).toBe("2.5.0");
    expect(next("2.4.2", "major")).toBe("3.0.0");
    expect(next("2.4.2", "prepatch")).toBe("2.4.3-pre.1");
    expect(next("2.4.2", "preminor")).toBe("2.5.0-pre.1");
    expect(next("2.4.2", "premajor")).toBe("3.0.0-pre.1");
    expect(next("2.4.2", "prerelease")).toBe("2.4.3-pre.1");
    expect(next("2.4.2", "prepatch", "prerelease")).toBe("2.4.3-prerelease.1");
  });

  it("moves a prerelease on, or releases it", () => {
    expect(next("2.5.0-pre.1", "prerelease")).toBe("2.5.0-pre.2");
    expect(next("2.5.0-pre", "prerelease")).toBe("2.5.0-pre.1");
    expect(next("2.5.0-pre.2", "prerelease", "rc")).toBe("2.5.0-rc.1");
    expect(next("2.5.0-pre.2", "release")).toBe("2.5.0");
    expect(next("3.0.0-pre.4", "release")).toBe("3.0.0");
  });

  it("releases a prerelease with the stable part it is on the way to, like npm", () => {
    expect(next("2.4.3-pre.1", "patch")).toBe("2.4.3");
    expect(next("2.5.0-pre.1", "minor")).toBe("2.5.0");
    expect(next("2.5.1-pre.1", "minor")).toBe("2.6.0");
    expect(next("3.0.0-pre.1", "major")).toBe("3.0.0");
    expect(next("2.5.0-pre.1", "major")).toBe("3.0.0");
  });

  it("starts a new prerelease line from a prerelease", () => {
    expect(next("2.5.0-pre.2", "prepatch")).toBe("2.5.1-pre.1");
    expect(next("2.5.0-pre.2", "preminor")).toBe("2.6.0-pre.1");
    expect(next("2.5.0-pre.2", "premajor")).toBe("3.0.0-pre.1");
  });

  it("refuses what would not move forward", () => {
    expect(() => next("2.4.2", "release")).toThrow(/already stable/);
    expect(() => next("2.5.0-rc.1", "prerelease", "beta")).toThrow(/not after/);
    expect(() => next("2.4.2", "prepatch", "1")).toThrow(/--preid/);
    expect(() => next("2.4.2", "prepatch", "a.b")).toThrow(/--preid/);
  });

  it("always moves forward", () => {
    const parts: Part[] = ["patch", "minor", "major", "prepatch", "preminor", "premajor", "prerelease"];
    for (const from of ["2.4.2", "2.5.0-pre.2", "3.0.0-pre.1", "2.4.3-pre"]) {
      for (const part of parts) expect(compare(bump(v(from), part), v(from))).toBeGreaterThan(0);
    }
  });
});

// The scripts read and write the repository they live in, so each test copies them into a scratch repository.
describe("bump-version.ts and check-version.ts", () => {
  // Each test runs git and bun a dozen times.
  const SLOW = 60_000;
  const temps: string[] = [];
  afterEach(() => {
    for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  const git = (root: string, ...args: string[]) => {
    const result = Bun.spawnSync(["git", "-C", root, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { stdout: "pipe", stderr: "pipe" });
    return result.stdout.toString().trim();
  };
  const run = (root: string, script: string, ...args: string[]) => {
    const result = Bun.spawnSync(["bun", join(root, "scripts", script), ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
    return { code: result.exitCode, out: (result.stdout.toString() + result.stderr.toString()).trim() };
  };

  function scratch(version: string, rules: number): string {
    const root = mkdtempSync(join(tmpdir(), "pm-version-"));
    temps.push(root);
    mkdirSync(join(root, "scripts"));
    for (const file of ["bump-version.ts", "check-version.ts", "semver.ts"]) copyFileSync(join(import.meta.dir, file), join(root, "scripts", file));
    mkdirSync(join(root, "skills", "pm-setup", "references"), { recursive: true });
    mkdirSync(join(root, "skills", "pm-init", "templates"), { recursive: true });
    writeFileSync(join(root, "package.json"), `{\n\t"name": "x",\n\t"version": "${version}"\n}\n`);
    writeFileSync(join(root, "skills", "pm-setup", "references", "AGENTS-section.md"), `<!-- pm-skills:start version=${rules} -->\nrules\n<!-- pm-skills:end -->\n`);
    writeFileSync(join(root, "skills", "pm-init", "templates", "config.md"), `# PM configuration\n\n- Rules version: ${rules}\n`);
    git(root, "init", "-q", "-b", "main");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "init");
    return root;
  }
  const version = (root: string) => JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const markerOf = (root: string) => /version=(\d+)/.exec(readFileSync(join(root, "skills", "pm-setup", "references", "AGENTS-section.md"), "utf8"))![1];

  it("goes stable -> prerelease -> stable, moving the rules version only when the major rises", () => {
    const root = scratch("18.0.0", 18);
    expect(run(root, "bump-version.ts", "premajor").code).toBe(0);
    expect([version(root), markerOf(root)]).toEqual(["19.0.0-pre.1", "19"]);
    expect(readFileSync(join(root, "skills", "pm-init", "templates", "config.md"), "utf8")).toContain("Rules version: 19");
    expect(run(root, "bump-version.ts", "prerelease", "--preid", "rc").code).toBe(0);
    expect(version(root)).toBe("19.0.0-rc.1");
    expect(run(root, "bump-version.ts", "release").code).toBe(0);
    expect([version(root), markerOf(root)]).toEqual(["19.0.0", "19"]);
    expect(run(root, "bump-version.ts", "prepatch").code).toBe(0);
    expect(version(root)).toBe("19.0.1-pre.1");
    expect(run(root, "bump-version.ts", "set", "19.1.0-beta.1").code).toBe(0);
    expect(version(root)).toBe("19.1.0-beta.1");
  }, SLOW);

  it("refuses a spent tag, a version that goes back, and a skipped major", () => {
    const root = scratch("2.4.2", 2);
    git(root, "tag", "v2.4.3-pre.1");
    expect(run(root, "bump-version.ts", "prepatch").out).toContain("already exists");
    expect(run(root, "bump-version.ts", "set", "2.4.2-pre.1").out).toContain("not after");
    expect(run(root, "bump-version.ts", "set", "4.0.0").out).toContain("skips a major");
    expect(run(root, "bump-version.ts", "release").out).toContain("already stable");
    expect(run(root, "bump-version.ts", "patch", "--preid", "rc").code).toBe(1);
    expect(version(root)).toBe("2.4.2");
  }, SLOW);

  it("check-version allows skills changes along an unreleased prerelease line, and asks for a new major otherwise", () => {
    const root = scratch("19.0.0-pre.1", 19);
    const base = git(root, "rev-parse", "HEAD");
    git(root, "switch", "-q", "-c", "feature");
    writeFileSync(join(root, "skills", "pm-init", "templates", "extra.md"), "# Extra\n");
    run(root, "bump-version.ts", "prerelease");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "feat: more");
    expect(run(root, "check-version.ts", base)).toMatchObject({ code: 0 });

    // Once 19.0.0 is released, a skills change needs rules v20.
    git(root, "switch", "-q", "main");
    run(root, "bump-version.ts", "release");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "chore(release): v19.0.0");
    git(root, "tag", "v19.0.0");
    const released = git(root, "rev-parse", "HEAD");
    git(root, "switch", "-q", "-c", "next");
    writeFileSync(join(root, "skills", "pm-init", "templates", "more.md"), "# More\n");
    run(root, "bump-version.ts", "patch");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "feat: change");
    const result = run(root, "check-version.ts", released);
    expect(result.code).toBe(1);
    expect(result.out).toContain("rules v19 is already on main");

    run(root, "bump-version.ts", "premajor");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "chore(release): v20.0.0-pre.1");
    expect(run(root, "check-version.ts", released)).toMatchObject({ code: 0 });
  }, SLOW);
});
