# R-022 Docs-site package: timeline hydrates in dev — design

- Item: R-022 Docs-site package: timeline hydrates in dev (serves V4, M1 Reproducible docs site)
- Branch: `feat/r-022-docs-site-package-timeline-hydrates-in-dev`
- Size: a small change

## Intent

Under `pm-docs-site dev` in a packed-install consumer, the Roadmap timeline
island never hydrates: `Timeline.tsx` and `useTimelineLayout.ts` import
`src/lib/timeline.ts`, which imports `src/lib/planning.ts`, which imports
`node:fs`. In dev every module an island imports reaches the browser, so the
bundle fails. R-012 hit the same trap with the graph and fixed it with
`src/lib/graph-state.ts`. This item fixes the timeline and makes the dev
browser test cover every island, so the next one is caught.

## Goals

- The timeline island hydrates under `pm-docs-site dev`: `/plan/roadmap/`
  shows `.plan-timeline__toolbar` with no console error.
- `test/browser/dev.browser.ts` checks every interactive island page in dev:
  Board (existing), Roadmap timeline, and Graph.

## Non-goals

- A static import-graph guard test (option 2, not chosen).
- Timeline behaviour or accessibility changes (R-028 Docs-site package:
  accessible board, popup, and timeline).
- The dev web server's intermittent start (R-023 Docs-site package: stable
  browser tests).

## Approaches

1. Fix the timeline only: split the module and add one dev test. Smallest;
   nothing catches the next island.
2. Fix the timeline and add a unit test that walks the imports of every island
   and fails on `planning.ts` or `node:*`. Fast, catches it in `bun test`.
3. **Chosen:** fix the timeline and check every island page in the dev browser
   test (Board, Roadmap timeline, Graph). Tests what a consumer sees. Cost:
   one more page load each in the `dev` Playwright project, which already
   starts its server once; this lands in `just lint-check` (pre-push).

## Design

- New `src/lib/timeline-state.ts` holding the browser-safe parts of
  `timeline.ts`: `TimelineLayout`, `parseTimelineQuery`, `timelineQuery`,
  `ZOOM`, `PINCH_STEP`, `zoomStep`, `zoomFromWheel`, `wheelScrollsStrip`,
  and the `TimelineMilestone`/`MilestoneState` types the island needs. Its
  header comment says why, as `graph-state.ts` does. It imports nothing that
  reads `planning.json`.
- `timeline.ts` keeps `timelineMilestones`, `parseMilestoneStatus`, and
  `normaliseTarget`, and re-exports `timeline-state.ts`, so
  `roadmap.astro` and `test/timeline.test.ts` are unchanged.
- `Timeline.tsx` and `useTimelineLayout.ts` import from `timeline-state.ts`
  only.
- `dev.browser.ts` gains two tests in the existing style (collect
  `console` errors and `pageerror`s, report them first):
  `/plan/roadmap/` shows `.plan-timeline__toolbar` visible; `/plan/graph/`
  hydrates (its pending marker clears and the graph renders nodes).

## Left to the builder

- Which types move if a type is shared between server and island code (keep
  server-only types in `timeline.ts`).
- The graph's hydration signal to assert (the one `graph.browser.ts` already
  uses).
