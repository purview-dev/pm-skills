# Graph no-flash test flakes on pending frame

- Captured: 2026-11-19 14:29
- Source: agent (R-012 execute)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site/test/browser/graph.browser.ts
- Context: R-012 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The both-switches-off no-flash browser test fails about 1 run in 10 on its "at least one pending frame" assertion. `sampleFrames` records its first frame on the first requestAnimationFrame after `addInitScript`, so a fast hydration can set and clear `data-graph-pending` before any frame is sampled. This is a test race; the no-wrong-layout assertions hold. Fix: push one frame synchronously when the init script runs, and record every `data-graph-pending` change with a MutationObserver on `document.documentElement`.

## Reproduction

Run `npx playwright test test/browser/graph.browser.ts --project chromium --repeat-each=10` in `packages/pm-docs-site`. About 1 in 10 runs fails `expect(frames.some((f) => f.pending)).toBe(true)` in the both-switches-off no-flash test. Diagnosed in the R-012 final fix-wave re-review.

## Links

- packages/pm-docs-site/test/browser/graph.browser.ts

## Notes

- 2026-11-19 Same re-review, minor: the chip dedup assertion at test/graph-layout.test.ts:498-500 cannot fail (filtering Record keys for one ID); `arrowheadFill` in graph.browser.ts:392-407 depends on React Flow's `url('#<id>')` marker format.
