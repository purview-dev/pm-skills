# Now

<!--
Edited only by pm-* skills. PM state lives in the main worktree; a completion
record may be written in the worktree that holds the item's branch.
Fields are fixed. When idle, every field except Status is empty.
Status: idle | active
Stage: design | plan | execute | finish
Session: <branch> (worktree <path>, optional)
Brief: optional; the item's brief, if it has one
Milestone: optional; the item's milestone while it is active
-->

- Status: active
- Item: R-017 Docs-site package: in-repo dev hydrates
- Session: feat/r-017-docs-site-package-in-repo-dev-hydrates
- Stage: design
- Brief:
- Milestone: M1
- Spec: docs/superpowers/specs/2026-11-18-docs-site-package-in-repo-dev-design.md
- Plan:
- Started: 2026-11-18

## Done when

- From `packages/pm-docs-site`, the package CLI's `dev test/fixtures/site` serves `/plan/board/?group=owner` with the Board island hydrated, and the dev server logs no `server.fs.allow` error.

## Checkpoint 2026-11-18 17:02

- Stopped at: design, approach 1 chosen (a `configResolved` plugin appends the package's real directory to the resolved `server.fs.allow` when no entry contains it), spec `docs/superpowers/specs/2026-11-18-docs-site-package-in-repo-dev-design.md` on this branch (commits 4eaf974, 53c8730).
- Next action: R-021 Docs-site package: TypeScript source with a build step has merged and `origin/main` is merged into this branch (e51ddcc); update the spec's Language line (the helper is a `.ts` source file in `lib/`, emitted by R-021's build) and its blocked decision, get the user's approval, then run writing-plans.
- Start with: the spec file.
- Decisions: TypeScript strongly preferred, JavaScript only where the runtime needs it (user, 2026-11-18, while shaping R-021); R-017 waits for R-021 so its helper is TypeScript.
- Context: Node refuses `.ts` under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), Bun loads it (checked 2026-11-18).
- Open question: none.

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: design
- Brief: planning/briefs/R-007-tenant-billing.md
- Milestone: M1
- Spec: docs/superpowers/specs/<file>.md
- Plan: docs/superpowers/plans/<file>.md
- Started: 2026-10-29

## Done when

- <observable check>

## Checkpoint 2026-10-29 14:55

- Stopped at: <last completed step>
- Next action: <one action>
- Start with: <exact command or file path>
- Decisions: <decisions made since the last checkpoint, with reasons | none>
- Context: <facts the next session needs that are not in the spec or plan | none>
- Open question: <only if blocking>
-->
