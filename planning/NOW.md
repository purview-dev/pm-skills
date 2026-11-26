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
- Stage: design
- Brief:
- Milestone: M2
- Serves: V1
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: 2026-11-26: the Done when's `22` is stale; `pm-setup` now says `26 of 26` while 27 `pm-*` skills ship (`release` is repository-only), so the check compares the count `pm-setup` writes with the shipped `pm-*` skills, whatever the number.
- Spec:
- Plan:
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
