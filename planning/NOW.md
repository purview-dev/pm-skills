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
- Item: R-018 Export the Now card's owner and size
- Session: feat/r-018-export-the-now-cards-owner-and-size
- Stage: execute
- Brief:
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Spec: docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md
- Plan: docs/superpowers/plans/2026-11-19-now-item-owner-size-links.md
- Started: 2026-11-19

## Done when

- `bun skills/pm-export/scripts/export.ts write` gives the active item's Now card its roadmap `owner` and `size` instead of `null`.
- The export gives the active item its own `dependsOn` and `revisits`, and the R-012 dependency graph draws those edges (for example R-008 -> R-012).
- The graph's `Own links not exported yet` notice is removed.
- The schema field docs, `planning.example.json`, and the docs-site fixture agree, and `just test` covers it.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: design
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
