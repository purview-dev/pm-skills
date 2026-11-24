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
- Item: R-043 Per-session context report
- Session: feat/r-043-per-session-context-report
- Stage: design
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Milestone:
- Serves: V2
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Note: From pm-shape 2026-11-22 (inbox 2026-11-22-1232), reshaped 2026-11-24 into 5 slices (R-043, R-046 to R-049); the upgrade-notes move went to R-046. A rules change. Dependency-free estimate (characters / 4), shipped in `pm-help` diagnose rather than a new skill; the `pm-tidy` archive slice is deferred until the report's PM state line recommends it. 2026-11-24: Started as is outside the M1 focus, because the user chose Build it now in pm-shape.
- Spec:
- Plan:
- Started: 2026-11-24

## Done when

- `bun skills/pm-help/scripts/context.ts --root .` prints one line per session type (`always`, `resume`, `claim`, `checkpoint`, `review`) with estimated tokens and the three largest files.
- `pm-help` diagnose prints that table.
- A `planning/research/` report records the baseline table.
- A test fails when the script's map names a missing skill or file.
- `just lint-check` and `just validate` pass.

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
