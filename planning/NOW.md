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
- Item: R-020 Docs-site package: rich demo planning fixture
- Session: feat/r-020-docs-site-demo-fixture
- Stage: execute
- Brief: planning/briefs/R-020-docs-site-demo-fixture.md
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Spec: docs/superpowers/specs/2026-11-20-docs-site-demo-design.md
- Plan: docs/superpowers/plans/2026-11-20-docs-site-demo.md
- Started: 2026-11-20

## Done when

- `bun skills/pm-export/scripts/export.ts validate examples/demo/planning/planning.json` passes on a synthetic export with at least 3 milestones with targets, `Depends on` and `Revisits` edges including one into the active node, risks in red, amber, and green, inbox files, briefs, Done and Dropped log lines, and an active Now item.
- `just demo` builds `examples/demo/` against the local `packages/pm-docs-site` and serves it at <http://localhost:4321>.
- `just package-test` validates and builds `examples/demo/` and fails when a built `plan/` page has no content.
- `now.astro` reads owner and size from `now.item` only, `skills/pm-board/SKILL.md`'s Now card step says they come from `NOW.md`, `$defs/itemRef` is gone from the export schema, `graph.test.ts` has no `as unknown as Planning`, and the package fixture has an edge into the active node.
- `just lint-check` passes.

## Checkpoint 2026-11-20 09:40

- Stopped at: plan written (`docs/superpowers/plans/2026-11-20-docs-site-demo.md`, 7 tasks); execution approach: native.
- Next action: Task 1 of the plan (drop the unreferenced itemRef).
- Start with: superpowers:executing-plans
- Decisions: demo PM files in `examples/demo/planning/` generate `planning.json`; linked `file:` package with a `demo-check` recipe; `just bump` refreshes the demo export.
- Context: Revision 2026-11-20: the `Done when` path is `examples/demo/planning/planning.json`, not `examples/demo/planning.json`.

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
