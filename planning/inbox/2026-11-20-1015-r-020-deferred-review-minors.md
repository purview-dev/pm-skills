# R-020 deferred demo check review minors

- Captured: 2026-11-20 10:15
- Source: agent (R-020 execute)
- Kind: tech-debt
- Affects: scripts/check-demo.ts, examples/demo/planning/planning.json
- Context: R-020 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Four minor findings from the R-020 final review, deferred: (1) `scripts/check-demo.ts` scans only `plan/` pages, so the home page's empty states ("Nothing in Next can be started.", "No open risk is red.") are not checked; include `index.html`. (2) The `Nothing links here yet.` allowlist entry is unused in today's demo build; drop it until a feature page needs it. (3) The demo export records this repository's branch and head (`feat/r-020-docs-site-demo-fixture`, `c2220cd`) as its source, now frozen by `export.ts write --frozen`; pin a neutral source. (4) The opening-tag regex in `emptyStates` also matches `data-class=`, and an unclosed `plan-empty` element swallows the rest of the page (loud false positives only).

## Links

- docs/superpowers/plans/2026-11-20-docs-site-demo.md
