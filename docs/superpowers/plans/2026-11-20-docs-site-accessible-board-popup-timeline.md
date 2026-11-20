# R-028 Accessible board, popup, and timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the docs-site package's popup, card, Board, and timeline accessibility and behaviour findings, each pinned by a test.

**Architecture:** Small edits to existing React islands (`Board.tsx`, `Timeline.tsx`), Astro components (`ItemDialog`, `FeatureSummary`, the kit cards), the popup script (`src/scripts/plan.ts`), and pure helpers in `src/lib/`. Browser tests in `test/browser/` run against the built fixture site from `test/fixtures/planning.json`; unit and scratch-build tests run under `bun test`.

**Tech Stack:** TypeScript, Astro + Starlight, React islands, Bun test, Playwright (Chromium).

**Spec:** `docs/superpowers/specs/2026-11-20-docs-site-accessible-board-popup-timeline-design.md`

All paths below are relative to `packages/pm-docs-site/` unless they start
with the repository root (`docs/`, `planning/`).

## Global Constraints

- Board, Timeline, and Graph stay React islands; no Preact, no static-first rewrite.
- TypeScript only.
- Copied Astro Components Kit files keep their MIT attribution and list each change in their header comment.
- Without JavaScript, cards stay links and the timeline strip stays visible.
- No export schema or `schemaVersion` change.
- Final check: `just lint-check` passes from the repository root.

## Review Focus

- A keyboard user at a zoom limit presses the same button again: zoom does not change and focus stays on the button (Task 4, `stays at the limit`).
- A click inside the dialog's content, including its edge, never closes the dialog; only a click outside its box does (Task 1, `inside click`).
- A Board re-render after a filter change keeps `aria-haspopup` on card links (Task 1, `after filtering`).
- Storage that throws on access (Safari blocked storage), not only on `getItem`, leaves the Board working (Task 3).
- A collapsed column restored before hydration keeps its narrow vertical title, with no layout jump once the button appears (Task 3, static toggle keeps the toggle class).

---

### Task 1: Item popup: trigger, backdrop, and heading levels

**Files:**

- Modify: `src/components/board/KanbanItemCard.tsx:82`, `src/components/board/TaskKanbanCard.tsx:50`, `src/components/lib/KanbanItemCard.astro:72`, `src/components/lib/TaskKanbanCard.astro:53`, `src/components/lib/StatusTimelineFeed.astro:68`
- Modify: `src/components/ItemDialog.astro`, `src/styles/components.css:260-268`, `src/scripts/plan.ts`
- Modify: `src/components/FeatureSummary.astro` (Props, lines 68, 83, 113, 146), `src/components/ItemDetail.astro:15`
- Test: `test/browser/popup.browser.ts`

**Interfaces:**

- Produces: `FeatureSummary` prop `headingLevel?: 2 | 3` (default `2`). Dialog content wrapper class `plan-dialog__frame`.

- [x] **Step 1: Write the failing tests** in `popup.browser.ts`:
  - `every card link on <path> says it opens a dialog` for `/plan/board/` and `/plan/roadmap/`: every `a[data-item]` has `aria-haspopup="dialog"` (`expect(await page.locator('a[data-item]:not([aria-haspopup="dialog"])').count()).toBe(0)` and the `a[data-item]` count is > 0).
  - `after filtering, card links still say they open a dialog`: open `/plan/board/`, wait for `.plan-board__filters` visible, select `agent` in `#board-owner`, then the same zero-count assertion.
  - `a backdrop click closes the popup; an inside click does not`: open the first card's popup on `/plan/board/`; click at `(dialogBox.x + 2, dialogBox.y + 2)` and at the body text → still `open`; `page.mouse.click(5, 5)` → not `open`, and focus is back on the card link (`data-item` equals the card's).
  - `popup section headings sit below the dialog title`: open a popup for a card whose template has sections; `#plan-dialog-title` is `H2`; `[data-item-dialog-body] h2` count is 0; `[data-item-dialog-body] h3` count > 0.
  - `a feature page keeps its section headings at h2`: `/plan/features/r-013/` has an `h2` with text `Done when`.

- [x] **Step 2: Run them to verify they fail**

  Run: `bun run test:browser test/browser/popup.browser.ts`
  Expected: the new tests FAIL (no `aria-haspopup`, dialog stays open, `h2` in body); the existing three PASS.

- [x] **Step 3: Add `aria-haspopup="dialog"`** beside `data-item` on the five links listed under Files. React: `aria-haspopup={itemId ? 'dialog' : undefined}`; Astro: `aria-haspopup={itemId ? 'dialog' : undefined}`. Add one line to each kit file's header comment naming the change.

- [x] **Step 4: Backdrop close.** In `ItemDialog.astro` wrap the head, body, and foot in `<div class="plan-dialog__frame">`. In `components.css` move `.plan-dialog`'s `padding: 1.25rem 1.5rem` to `.plan-dialog__frame` and set `.plan-dialog { padding: 0; }`. In `plan.ts`'s click listener, before the close-button check: `if (target instanceof HTMLDialogElement && target.matches('dialog[data-item-dialog]')) target.close();`. Update the `plan.ts` header comment.

- [x] **Step 5: Heading levels.** `FeatureSummary.astro` takes `headingLevel?: 2 | 3` and renders its four section headings with `const Heading = headingLevel === 3 ? 'h3' : 'h2'`; `ItemDetail.astro` passes `headingLevel={3}`. If `.plan-dialog` CSS targets `h2` inside the body, retarget it to keep today's look.

- [x] **Step 6: Run the tests to verify they pass**

  Run: `bun run test:browser test/browser/popup.browser.ts`
  Expected: all PASS.

- [x] **Step 7: Commit**

  ```bash
  git add packages/pm-docs-site/src packages/pm-docs-site/test/browser/popup.browser.ts
  git commit -m "fix(pm-docs-site): popup trigger, backdrop close, and heading levels (R-028)"
  ```

### Task 2: One tab stop per card

**Files:**

- Modify: `src/components/lib/KanbanItemCard.astro:1-21` (header), `:60`, `:146-175` (styles)
- Test: `test/browser/popup.browser.ts` (or a new `test/browser/cards.browser.ts`)

- [x] **Step 1: Write the failing test** `cards are not tab stops on <path>` for `/plan/board/`, `/plan/roadmap/`, `/plan/inbox/`: `page.locator('.k-item[tabindex], .task-card[tabindex]').count()` is `0`, and `.k-item` count on `/plan/inbox/` is > 0.

- [x] **Step 2: Run it to verify it fails**

  Run: `bun run test:browser -g "cards are not tab stops"`
  Expected: FAIL on `/plan/inbox/` (the Astro card has `tabindex="0"`).

- [x] **Step 3: Edit `KanbanItemCard.astro`:** remove `tabindex="0"`, `role="article"`, and `aria-label` from the root `div`; remove `cursor: grab`, `outline: none`, and the `.k-item:focus-visible` rules (keep `.k-item:hover`). Add to the header comment: "the card is not focusable and has no role (one tab stop per link), and the drag cursor is gone", matching the React port.

- [x] **Step 4: Run it to verify it passes**

  Run: `bun run test:browser -g "cards are not tab stops"`
  Expected: PASS.

- [x] **Step 5: Commit**

  ```bash
  git add packages/pm-docs-site/src/components/lib/KanbanItemCard.astro packages/pm-docs-site/test/browser
  git commit -m "fix(pm-docs-site): inbox cards are not tab stops (R-028)"
  ```

### Task 3: Board collapse toggles and storage that throws

**Files:**

- Modify: `src/components/board/Board.tsx:205-218`, header comment `:1-8`
- Modify: `src/styles/components.css` (only if a `button`-only selector styles `.plan-column__toggle`)
- Test: `test/browser/board.browser.ts`

**Interfaces:**

- Consumes: `hydrated` from `useBoardUrlState` (already returned, `Board.tsx:118`).

- [x] **Step 1: Write the failing tests** in `board.browser.ts`:
  - In `without JavaScript the full board renders` (line 155), add: `button.plan-column__toggle` count is `0`, and each `section[data-column] h2` contains its column title (`Now`, `Next`, `For you`, `Waiting`, `Done`; take titles from `COLUMNS` in `src/lib/board.ts`).
  - `once hydrated, every column has its collapse button`: `button.plan-column__toggle` count is `5`.
  - `a localStorage that throws leaves the Board usable`: `page.addInitScript(() => Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('blocked', 'SecurityError'); } }))`; collect `pageerror`; open the Board and wait for hydration; click the `Next` column toggle → `document.documentElement.dataset.boardCollapsed` contains `next`; select `agent` in `#board-owner` → only `[data-owner="agent"]` cards visible; `errors` is empty.

- [x] **Step 2: Run them to verify they fail**

  Run: `bun run test:browser test/browser/board.browser.ts`
  Expected: the no-JavaScript test FAILS (5 buttons rendered). The storage test may already PASS (the guards exist); keep it as the pin.

- [x] **Step 3: Render the toggle only when hydrated.** In `Board.tsx`, inside each column's `h2`: when `hydrated`, today's `<button className="plan-column__toggle" …>`; otherwise `<span className="plan-column__toggle plan-column__toggle--static">` with the same two child spans and no `aria-*`. The shared class keeps the collapsed-column CSS (`components.css:224-228`) applying before hydration. Update the header comment: toggles appear once the island has hydrated.

- [x] **Step 4: Run the tests to verify they pass**

  Run: `bun run test:browser test/browser/board.browser.ts`
  Expected: all PASS, including `a collapsed column stays collapsed after a reload`.

- [x] **Step 5: Commit**

  ```bash
  git add packages/pm-docs-site/src packages/pm-docs-site/test/browser/board.browser.ts
  git commit -m "fix(pm-docs-site): board collapse toggles only once hydrated (R-028)"
  ```

### Task 4: Timeline zoom limits, wheel deltas, and the zoom anchor

**Files:**

- Modify: `src/lib/timeline-state.ts`, `src/components/timeline/Timeline.tsx:1-16, 112-115, 137-148`, `src/styles/timeline.css:45`
- Test: `test/timeline.test.ts`, `test/browser/timeline.browser.ts`

**Interfaces:**

- Produces: `wheelPixels(deltaY: number, deltaMode: number, lineHeight: number, pageSize: number): number` in `src/lib/timeline-state.ts` (re-exported by `lib/timeline` through its `export *`).

- [x] **Step 1: Write the failing unit test** in `timeline.test.ts`, `describe('wheelPixels')`:
  - `wheelPixels(40, 0, 20, 600)` is `40`.
  - `wheelPixels(3, 1, 20, 600)` is `60`.
  - `wheelPixels(-1, 2, 20, 600)` is `-600`.
  - `wheelPixels(0, 1, 20, 600)` is `0`.

- [x] **Step 2: Write the failing browser tests** in `timeline.browser.ts`:
  - Update `zoom buttons resize cards and stop at the limits`: replace `toBeDisabled()` with `toHaveAttribute('aria-disabled', 'true')`, and assert the opposite buttons have `aria-disabled="false"`.
  - `a zoom button keeps focus and stays at the limit`: focus `Zoom in`, press `Enter` 4 times → readout `200%`; the focused element's `aria-label` is `Zoom in`; press `Enter` again → still `200%` and still focused. Same for `Zoom out` down to `50%`, and `Reset zoom` at `100%` keeps focus.
  - `a line-mode wheel scrolls the strip by lines`: `overflowingStrip(page)`, set `scrollLeft = 0`, dispatch `new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true })` on the strip → `scrollLeft` > `3`.
  - `the zoom anchor holds across two zoom changes before one render`: as `zooming keeps the point at the centre of the strip`, but fire the change inside one `strip.evaluate` that dispatches two `WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true, bubbles: true })` events synchronously → readout moves two steps (`150%` → `200%`) and the centre ratio is within `0.02` of before.

- [x] **Step 3: Run them to verify they fail**

  Run: `bun test test/timeline.test.ts` and `bun run test:browser test/browser/timeline.browser.ts`
  Expected: `wheelPixels` is not exported; the `aria-disabled` and focus tests FAIL; the line-mode test FAILS (`scrollLeft` is `3`). The two-change anchor test may already PASS; keep it as the pin.

- [x] **Step 4: Implement `wheelPixels`** in `timeline-state.ts`: mode `0` returns `deltaY`, mode `1` `deltaY * lineHeight`, mode `2` `deltaY * pageSize`. In `Timeline.tsx` the plain-wheel branch uses `element.scrollLeft += wheelPixels(event.deltaY, event.deltaMode, lineHeightOf(element), element.clientWidth)`, where a local `lineHeightOf` is `parseFloat(getComputedStyle(element).lineHeight)` with a fallback of `16` when it is `NaN` (`normal`).

- [x] **Step 5: `aria-disabled` zoom buttons.** Replace each `disabled={…}` with `aria-disabled={…}`; each `onClick` returns without calling `changeZoom` when its condition holds (`zoom <= ZOOM.min`, `zoom >= ZOOM.max`, `zoom === ZOOM.default`). In `timeline.css:45` change `button:disabled` to `button[aria-disabled='true']` (same declarations, plus `cursor: default`).

- [x] **Step 6: Header note.** Add a line to `Timeline.tsx`'s header: it imports only types from `lib/timeline`; its values come from `lib/timeline-state.ts`, so the island never pulls `lib/planning` into the browser (as `Graph.tsx:5-7`).

- [x] **Step 7: Run the tests to verify they pass**

  Run: `bun test test/timeline.test.ts` and `bun run test:browser test/browser/timeline.browser.ts`
  Expected: all PASS.

- [x] **Step 8: Commit**

  ```bash
  git add packages/pm-docs-site/src packages/pm-docs-site/test
  git commit -m "fix(pm-docs-site): timeline zoom keeps focus at limits, scales line wheels (R-028)"
  ```

### Task 5: Fixture: planned and other milestones, Now item listed once

**Files:**

- Modify: `test/fixtures/planning.json`, `test/fixtures/expected-pages.txt`
- Modify: any test the fixture change breaks (likely `test/timeline.test.ts`, `test/planning.test.ts`, `test/graph-layout.test.ts`, `test/browser/graph.browser.ts`, `test/browser/timeline.browser.ts` comment at lines 3-5)
- Test: `test/planning.test.ts`, `test/browser/timeline.browser.ts`, `test/browser/popup.browser.ts` or a new Roadmap test

- [x] **Step 1: Edit the fixture** so it stays an export `pm-export` could write (`schemaVersion` unchanged, `counts` consistent):
  - `strategy.milestones` gains `M3 Self-serve upgrades` (`status: "planned"`, `target: "2027-02-01"`, `serves: ["V1"]`, an `exitCriteria`) and `M4 Partner billing` (`status: "on hold"`, `target: "none"`, `serves: ["V2"]`, an `exitCriteria`).
  - `R-020 README matches the code` moves to `milestone: "M3"`.
  - New Later item `R-026 Partner invoice feed` (`milestone: "M4"`, `owner: "agent"`, `size: "S"`, `status.value: "ready"`, `dependsOn: []`, `serves: ["V2"]`, a `doneWhen`), position 2; `counts.later` becomes `2`.
  - New Later item for the Now item: `R-012 Invoice export` again, `milestone: "M2"`, position 3, so the Now item is also queued under another milestone; `counts.later` becomes `3`.
  - `expected-pages.txt` gains `plan/features/r-026/index.html`, `plan/milestones/m3/index.html`, `plan/milestones/m4/index.html`.
  - Unassigned open items remain (`R-024 Dunning emails`), so the `No milestone` card still shows here.

- [x] **Step 2: Write the failing tests:**
  - `planning.test.ts`, in `describe('roadmapGroups')`: `lists the Now item once, as active, when it is also queued` (fixture: exactly one event with `id === 'R-012'` across all groups, `status === 'active'`); `lists the Now item once, as active, when it is also logged done` (a `structuredClone` of the fixture with an R-012 entry pushed onto `log.done` under `M1`: one R-012 event, `status === 'active'`).
  - `timeline.browser.ts`: `planned and other milestones render their state and marker`: `card(page, 'M3')` has `data-state="planned"`, `card(page, 'M4')` has `data-state="other"` and shows `on hold`; both contain a visible `.plan-timeline__marker`.
  - Roadmap browser test `the Now item is listed once on the Roadmap page`: on `/plan/roadmap/`, `a[data-item="R-012"]` inside the event feed has count `1`.

- [x] **Step 3: Run the whole suite** and fix tests the fixture changed (counts of milestones, lanes, items, pages); each fix updates the expected value to the new fixture, never weakens the assertion.

  Run: `bun test` and `bun run test:browser`
  Expected: all PASS.

- [x] **Step 4: Commit**

  ```bash
  git add packages/pm-docs-site/test
  git commit -m "test(pm-docs-site): planned and other milestones, Now item listed once (R-028)"
  ```

### Task 6: No empty `No milestone` card on the Milestones page

**Files:**

- Modify: `src/lib/planning.ts` (beside `milestoneSummaries`, line 364), `src/routes/plan/milestones/index.astro:13`, `src/lib/timeline.ts:35`
- Test: `test/planning.test.ts`, `test/cli.test.ts`

**Interfaces:**

- Produces: `milestoneCards(planning: Planning, all?: Feature[]): MilestoneSummary[]` in `src/lib/planning.ts`: `milestoneSummaries` without the unassigned summary when its `progress.total` is `0`. `milestoneSummaries` itself is unchanged (the `none` milestone page needs it).

- [x] **Step 1: Write the failing tests:**
  - `planning.test.ts`: `milestoneCards keeps No milestone while an unassigned item is not dropped` (fixture: last entry has `id === null`); `milestoneCards drops No milestone when every unassigned item is dropped` (a clone whose unassigned roadmap items, Now item, and done entries are given `milestone: "M1"`, plus one dropped unassigned entry: no entry has `id === null`).
  - `cli.test.ts`: `the Milestones page has no No milestone card when every unassigned item is dropped`: `scratchFixture('no-milestone-')`, apply the same edit to its `planning.json`, `siteConfig("{ title: 'M', planning: '../planning.json', views: ['milestones'] }")`, build; `dist/plan/milestones/index.html` does not contain `No milestone`, exit code `0`.

- [x] **Step 2: Run them to verify they fail**

  Run: `bun test test/planning.test.ts test/cli.test.ts`
  Expected: `milestoneCards` is not exported; the build test FAILS (the page shows `No milestone`).

- [x] **Step 3: Implement `milestoneCards`**; use it in `milestones/index.astro` instead of `milestoneSummaries`, and in `timelineMilestones` in place of its own `.filter`, so the two pages share one rule. Update the `planning.ts:139` comment to name `milestoneCards`.

- [x] **Step 4: Run them to verify they pass**

  Run: `bun test`
  Expected: all PASS.

- [x] **Step 5: Commit**

  ```bash
  git add packages/pm-docs-site/src packages/pm-docs-site/test
  git commit -m "fix(pm-docs-site): no empty No milestone card on the Milestones page (R-028)"
  ```

### Task 7: Island import guard

**Files:**

- Create: `test/island-imports.test.ts`

- [x] **Step 1: Write the test** `islands import only types from server-only libs`: walk `src/components/**/*.tsx` and `src/components/**/*.ts`; for each `import` statement (single or multi-line), fail when the specifier ends in `lib/planning`, `lib/timeline`, `lib/graph`, or `lib/graph-layout` (with or without `.ts`) and the statement is not `import type`. The failure message names the file and the specifier. A second test `the guard catches a value import` runs the same checker on the string `import { features } from '../../lib/planning';` and expects one finding, and on `import type { Feature } from '../../lib/planning';` and expects none.

- [x] **Step 2: Run it**

  Run: `bun test test/island-imports.test.ts`
  Expected: PASS today (Task 4's note documents the existing boundary). If it fails, the finding is a real value import: change it to `import type` or move the value to `lib/timeline-state.ts` or `lib/graph`'s client-safe module.

- [x] **Step 3: Commit**

  ```bash
  git add packages/pm-docs-site/test/island-imports.test.ts
  git commit -m "test(pm-docs-site): islands import only types from server-only libs (R-028)"
  ```

### Task 8: Full verification

- [x] **Step 1: Run** from the repository root: `just lint-check`
  Expected: exit `0`, including `package-test` (`bun test`, `test:browser`, `test:browser:dev`, the demo check) and `just docs-check`.

- [x] **Step 2: Check the Done when** in `planning/NOW.md` line by line against the tests from Tasks 1 to 6. The "No milestone" clause reads as "without an unassigned item that is not dropped" (spec, Decisions by the user).

- [x] **Step 3: Commit** any fixes from Step 1 with a `fix(pm-docs-site): …` or `test(pm-docs-site): …` message.
