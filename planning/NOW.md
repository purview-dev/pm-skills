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
- Item: R-034 Engineering file and pm-engineering skill
- Session: feat/r-034-engineering-file-and-pm-engineering-skill
- Stage: execute
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Note: 2026-11-24: Started as is: the Current focus milestone M1 Reproducible docs site is done (2026-11-24) and M4 is next in milestone order; run pm-strategy to set the focus.
- Spec: docs/superpowers/specs/2026-11-24-engineering-file-and-pm-engineering-skill-design.md
- Plan: docs/superpowers/plans/2026-11-24-engineering-file-and-pm-engineering-skill.md
- Started: 2026-11-24

## Done when

- `pm-engineering add` writes a linted entry to `planning/ENGINEERING.md` (`## Technology` and `## Principles`, each entry citing its `Source`), and the skill is listed in the README, managed-section, `pm-setup`, and `pm-help` tables with `just validate` and `just test` passing.

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
