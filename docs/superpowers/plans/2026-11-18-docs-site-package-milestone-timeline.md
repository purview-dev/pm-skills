# R-011 Docs-site package: milestone timeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a milestone timeline to the Roadmap page of `@purview-dev/pm-docs-site`. It is a strip of milestone cards in strategy order, with status, target, progress, and a link per card. The strip has a horizontal or vertical layout kept in the URL, scrolls natively, and zooms from 50% to 200%. The Roadmap, timeline, and Milestones pages share one progress derivation.

**Architecture:**

- Pure derivations live in a new `src/lib/timeline.ts`: the milestone cards, the URL layout, the zoom maths, and the wheel rule. All of it is unit-tested with `bun test`.
- A server-rendered React island, `src/components/timeline/Timeline.tsx`, renders the cards. It sizes them with a `--timeline-zoom` CSS custom property, so scroll extents stay real.
- `roadmapGroups` takes its progress from `milestoneSummaries`.
- `roadmap.astro` mounts the island above its sections.

**Tech Stack:** Astro 5 + Starlight, React 19 (islands, `client:load`), TypeScript, `bun test`, Playwright (`test:browser`).

**Spec:** `docs/superpowers/specs/2026-11-18-docs-site-package-milestone-timeline-design.md`

## Global Constraints

- TypeScript only (`.ts` / `.tsx`); React, not Preact. No new runtime dependency.
- Read the export only through `loadPlanning()`; `schemaVersion` stays 3; no change to `planning.json`, its schema, or `skills/`.
- Package-only change: `skills/pm-docs-site/templates/` and `docs-site/` are not edited; the package version in `packages/pm-docs-site/package.json` does not change.
- Zoom: `min 0.5`, `max 2`, `step 0.25`, `default 1`; not in the URL.
- Layout: `?layout=vertical` for vertical; horizontal is the default and writes no key; every other query parameter is kept.
- Target: `null`, empty, or `none` (any case) shows `No target`; any other text is shown as written, never parsed as a date.
- Colours from Starlight variables only (`--sl-color-*`); the strip sits in a `not-content` wrapper.
- Never call `scrollIntoView` on the timeline; never `preventDefault` a wheel event the strip does not use.
- Commit messages follow commitlint (`feat(pm-docs-site): …`, `test(pm-docs-site): …`).
- Run package commands from `packages/pm-docs-site`.

## Review Focus

1. **A plain wheel over a horizontal strip that cannot scroll further (or has no overflow)** must scroll the page, not get stuck. Pinned by the `wheelScrollsStrip` tests (Task 3) and the browser test "a plain wheel at the strip's end scrolls the page" (Task 4).
2. **A milestone with a status other than `active`, `planned`, or `done`** (for example `paused`, or a missing value) must still render with its text, never crash or vanish. Pinned by the `parseMilestoneStatus` tests (Task 1).
3. **A site with the Milestones view switched off** (`views` without `milestones`) must render plain card titles, not broken links. Pinned by the `timelineMilestones` test "has no href when the milestone has no page" (Task 1).
4. **A `?layout=` link with other parameters or a hash** (for example `?layout=vertical&x=1#m2`) must keep `x=1` and the hash when the layout changes. Pinned by the `timelineQuery` tests (Task 3) and the browser toggle test (Task 4).
5. **The island's JavaScript fails to load on a `?layout=vertical` link**: the strip must still appear, horizontally, after 3s, never stay blank. Pinned by the browser test "a vertical link with no island script still shows the strip" (Task 4).

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/lib/timeline.ts` (create) | Pure derivations: `timelineMilestones`, `parseMilestoneStatus`, `normaliseTarget`, `parseTimelineQuery`, `timelineQuery`, `ZOOM`, `zoomStep`, `zoomFromWheel`, `wheelScrollsStrip` |
| `src/lib/planning.ts` (modify `roadmapGroups`, lines 52–128) | Progress from `milestoneSummaries`; de-duplicate events by ID; expose `target` on the group's milestone |
| `src/components/timeline/useTimelineLayout.ts` (create) | URL-backed layout state and the pending mark |
| `src/components/timeline/Timeline.tsx` (create) | The island: toolbar, strip, cards, zoom and wheel handling |
| `src/styles/timeline.css` (create) | Strip and card styles scaled by `--timeline-zoom`; pending and reveal rule |
| `src/pages/plan/roadmap.astro` (modify) | Mount the island, add the pre-paint script, and show the target in each section's meta line |
| `test/timeline.test.ts` (create) | Unit tests for `timeline.ts` |
| `test/planning.test.ts` (modify `roadmapGroups` block) | Progress parity and de-duplication |
| `test/fixtures/planning.json` (modify line 19) | M2 `target` `2026-12-15` |
| `test/browser/timeline.browser.ts` (create) | Island behaviour in Chromium |
| `README.md` (modify, after `## Board`) | A `## Roadmap timeline` section |

---

### Task 1: Timeline milestone derivation

**Files:**

- Create: `packages/pm-docs-site/src/lib/timeline.ts`
- Modify: `packages/pm-docs-site/src/lib/planning.ts` (add the `normaliseTarget` export)
- Modify: `packages/pm-docs-site/test/fixtures/planning.json:19` (M2 `"target": "2026-12-15"`)
- Test: `packages/pm-docs-site/test/timeline.test.ts`

**Interfaces:**

- Consumes: `milestoneSummaries(planning, all?)` and `MilestoneSummary` from `src/lib/planning.ts`, and `Planning` from `src/lib/planning-types.ts`. Also `targets(planning, views)` from `src/lib/references.ts`, which returns `Map<string, { href: string | null; … }>` keyed by ID, with `'none'` for the no-milestone group. That map is only used in the tests and the page.
- Produces:

  ```ts
  export type MilestoneState = 'active' | 'planned' | 'done' | 'other';
  export interface MilestoneStatus { state: MilestoneState; label: string; doneOn: string | null }
  export interface TimelineMilestone {
    id: string | null;           // null = No milestone
    key: string;                 // id, or 'none'
    name: string;
    href: string | null;
    isFocus: boolean;
    status: MilestoneStatus;
    target: string | null;
    progress: { done: number; total: number; percent: number };
  }
  export function parseMilestoneStatus(status: string | null): MilestoneStatus;
  // normaliseTarget is defined and exported in src/lib/planning.ts (Task 2 uses it there;
  // timeline.ts imports planning.ts, so defining it in timeline.ts would make an import cycle).
  // timeline.ts re-exports it.
  export { normaliseTarget } from './planning'; // (target: string | null) => string | null
  export function timelineMilestones(planning: Planning, known: Map<string, { href: string | null }>): TimelineMilestone[];
  ```

- [ ] **Step 1: Write the failing tests** in `test/timeline.test.ts`. Load the fixture the way `test/planning.test.ts` does (`FIXTURE`). Build `known` with `targets(planning, ALL_VIEWS)`; take `ALL_VIEWS` from `test/links.test.ts`, or define every view `true`. Tests:
  - `parseMilestoneStatus`:
    - `'active'` → `{ state: 'active', label: 'active', doneOn: null }`
    - `'planned'` → `{ state: 'planned', label: 'planned', doneOn: null }`
    - `'done'` → `{ state: 'done', label: 'done', doneOn: null }`
    - `'done (2026-11-03)'` → `{ state: 'done', label: 'done', doneOn: '2026-11-03' }`
    - `' Active '` → state `active` (trimmed, any case)
    - `'paused'` → `{ state: 'other', label: 'paused', doneOn: null }`
    - `null` → `{ state: 'other', label: 'No status', doneOn: null }`
  - `normaliseTarget`: `null`, `''`, `'none'`, and `'None'` → `null`; `'2026-12-15'` → `'2026-12-15'`; `'Q1 2027'` → `'Q1 2027'`.
  - `timelineMilestones` on the fixture:
    - keys in order are `['M1', 'M2', 'none']`;
    - M2 has `isFocus` true, status `active`, target `'2026-12-15'`, and progress `{ done: 1, total: 4, percent: 25 }`;
    - M1 has status `{ state: 'done', doneOn: '2026-11-03' }`, target `null`, and progress `{ done: 1, total: 3, percent: 33 }`;
    - `none` has name `'No milestone'`, progress `{ done: 2, total: 5, percent: 40 }`, and `href` equal to `known.get('none')?.href ?? null`;
    - M1's `href` is `'/plan/milestones/m1/'`.
  - "has no href when the milestone has no page": with `targets(planning, { …ALL_VIEWS, milestones: false })`, every `href` is `null`.
  - "hides No milestone when its only items are dropped": use a minimal planning object, shaped like `keeps milestones with no items` in `planning.test.ts` but with every field `features()` reads. It has M9 with no items and `log.dropped: [{ id: 'R-099', … }]`. The keys are `['M9']`, and M9's progress is `{ done: 0, total: 0, percent: 0 }`.

- [ ] **Step 2: Run the tests and check they fail**

  Run: `bun test test/timeline.test.ts`
  Expected: FAIL, because the module `../src/lib/timeline` is not found.

- [ ] **Step 3: Implement the three functions in `src/lib/timeline.ts`.**
  - `timelineMilestones` maps `milestoneSummaries(planning)`.
  - It drops the summary with `id === null` when `progress.total === 0`.
  - `href` is `known.get(key)?.href ?? null`.
  - `percent` is `total === 0 ? 0 : Math.round(done / total * 100)`.
  - The status regex for done is `/^done(?:\s*\((\d{4}-\d{2}-\d{2})\))?$/i`.
  - Set M2's fixture target to `2026-12-15`.

- [ ] **Step 4: Run the tests and check they pass**

  Run: `bun test`
  Expected: all PASS. The fixture target change must not break `links`, `references`, or `board-data`.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/pm-docs-site/src/lib/timeline.ts packages/pm-docs-site/test/timeline.test.ts packages/pm-docs-site/test/fixtures/planning.json
  git commit -m "feat(pm-docs-site): derive the milestone timeline (R-011)"
  ```

### Task 2: One progress derivation for the Roadmap sections

**Files:**

- Modify: `packages/pm-docs-site/src/lib/planning.ts:61-128` (`RoadmapGroup`, `roadmapGroups`)
- Modify: `packages/pm-docs-site/src/pages/plan/roadmap.astro:38-48` (meta line)
- Test: `packages/pm-docs-site/test/planning.test.ts` (`roadmapGroups` block)

**Interfaces:**

- Consumes: `milestoneSummaries` (same file).
- Produces: `RoadmapGroup.milestone` gains `target: string | null`, already normalised with `normaliseTarget` (Task 1; it lives in `planning.ts`, so there is no import cycle). `progress` equals the matching `MilestoneSummary.progress`.

- [ ] **Step 1: Write the failing tests** in the `roadmapGroups` describe block:
  - "takes progress from milestoneSummaries": for every group, `group.progress` equals `milestoneSummaries(planning).find(s => s.id === (group.milestone?.id ?? null))!.progress`.
  - "lists an item once, in the state features() counts": take a minimal planning object with M9. It has `log.done` R-050 (milestone M9), `roadmap.later` R-050 (milestone M9), and `log.done` with an ID-less entry (milestone M9). `features()` keeps Now, then Next/Later, then Done (planning.ts:314), so M9's events are the ID-less entry (`done`) and R-050 (`pending`, time `Later`), in that order, and its progress is `{ done: 0, total: 1 }`.
  - "exposes the target": M2's group has `milestone.target === '2026-12-15'`, and M1's is `null`.
  - Keep the existing tests unchanged. They must still pass: `{1,4}`, `{1,3}`, `{2,5}`, and the event lists.

- [ ] **Step 2: Run the tests and check they fail**

  Run: `bun test test/planning.test.ts`
  Expected: FAIL on de-duplication and `target`.

- [ ] **Step 3: Change `roadmapGroups`.**
  - Build `eventsFor` as today.
  - Filter it so that each non-null `id` appears once, keeping the event whose state matches `features()` precedence: Now (`active`), then Next/Later (`pending`), then Done (`done`).
  - Keep the event order otherwise: Done, then Now, then queued.
  - Take `progress` from `milestoneSummaries(planning)` by `id`, and fall back to `{ done: 0, total: 0 }`.
  - Keep the rule that the no-milestone group is shown only when it has events.
  - Delete `withProgress` if nothing else uses it.
  - In `roadmap.astro`, add `· target {group.milestone.target}` (with a leading space) after the status when the target is set.

- [ ] **Step 4: Run the tests and check they pass**

  Run: `bun test`
  Expected: all PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/pm-docs-site/src/lib/planning.ts packages/pm-docs-site/src/pages/plan/roadmap.astro packages/pm-docs-site/test/planning.test.ts
  git commit -m "refactor(pm-docs-site): one progress count for roadmap and milestones (R-011)"
  ```

### Task 3: Layout URL state, zoom maths, and the wheel rule

**Files:**

- Modify: `packages/pm-docs-site/src/lib/timeline.ts`
- Test: `packages/pm-docs-site/test/timeline.test.ts`

**Interfaces:**

- Produces:

  ```ts
  export type TimelineLayout = 'horizontal' | 'vertical';
  export function parseTimelineQuery(search: string): TimelineLayout;
  export function timelineQuery(layout: TimelineLayout, search: string): string; // '' or '?…'
  export const ZOOM: { readonly min: 0.5; readonly max: 2; readonly step: 0.25; readonly default: 1 };
  export const PINCH_STEP = 50;
  export function zoomStep(zoom: number, direction: 1 | -1): number;
  export function zoomFromWheel(zoom: number, pending: number, deltaY: number, deltaMode: number): { zoom: number; pending: number };
  export function wheelScrollsStrip(e: { deltaX: number; deltaY: number }, s: { scrollLeft: number; scrollWidth: number; clientWidth: number }): boolean;
  ```

- [ ] **Step 1: Write the failing tests:**
  - `parseTimelineQuery`:
    - `''`, `'?layout=horizontal'`, and `'?layout=VERTICAL&x=1'` → `'horizontal'`. Only the exact `vertical` counts.
    - `'?layout=vertical'` and `'?x=1&layout=vertical'` → `'vertical'`.
  - `timelineQuery`:
    - `('vertical', '?x=1')` → `'?x=1&layout=vertical'`
    - `('horizontal', '?x=1&layout=vertical')` → `'?x=1'`
    - `('horizontal', '?layout=vertical')` → `''`
    - `('vertical', '')` → `'?layout=vertical'`
  - `zoomStep`:
    - `(1, 1)` → `1.25`
    - `(2, 1)` → `2`
    - `(0.5, -1)` → `0.5`
    - `(1.1, 1)` → `1.25` (snaps to the step)
  - `zoomFromWheel`:
    - a mouse notch in pixels, `(1, 0, -100, 0)`, gives `{ zoom: 1.25, pending: 0 }`;
    - a line-mode notch, `(1, 0, 3, 1)`, gives `{ zoom: 0.75, pending: 0 }`;
    - a pinch, `(1, 0, -20, 0)`, gives `{ zoom: 1, pending: -20 }`;
    - `(1, -40, -20, 0)` gives `{ zoom: 1.25, pending: -10 }`;
    - at the limit, `(2, -40, -20, 0)` gives `{ zoom: 2, pending: -10 }`;
    - `deltaY` 0 gives the input back unchanged.
  - `wheelScrollsStrip`, with a strip where `clientWidth` is 500 and `scrollWidth` is 1000:
    - `deltaY` 100 at `scrollLeft` 0 → `true`;
    - `deltaY` 100 at `scrollLeft` 500 (at the end) → `false`;
    - `deltaY` -100 at `scrollLeft` 0 → `false`;
    - no overflow (`scrollWidth` 500) → `false`;
    - a mostly sideways gesture (`deltaX` 100, `deltaY` 10) → `false`, because native scrolling already handles it.

- [ ] **Step 2: Run the tests and check they fail**

  Run: `bun test test/timeline.test.ts`
  Expected: FAIL, because the new exports are missing.

- [ ] **Step 3: Implement the functions.**
  - `timelineQuery` uses `URLSearchParams`, deletes `layout`, then appends it last when the layout is vertical.
  - `zoomFromWheel`: when `deltaMode !== 0` or `|deltaY| >= PINCH_STEP`, step once in the direction `deltaY < 0 ? 1 : -1` and reset `pending` to 0. Otherwise add `deltaY` to `pending`. While `|pending| >= PINCH_STEP`, step once and subtract `sign * PINCH_STEP`. At a limit, `zoomStep` simply holds the value.
  - Allow `±1px` of tolerance at the end in `wheelScrollsStrip`.

- [ ] **Step 4: Run the tests and check they pass**

  Run: `bun test`
  Expected: all PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/pm-docs-site/src/lib/timeline.ts packages/pm-docs-site/test/timeline.test.ts
  git commit -m "feat(pm-docs-site): timeline layout, zoom and wheel rules (R-011)"
  ```

### Task 4: The Timeline island on the Roadmap page

**Files:**

- Create: `packages/pm-docs-site/src/components/timeline/useTimelineLayout.ts`
- Create: `packages/pm-docs-site/src/components/timeline/Timeline.tsx`
- Create: `packages/pm-docs-site/src/styles/timeline.css`
- Modify: `packages/pm-docs-site/src/pages/plan/roadmap.astro`
- Modify: `packages/pm-docs-site/README.md`, adding a `## Roadmap timeline` section after `## Board`
- Test: `packages/pm-docs-site/test/browser/timeline.browser.ts`

**Interfaces:**

- Consumes:
  - from Task 1: `TimelineMilestone` and `timelineMilestones`;
  - from Task 3: `TimelineLayout`, `parseTimelineQuery`, `timelineQuery`, `ZOOM`, `zoomStep`, `zoomFromWheel`, `wheelScrollsStrip`;
  - `siteRefs()` from `src/lib/references.ts`.
- Produces:
  - `useTimelineLayout(): [TimelineLayout, (layout: TimelineLayout) => void, boolean]`, returning the layout, its setter, and whether the URL state has been applied;
  - `export default function Timeline({ milestones }: { milestones: TimelineMilestone[] })`.
- DOM contract, which the browser tests rely on:
  - wrapper `div.plan-timeline.not-content`;
  - toolbar `div.plan-timeline__toolbar`, with `hidden` set until the URL state is applied;
  - buttons named `Left to right`, `Top to bottom` (both with `aria-pressed`), `Zoom out`, `Zoom in`, and `Reset zoom`;
  - readout `.plan-timeline__zoom` with text like `100%`;
  - strip `ol.plan-timeline__strip`, with `aria-label="Milestones in order"`, `tabindex="0"`, `data-layout`, and `style="--timeline-zoom: <n>"`;
  - one card per milestone, `li.plan-timeline__card`, with `data-milestone={key}` and `data-state={status.state}`;
  - the title is an `<a>` when `href` is set, or a `<span>` when it is not.

- [ ] **Step 1: Write the failing browser tests** in `test/browser/timeline.browser.ts`. Follow `board.browser.ts`. Add a `hydrated(page)` helper that waits for `.plan-timeline__toolbar` to be visible. Tests:
  - "each card links to its milestone page": the cards are `M1`, `M2`, and `none`, in order. M1's link `href` is `/plan/milestones/m1/`. M2 shows `Focus`, `active`, `2026-12-15`, and `1 of 4 done`. M1 shows `No target`.
  - "the toggle switches layout and keeps other parameters": go to `/plan/roadmap/?x=1#top`. Click `Top to bottom`. Then:
    - the strip has `data-layout="vertical"`;
    - the URL search is `?x=1&layout=vertical` and the hash is `#top`;
    - `Top to bottom` has `aria-pressed="true"`;
    - the second card's top is greater than the first card's bottom.

    Click `Left to right`. The search is back to `?x=1`.
  - "a vertical link renders vertical": go to `/plan/roadmap/?layout=vertical`, wait until hydrated, then check `data-layout="vertical"` and that `html` has no `data-timeline-pending`.
  - "a vertical link with no island script still shows the strip": block island scripts with `page.route('**/_astro/**/*.js', r => r.abort())`, then go to `/plan/roadmap/?layout=vertical`.
    - Straight after load, the strip is not visible.
    - Within 5s, the strip is visible, with `data-layout="horizontal"`.
  - "zoom buttons resize cards and stop at the limits":
    - The first card's width at 100% is `w`. After `Zoom in` it is about `1.25 * w` (±2px), and the readout says `125%`.
    - Click `Zoom in` 3 more times. The readout says `200%` and `Zoom in` is disabled.
    - `Reset zoom` brings back `100%`.
    - Click `Zoom out` 2 times. The readout says `50%` and `Zoom out` is disabled.
  - "Ctrl + wheel over the strip zooms the strip, not the page": hover the strip, `keyboard.down('Control')`, `mouse.wheel(0, -100)`, `keyboard.up('Control')`. The readout says `125%`, and `await page.evaluate(() => visualViewport!.scale)` is `1`.
  - "a plain wheel scrolls an overflowing strip sideways": at viewport `700×900`, zoom to `200%` and hover the strip. Read `scrollY` before. `mouse.wheel(0, 200)`. The strip's `scrollLeft` is greater than 0, and `window.scrollY` is unchanged.
  - "a plain wheel at the strip's end scrolls the page": in the same setup, set the strip's `scrollLeft` to its maximum, then `mouse.wheel(0, 200)`. `window.scrollY` increases.
  - "usable at 320px": at viewport `320×800`, `document.documentElement.scrollWidth <= 320`, and the strip and toolbar are visible.

- [ ] **Step 2: Build the fixture site and run the tests to check they fail**

  Run: `bun run test:browser -- --project chromium test/browser/timeline.browser.ts`
  Expected: FAIL, because `.plan-timeline` is not found.

- [ ] **Step 3: Implement `useTimelineLayout`.**
  - It mirrors `useBoardUrlState`. The first render is `'horizontal'` and `applied` starts `false`.
  - On mount, it reads `parseTimelineQuery(location.search)` and sets `applied`.
  - After each applied render, it deletes `document.documentElement.dataset.timelinePending`.
  - When the URL differs, it runs `history.replaceState(history.state, '', location.pathname + timelineQuery(layout, location.search) + location.hash)`.

- [ ] **Step 4: Implement `Timeline.tsx`.**
  - Zoom is `useState(ZOOM.default)`, and `pending` is a `useRef(0)`.
  - Attach the wheel listener to the strip in an effect with `addEventListener('wheel', fn, { passive: false })`:
    - with `ctrlKey || metaKey`, call `preventDefault()` and run `zoomFromWheel`;
    - otherwise, when the layout is horizontal and `wheelScrollsStrip` is true, call `preventDefault()` and add `deltaY` to `scrollLeft`;
    - in every other case, do nothing.
  - When zoom changes on the horizontal strip, keep the centre fixed: `scrollLeft = (old + clientWidth/2) * next/prev - clientWidth/2`.
  - On first load, the horizontal strip sets `scrollLeft` so the focus card's `offsetLeft` is in view. Never call `scrollIntoView`.
  - Card body:
    - the title (`<ID> <name>`, or `No milestone`);
    - a `Focus` pill;
    - the status label, plus `· <doneOn>` (with a leading space) when set;
    - `target <date>` or `No target`;
    - `<done> of <total> done`;
    - `<progress max={total} value={done}>`, rendered only when `total > 0`.
  - Hide the status and target lines for the `none` card.

- [ ] **Step 5: Write `timeline.css`.**
  - Size the card width (base `14rem`), padding, font size, and bar height with `calc(<base> * var(--timeline-zoom, 1))`.
  - `[data-layout="horizontal"]`: `display: flex; overflow-x: auto`, a connector line between cards, and fixed height (no `max-height` on vertical).
  - `[data-layout="vertical"]`: `flex-direction: column`, no overflow box.
  - Marker by `data-state`: filled for done, ringed and accented for active, hollow for planned and other.
  - Add `:root[data-timeline-pending] .plan-timeline__strip { visibility: hidden; animation: plan-timeline-reveal 0s 3s forwards; }` with its keyframes to `visibility: visible`.
  - Use Starlight colour variables only.

- [ ] **Step 6: Wire `roadmap.astro`.**
  - Import `timeline.css` and `Timeline`.
  - Compute `timelineMilestones(loadPlanning(), siteRefs().known)` and render `<Timeline client:load milestones={…} />` after `<ExportStamp />`.
  - Add an `<script is:inline>` that sets `document.documentElement.dataset.timelinePending = ''` when `new URLSearchParams(location.search).get('layout') === 'vertical'`. It lives in this page only, so the mark is scoped to the Roadmap page.
  - Add the README section: what the strip shows, `?layout=vertical`, the zoom controls (buttons, Ctrl/Cmd + wheel, pinch), and that zoom is not kept in the URL.

- [ ] **Step 7: Run every check and confirm it passes**

  Run each of these:
  - `bun run test:browser -- --project chromium`
  - `bun test`
  - `bun run check`

  Expected: all PASS, including the existing `board`, `popup`, and `width` browser tests, and `0 errors` from astro-check.

- [ ] **Step 8: Commit**

  ```bash
  git add packages/pm-docs-site/src/components/timeline packages/pm-docs-site/src/styles/timeline.css packages/pm-docs-site/src/pages/plan/roadmap.astro packages/pm-docs-site/README.md packages/pm-docs-site/test/browser/timeline.browser.ts
  git commit -m "feat(pm-docs-site): milestone timeline on the roadmap page (R-011)"
  ```

### Task 5: Whole-repository verification

**Files:** none, unless a check fails.

- [ ] **Step 1: Run the full package suite, including the `dev` project.**

  Run: `cd packages/pm-docs-site && bun run test:browser`
  Expected: all PASS. This includes `dev.browser.ts`, which checks that the island hydrates on a packed install.

- [ ] **Step 2: Run the repository checks.**

  Run: `just lint-check` and `just docs-check`
  Expected: both PASS (Markdown lint, validate, `bun test`, pm-lint, and the docs-site test, check, and build).

- [ ] **Step 3: Check the Done when by hand.**

  Build the package's fixture site the way `test/browser/serve.mjs` does, then open `/plan/roadmap/`. Every milestone card shows its target, status, and progress, and links to its milestone page. Record the command and its result in the commit body, if a fix commit is needed.
