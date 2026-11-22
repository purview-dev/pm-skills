# Merge-proof PM sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After any pull request merge (merge commit, squash, or rebase), the PM branch fast-forwards on pull and PM state never conflicts.

**Architecture:** A dependency-free Bun script, `skills/pm-next/scripts/sync.ts`, owns the PM branch moves:

- `release` moves the local PM branch back to its remote after an item branch takes its commits.
- `pull` fast-forwards the PM branch, or repairs a diverged one by carrying its PM-root changes onto the remote with a 3-way apply.

A `merge=pm-export` driver keeps `planning.json` from conflicting in local merges. The managed rules, `pm-next`, `pm-setup`, and `pm-help` call them.

**Tech Stack:** Bun, TypeScript (`node:child_process`, `node:fs`), `bun:test`, git.

**Spec:** `docs/superpowers/specs/2026-11-22-merge-proof-pm-sync-design.md`

## Global Constraints

- Dependency-free: import only `node:` and `bun:` modules, like `skills/pm-export/scripts/`.
- State-changing git commands the script may run, and nothing else:
  - `git fetch <remote> --prune`;
  - `git merge --ff-only <remote>/<PM branch>`, run only when the PM branch is checked out;
  - `git branch -f <PM branch> <remote>/<PM branch>`;
  - `git reset --keep <sha>`;
  - `git apply -3 --index`;
  - `git add` and `git commit -- <PM root>`.
- It never pushes, never runs `--hard`, never stashes, and never rebases.
- It never discards a commit. Any failure restores the PM branch to its starting SHA and exits non-zero, printing both SHAs.
- Local-only commits that touch a path outside the PM root stop the repair, unchanged.
- Rules stay on 21. `package.json` moves to `21.0.0-pre.6` with `just bump prerelease`.
- Every `.md` file passes `bunx markdownlint-cli2`. Commit subjects are lowercase.
- `justfile` recipes stay `sh`; never set a shell.

## Review Focus

- A PM branch with uncommitted PM-root changes must not be moved: `pull` stops before touching it. This is pinned in Task 1.
- A repository with no remote, or a PM branch with no upstream, must be a no-op that reports `no remote`, not an error. Pinned in Task 1.
- A detached HEAD, or a checked-out item branch, must still let `release` and `pull` move the PM branch with `branch -f`, because it is not checked out. Pinned in Task 1.
- CRLF files (Windows checkouts) must carry through `git apply -3` unchanged. Pinned in Task 1 by a CRLF fixture file.
- GitHub's server-side merge ignores custom drivers. The rules text must say the driver covers local pulls and merges only. Checked in Task 3's review.

## Ruling (made while planning)

- Delivery is proven by a 3-way apply, not by the `## Done` line on the remote. Applying the local PM-root diff (merge base to the local PM branch, excluding `planning.json` and `planning.schema.json`) onto the remote with `git apply -3` merges identical, already-delivered edits cleanly and leaves nothing to commit. Edits that were not delivered remain and become one carry commit. This works for every merge method, and still works after the item branch is deleted. Cost if wrong: an apply conflict on delivered work makes `pull` stop and restore the branch, so it fails safe. The spec's Design item 2 is updated to match.

---

### Task 1: `sync.ts`, with `release` and `pull`

**Files:**

- Create: `skills/pm-next/scripts/sync.ts`
- Create: `skills/pm-next/scripts/sync.test.ts`
- Modify: `justfile` (the `test` recipe adds `skills/pm-next/`)
- Modify: `docs/superpowers/specs/2026-11-22-merge-proof-pm-sync-design.md` (Design item 2, per the ruling)

**Interfaces:**

- Produces the CLI: `bun skills/pm-next/scripts/sync.ts <release|pull> [--root <repo>] [--pm-root planning/] [--pm-branch <name>] [--remote <name>]`.
  - The defaults come from `<PM root>/config.md`: `PM branch` (else the main worktree's current branch). `--remote` defaults to the PM branch's upstream remote, else `origin`, else none.
  - It prints one result line on stdout and exits 0, or exits 1 with `sync: <reason>` on stderr.
- Produces the exports: `release(opts: SyncOptions): SyncResult` and `pull(opts: SyncOptions): SyncResult`.
  - `SyncOptions` is `{ root: string; pmRoot: string; pmBranch: string; remote: string | null }`.
  - `SyncResult` is `{ action: 'none' | 'fast-forward' | 'released' | 'repaired' | 'carried'; moved: number; message: string; commit?: string }`.
- Result lines:
  - `release`: `Moved <n> PM commits from <PM branch> to the item branch.`, or `<PM branch> already matches <remote>/<PM branch>.`
  - `pull`: `<PM branch> fast-forwarded <n> commits.`, `<PM branch> repaired: <n> delivered commits replaced by <remote>/<PM branch>.`, or `<PM branch> carried <n> PM commits onto <remote>/<PM branch> as <sha>.`

**Behaviour:**

- **`release`:**
  - Fetch first.
  - When the PM branch is strictly ahead of `<remote>/<PM branch>` (behind 0) and is not checked out in any worktree, run `git branch -f`.
  - When it is checked out, return `none` with `Run release from the item branch.` It never moves a checked-out branch.
- **`pull`:**
  - Fetch first.
  - **Behind only:** fast-forward. With the branch checked out, run `git merge --ff-only`; otherwise run `git branch -f`.
  - **Diverged:**
    1. Require every local-only commit to touch only the PM root.
    2. Require no uncommitted changes under the PM root in the worktree that holds the branch.
    3. Record `old = rev-parse <PM branch>` and `base = merge-base`.
    4. Take the patch: `git diff --binary <base> <old> -- <PM root> ':!<PM root>/planning.json' ':!<PM root>/planning.schema.json'`.
    5. Move the branch to the remote (`reset --keep` when checked out, else `branch -f`).
    6. When the branch is checked out and the patch is non-empty, run `git apply -3 --index` on it.
       - If the index then differs from HEAD, refresh the export by running `bun skills/pm-export/scripts/export.ts write --root <root> --pm-root <pm-root>` (resolved from this script's location, `../../pm-export/scripts/export.ts`), when `<PM root>/planning.json` exists.
       - Then `git add -A -- <PM root>` and commit `docs(pm): carry <n> PM commits onto <remote>/<PM branch>`. The result is `carried`.
       - If the index matches HEAD, the result is `repaired`.
    7. When the branch is not checked out, carry through a temporary index:
       - `GIT_INDEX_FILE=<tmp>`;
       - `git read-tree <remote>/<PM branch>`;
       - `git apply -3 --cached`;
       - `git write-tree`;
       - `git commit-tree -p <remote>/<PM branch>`;
       - `git branch -f <PM branch> <new>`.

       The export refresh is skipped there, with the message suffix `; run pm-export on <PM branch>.`
    8. On any failure after the move, run `git reset --keep <old>` (or `branch -f <PM branch> <old>`), exit 1, and print `sync: restored <PM branch> to <old>; <reason>`.

- [ ] **Step 1: Write the failing tests** in `skills/pm-next/scripts/sync.test.ts`.

  Use a helper that builds a scratch layout in `mkdtempSync`:

  - a bare remote `remote.git`;
  - a clone `work` with `planning/config.md` (`- PM branch: main`), `planning/LOG.md`, `planning/ROADMAP.md`, `planning/planning.json`, and one CRLF file `planning/inbox/crlf.md`;
  - `main` pushed, and git user config set.

  Simulate the merge methods with git only:

  - merge commit: `git merge --no-ff`, then push from a second clone;
  - squash: `git merge --squash`, then commit;
  - rebase: `git rebase`, then a fast-forward.

  Write these tests, with these assertions:

  1. `release moves unpushed PM commits off main after an item branch is cut`: on `item` cut from `main` (2 local PM commits ahead), `release` returns `released`, `moved: 2`, and `main` equals `origin/main`.
  2. `pull fast-forwards main after a merge commit, a squash, and a rebase merge`: one `it.each` over the three methods. After `release` and the merge on the remote, `git switch main` followed by `pull` gives `fast-forward`, and `git diff origin/main -- planning` is empty. As a control, plain `git pull --ff-only` also exits 0.
  3. `pull repairs a main that kept squash-delivered PM commits`: no `release`; the squash lands upstream; `pull` gives `repaired`, `main` equals `origin/main`, and no new commit is made.
  4. `pull carries an undelivered PM commit onto the remote`: one PM commit on `main` that is not on the item branch; `pull` gives `carried`, `moved: 1`, HEAD's parent is `origin/main`, its subject starts `docs(pm): carry 1 PM commits`, the carried file has its content, and the CRLF file keeps its `\r\n`.
  5. `pull stops when a local-only commit touches a path outside the PM root`: exits with `ok: false`, and `main` is unchanged.
  6. `pull stops on uncommitted PM changes`: `main` is unchanged.
  7. `pull restores main when the carry conflicts`: the same line is edited differently locally and upstream; `main` equals its old SHA and the message names both SHAs.
  8. `pull and release are no-ops without a remote`: the result is `none`, with message `no remote`.
  9. `pull moves main with branch -f when another branch is checked out`: from `item`, `pull` gives `repaired`, and `main` equals `origin/main`.

- [ ] **Step 2: Run the tests and confirm they fail**

  Run: `bun test skills/pm-next/`
  Expected: FAIL (`Cannot find module './sync'`).

- [ ] **Step 3: Implement `sync.ts`** to the Interfaces and Behaviour above.

  - Run git through `spawnSync('git', args, { cwd, encoding: 'utf8' })`, with a `git()` helper that throws on a non-zero exit.
  - Export `release` and `pull`. Make the CLI `import.meta.main`.

- [ ] **Step 4: Update the spec's Design item 2** to the 3-way apply rule (see Ruling above).

- [ ] **Step 5: Add `skills/pm-next/`** to the `justfile` `test` recipe.

- [ ] **Step 6: Run the tests and confirm they pass**

  Run: `bun test skills/pm-next/`
  Expected: PASS, 9 tests and 3 `each` cases, 0 fail.

  Run: `just test`
  Expected: exit code 0.

- [ ] **Step 7: Commit**

  ```bash
  git add skills/pm-next/scripts/sync.ts skills/pm-next/scripts/sync.test.ts justfile docs/superpowers/specs/2026-11-22-merge-proof-pm-sync-design.md
  git commit -m "feat(pm-next): sync script keeps the pm branch mergeable (R-044)"
  ```

### Task 2: The `planning.json` merge driver

**Files:**

- Modify: `skills/pm-next/scripts/sync.ts` (adds the `driver` command)
- Modify: `skills/pm-next/scripts/sync.test.ts`
- Create or modify: `.gitattributes` (this repository)
- Modify: `justfile` (the `install` recipe)

**Interfaces:**

- Consumes: the scratch-repository helper from Task 1.
- Produces the CLI: `sync.ts driver [--root] [--pm-root]`.
  - It ensures `.gitattributes` contains the line `<PM root>/planning.json merge=pm-export`, appending it with a final newline and creating the file when it is missing.
  - It runs `git config merge.pm-export.name "pm-export derived file"` and `git config merge.pm-export.driver true`.
  - It prints `Merge driver registered for <PM root>/planning.json.`, or `already registered`.
- Produces the export: `driver(opts: SyncOptions): SyncResult`.

- [ ] **Step 1: Write the failing tests**

  1. `driver registers the attribute and config once`: running it twice leaves exactly one line in `.gitattributes`, and `git config merge.pm-export.driver` prints `true`.
  2. `two branches that change planning.json merge without a conflict after driver`: branches `a` and `b` each rewrite `planning/planning.json` differently. `git merge b` on `a` exits 0, and `planning.json` equals `a`'s version. As a control, the same merge without `driver` exits non-zero.

- [ ] **Step 2: Run the tests and confirm they fail**

  Run: `bun test skills/pm-next/`
  Expected: the 2 new tests FAIL.

- [ ] **Step 3: Implement `driver`** in `sync.ts`.

- [ ] **Step 4: Register it in this repository**

  - Add `planning/planning.json merge=pm-export` to `.gitattributes`.
  - Add `bun skills/pm-next/scripts/sync.ts driver` to the `just install` recipe, after `lefthook install`.

- [ ] **Step 5: Run the tests and confirm they pass**

  Run: `bun test skills/pm-next/`
  Expected: PASS, 0 fail.

  Run: `bun skills/pm-next/scripts/sync.ts driver`
  Expected: `Merge driver registered for planning/planning.json.`, or `already registered`.

- [ ] **Step 6: Commit**

  ```bash
  git add skills/pm-next/scripts/sync.ts skills/pm-next/scripts/sync.test.ts .gitattributes justfile
  git commit -m "feat(pm-next): planning.json merge driver (R-044)"
  ```

### Task 3: Rules and skills use the sync script

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md`
- Modify: `AGENTS.md` (the installed copy between the markers, kept equal by `scripts/validate.ts`)
- Modify: `skills/pm-next/SKILL.md` (step 6)
- Modify: `skills/pm-setup/SKILL.md` (Step 5 item 6, and Step 6)
- Modify: `skills/pm-help/SKILL.md` (adds check 29)
- Modify: `package.json` (via `just bump prerelease`)

**Interfaces:**

- Consumes: the CLI commands `release`, `pull`, and `driver` from Tasks 1 and 2.

- [ ] **Step 1: Managed section**

  - **Pull latest (Shared definitions):** for the PM branch, run `bun <pm-next skill>/scripts/sync.ts pull` when Bun is installed.
    - It fast-forwards, or repairs a diverged PM branch by carrying its PM-root commits onto the remote; a branch it cannot carry is restored and stops.
    - Without Bun, keep `pull --ff-only`, which stops on divergence.
  - **PM base:** "diverged" now runs `sync.ts pull` before stopping.
  - **Feature branches rule 1:** after `git switch -c`, run `sync.ts release`, so the PM branch never keeps commits that the item branch carries.
  - **Non-interruption rule 6:**
    - Add `git branch -f <PM branch> <remote>/<PM branch>`, `git reset --keep`, and `git apply -3`, run only by `sync.ts` for the PM branch.
    - Add that `pm-setup` may write the `.gitattributes` line and the `merge.pm-export` git config.
  - **Upgrade notes:** a `Version 21` paragraph. It says the driver covers local pulls and merges only; GitHub's server-side merge does not run it.
  - Copy the section into `AGENTS.md` between the markers, without `version=`.

- [ ] **Step 2: `pm-next` step 6**

  - Add the `release` call and its Note line.
  - In step 1, use `sync.ts pull` for the PM base.

- [ ] **Step 3: `pm-setup` Step 5 item 6, "Merge driver"**

  - Run `bun <pm-next skill>/scripts/sync.ts driver`. Without Bun, print the `.gitattributes` line and the two `git config` commands.
  - Step 6 verify: `.gitattributes` may change only by that line.

- [ ] **Step 4: `pm-help` check 29**

  - Check: when `<PM root>/planning.json` exists, `git check-attr merge -- <PM root>/planning.json` prints `pm-export` and `git config merge.pm-export.driver` is set.
  - Finding: `planning.json merge driver not registered`.
  - Fix: `pm-setup`.

- [ ] **Step 5: Bump the version.** Run `just bump prerelease`. Expected: `package.json` version `21.0.0-pre.6`.

- [ ] **Step 6: Verify**

  Run: `just validate`
  Expected: exit code 0.

  Run: `bunx markdownlint-cli2 "**/*.md" "#node_modules"`
  Expected: `0 issues`.

- [ ] **Step 7: Commit**

  ```bash
  git add skills/pm-setup/references/AGENTS-section.md AGENTS.md skills/pm-next/SKILL.md skills/pm-setup/SKILL.md skills/pm-help/SKILL.md package.json
  git commit -m "feat(pm-skills): pm branch sync and merge driver in the rules (R-044)"
  ```
