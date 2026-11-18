# R-010 Board filters and swimlanes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the package's Board into a server-rendered React island with owner, milestone, size, and RAG filters, grouping into milestone or owner lanes, and URL state.

**Architecture:** `board.astro` builds a flat, serialisable card list at build time (`src/lib/board-data.ts`) and passes it to `src/components/board/Board.tsx` (`client:load`). All filter, lane, and query logic is pure TypeScript in `src/lib/board.ts`, unit-tested with `bun test`; the island only holds state and renders. The item popup keeps its existing mechanism (`ItemDetail` templates plus `src/scripts/plan.ts`); column collapse moves into the island.

**Tech Stack:** Astro 7.4.8, Starlight 0.42.10, React 19 via `@astrojs/react`, TypeScript 6, `bun test`, Playwright (Chromium) against the built fixture site.

**Spec:** `docs/superpowers/specs/2026-11-18-docs-site-package-board-filters-design.md`

## Global Constraints

- Work in `packages/pm-docs-site/` on `feat/r-010-docs-site-package-board-filters-and-swimlanes`; no new branch or worktree.
- Do not change the package `version` (`0.1.0-pre.1`).
- TypeScript always: every new file is `.ts` or `.tsx` (modules, components, tests); never add `.js`, `.mjs`, or `.jsx`. Two existing exceptions are edited in place, not converted: `index.mjs` (a published entry point Node loads with no build step, kept `// @ts-check` with JSDoc types) and the `is:inline` script in `PlanInteractions.astro` (Astro does not process inline scripts, and it must run before paint).
- Exact-pin new dependencies (no `^` or `~`), like the existing ones; update `bun.lock` with `bun install`.
- `planning.json` `schemaVersion` 3 unchanged; derive everything from fields the export already has.
- Card RAG = worst of `red` > `amber` > `green` over `planning.risks.open` (statuses open, mitigating, accepted) whose `affects === card id`; otherwise `none`. Closed risks and milestone-level risks never colour a card.
- URL keys, in this order: `owner`, `milestone`, `size`, `rag`, `group`. "No milestone" and "No risk" are the token `none`. Junk or unknown values are ignored (All / None). Update with `history.replaceState`.
- Lane order: milestone lanes in `strategy.milestones` order, then `none` ("No milestone"); owner lanes `agent`, `user`, `both`, then `none` ("No owner"). Empty lanes are omitted.
- Collapse keeps the localStorage key `pm-docs-site:board:collapsed` and the root attribute `data-board-collapsed` (space-separated column names), which the existing CSS reads.
- Column names: `now`, `next`, `foryou`, `waiting`, `done`; titles Now, Next, For you, Waiting, Done.
- Empty column text: "Nothing here" with no active filter, "Nothing matches" with one.
- Keep the Astro Components Kit MIT attribution comment on every ported card component.
- Every commit passes `bun test`, `bun run check` (0 errors), and from Task 5 on `bun run test:browser`, run in `packages/pm-docs-site/`.

## Review Focus

- A filtered link opened cold (`/plan/board/?owner=user&group=owner`) must never show the unfiltered board first and must end with exactly the filtered lanes — Task 6's pending-mark test.
- A closed risk that names an item must not colour it (fixture RK-010 closed, red, affects R-021, so R-021 stays `none`) — Task 2 and Task 4 tests.
- Junk query values (`?owner=boss&size=XL&group=sideways&milestone=M9`) must give the default board with no page error — Task 2 unit test and Task 6 browser test.
- With JavaScript off, the full board renders with every card and no filter bar — Task 5 browser test with `javaScriptEnabled: false`.
- `pm-docs-site dev` must hydrate the island (astroc4 found React served as raw CommonJS in dev while the build passed) — Task 7 manual check.

---

### Task 1: React in the integration

**Files:**

- Modify: `packages/pm-docs-site/package.json` (dependencies), `bun.lock`
- Modify: `packages/pm-docs-site/tsconfig.json`
- Modify: `packages/pm-docs-site/index.mjs` (the `updateConfig` integrations list)
- Test: `packages/pm-docs-site/test/integration.test.ts`

**Interfaces:**

- Produces: every site built with `pmDocsSite()` renders `.tsx` islands with no consumer configuration.

- [ ] **Step 1: Write the failing test** `it('adds React with Starlight, so islands need no consumer config')` in `test/integration.test.ts`: call `pmDocsSite({ title: 'T' }).hooks['astro:config:setup']` with a fake `{ config: { root: <fixture site URL> }, updateConfig, injectRoute }`, capture the object passed to `updateConfig`, and assert `integrations.map((i) => i.name)` contains both `'@astrojs/starlight'` and `'@astrojs/react'`.
- [ ] **Step 2: Run** `bun test test/integration.test.ts` — expected FAIL (no `@astrojs/react`).
- [ ] **Step 3: Add dependencies** `@astrojs/react`, `react`, `react-dom` (dependencies) and `@types/react`, `@types/react-dom` (devDependencies), exact versions compatible with `astro` 7.4.8 (purview-dev/astroc4 uses `@astrojs/react` 7.x with Astro 7.4); run `bun install`.
- [ ] **Step 4: Add** `"jsx": "react-jsx"` and `"jsxImportSource": "react"` to `compilerOptions` in `tsconfig.json`; in `index.mjs` import `react` from `@astrojs/react` and append `react()` after `starlight(...)` in the same `integrations` array.
- [ ] **Step 5: Run** `bun test` and `bun run check` — expected PASS, 0 errors. `test/install.test.ts` (packed tarball outside the repo) must pass, proving React resolves from the package; if it fails on resolution, add the React packages to the integration's Vite `ssr.noExternal` handling next to `NO_EXTERNAL`.
- [ ] **Step 6: Commit** `build(pm-docs-site): add React islands to the integration`

### Task 2: Board model (pure)

**Files:**

- Create: `packages/pm-docs-site/src/lib/board.ts` (no imports from Astro, `node:*`, or `planning.ts` runtime code; types only)
- Test: `packages/pm-docs-site/test/board.test.ts`

**Interfaces:**

- Consumes: `Owner`, `Size`, `Rag` from `src/lib/planning-types.ts`.
- Produces:

```ts
export type ColumnName = 'now' | 'next' | 'foryou' | 'waiting' | 'done';
export const COLUMNS: readonly { name: ColumnName; title: string }[];
export type CardRag = Rag | 'none';
export interface LinkRun { text: string; href: string | null; label: string | null }
export interface BoardCard {
  key: string;                 // unique per card: `${column}:${id ?? index}`
  id: string | null;           // null for a Done entry without an ID
  title: string;               // "R-013 Email invoices to tenants"
  titleRuns: LinkRun[];        // linked title text, used when href is null
  column: ColumnName;
  owner: Owner | null;
  milestone: string | null;    // a known milestone ID, or null
  tag: string;                 // milestone ID or "No milestone"
  tagHref: string | null;
  size: Size | null;
  rag: CardRag;
  detail: LinkRun[];           // the detail line (Done: the date)
  href: string | null;         // the item page; null when not built
  started: string | null;      // Now card only
  progress: number | null;     // Now card only, 0..100
}
export interface BoardFilters { owner: Owner | null; milestone: string | null; size: Size | null; rag: CardRag | null }
export type GroupBy = 'none' | 'milestone' | 'owner';
export interface BoardState { filters: BoardFilters; group: GroupBy }
export const DEFAULT_STATE: BoardState;
export function cardRag(id: string | null, openRisks: { affects: string | null; rag: Rag }[]): CardRag;
export function parseBoardQuery(search: string, milestoneIds: string[]): BoardState;
export function boardQuery(state: BoardState): string;   // '' for DEFAULT_STATE, else '?owner=…&…'
export function isFiltered(state: BoardState): boolean;  // any filter set (group alone is not a filter)
export function matches(card: BoardCard, filters: BoardFilters): boolean;
export interface Lane { key: string; label: string; cards: BoardCard[] }
export function lanes(cards: BoardCard[], group: GroupBy, milestones: { id: string; name: string }[]): Lane[];
```

- [ ] **Step 1: Write the failing tests** in `test/board.test.ts`, with a small inline `card()` factory:
  - `cardRag`: `[{affects:'R-1',rag:'green'},{affects:'R-1',rag:'red'},{affects:'R-1',rag:'amber'}]` → `'red'`; no match → `'none'`; `id` null → `'none'`; `affects: 'R-1, R-2'` does not match `'R-1'` (exact match).
  - `parseBoardQuery('?owner=user&milestone=none&size=L&rag=none&group=owner', ['M1','M2'])` → `{ filters: { owner:'user', milestone:'none', size:'L', rag:'none' }, group:'owner' }`.
  - `parseBoardQuery('?owner=boss&size=XL&group=sideways&milestone=M9&rag=pink', ['M1'])` → `DEFAULT_STATE`.
  - `boardQuery(DEFAULT_STATE)` → `''`; `boardQuery({ filters:{owner:'both',milestone:'M2',size:'S',rag:'red'}, group:'milestone' })` → `'?owner=both&milestone=M2&size=S&rag=red&group=milestone'`; round trip `parseBoardQuery(boardQuery(s), ids)` equals `s` for that state.
  - `matches`: owner filter hides a card whose `owner` is null; size filter hides a card whose `size` is null; `milestone: 'none'` matches only `milestone === null`; `rag: 'none'` matches only `rag === 'none'`; filters combine with AND.
  - `lanes(cards, 'none', ms)` → one lane `{ key:'all', label:'', cards }`.
  - `lanes(cards, 'milestone', [{id:'M1',name:'First release'},{id:'M2',name:'Billing'}])` → keys in order `M1`, `M2`, `none`, labels `M1 First release`, `M2 Billing`, `No milestone`, omitting a key with no cards; a card whose milestone is not in the list goes to `none`.
  - `lanes(cards, 'owner', ms)` → keys `agent`, `user`, `both`, `none` in that order, labels `agent`, `user`, `both`, `No owner`, empty ones omitted.
- [ ] **Step 2: Run** `bun test test/board.test.ts` — expected FAIL (module missing).
- [ ] **Step 3: Implement** `src/lib/board.ts` to the interface above.
- [ ] **Step 4: Run** `bun test test/board.test.ts` and `bun run check` — expected PASS, 0 errors.
- [ ] **Step 5: Commit** `feat(pm-docs-site): board filter, lane, and query model`

### Task 3: Fixture coverage

**Files:**

- Modify: `packages/pm-docs-site/test/fixtures/planning.json`
- Modify: `packages/pm-docs-site/test/fixtures/expected-pages.txt`

**Interfaces:**

- Produces: the Board below, which Tasks 4 to 6 assert on. Keep every existing item, risk, and field unchanged.

| Column | Card | Owner | Size | Milestone | RAG (risk) |
| --- | --- | --- | --- | --- | --- |
| now | R-012 Invoice export (existing) | none | none | none | amber (RK-004, existing) |
| next | R-013 Email invoices to tenants (existing) | agent | M | M2 | red (RK-002, existing) |
| next | R-022 Usage-based pricing tiers | both | L | M1 | green (RK-006 open, low × medium) |
| foryou | R-021 Tenant onboarding checklist | user | S | M1 | none (RK-010 closed, high × high, red — must not count) |
| foryou | R-023 Approve the pricing copy | user | L | M2 | amber (RK-007 open, medium × medium) |
| waiting | R-014 Retry failed invoice emails (existing) | agent | M | M2 | none |
| waiting | R-024 Dunning emails (depends on R-022) | agent | S | none | red (RK-008 open, high × high) |
| done | R-011 Write the first export (existing) | user | — | none | none |
| done | R-025 Tenant model | both | — | M1 | green (RK-009 accepted, low × low) |

- [ ] **Step 1: Add** R-021 to R-024 to `roadmap.next` (R-021, R-023 `owner: user`; R-024 `label: waiting`, `dependsOn: ['R-022']`) and to `board.columns` as above; add R-025 to `log.done` (newest first) and `board.columns.done`; add RK-006 to RK-009 to `risks.open` and RK-010 to `risks.closed`, each with `rag` equal to its derived value; update every `counts` field the additions change.
- [ ] **Step 2: Validate** `bun ../../skills/pm-export/scripts/export.ts validate test/fixtures/planning.json` — expected: valid.
- [ ] **Step 3: Add** the new pages to `expected-pages.txt` (`plan/features/r-021/index.html` … `r-025`, `plan/risks/rk-006/index.html` … `rk-010`), sorted like the existing lines.
- [ ] **Step 4: Run** `bun test` — expected PASS (existing assertions on the fixture that count items or risks are updated to the new totals, not weakened).
- [ ] **Step 5: Commit** `test(pm-docs-site): fixture board covers every owner, milestone, size, and RAG`

### Task 4: Board data at build time

**Files:**

- Create: `packages/pm-docs-site/src/lib/board-data.ts`
- Test: `packages/pm-docs-site/test/board-data.test.ts`

**Interfaces:**

- Consumes: `features`, `milestoneId`, `planProgress`, `loadPlanning` (`src/lib/planning.ts`); `linkify`, `Target` (`src/lib/references.ts`); `BoardCard`, `LinkRun`, `cardRag` (Task 2).
- Produces: `export function boardCards(planning: Planning, known: Map<string, Target>): BoardCard[]` — columns in `COLUMNS` order, cards in export order. Owner and size come from the card, else the item's feature; milestone from the feature (`now`, `next`, `foryou`, `waiting`) or `milestoneId(entry.milestone, …)` (`done`); `tag`/`tagHref` exactly as `board.astro`'s `tagOf` does today; `detail` is `linkify(card.detail)` (Done: `linkify(entry.date)`), mapped to `LinkRun` (`href: run.target?.href ?? null`, `label: run.target?.label ?? null`); `started`/`progress` from `planning.now.started` and `planProgress(planning.plan)` for the Now card only, else null.

- [ ] **Step 1: Write the failing tests** against the Task 3 fixture: 9 cards; per column the IDs of the table in Task 3; R-012 has `owner: null`, `size: null`, `milestone: null`, `tag: 'No milestone'`, `rag: 'amber'`, `progress` equal to `planProgress(fixture.plan)`; R-021 `rag: 'none'`; R-025 `milestone: 'M1'`, `size: null`, `rag: 'green'`; R-024's `detail` has a run with text `R-022` and a non-null `href`; every `key` is unique.
- [ ] **Step 2: Run** `bun test test/board-data.test.ts` — expected FAIL.
- [ ] **Step 3: Implement** `boardCards`.
- [ ] **Step 4: Run** `bun test` and `bun run check` — expected PASS, 0 errors.
- [ ] **Step 5: Commit** `feat(pm-docs-site): build the board's cards from planning.json`

### Task 5: The Board island (filters, collapse, popup)

**Files:**

- Create: `packages/pm-docs-site/src/components/board/Board.tsx`, `KanbanItemCard.tsx`, `TaskKanbanCard.tsx`, `LinkRuns.tsx`
- Create: `packages/pm-docs-site/src/styles/kanban.css` (the two Astro cards' `<style>` blocks as global CSS, attribution comment at top)
- Modify: `packages/pm-docs-site/src/pages/plan/board.astro`, `src/scripts/plan.ts`, `src/styles/components.css`
- Test: `packages/pm-docs-site/test/browser/board.browser.ts`

**Interfaces:**

- Consumes: `boardCards` (Task 4), `COLUMNS`, `matches`, `isFiltered`, `BoardState`, `DEFAULT_STATE` (Task 2).
- Produces: `export default function Board(props: { cards: BoardCard[]; milestones: { id: string; name: string }[] }): JSX.Element`. DOM contract the tests and CSS rely on:
  - Filter bar `.plan-board__filters`, hidden until hydrated (rendered with `hidden`, cleared in `useEffect`); `<select>`s with ids `board-owner`, `board-milestone`, `board-size`, `board-rag`, `board-group` (each with a visible `<label>`); first option value `''` "All" (`board-group`: `none` "None", `milestone` "Milestone", `owner` "Owner"); a "Clear" button `#board-clear`.
  - One header row: five `section.plan-column[data-column="<name>"]`, each with the existing `h2 > button.plan-column__toggle[aria-expanded][aria-controls]` holding `.plan-column__name` and `.plan-column__count` (visible cards in that column across lanes).
  - Each lane: `div.plan-lane[data-lane="<key>"]`; when grouped, a `.plan-lane__header` spanning all columns with the label and `.plan-lane__count`; then five `div.plan-column__cards[data-lane-column="<name>"]` cells; the cell for column `x` in lane `all` has `id="col-x-cards"` (the toggle's `aria-controls`), other lanes `col-x-cards-<lane key>`.
  - Card: `[data-card="<key>"]` wrapper with `data-owner`, `data-milestone`, `data-size`, `data-rag` (`none` for null); title link `a.plan-item-link[data-item="<id>"]` when `href` is set, else `LinkRuns` of `titleRuns`.

- [ ] **Step 1: Write the failing browser tests** in `board.browser.ts` (keep the three existing tests):
  - `each owner filter leaves only that owner's cards` — for `agent`, `user`, `both`: select it, every visible `[data-card]` has that `data-owner`, the count equals the Task 3 table (agent 3, user 3, both 2), R-012 is hidden.
  - same for `milestone` (`M1` 3, `M2` 3, `none` 3), `size` (`S` 2, `M` 2, `L` 2; both Done cards hidden), `rag` (`red` 2, `amber` 2, `green` 2, `none` 3).
  - `filters combine` — owner `user` + rag `amber` leaves only R-023.
  - `counts follow the filter` — with size `L`, `[data-column="next"] .plan-column__count` reads 1 and the Now cell shows "Nothing matches"; after `#board-clear`, all counts return to 1, 2, 2, 2, 2.
  - `a card opens its popup` — plain click on R-013's title opens `dialog[data-item-dialog]` titled `R-013 Email invoices to tenants`.
  - `without JavaScript the full board renders` — `browser.newContext({ javaScriptEnabled: false })`: 9 `[data-card]` visible and `.plan-board__filters` not visible.
  - `the board hydrates with no page errors` — collect `pageerror`, interact with one filter, expect none.
- [ ] **Step 2: Run** `bun run test:browser` — expected the new tests FAIL, the three existing ones PASS.
- [ ] **Step 3: Port** `KanbanItemCard.astro` and `TaskKanbanCard.astro` to `KanbanItemCard.tsx` and `TaskKanbanCard.tsx` with the same class names and markup, except: the pill shows the size (`S`, `M`, `L`; colours S `#059669`, M `#d97706`, L `#dc2626` from the kit's low/medium/high) and is omitted when size is null; a RAG dot (`.k-item__rag[data-rag]`, `aria-label="RAG <value>"`) beside it, omitted for `none`; the wrapper has no `tabindex` and no `role`. Move their styles into `src/styles/kanban.css` (plus the RAG dot, using `--sl-color-red`, `--sl-color-orange`, `--sl-color-green`). `LinkRuns.tsx` renders `LinkRun[]` as text and `<a href title>` like `LinkedText.astro`.
- [ ] **Step 4: Implement** `Board.tsx` to the DOM contract (lane `all` only in this task). Collapse: read the stored set on mount with the same junk tolerance as `readCollapsed` in `plan.ts`, toggle on header click, write storage, and set `document.documentElement.dataset.boardCollapsed`; extend the collapse selectors in `components.css` to `[data-lane-column]` cells (cards hidden, narrow) alongside `[data-column]`. Ungrouped, the header cell and its cards cell read as one column (shared border and background).
- [ ] **Step 5: Wire** `board.astro`: render `<Board client:load cards={boardCards(planning, known)} milestones={…} />` inside `.plan-columns not-content`, keep `ExportStamp`, `PlanInteractions`, `ItemDialog`, and one `ItemDetail` per card with an `href` outside the island; import `kanban.css`. Remove the collapse code from `src/scripts/plan.ts`, keeping the popup handling (the Roadmap and Board share it) and `STORAGE_KEY` export if `PlanInteractions.astro`'s comment references it.
- [ ] **Step 6: Run** `bun run test:browser`, `bun test`, `bun run check` — expected all PASS, 0 errors (including the 1440/1024/700px one-row test and the collapse tests).
- [ ] **Step 7: Commit** `feat(pm-docs-site): board filters in a React island`

### Task 6: Lanes, URL state, and no flash

**Files:**

- Modify: `packages/pm-docs-site/src/components/board/Board.tsx`, `src/components/PlanInteractions.astro`, `src/styles/components.css`
- Test: `packages/pm-docs-site/test/browser/board.browser.ts`

**Interfaces:**

- Consumes: `lanes`, `parseBoardQuery`, `boardQuery` (Task 2).
- Produces: the pending mark `data-board-pending` on `<html>`, set by the inline script and cleared by the island after it applies the query.

- [ ] **Step 1: Write the failing browser tests:**
  - `grouping by milestone renders one lane per milestone` — select group `milestone`: `[data-lane]` keys `M1`, `M2`, `none` in order, lane counts 3, 3, 3, every card in lane `M1` has `data-milestone="M1"`.
  - `grouping by owner renders one lane per owner` — keys `agent`, `user`, `both`, `none`, counts 3, 3, 2, 1.
  - `grouping and filtering together drop empty lanes` — owner `user` + group `milestone` leaves lanes `M1`, `M2`, `none` with 1, 1, 1; rag `green` + group `owner` leaves lanes `both` only.
  - `the URL carries the state` — choose owner `user`, group `owner`: `page.url()` ends with `?owner=user&group=owner`; reload: the same selects and lanes.
  - `a filtered link never shows the unfiltered board` — `page.goto('/plan/board/?owner=user&group=owner')` with an init script that records, on `DOMContentLoaded`, whether `.plan-board__body` is visible (`visibility` not `hidden`) while `data-board-pending` is set; expect it hidden then, and after load exactly lane `user` with 3 cards and no `data-board-pending`.
  - `junk in the URL gives the default board` — `?owner=boss&size=XL&group=sideways&milestone=M9` shows 9 cards, no lanes header, no page error.
  - `a collapsed column collapses in every lane` — group `owner`, collapse `done`: every `[data-lane-column="done"]` hides its cards and is narrower than 64px; reload keeps it.
  - `a card in a lane opens its popup` — group `milestone`, click R-022's title: the dialog opens titled `R-022 Usage-based pricing tiers`.
- [ ] **Step 2: Run** `bun run test:browser` — expected the new tests FAIL.
- [ ] **Step 3: Implement** lanes in `Board.tsx` (`lanes(visibleCards, state.group, milestones)`; lane header and count only when grouped), state from `parseBoardQuery(location.search, …)` on mount, and `history.replaceState(null, '', location.pathname + boardQuery(state) + location.hash)` on change.
- [ ] **Step 4: Add the pending mark:** in `PlanInteractions.astro`'s inline script, set `document.documentElement.dataset.boardPending = ''` when `location.search` has any of `owner`, `milestone`, `size`, `rag`, `group`; in `components.css`, `:root[data-board-pending] .plan-board__body { visibility: hidden; }` (`.plan-board__body` wraps the header row and lanes); the island deletes the mark after its first render with the parsed state (in `useEffect`, after the state is applied).
- [ ] **Step 5: Run** `bun run test:browser`, `bun test`, `bun run check` — expected all PASS, 0 errors.
- [ ] **Step 6: Commit** `feat(pm-docs-site): board swimlanes and shareable filter URLs`

### Task 7: Docs and whole-package verification

**Files:**

- Modify: `packages/pm-docs-site/README.md` (what the Board offers), `docs/wiki/guide/Docs-Site-Package.md` (a sentence on Board filters, lanes, and linkable URLs, and that the package adds React itself)

- [ ] **Step 1: Document** the Board's filters, grouping, and URL parameters (`owner`, `milestone`, `size`, `rag`, `group`, `none`) in both files; note that the integration adds `@astrojs/react`, so consumer sites stay three files.
- [ ] **Step 2: Run** from the repository root: `just package-test` — expected PASS (install, `bun test` including the packed-install test, `bun run check`, browser tests); `bunx markdownlint-cli2 packages/pm-docs-site/README.md docs/wiki/guide/Docs-Site-Package.md` — 0 issues; `bun scripts/validate.ts` — OK; `bun scripts/check-version.ts origin/main` — `pm-docs-site 0.1.0-pre.1`, unchanged.
- [ ] **Step 3: Check dev hydration by hand:** in a scratch copy of the fixture site (as `test/browser/serve.mjs` builds it), run `pm-docs-site dev`, open `/plan/board/?group=owner`, and confirm lanes render and a filter works with no console error. Record the result in the commit body.
- [ ] **Step 4: Commit** `docs(pm-docs-site): board filters, lanes, and linkable views`
