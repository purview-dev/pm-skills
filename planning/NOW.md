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
- Item: R-009 Docs-site package: backlinks everywhere
- Session: feat/r-009-docs-site-package-backlinks
- Stage: plan
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M1
- Spec: docs/superpowers/specs/2026-11-17-docs-site-package-backlinks-design.md
- Plan:
- Started: 2026-11-17

## Done when

- The package link test finds every item, milestone, and risk ID the export knows, and every brief path, inside a link on every page of the fixture build (except a page's own ID in its title), and no internal link or anchor that does not resolve.
- Every item, milestone, and risk page has a `Linked from` section listing every page that links to it.
- Browser tests show the Board's five columns in one row at 1440, 1024, and 700px; a collapsed Board column stays collapsed after a reload; a plain click on a Board card or Roadmap row opens a detail popup with an `Open page` link, and a ctrl-click follows the link without a popup.
- At 1440px the main content of a plan page and a docs page is wider than Starlight's default 45rem column.
- `expected-pages.txt` lists the new risk pages, and `bun test`, `bun run check`, and `just version-check` pass in `packages/pm-docs-site/`.

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
