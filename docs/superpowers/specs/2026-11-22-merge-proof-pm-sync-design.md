# Merge-proof PM sync: design

- Date: 2026-11-22
- Approved: 2026-11-22 (user), as a roadmap item at the top of Next, shipping as `21.0.0-pre.6`
- ADRs: writes ADR-004 The PM branch never keeps delivered commits (proposed, Item R-044); follows ADR-001 ADRs live in the PM root

## Intent

After any pull request merges (merge commit, squash, or rebase), `git switch <PM branch>` followed by `git pull` must fast-forward, and PM state must never conflict. The user hit this twice: switching to `main` and pulling after a squash-merged PR gave `CONFLICT (content): Merge conflict in planning/planning.json`.

## Root cause (observed 2026-11-22)

1. PM skills commit idle-time PM state (`pm-review`, `pm-shape`, `pm-item`) on the local PM branch and never push it. The `main` ruleset requires a pull request, so the commits cannot be pushed directly either.
2. `pm-next` cuts the item branch from the **PM base**, which is the local PM branch when it is ahead, so those commits ride the item's pull request.
3. A squash or rebase merge lands them under new SHAs (PR #47 became `54c5db1`, which has one parent). Local `main` still holds the originals, so it diverges from `origin/main` (ahead 3, behind 1).
4. A merging pull then merges the same work twice. The Markdown auto-merges because the edits are identical. `planning.json`, a whole-file snapshot regenerated on every PM commit (`generatedAt`, counts, arrays), conflicts.

## Goals

- **Prevent.** The local PM branch never keeps commits that an item branch carries.
- **Repair.** A diverged PM branch whose local-only commits are proven delivered is moved to the remote. Commits that are not delivered are carried forward, never dropped.
- **No derived conflicts.** `<PM root>/planning.json` never stops a merge.

## Non-goals

- Pushing the PM branch, or opening pull requests that hold only PM state (both remain forbidden).
- Changing the repository's merge method.
- Rewriting history on any remote branch.

## Approaches

- **A. Prevent, repair, and add a merge driver (chosen).** It covers every merge method, the user's own `git pull`, and commits made outside the skills.
- B. Prevention only. Rejected: commits made outside the skills, and `planning.json` conflicts between two pull requests, still break.
- C. Require merge commits. Rejected by the user ("teach it about all merges").

## Design

1. **Prevent (`pm-next` step 6, Feature branches rule 1).**
   - After `git switch -c <Item branch> <PM base>`, when the PM base was the local PM branch ahead of `<remote>/<PM branch>`, run `git branch -f <PM branch> <remote>/<PM branch>`.
   - The commits now live on the item branch. The PM branch is not checked out, so no file changes.
   - Add the Note `Moved <n> PM commits from <PM branch> to <Item branch>.`
2. **Repair (Shared definitions: Pull latest, and PM base).** When the PM branch has diverged from its remote:
   - Every local-only commit (`git rev-list <remote>/<PM branch>..<PM branch>`) must touch only the PM root. Otherwise stop, as today.
   - The worktree that holds the PM branch, if any, must have no uncommitted changes under the PM root. Otherwise stop.
   - **Three-way tree merge (ruling made while planning; it replaces the `## Done`-line proof).**
     - Take the local PM branch with its derived files (`planning.json`, `planning.schema.json`) put back to their merge-base state.
     - Merge it onto `<remote>/<PM branch>` with `git merge-tree --write-tree --merge-base <base>`. This needs git 2.40 or later.
     - Edits that were already delivered, by any merge method, merge cleanly to the remote's tree. This holds even after the item branch is deleted. (A plain `git apply -3` would fail on files the squash already created.)
   - **Delivered** (the merged tree equals the remote's tree): move the PM branch to the remote.
     - When it is checked out, run `git reset --keep <remote>/<PM branch>`.
     - Otherwise run `git branch -f <PM branch> <remote>/<PM branch>`.
   - **Not delivered:** move the PM branch to the remote, then bring in the merged tree.
     - Run `git read-tree -m -u HEAD <tree>`, refresh the export, and make one PM commit, `docs(pm): carry <n> PM commits onto <remote>/<PM branch>`.
     - When the branch is not checked out, `git commit-tree` builds that commit instead, and the export is left for the next PM commit.
   - **Conflict:** nothing is moved. The PM branch stays at its old SHA, both SHAs are printed, and the script stops. A failure after the move restores the branch with `git reset --keep <old sha>`. Nothing is ever lost.
   - The script is `skills/pm-next/scripts/sync.ts` (`release`, `pull`, `driver`).
3. **Merge driver.**
   - `.gitattributes` gets `<PM root>/planning.json merge=pm-export`.
   - The driver, `git config merge.pm-export.name "pm-export derived file"` and `git config merge.pm-export.driver true`, keeps the current side.
   - The export is derived and is refreshed by the next PM commit (Committing PM state, step 6). `pm-export check` reports it as stale until then.
   - Registered by `pm-setup` in consumers (a new, stated write) and by `just install` here.
   - `pm-help` diagnoses a missing attribute or driver.
4. **Rules.**
   - Non-interruption rule 6 allows more state-changing git commands, run only by `sync.ts` on the PM branch: `git branch -f`, `git reset --keep`, `git read-tree -m -u`, `git commit-tree`, and `git merge --ff-only`.
   - `pm-setup` may write `.gitattributes` and the two `git config` keys.
   - Add a `Version 21` upgrade note.
   - The managed section and `skills/pm-init/templates/config.md` change together (`scripts/validate.ts`).
5. **Docs site:** nothing, because this is git behaviour, not PM state or a browsable record.

## Done when

- In a scratch repository with a bare remote, for each of a merge commit, a squash, and a rebase merge of an item branch that carries idle PM commits: `git switch main` followed by `git pull --ff-only` succeeds, and `planning/` matches the remote.
- A diverged PM branch whose commits were delivered is repaired by **Pull latest** to equal the remote. An undelivered PM-only commit is carried forward as one `docs(pm): carry` commit.
- Two branches that each change `planning.json` merge without a conflict once the driver is registered.
- `just lint-check` and `just validate` pass.

## Left to the builder

- Where the scratch-repository rehearsal lives: a `scripts/` test (`bun test`) is preferred, so CI repeats it.
- The exact wording of the rules text.
