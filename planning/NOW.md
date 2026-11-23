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
- Item: R-013 Docs-site package: publish and migrate
- Session: feat/r-013-docs-site-package
- Stage: design
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M1
- Serves: V4
- Owner: both
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014, R-019, R-027, R-028, R-029, R-031
- Revisits:
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major. From the 2026-11-22 review: (1) Done when moved to schemaVersion 6, because R-038 moved the export to 5 (inbox 2026-11-22-1501). (2) R-028's accessibility fixes (popup trigger, backdrop close, heading levels, card tab stops, collapse toggles, timeline zoom focus) exist only in `packages/pm-docs-site`; confirm the migrated `docs-site/` no longer carries the gaps of `skills/pm-docs-site/templates/`, or port the fixes if R-013 slips (inbox 2026-11-20-1844). (3) `just docs-check` still logs `[WARN] [content] Entry docs → 404 was not found.` from the template site; confirm it is gone after the migration, or give the template the package's fix (Starlight `disable404Route: true` and its own `src/pages/404.astro`; not a draft `404` entry, which prints a draft notice) (inbox 2026-11-21-1035). (4) The brief's Performance ramification ("Render static HTML first and enhance with small islands") is superseded: R-010 design (2026-11-18) chose rich interactive React islands for every view (React over Preact), and its Ramifications omit the React runtime dependency every consumer now gets (inbox 2026-11-18-0911; spec `docs/superpowers/specs/2026-11-18-docs-site-package-board-filters-design.md`).
- Spec:
- Plan:
- Started: 2026-11-23

## Done when

- `npm view @purview-dev/pm-docs-site version` returns the released version.
- `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore`, and `just docs-check` passes.
- Two builds from the same `planning.json` and lockfile give byte-identical HTML.
- A scratch export at schemaVersion 6 fails the build until the package's range includes it.

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
