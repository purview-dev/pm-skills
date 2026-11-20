# R-028 Docs-site package: accessible board, popup, and timeline

- Item: R-028 Docs-site package: accessible board, popup, and timeline
- Serves: V4, milestone M1 Reproducible docs site
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Branch: feat/r-028-docs-site-package-accessible-board-popup-and-timeline
- Package: `packages/pm-docs-site`

## Intent

Close the accessibility and timeline findings left by the R-009 and R-011
final reviews and the 2026-11-19 and 2026-11-20 reviews, so the docs-site
package is consumer-ready for M1. Every fix is pinned by a browser test (or,
for pure logic, a unit test beside the browser test that shows it).

## Goals

1. **Popup trigger says it opens a popup.** Every `a[data-item]` card link
   carries `aria-haspopup="dialog"`: the React Board cards
   (`src/components/board/KanbanItemCard.tsx`, `TaskKanbanCard.tsx`) and the
   Astro cards and feed (`src/components/lib/KanbanItemCard.astro`,
   `TaskKanbanCard.astro`, `StatusTimelineFeed.astro`). Rendered in markup,
   not added by `plan.ts`, so a React re-render after filtering keeps it.
2. **Backdrop click closes the item dialog.** `ItemDialog.astro` wraps its
   content in an inner element that carries today's padding
   (`.plan-dialog` padding moves to it, the dialog gets `padding: 0`). In
   `src/scripts/plan.ts`, a click whose target is the `<dialog>` itself
   closes it; a click inside the content does not. Focus returns to the
   card link as today.
3. **Popup headings sit below the dialog title.** `FeatureSummary.astro`
   takes a `headingLevel` prop (`2` default, for feature pages); `ItemDetail.astro`
   passes `3`, so `Done when`, `Related items`, `Brief`, and `Risks` are
   `h3` under the dialog's `h2`.
4. **One tab stop per card.** The Astro `KanbanItemCard.astro` (used by
   `src/routes/plan/inbox.astro`) drops `tabindex="0"` and `role="article"`,
   matching the React port; its header comment records the change (MIT
   attribution kept). Its dead `:focus-visible` card styles and
   `cursor: grab` go with it.
5. **Board collapse toggles are hidden without JavaScript.** In `Board.tsx`
   the column `h2` renders the plain name and count until `hydrated`
   (from `useBoardUrlState`), then the toggle button. The `aria-controls`
   and `aria-expanded` attributes exist only on the button.
6. **A throwing `localStorage` leaves the Board usable.** Code already
   guards both reads (`Board.tsx` `readCollapsed`, the inline script in
   `PlanInteractions.astro`) and the write; add a browser test that makes
   `localStorage` getters and `setItem` throw (`addInitScript`) and checks
   the Board renders, filters, and collapses with no page error.
7. **Zoom buttons keep focus at their limits.** `Timeline.tsx` replaces
   `disabled` with `aria-disabled` on `Zoom out`, `Zoom in`, and
   `Reset zoom`, and each click handler is a no-op while at its limit.
   `src/styles/timeline.css` styles `[aria-disabled='true']` as the
   disabled look. Browser test: press `Zoom in` by keyboard to the max;
   focus stays on it and zoom stays at the max.
8. **Line-mode wheel deltas are scaled.** The plain-wheel sideways scroll
   converts `deltaY` to pixels: `deltaMode` 0 as is, 1 times the strip's
   computed line height (fallback 16), 2 times the strip's `clientWidth`.
   The conversion is a pure function in `src/lib/timeline-state.ts` with a
   unit test; the browser test dispatches a `deltaMode: 1` wheel and
   checks `scrollLeft` moved by more than the raw delta.
9. **Zoom anchor holds across two changes before one render.** The code
   already keeps the earliest snapshot (`Timeline.tsx` `changeZoom`). Add a
   browser test that fires two zoom changes in one task (two Ctrl+wheel
   events, or two clicks inside one `evaluate`) and checks the centre point
   holds.
10. **`planned` and `other` markers render.** `test/fixtures/planning.json`
    gains a `planned` milestone and one with an unrecognised status, each
    with at least one item; a browser test checks their cards'
    `data-state` and marker. Other tests that count milestones, lanes, or
    expected pages (`test/fixtures/expected-pages.txt`, graph and board
    tests) are updated to the new fixture.
11. **The Now item is listed once.** `dedupeEvents` in `src/lib/planning.ts`
    already handles it. The fixture's Now item (R-012) is also listed as
    queued under another milestone (added to the fixture if it is not
    there today); a unit test on `roadmapGroups` and a
    browser test on the Roadmap page check it appears once, as active.
    A second case (Now item also logged done) is a unit test with an
    inline planning object.
12. **No empty `No milestone` card on the Milestones page.**
    `milestoneSummaries` keeps returning the unassigned summary (the
    `none` milestone page still needs it); the Milestones index
    (`src/routes/plan/milestones/index.astro`) filters it out when its
    `progress.total` is 0, the same rule as `timelineMilestones`. Browser
    or build test: a fixture whose only unassigned item is dropped shows no
    `No milestone` card.
13. **Import boundary.** `Timeline.tsx` gets a one-line header note that it
    imports only types from `lib/timeline` (values come from
    `lib/timeline-state.ts`), matching `Graph.tsx:5-7`. A `bun test` guard
    walks `src/components/**/*.tsx` and fails on a value import (not
    `import type`) of `lib/planning`, `lib/timeline`, `lib/graph`, or
    `lib/graph-layout`.

## Non-goals

- No redesign of the Board, popup, or timeline; no new views.
- No change to the export schema or `schemaVersion`.
- The R-010 deferred board polish inbox file and R-031's findings stay
  where they are.

## Anti-goals

- A fix that only works with JavaScript where the page works without it
  today (cards stay links; the strip stays visible).
- Focus jumping anywhere the user did not move it.

## Constraints

- Board, Timeline, and Graph stay React islands; no Preact, no
  static-first rewrite.
- TypeScript only; tests in `bun test` and Playwright (`test/browser/`).
- Copied Astro Components Kit files keep their MIT attribution and list
  each change in their header comment (`scripts/validate.ts` checks it).
- `just lint-check` passes, including `package-test` and
  `just docs-check` on `docs-site/`.

## Approaches

- **Collapse toggles:** chosen — switch on hydration (plain heading text
  until `hydrated`, then the button), like the filter bar. Rejected —
  CSS-hidden buttons revealed by a root attribute: the button wraps the
  column name, so hiding it hides the name unless it is duplicated.
- **Zoom limits:** chosen — `aria-disabled` with a no-op guard, so focus
  stays put. Rejected — keep `disabled` and move focus to the zoom
  readout: focus jumps.
- **Import guard:** chosen — include the optional `bun test` guard.

## Decisions by the user

- The Milestones page uses the timeline's rule: the `No milestone` card
  shows when any unassigned item that is not dropped exists, done or open.
  R-028's Done when clause "without an open unassigned item" reads as
  "without an unassigned item that is not dropped".
- The approaches above, as proposed.

## Calls made by the agent

- `aria-haspopup` in markup rather than set by `plan.ts`: React re-renders
  would drop a script-set attribute. Without JavaScript the link still
  navigates; the attribute then overstates, which is accepted.
- Backdrop detection by `event.target === dialog` with the padding moved
  to an inner wrapper, rather than coordinate checks.
- New planned and other milestones go in `test/fixtures/planning.json`,
  not by pointing browser tests at `examples/demo/`.

## Left to the builder

- Names of the inner dialog wrapper class and the delta helper.
- Exact fixture IDs and titles for the new milestones and items.
- Whether the dropped-only `No milestone` check is a browser test or a
  build test on a scratch fixture.
