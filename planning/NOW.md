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
- Item: R-021 Docs-site package: TypeScript source with a build step
- Session: feat/r-021-docs-site-package-typescript-source-with-a-build-step
- Stage: plan
- Brief: planning/briefs/2026-11-18-pm-docs-site-typescript.md
- Milestone: M1
- Spec: docs/superpowers/specs/2026-11-18-docs-site-package-typescript-design.md
- Plan:
- Started: 2026-11-18

## Done when

- `git ls-files packages/pm-docs-site` lists no `.js`, `.mjs`, or `.cjs` file; the package build emits JavaScript and declarations for `cli`, `index`, and `lib/`, and the packed tarball contains them and no `.ts` entry point that Node loads; the packed-install test runs the installed CLI with `node` and passes, and `just package-test` passes; the fixture site uses `astro.config.ts`; and `publish-pm-docs-site.yml` builds before `check-exports` and `npm publish`, pinned by `scripts/workflows.test.ts`.

## Checkpoint

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
