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
- Item: R-057 pm-setup suggests ADR import before init
- Session: feat/r-057-pm-setup-suggests-adr-import-before-init
- Stage: design
- Brief:
- Milestone: M2
- Serves: V1
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From the 2026-11-26 review (bug, inbox 2026-11-26-0200, severity minor, from R-036 execute). pm-setup Step 5 item 4 checks for an existing docs/adr/ folder only when `<PM root>/config.md` exists, so running pm-setup before pm-init (the usual order on a new install) never prints the Note that suggests `pm-adr import docs/adr/`. Reproduction: the M4 rehearsal (`planning/research/2026-11-26-m4-rehearsal.md`); a scratch repository with `docs/adr/`, `pm-setup` run first, then `pm-init`; no import Note appeared. Every run.
- Spec:
- Plan:
- Started: 2026-11-26

## Done when

- `pm-setup` run in a repository with `docs/adr/` and no `<PM root>/config.md` prints the Note that suggests `pm-adr import docs/adr/`, shown in a scratch-repository run, and `just validate` passes.

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
