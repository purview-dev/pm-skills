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
- Item: R-044 Merge-proof PM sync
- Session: feat/r-044-merge-proof-pm-sync
- Stage: execute
- Brief:
- Milestone:
- Serves: V2, V3
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Note: Added and claimed 2026-11-22 at the user's request ("teach it about all merges so this can never happen. Do this now"), ahead of the M1 focus, after a squash-merged PR left local main diverged and planning/planning.json conflicting on pull. Design approved in the conversation and recorded in the spec.
- Spec: docs/superpowers/specs/2026-11-22-merge-proof-pm-sync-design.md
- Plan: docs/superpowers/plans/2026-11-22-merge-proof-pm-sync.md
- Started: 2026-11-22

## Done when

- In a scratch repository with a bare remote, for each of a merge commit, a squash, and a rebase merge of an item branch that carries idle PM commits, `git switch main` then `git pull --ff-only` succeeds and `planning/` equals the remote.
- A diverged PM branch whose commits were delivered is repaired by Pull latest to equal the remote; an undelivered PM-only commit is carried forward as one `docs(pm): carry` commit.
- Two branches that each change `planning.json` merge without a conflict once the driver is registered.
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
