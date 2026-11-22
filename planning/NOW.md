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
- Item: R-039 ADRs across the PM skills
- Session: feat/r-039-adrs-across-the-pm-skills
- Stage: plan
- Brief: planning/briefs/2026-11-22-where-do-adrs-fit.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: M
- Depends on: R-033
- Revisits:
- Note: Slice 3 of the ADR work (spec docs/superpowers/specs/2026-11-22-adr-record-design.md, Follow-ups). The design re-entries were added by the R-033 final review. 2026-11-22: Started as is outside the Current focus (M1 Reproducible docs site) at the user's choice; it was first in Next.
- Spec: docs/superpowers/specs/2026-11-22-adrs-across-the-pm-skills-design.md
- Plan:
- Started: 2026-11-22

## Done when

- `pm-shape` and `pm-discover` read ADRs and challenge contradictions; `pm-revise` supersedes an ADR a correction reverses; `pm-checkpoint` (`done`) checks the spec's ADR IDs exist; `pm-review` lists ADRs `proposed` longer than the review cadence; `pm-purview` records an accepted recommendation as an ADR; `pm-status` counts ADRs by status; `pm-help` diagnoses unaccepted and broken ADRs; every re-entry into design (`pm-next` resume, `pm-resume`, `pm-checkpoint` `pop`, `pm-revise` `rewind`, `pm-rejoin`) passes the ADR instruction; `just validate` and `just test` pass.

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
