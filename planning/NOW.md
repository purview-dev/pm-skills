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
- Item: R-040 ADR link and export edge cases
- Session: feat/r-040-adr-link-export-edge-cases
- Stage: plan
- Brief:
- Milestone: M4
- Serves: V4, V5
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From the 2026-11-22 review; R-038 final-review findings (inbox 2026-11-22-1554, 1555, 1556). (1) Bug, minor: `references()` linkifies an ADR's raw Markdown while the ADR page links the rendered HTML, so `_R-012_` gives a link with no Linked from entry, and `[R-012](url)` or image alt text gives a Linked from entry with no link. `linkHtml` also splits tags on a `>` inside an attribute value, and links IDs inside raw script and style blocks. Fix: build the ADR page's references from the rendered HTML (or have `linkHtml` return the keys it linked), and use the tag pattern `<(?:"[^"]*"|'[^']*'|[^'">])*>`. Files: `packages/pm-docs-site/src/lib/link-html.ts`, `src/lib/references.ts`. (2) Bug, minor: the exporter strips HTML comments everywhere, so an ADR section showing `<!-- pm-skills:start -->` in code loses it, although ADR-002 promises sections verbatim; `parseAdr` takes the ID from the heading before the file name, so a mismatched heading duplicates an ID and the site overwrites one page. Fix: keep comments inside code in ADR sections, and prefer the file-name ID or fail on a duplicate. File: `skills/pm-export/scripts/planning.ts` (a rules bump). (3) Decisions view: turning every status chip off writes `?status=`, which reloads as the default; ADRs with no status ignore the status chips; with one category there is no category chip, so a shared `?category=x` filters invisibly until Clear; without JavaScript the superseded rows cannot be shown. Files: `packages/pm-docs-site/src/lib/decisions.ts`, `src/components/decisions/Decisions.tsx`. 2026-11-25: Started as is: the Current focus in STRATEGY.md names M1 Reproducible docs site, done since 2026-11-24, so the focus check is out of date rather than a conflict.
- Spec: docs/superpowers/specs/2026-11-25-adr-link-and-export-edge-cases-design.md
- Plan:
- Started: 2026-11-25

## Done when

- An ADR whose Context holds `_R-012_`, `[R-012](https://x)`, and `![a > R-012](x.png)` builds with matching links and Linked from entries and an intact alt attribute (`test/links.test.ts` passes).
- An ADR section keeps a `<!-- x -->` inside a code span through `pm-export write`.
- A file `ADR-004-x.md` headed `# ADR-003` fails the export or exports as ADR-004.
- The Decisions view's empty-status, no-status, single-category, and no-JavaScript states have tests that pin the chosen behaviour.
- `just test` and `just package-test` pass.

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
