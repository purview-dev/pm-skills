# ADR-004 The PM branch never keeps delivered commits

- Status: accepted
- Date: 2026-11-22
- Category: tooling
- Supersedes: none
- Item: R-044
- Source: none

## Context

PM skills commit idle-time PM state (`pm-review`, `pm-shape`, `pm-item`) on the local PM branch and never push it, and the `main` ruleset accepts changes only through pull requests. `pm-next` cut each item branch from that local branch, so those commits rode the item's pull request. A squash or rebase merge then landed them under new SHAs, local `main` diverged from `origin/main`, and the user's `git pull` merged the same work twice and conflicted in the derived `planning/planning.json` (2026-11-22, PR #47).

## Decision

One script, `skills/pm-next/scripts/sync.ts` (**PM sync**), is the only thing that moves the PM branch.

- `release` runs from the item branch right after `pm-next` cuts it. It moves the PM branch back to `<remote>/<PM branch>`, because the item branch now carries its commits.
- `pull` fast-forwards the PM branch, or repairs a diverged one.
  - Each local-only commit, which must touch only the PM root, is delivered when some remote commit already holds its change: a three-way merge of that commit's own change onto the remote commit changes nothing. This holds for merge-commit, squash, and rebase merges alike.
  - Undelivered commits are carried as one `docs(pm): carry` commit, built with `commit-tree`.
  - A conflict stops it before anything moves.
- `driver` registers a `merge=pm-export` driver that keeps the current side of the derived `planning.json`, and sets `branch.<PM branch>.mergeOptions` to `--ff-only`, so a plain `git pull` on the PM branch never makes a merge.

## Alternatives

- **Require merge commits for pull requests.** Rejected by the user: the lifecycle must work under every merge method.
- **Prove delivery by the `## Done` line on the remote.** Rejected: it fails once the item branch is deleted, and it says nothing about commits made after the cut.
- **Repair with one whole-tree merge from the fork point.** Rejected in review: delivered state that upstream later deleted or changed (a triaged inbox file, a closed item) would come back as a carry.
- **Carry with `git apply -3`.** Rejected: it fails on files a squash already created.

## Consequences

- After the normal lifecycle, the pull that follows a merge is a fast-forward under any merge method.
- A refused plain pull is fixed with `just pm-sync`, or with `bun <pm-next skill>/scripts/sync.ts pull`.
- The rules allow `branch -f`, `reset --keep`, `reset --soft`, `commit-tree`, and `config` for PM sync only.
- The carry commit bypasses commit hooks, because its changes already passed them when first committed.
- GitHub's server-side merge does not run custom drivers, so a pull request whose `planning.json` conflicts is updated locally.
- Needs git 2.40 or later (`merge-tree --write-tree --merge-base`).
