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
- Item: R-050 ADR relative images render unresolved
- Session: feat/r-050-adr-relative-images-render-unresolved
- Stage: plan
- Brief:
- Milestone: M4
- Serves: V4, V5
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From the 2026-11-25 review (bug, minor; inbox 2026-11-25-0931, R-040 execute). An ADR section with a relative image (`![a](x.png)`) renders as `<img __ASTRO_IMAGE_="{...}">` on the ADR page: the loader's renderMarkdown leaves an image placeholder that only Astro's render() resolves, and the page prints the HTML with set:html, so the image never shows. Remote image URLs render as plain img tags. Reproduction: add `![a](x.png)` to an ADR section, build the docs site, and open the ADR page: the img tag has no src, every time (evidence: R-040 links.test.ts build output). Files: `packages/pm-docs-site/src/loaders/adrs.ts`, `packages/pm-docs-site/src/routes/plan/decisions/[id].astro`.
- Spec: docs/superpowers/specs/2026-11-25-adr-relative-images-design.md
- Plan:
- Started: 2026-11-25

## Done when

- An ADR section with `![a](x.png)` builds to an ADR page whose `img` has a resolved `src`, a test in `packages/pm-docs-site/test/` covers it, and `just package-test` passes.

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
