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
- Item: R-019 Docs-site package: consumer-ready for 1.0.0
- Session: feat/r-019-docs-site-package-consumer-ready-for-1-0-0
- Stage: design
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: R-021
- Revisits:
- Spec:
- Plan:
- Started: 2026-11-20

## Done when

- The package home page has no `just docs-preview`.
- A build without the `docs` option logs no Starlight missing-folder or empty-collection warning.
- `docsHref` returns no link for a spec or plan path no docs source maps, and honours a source `prefix`.
- RefLink prints fallback text (the entry title, "No milestone") for an unknown key.
- `linkify` uses the link scanner's boundaries, so an ID inside a path is not linked.
- The CLI warns when `--title` or `--planning` is ignored.
- A `planning.json` holding `null` prints the pm-export hint.
- `check` loads an `astro.config.ts` on the `engines` Node floor.
- The README names the same-drive requirement on Windows.

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
