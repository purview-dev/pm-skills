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
- Item: R-033 ADR directory setting and design handoff
- Session: feat/r-033-adr-directory-setting-and-design-handoff
- Stage: execute
- Brief: planning/briefs/2026-11-22-where-do-adrs-fit.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Spec: docs/superpowers/specs/2026-11-22-adr-record-design.md
- Plan: docs/superpowers/plans/2026-11-22-adr-record.md
- Started: 2026-11-22

## Done when

- `pm-init` in a scratch repository with `docs/adr/` writes `ADR directory: docs/adr/` to `planning/config.md` and `pm-lint check` passes; `pm-next` step 10's handoff names the ADR directory and tells the design skill to read it and write one ADR per architecture decision; the managed section names the directory and the product, technical, and spec split; `pm-help` reports `ADR directory: none` with `pm-setup` as the fix; `just validate` passes.

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
