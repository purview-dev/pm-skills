import { afterEach, describe, expect, it, setDefaultTimeout } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { driver, pull, release, type SyncOptions } from "./sync";

// Scratch repositories: a bare remote, the user's clone (`work`), and a
// second clone (`hub`) that plays GitHub merging the pull request.

// Each test spawns dozens of git processes, which is slow on Windows.
setDefaultTimeout(60_000);

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  const run = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (run.status !== 0) throw new Error(`git ${args.join(" ")}: ${run.stdout}${run.stderr}`);
  return run.stdout.trim();
}

function write(cwd: string, path: string, text: string): void {
  mkdirSync(join(cwd, path, ".."), { recursive: true });
  writeFileSync(join(cwd, path), text);
}

function clone(dir: string, name: string): string {
  git(dir, "clone", "-q", "remote.git", name);
  const cwd = join(dir, name);
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "Test");
  git(cwd, "config", "core.autocrlf", "false");
  return cwd;
}

function scratch(): { dir: string; work: string; opts: SyncOptions } {
  const dir = mkdtempSync(join(tmpdir(), "pm-sync-"));
  dirs.push(dir);
  git(dir, "init", "-q", "--bare", "-b", "main", "remote.git");
  const work = clone(dir, "work");
  git(work, "switch", "-q", "-c", "main");
  write(work, "planning/config.md", "# Config\n\n## Commits\n\n- PM branch: main\n");
  write(work, "planning/LOG.md", "# Log\n\n## Done\n\n- 2026-11-01 R-001 First.\n");
  write(work, "planning/planning.json", '{ "generatedAt": "1" }\n');
  write(work, "planning/inbox/crlf.md", "# Windows file\r\n\r\n- line one\r\n");
  write(work, "src/app.ts", "export const app = 1;\n");
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "init");
  git(work, "push", "-q", "-u", "origin", "main");
  return { dir, work, opts: { root: work, pmRoot: "planning/", pmBranch: "main", remote: "origin" } };
}

/** Two idle PM commits on main, then an item branch cut from it with code and a completion record. */
function idleThenItem(work: string): void {
  write(work, "planning/inbox/a.md", "# Idea A\n");
  write(work, "planning/planning.json", '{ "generatedAt": "2" }\n');
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "docs(pm): park a");
  write(work, "planning/inbox/b.md", "# Idea B\n");
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "docs(pm): park b");
  git(work, "switch", "-q", "-c", "item");
  write(work, "src/app.ts", "export const app = 2;\n");
  write(work, "planning/LOG.md", "# Log\n\n## Done\n\n- 2026-11-02 R-002 Second. Result: branch item.\n- 2026-11-01 R-001 First.\n");
  write(work, "planning/planning.json", '{ "generatedAt": "3" }\n');
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "feat: item");
  git(work, "push", "-q", "-u", "origin", "item");
}

type Method = "merge" | "squash" | "rebase";

/** Merge the pull request on the "server", by one of GitHub's three methods. */
function mergeUpstream(dir: string, method: Method): void {
  const hub = clone(dir, `hub-${method}`);
  git(hub, "fetch", "-q", "origin", "item");
  if (method === "merge") git(hub, "merge", "-q", "--no-ff", "-m", "Merge pull request #1", "origin/item");
  if (method === "squash") {
    git(hub, "merge", "-q", "--squash", "origin/item");
    git(hub, "commit", "-q", "-m", "feat: item (#1)");
  }
  if (method === "rebase") {
    git(hub, "switch", "-q", "-c", "tmp", "origin/item");
    git(hub, "rebase", "-q", "--force-rebase", "main");
    git(hub, "switch", "-q", "main");
    git(hub, "merge", "-q", "--ff-only", "tmp");
  }
  git(hub, "push", "-q", "origin", "main");
  git(hub, "push", "-q", "origin", "--delete", "item");
}

const sha = (cwd: string, ref: string) => git(cwd, "rev-parse", ref);

describe("release", () => {
  it("moves unpushed PM commits off main after an item branch is cut", () => {
    const { work, opts } = scratch();
    idleThenItem(work);

    const result = release(opts);

    expect(result).toMatchObject({ action: "released", moved: 2 });
    expect(sha(work, "main")).toBe(sha(work, "origin/main"));
    expect(git(work, "branch", "--show-current")).toBe("item");
  });

  it("never moves a checked-out PM branch", () => {
    const { work, opts } = scratch();
    idleThenItem(work);
    git(work, "switch", "-q", "main");
    const before = sha(work, "main");

    const result = release(opts);

    expect(result.action).toBe("none");
    expect(result.message).toContain("Run release from the item branch.");
    expect(sha(work, "main")).toBe(before);
  });
});

describe("pull", () => {
  it.each<Method>(["merge", "squash", "rebase"])("fast-forwards main after a %s merge once release ran", (method) => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    release(opts);
    mergeUpstream(dir, method);
    git(work, "switch", "-q", "main");

    const result = pull(opts);

    expect(result.action).toBe("fast-forward");
    expect(sha(work, "main")).toBe(sha(work, "origin/main"));
    expect(git(work, "diff", "origin/main", "--", "planning")).toBe("");
  });

  it("repairs a main that kept squash-delivered PM commits", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    mergeUpstream(dir, "squash");
    git(work, "switch", "-q", "main");

    const result = pull(opts);

    expect(result).toMatchObject({ action: "repaired", moved: 2 });
    expect(sha(work, "main")).toBe(sha(work, "origin/main"));
  });

  it("carries an undelivered PM commit onto the remote", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    release(opts);
    git(work, "switch", "-q", "main");
    write(work, "planning/inbox/late.md", "# Late idea\r\n\r\n- after the cut\r\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "docs(pm): park late");
    mergeUpstream(dir, "squash");

    const result = pull(opts);

    expect(result).toMatchObject({ action: "carried", moved: 1 });
    expect(sha(work, "main^")).toBe(sha(work, "origin/main"));
    expect(git(work, "log", "-1", "--format=%s")).toStartWith("docs(pm): carry 1 PM commits onto origin/main");
    expect(readFileSync(join(work, "planning/inbox/late.md"), "utf8")).toBe("# Late idea\r\n\r\n- after the cut\r\n");
    expect(readFileSync(join(work, "planning/inbox/crlf.md"), "utf8")).toBe("# Windows file\r\n\r\n- line one\r\n");
    expect(git(work, "status", "--porcelain")).toBe("");
  });

  it("stops when a local-only commit touches a path outside the PM root", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    release(opts);
    git(work, "switch", "-q", "main");
    write(work, "src/hotfix.ts", "export const fix = 1;\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "fix: local");
    mergeUpstream(dir, "squash");
    const before = sha(work, "main");

    expect(() => pull(opts)).toThrow("touch paths outside planning/");
    expect(sha(work, "main")).toBe(before);
  });

  it("stops on uncommitted PM changes", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    mergeUpstream(dir, "squash");
    git(work, "switch", "-q", "main");
    write(work, "planning/inbox/dirty.md", "# Not committed\n");
    const before = sha(work, "main");

    expect(() => pull(opts)).toThrow("uncommitted changes under planning/");
    expect(sha(work, "main")).toBe(before);
  });

  it("restores main when the carry conflicts", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    release(opts);
    mergeUpstream(dir, "squash");
    const hub = clone(dir, "hub-later");
    write(hub, "planning/LOG.md", "# Log\n\nupstream edit\n");
    git(hub, "commit", "-q", "-am", "docs(pm): upstream");
    git(hub, "push", "-q", "origin", "main");
    git(work, "switch", "-q", "main");
    write(work, "planning/LOG.md", "# Log\n\nlocal edit\n");
    git(work, "commit", "-q", "-am", "docs(pm): local");
    const before = sha(work, "main");

    expect(() => pull(opts)).toThrow(before);
    expect(sha(work, "main")).toBe(before);
    expect(git(work, "status", "--porcelain")).toBe("");
  });

  it("is a no-op without a remote", () => {
    const { work, opts } = scratch();
    const local = { ...opts, remote: null };

    expect(pull(local)).toMatchObject({ action: "none", message: "no remote" });
    expect(release(local)).toMatchObject({ action: "none", message: "no remote" });
    expect(git(work, "branch", "--show-current")).toBe("main");
  });

  it("moves main with branch -f when another branch is checked out", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    mergeUpstream(dir, "squash");

    const result = pull(opts);

    expect(result).toMatchObject({ action: "repaired", moved: 2 });
    expect(sha(work, "main")).toBe(sha(work, "origin/main"));
    expect(git(work, "branch", "--show-current")).toBe("item");
  });
});

describe("driver", () => {
  it("registers the attribute and the config once", () => {
    const { work, opts } = scratch();

    expect(driver(opts).action).toBe("registered");
    expect(driver(opts).action).toBe("none");

    const lines = readFileSync(join(work, ".gitattributes"), "utf8").split("\n").filter((line) => line.includes("merge=pm-export"));
    expect(lines).toEqual(["planning/planning.json merge=pm-export"]);
    expect(git(work, "config", "merge.pm-export.driver")).toBe("true");
  });

  /** Branches a and b each rewrite planning.json differently. */
  function rivals(work: string): void {
    git(work, "switch", "-q", "-c", "a");
    write(work, "planning/planning.json", '{ "generatedAt": "a" }\n');
    git(work, "commit", "-q", "-am", "docs(pm): a");
    git(work, "switch", "-q", "-c", "b", "main");
    write(work, "planning/planning.json", '{ "generatedAt": "b" }\n');
    git(work, "commit", "-q", "-am", "docs(pm): b");
    git(work, "switch", "-q", "a");
  }

  it("lets two branches that change planning.json merge without a conflict", () => {
    const { work, opts } = scratch();
    driver(opts);
    git(work, "add", ".gitattributes");
    git(work, "commit", "-q", "-m", "chore: merge driver");
    rivals(work);

    git(work, "merge", "-q", "--no-edit", "b");

    expect(readFileSync(join(work, "planning/planning.json"), "utf8")).toBe('{ "generatedAt": "a" }\n');
  });

  it("conflicts without the driver (control)", () => {
    const { work } = scratch();
    rivals(work);

    expect(() => git(work, "merge", "-q", "--no-edit", "b")).toThrow("CONFLICT");
  });
});

describe("final review fixes", () => {
  /** A later upstream PM commit, made after the item merged. */
  function upstream(dir: string, name: string, change: (hub: string) => void): void {
    const hub = clone(dir, name);
    change(hub);
    git(hub, "add", "-A");
    git(hub, "commit", "-q", "-m", `docs(pm): ${name}`);
    git(hub, "push", "-q", "origin", "main");
  }

  it("does not bring back a delivered inbox file that upstream later deleted", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    mergeUpstream(dir, "squash");
    upstream(dir, "triage", (hub) => rmSync(join(hub, "planning/inbox/a.md")));
    git(work, "switch", "-q", "main");

    const result = pull(opts);

    expect(result).toMatchObject({ action: "repaired", moved: 2 });
    expect(sha(work, "main")).toBe(sha(work, "origin/main"));
    expect(existsSync(join(work, "planning/inbox/a.md"))).toBe(false);
  });

  it("does not bring back a delivered roadmap item that upstream later closed", () => {
    const { dir, work, opts } = scratch();
    write(work, "planning/ROADMAP.md", "# Roadmap\n\n## Next\n\n### R-002 Second\n\n- Status: ready\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "docs(pm): add R-002");
    git(work, "switch", "-q", "-c", "item");
    write(work, "src/app.ts", "export const app = 2;\n");
    git(work, "commit", "-q", "-am", "feat: item");
    git(work, "push", "-q", "-u", "origin", "item");
    mergeUpstream(dir, "squash");
    upstream(dir, "close", (hub) => write(hub, "planning/ROADMAP.md", "# Roadmap\n\n## Next\n"));
    git(work, "switch", "-q", "main");

    const result = pull(opts);

    expect(result).toMatchObject({ action: "repaired", moved: 1 });
    expect(readFileSync(join(work, "planning/ROADMAP.md"), "utf8")).toBe("# Roadmap\n\n## Next\n");
  });

  it("refuses a local merge commit whose resolution changed a path outside the PM root", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    release(opts);
    git(work, "switch", "-q", "-c", "side", "main");
    write(work, "planning/inbox/side.md", "# Side\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "docs(pm): side");
    git(work, "switch", "-q", "main");
    git(work, "merge", "-q", "--no-ff", "--no-commit", "side");
    write(work, "src/app.ts", "export const app = 99;\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "merge side");
    mergeUpstream(dir, "squash");
    const before = sha(work, "main");

    expect(() => pull(opts)).toThrow("touch paths outside planning/");
    expect(sha(work, "main")).toBe(before);
  });

  it("releases main from a linked item worktree while main is checked out elsewhere", () => {
    const { dir, work, opts } = scratch();
    write(work, "planning/inbox/a.md", "# Idea A\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "docs(pm): park a");
    const itemTree = join(dir, "item-tree");
    git(work, "worktree", "add", "-q", "-b", "item", itemTree);

    const result = release({ ...opts, root: itemTree });

    expect(result).toMatchObject({ action: "released", moved: 1 });
    expect(sha(work, "main")).toBe(sha(work, "origin/main"));
    expect(git(work, "status", "--porcelain")).toBe("");
    expect(git(itemTree, "log", "-1", "--format=%s")).toBe("docs(pm): park a");
  });

  it("makes a plain git pull on main refuse to merge once the driver is registered", () => {
    const { dir, work, opts } = scratch();
    driver(opts);
    git(work, "add", ".gitattributes");
    git(work, "commit", "-q", "-m", "chore: merge driver");
    git(work, "push", "-q", "origin", "main");
    write(work, "planning/inbox/local.md", "# Local\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "docs(pm): local");
    upstream(dir, "remote", (hub) => write(hub, "planning/inbox/remote.md", "# Remote\n"));
    const before = sha(work, "main");

    expect(() => git(work, "pull", "-q")).toThrow();
    expect(sha(work, "main")).toBe(before);
    expect(existsSync(join(work, ".git/MERGE_HEAD"))).toBe(false);
  });

  it("carries without depending on commit hooks", () => {
    const { dir, work, opts } = scratch();
    idleThenItem(work);
    release(opts);
    git(work, "switch", "-q", "main");
    write(work, "planning/inbox/late.md", "# Late idea\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "docs(pm): park late");
    write(work, ".git/hooks/pre-commit", "#!/bin/sh\nexit 1\n");
    mergeUpstream(dir, "squash");

    const result = pull(opts);

    expect(result).toMatchObject({ action: "carried", moved: 1 });
    expect(sha(work, "main^")).toBe(sha(work, "origin/main"));
    expect(git(work, "status", "--porcelain")).toBe("");
  });
});
