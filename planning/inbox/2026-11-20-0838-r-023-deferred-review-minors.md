# R-023 deferred browser test review minors

- Captured: 2026-11-20 08:38
- Source: agent (R-023 execute)
- Kind: tech-debt
- Affects: packages/pm-docs-site/test/browser/graph.browser.ts, packages/pm-docs-site/playwright.config.ts
- Context: R-023 execute
- Discuss: no
- Related: R-023
- Brief: none
- Reviewed: never

## Idea

Four minor findings from the R-023 final review, deferred: (1) `sampleFrames` counts observer records toward the 5-frame post-hydration tail (`stopAtFrame = frames.length + 5`), so as few as 3 real animation frames are sampled after hydration; count rAF samples separately. (2) `record(true)` on a pending-mark removal reads `visible` and `layout` after the removal, recording an impossible `pending: true, visible: true` frame; push `visible: false` or comment it as a marker. (3) `arrowheadFill` reports `marker-end is not url(#id) (marker-end: null)` when the edge path itself is missing; add a `no edge path` reason. (4) `playwright.config.ts` could say `--project=dev` now runs only through `bun run test:browser:dev`.

## Links

- docs/superpowers/plans/2026-11-20-docs-site-package-stable-browser-tests.md
