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
- Item: R-006 Check pm-setup's skill counts in validate
- Session: feat/r-006-check-pm-setup-skill-counts
- Stage: execute
- Brief:
- Milestone: M2
- Serves: V1
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: 2026-11-26: the Done when's `22` is the old number; `pm-setup`'s `26 of 26` is correct today (27 shipped `pm-*` skills minus `pm-setup`, which its inventory omits; `release` is internal), and the check compares the counts with that number, whatever it is.
- Spec: docs/superpowers/specs/2026-11-26-r-006-pm-setup-skill-counts-design.md
- Plan: docs/superpowers/plans/2026-11-26-r-006-pm-setup-skill-counts.md
- Started: 2026-11-26

## Done when

- `just validate` fails when the `<n> of 22` counts in `pm-setup` differ from the number of shipped skills.

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
