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
- Item: R-027 Docs-site package: build hardening
- Session: feat/r-027-docs-site-package-build-hardening
- Stage: plan
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Spec: docs/superpowers/specs/2026-11-20-docs-site-package-build-hardening-design.md
- Plan:
- Started: 2026-11-20

## Done when

- `@types/node` is in `packages/pm-docs-site` `devDependencies`; `scripts/build.ts` and the install-test guard walk `dist/` recursively; `scripts/check-exports.ts` accepts `.mjs` and `.cjs` entry points and rejects a `.d.ts` outside a `types` condition; every type import in the packed tarball resolves; the `astro.config.ts` examples in `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md` are fenced as `ts`; and no file names `0.1.0-pre.1` as the published version.

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
