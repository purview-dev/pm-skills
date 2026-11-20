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
- Item: R-023 Docs-site package: stable browser tests
- Session: feat/r-023-docs-site-package-stable-browser-tests
- Stage: execute
- Brief:
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Spec: docs/superpowers/specs/2026-11-20-docs-site-package-stable-browser-tests-design.md
- Plan: docs/superpowers/plans/2026-11-20-docs-site-package-stable-browser-tests.md
- Started: 2026-11-20

## Done when

- `npx playwright test test/browser/graph.browser.ts --project chromium --repeat-each=10` in `packages/pm-docs-site` passes 10 of 10 runs.
- `just package-test` passes twice in a row.

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
