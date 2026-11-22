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
- Item: R-033 ADR record, pm-adr, and design handoff
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

- `pm-adr new` in this repository writes `planning/decisions/ADR-001-<slug>.md` in the format, and `just pm-lint` passes; `pm-adr supersede ADR-001` writes `ADR-002` and sets ADR-001's status to `superseded by ADR-002`, and lint passes.
- `lint.test.ts` fails a bad `Status`, a missing section, a duplicate ID, and a broken `Supersedes` link, and passes the default format.
- `pm-adr import` on a scratch folder with one field-bullet, one MADR, and one Nygard-style ADR writes three linted ADRs with `Source` set.
- `pm-next` step 10 lists the ADRs and tells the design skill to record each architecture decision with `pm-adr`.
- The managed section defines the decisions folder, ADR IDs, ADR, the split, and the read-before-deciding rule, and Non-interruption rules 2 and 3 name `pm-adr`.
- `pm-adr` is in the README, managed-section, `pm-setup`, and `pm-help` tables, and `just validate`, `just test`, and `just lint-check` pass.

## Checkpoint 2026-11-22 14:20

- Stopped at: all 28 plan steps done; final whole-branch review clean after one fix wave (`981977a`, `ed67ff2`, `1b62658`).
- Next action: run `pm-checkpoint` (`done`) to close R-033 on this branch, then the finish step.
- Start with: `pm-checkpoint`
- Decisions: R-033 rescoped to the spec (user, 2026-11-22): ADRs live in `planning/decisions/` under `pm-adr`, and the `ADR directory` setting is dropped. ADR-001 ADRs live in the PM root (accepted) records it.
- Context: Revision 2026-11-22: title and Done when replaced with the spec's (brief `## Revisions`). The old Done when (the `ADR directory` setting in `config.md`) is superseded. The supersede and import rehearsal ran in a scratch copy: ADR-002 superseded ADR-001, and ADR-003 to ADR-005 were imported with `Source` set; one MADR list-marker finding led to the import fix in `ed67ff2`. `package.json` is `21.0.0-pre.3`.
- Open question: none.

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
