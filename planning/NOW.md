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
- Item: R-036 Plan citation and done check
- Session: feat/r-036-plan-citation-and-done-check
- Stage: design
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: M
- Depends on: R-033, R-034
- Revisits:
- Spec:
- Plan:
- Started: 2026-11-25

## Done when

- `pm-next` and `pm-checkpoint` (`stage`) pass the principles and ADRs that apply to the plan handoff; `pm-checkpoint` (`done`) refuses to close on a failing command check and lists failed review checks as a `Note` and an inbox file, shown in a rehearsal report in `planning/research/` whose scratch repository has `docs/adr/` and in which `pm-adr import docs/adr/` brings its ADRs into `planning/decisions/`; `pm-purview` hands accepted packages to `pm-engineering add`.

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
