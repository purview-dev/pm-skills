# R-011 Docs-site package: milestone timeline — design

- Item: R-011 Docs-site package: milestone timeline
- Serves: V4 (M1 Reproducible docs site)
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Branch: feat/r-011-docs-site-package-milestone-timeline
- Date: 2026-11-18

## Intent

The Roadmap page of `@purview-dev/pm-docs-site` lists milestones as stacked
sections, so the shape of the plan (which milestone is done, which is the
focus, how far each has gone, when each is due) has to be read top to bottom.
R-011 adds a timeline at the top of the page: one strip with every milestone
in strategy order, readable at a glance, linked to each milestone's page. It
is the third of the four views the brief's user chose (backlinks, board
filters and swimlanes, timeline, dependency graph), and like every docs-site
view it is a rich interactive React island in TypeScript (brief, 2026-11-18
R-010 scope).

## Done when (from the roadmap item)

The Roadmap page shows each milestone with its target, status, and progress
from `planning.json`, each linking to its milestone page, and the derivation
has unit tests.

## Goals

- A **sequence strip** of milestone cards in `strategy.milestones` order (the
  user's choice: sequence, not a date axis). Each card shows:
  - the milestone ID and name, as a link to its milestone page
    (`milestoneHref`, `/plan/milestones/<id>/`);
  - a `Focus` badge when it is `strategy.focus.milestone`;
  - its status (`active`, `planned`, `done`, with the done date when the
    status is `done (<YYYY-MM-DD>)`);
  - its target date, or `No target` when `target` is null or `none`;
  - its progress: `<done> of <total> done` and a progress bar.
  The `No milestone` group is a last card linking to
  `/plan/milestones/none/`, with no status or target, shown only when it has
  at least one item that is not dropped. `features()` gives dropped items
  `milestone: null`, so a group of dropped items alone would otherwise show
  `0 of 0 done` (builder's call).
- **Orientation:** left to right (horizontal) or top to bottom (vertical), by
  a toggle on the strip. The choice is kept in the URL as `?layout=vertical`
  (horizontal is the default and writes no key), like the Board's filters, so
  a shared link opens the same layout.
- **Scrolling:** the horizontal strip has a fixed height and scrolls
  sideways inside itself when the cards do not fit. It uses the browser's own
  scrolling: wheel, trackpad, scrollbar, and arrow keys when the strip has
  focus. A plain vertical wheel also scrolls it sideways (no Shift needed)
  when it has overflow. The vertical strip has no height limit and grows with
  the page, so the page's own scroll moves through it. A vertical box nested
  inside a scrolling page would trap the wheel (builder's call).
- **Zooming:** the cards get bigger or smaller (the user's choice: plain
  scaling, not more detail). Zoom runs from 50% to 200% in steps of 25%,
  default 100%, by `−`, `+`, and reset buttons, Ctrl or Cmd + wheel over the
  strip, and trackpad pinch (which browsers report as Ctrl + wheel). Zoom is
  not in the URL.
- **One progress derivation.** Today `roadmapGroups` counts timeline events
  and `milestoneSummaries` counts features, so the Roadmap and Milestones
  pages can disagree. The timeline, the Roadmap sections, and the Milestones
  page all take progress from `milestoneSummaries`.
- **Unit tests** for the derivation, the URL state, and the zoom maths; a
  browser test for the island.

## Non-goals

- A date axis, a "today" marker, or placing milestones by target.
- More detail at higher zoom (items inside each card).
- Roadmap filters. The R-010 inbox note (`2026-11-18-1222-r-010-deferred-board-polish.md`)
  expected them "when R-011 adds Roadmap filters"; they are not in R-011's
  Done when and stay parked.
- Changing the per-milestone sections below the strip, apart from their
  progress source and showing the target in their meta line.
- Any change to `planning.json` or its schema (`schemaVersion` stays 3).
- Drag-to-pan.

## Anti-goals (a failure even if it technically works)

- Blurry text at high zoom, or a scrollbar that does not match the content
  (the reason `transform: scale` and `react-zoom-pan-pinch` were rejected).
- A blank or jumping strip before the island hydrates, or a vertical link
  that flashes horizontal first.
- Ctrl + wheel zooming the whole browser page while the pointer is over the
  strip, or a plain wheel being swallowed when the strip has nothing to
  scroll.
- The Roadmap and Milestones pages showing different progress for the same
  milestone.

## Approaches

| Approach | Trade-off | Decision |
| --- | --- | --- |
| A. Own React island, no new dependency: zoom is one CSS custom property that sizes the cards; panning is native overflow scrolling | Sharp text and real scroll extents at every zoom; native scrolling, keyboard, and screen readers keep working; about 50 lines of wheel and pinch handling to write and test | **Chosen** (user, 2026-11-18) |
| B. `react-zoom-pan-pinch` | Ready-made zoom, pinch, and drag-pan, but it zooms by transform (blurry text, scrollbar no longer matches), pans by drag, and adds a dependency every consumer installs | Rejected |
| C. A date-based timeline library (vis-timeline and similar) | Lays out by date; no milestone here has a target, and the user chose a sequence | Dropped |

## Decided parts of the how

These are the user's decisions:

- A sequence strip, not a date axis.
- Orientation can be horizontal or vertical. Scrolling and zooming are both
  supported.
- Zoom only scales the cards.
- Approach A.

These follow from the brief and R-010 and are not reopened:

- The strip is a React island (`client:load`), in TypeScript.
- It is rendered on the server, so the page has content before hydration.
- Its state lives in the URL, written with `history.replaceState`.

### Derivation (`src/lib/timeline.ts`, pure)

- `timelineMilestones(planning, features?)` returns
  `TimelineMilestone[]` from `milestoneSummaries`:
  `{ id: string | null, name, href, isFocus, status: { state: 'active' | 'planned' | 'done' | 'other', label: string, doneOn: string | null }, target: string | null, progress: { done, total, percent } }`.
- Status parsing: `active` and `planned` map to themselves. `done` and
  `done (<YYYY-MM-DD>)` map to `done` with `doneOn` set to the date when there
  is one. Any other text maps to `other` and keeps its label. null maps to
  `other` with the label `No status`.
- Target: null, an empty string, and `none` (any case) all map to null. Any
  other text is kept as written. It is not parsed as a date, because the
  schema types it as text.
- `percent` is `Math.round(done / total * 100)`, and 0 when `total` is 0.
- `roadmapGroups` takes each group's `progress` from `milestoneSummaries` for
  the same milestone, so every page counts the same features. Dropped items
  are left out. So that a section never lists more items than it counts, its
  events are de-duplicated by ID in the same way `features()` does it, and
  the most advanced state wins: done, then active, then pending. A `## Done`
  entry with no ID stays in the feed but is not counted (builder's call;
  `planning.test.ts` asserts the counted IDs match the summary's features).
  The `No milestone` section follows the card's rule above.

### URL state (`src/lib/timeline.ts`)

- `parseTimelineQuery(search)` returns `'horizontal' | 'vertical'`.
  `layout=vertical` gives `vertical`. Anything else, or a missing key, gives
  `horizontal`.
- `timelineQuery(layout, search)` returns the search string with `layout`
  set or removed. It keeps every other parameter. This fixes, for this page,
  the R-010 finding that `replaceState` drops other parameters.
- Before paint, an inline script sets a pending mark on `<html>` when the URL
  has `layout=vertical`. The mark is `data-timeline-pending` and the script
  lives in the Roadmap page. While the mark is set, the strip is hidden until
  the island applies the layout, with the same 3s reveal fallback as the
  Board. The mark applies only on the Roadmap page.

### Zoom (`src/lib/timeline.ts` for the maths, the island for events)

- `ZOOM = { min: 0.5, max: 2, step: 0.25, default: 1 }`.
- `zoomStep(zoom, direction)` returns the value clamped to the range and
  rounded to the step.
- `zoomFromWheel(zoom, pending, deltaY, deltaMode)` is pure and returns
  `{ zoom, pending }`.
  - A mouse notch is one step per event: `deltaMode` line or page, or a pixel
    delta of at least 50 in one event. Chromium reports about 100 per notch,
    Firefox about 3 lines.
  - Small pixel deltas (trackpad pinch) are added to `pending`. The zoom
    takes one step each time `pending` reaches ±50, and the leftover carries
    into the next event (builder's call).
- The island sets `--timeline-zoom` on the strip. Card width, padding, font
  size, and the bar height are written with `calc(... * var(--timeline-zoom))`
  in `src/styles/timeline.css`, so the layout and scroll extents are real.
- The island attaches its own `wheel` listener with `{ passive: false }`.
  With Ctrl or Meta held, it calls `preventDefault()` and zooms. On the
  horizontal strip, a plain wheel scrolls the strip sideways only when it has
  horizontal overflow and is not already at the end in that direction. In
  every other case the event passes through, so the page scrolls.
- When zoom changes, the scroll position is kept on the same point of the
  strip: the focus card, or else the first card that is in view.

### Component (`src/components/timeline/Timeline.tsx`)

- A toolbar with:
  - an orientation toggle: two buttons with `aria-pressed`, `Left to right`
    and `Top to bottom`;
  - `Zoom out`, a zoom level readout (`100%`), `Zoom in`, and `Reset zoom`.
    The buttons are disabled at the limits.
- The strip is an `<ol>` with `aria-label="Milestones in order"` and
  `tabindex="0"`, so arrow keys scroll it. Each card is an `<li>`. A
  connector line between the cards shows the sequence. Status sets the card's
  marker: filled for done, ringed and accented for active, hollow for
  planned.
- On first load, the horizontal strip sets its own `scrollLeft` so the focus
  card is in view. It never calls `scrollIntoView`, which would scroll the
  page. The vertical strip does not scroll on load.
- The server render uses the horizontal layout at 100% zoom, so the first
  render matches hydration.
- `roadmap.astro` renders `<Timeline client:load milestones={...} />` below
  `ExportStamp`, above the sections. Each section's meta line also shows the
  target when there is one.

### Tests

- `test/timeline.test.ts` (bun test) covers:
  - status parsing: each form above, including `done (2026-11-03)` and
    unknown text;
  - target normalisation: null, `none`, `None`, empty, and a date;
  - progress and percent, including `total` 0 and excluding dropped items;
  - focus;
  - the `No milestone` card, shown only when it has items;
  - the order follows `strategy.milestones`;
  - `parseTimelineQuery` and `timelineQuery`, which keep other parameters;
  - `zoomStep` and `zoomFromWheel`: clamping, step rounding, and collecting
    small deltas.
- `test/planning.test.ts`: `roadmapGroups` progress equals
  `milestoneSummaries` progress for every group in the fixture.
- The fixture gets a target date on one milestone and a `planned` milestone,
  so every card state is rendered. `test/fixtures/expected-pages.txt` changes
  only if a page is added. None is.
- `test/browser/timeline.browser.ts` (Playwright) checks that:
  - each card links to its milestone page;
  - the toggle switches layout and writes `?layout=vertical`;
  - a `?layout=vertical` link renders vertical with no horizontal frame;
  - `+` and `−` change the card width and stop at the limits;
  - Ctrl + wheel over the strip zooms the strip, not the page;
  - the strip scrolls when it overflows;
  - at 320px the strip is usable (no page-level horizontal overflow).

## Constraints

- TypeScript only (`.ts` and `.tsx`). React, not Preact.
- No new runtime dependency.
- The export is read through `loadPlanning()` only, and `schemaVersion`
  stays 3.
- Starlight prose styles do not apply inside the strip (`not-content`).
- Colours come from Starlight variables, so light and dark themes both work.
- `just docs-check` on `docs-site/` and the package's `bun test`,
  `bun run check`, and `bun run test:browser` must pass.
- The package version does not change (brief, 2026-11-18: releases are held
  until R-013).

## Left to the builder

- The exact card dimensions at 100%, and the connector's styling.
- Whether the zoom readout is a `<output>` or a plain label.
- The anchor used to keep the scroll position when zooming, as long as the
  view does not jump.
- The file split inside `src/components/timeline/`.
