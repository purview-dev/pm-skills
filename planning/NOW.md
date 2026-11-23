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
- Item: R-045 Docs-site package: architecture view
- Session: feat/r-013-docs-site-package
- Stage: design
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Note: From R-013 design (2026-11-23): the user chose to build it before R-013 so no architecture-module site is left without a path when the templates are deleted. Port `skills/pm-docs-site/templates/architecture/` (MODULE.md, `src/lib/architecture.ts`, `src/pages/architecture/[group].astro`) into the package as an option; astroc4 and its peers (`@astrojs/react`, `react`, `react-dom`, `likec4`, `@likec4/core`) as optional peer dependencies. R-013's spec (`docs/superpowers/specs/2026-11-23-docs-site-package-publish-and-migrate-design.md`, sections 3 and 4) consumes the option name and its peer-dependency steps. This repository's model: `docs/wiki/diagrams/pm-skills.c4`. 2026-11-23: claimed on feat/r-013-docs-site-package at the user's request, because R-045 exists only on that branch.
- Spec:
- Plan:
- Started: 2026-11-23

## Done when

- With `pmDocsSite({ architecture: ... })` pointing at a LikeC4 model, the build renders one page per view folder at `/architecture/<group>/` through `@purview-dev/astroc4`, and a ```` ```likec4 ```` fence in a repository docs page renders a diagram.
- `examples/demo/` builds with a LikeC4 model and `just package-test` passes.
- A site without the option builds without astroc4 installed.

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
