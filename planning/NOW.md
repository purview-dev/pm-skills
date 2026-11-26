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
- Stage: plan
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: M
- Depends on: R-033, R-034
- Revisits:
- Spec: docs/superpowers/specs/2026-11-25-plan-citation-and-done-check-design.md
- Plan:
- Started: 2026-11-25

## Done when

- `pm-next` and `pm-checkpoint` (`stage`) pass the principles and ADRs that apply to the plan handoff; `pm-checkpoint` (`done`) refuses to close on a failing command check and lists failed review checks as a `Note` and an inbox file, shown in a rehearsal report in `planning/research/` whose scratch repository has `docs/adr/` and in which `pm-adr import docs/adr/` brings its ADRs into `planning/decisions/`; an item `pm-purview` accepted records its package in `ENGINEERING.md` through `pm-engineering add`'s write steps when `pm-checkpoint` (`done`) closes it.

## Checkpoint 2026-11-25 21:39

- Stopped at: spec written at `docs/superpowers/specs/2026-11-25-plan-citation-and-done-check-design.md`, builder check answered
- Next action: user approves the spec, then the plan stage starts
- Start with: superpowers:writing-plans
- Decisions: approach A, prose only (user); Purview package recorded at item close, not at acceptance (user); rehearsal runs in a fresh agent session with this branch's skills installed in the scratch repository (user)
- Context: Revision 2026-11-25: Done when's pm-purview clause reworded to the record-at-close design (ADR-014 Purview packages are recorded at item close, proposed).

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
