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
- Item: R-038 ADR export and Decisions view
- Session: feat/r-038-adr-export-and-decisions-view
- Stage: execute
- Brief: planning/briefs/2026-11-22-where-do-adrs-fit.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: M
- Depends on: R-033
- Revisits:
- Note: Slice 2 of the ADR work (spec docs/superpowers/specs/2026-11-22-adr-record-design.md, Follow-ups). Decisions view is a React island: text search, category and status chips, superseded hidden by default, group by category or status, URL state. 2026-11-22: Started outside the current focus M1 Reproducible docs site at the user's choice, to continue the ADR work after R-033 closed.
- Spec: docs/superpowers/specs/2026-11-22-adr-export-and-decisions-view-design.md
- Plan: docs/superpowers/plans/2026-11-22-adr-export-and-decisions-view.md
- Started: 2026-11-22

## Done when

- `pm-export write` puts `adrs` (read from `planning/decisions/`) in `planning/planning.json` at `schemaVersion` 5 and `pm-export check` passes; the `packages/pm-docs-site` Decisions view lists, searches, and filters ADRs by category and status, with one indexed page per ADR and feature pages listing their ADRs, covered by unit tests; the demo has ADRs; the templates read `schemaVersion` 5; `just validate`, `just test`, and `just demo-check` pass.

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
