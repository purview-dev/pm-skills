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
- Item: R-025 Docs-site package: feature pages list revisions
- Session: feat/r-025-docs-site-package-feature-pages-list-revisions
- Stage: plan
- Brief:
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From R-012 design (2026-11-19): `dependents()` in `packages/pm-docs-site/src/lib/planning.ts` looks only at `dependsOn`, so a feature page lists its dependants but not the items whose `Revisits` names it; the R-012 graph already draws Revisits edges.
- Spec: docs/superpowers/specs/2026-11-22-feature-pages-list-revisions-design.md
- Plan:
- Started: 2026-11-22

## Done when

- a feature page for an item that another item's `Revisits` names lists that item under "Revised by", and a unit test in `packages/pm-docs-site` covers it.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: execute
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
