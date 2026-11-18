# R-010 Docs-site package: board filters and swimlanes — design

- Item: R-010 Docs-site package: board filters and swimlanes (M1 Reproducible docs site, serves V4)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md`
- Branch: `feat/r-010-docs-site-package-board-filters-and-swimlanes`
- Package: `packages/pm-docs-site/`

## Intent

The docs site is a project-management site: people open it to see what is
happening and what needs them. The Board today shows every card in five
columns and nothing else. R-010 makes it something you can work with: narrow
it to one owner, milestone, size, or risk level, and split it into lanes by
milestone or by owner.

The user's standing direction (2026-11-18): the site's views are **rich
interactive components**, not static content, so consumers get visibility.
That replaces the brief's "static HTML first, enhanced by small islands"
mitigation. The Board becomes the first React island; R-011 (milestone
timeline) and R-012 (dependency graph) follow the same pattern.

## Done when (from the roadmap item)

Browser tests show that filtering the fixture Board by owner, milestone,
size, and RAG leaves only matching cards, and that grouping by milestone and
by owner renders one lane per group.

## Goals

- Filters for **owner** (agent, user, both), **milestone** (each milestone in
  `strategy.milestones`, plus "No milestone"), **size** (S, M, L), and **RAG**
  (red, amber, green, plus "No risk"). One value per filter, default "All".
  Filters combine with AND.
- **Group by**: None (today's board), Milestone, or Owner. A lane is one row
  holding all five columns (Now, Next, For you, Waiting, Done), headed by the
  lane's name and its visible card count.
- A card's **RAG** is the worst RAG (red over amber over green) of the risks in
  `risks.open` (status open, mitigating, or accepted) whose `affects` equals
  the card's item ID — the same exact-match rule `references.ts` and
  `FeatureSummary.astro` use. A card with no such risk is "No risk". Closed
  risks never count. Risks that name a milestone do not colour its cards.
- Each card shows its **size** (`S`, `M`, `L`) in the pill where the kit card
  shows a priority today, so the pill matches the size filter (agent's call:
  `sizeToPriority`'s Low/Medium/High label described the size indirectly, and
  Done cards' hard-coded "Low" was not true). The pill keeps the kit's colours
  by size (S green, M amber, L red). Cards with no size (Done, and the Now card
  when it has none) show no pill.
- Each card shows its RAG as a small coloured dot beside the size pill, with a
  text label for screen readers (`RAG red`); "No risk" shows no dot.
- Filter and group state is in the URL query (`?owner=user&milestone=M2&size=M&rag=red&group=milestone`),
  so a filtered board can be linked and survives a reload. Unknown or junk
  values are ignored (treated as "All" / "None"). Changing a control updates the
  URL with `history.replaceState` (no new history entry per click).
- Column collapse keeps working exactly as today: same localStorage key
  (`pm-docs-site:board:collapsed`), same junk-value tolerance, the same column
  collapses in every lane, and the pre-paint inline script in
  `PlanInteractions.astro` still prevents a collapsed column flashing open.
- The item popup keeps working: a plain click on a card title opens the
  dialog with that item's detail; ctrl/cmd/shift/alt or middle click follows
  the link.
- Counts are honest: each column header and lane header counts the cards
  visible after filtering. A column with no visible cards shows "Nothing
  matches" when a filter is active (and "Nothing here", as today, when none
  is). A "Clear" control resets every filter and the grouping.
- A card that has no value for an active filter is hidden (Done cards have no
  size; the Now card may have no owner or size).
- Lanes with no visible cards are omitted. Lane order: milestones in
  `strategy.milestones` order, then "No milestone"; owners agent, user, both,
  then "No owner".
- **One shared column header row** (agent's call). The five column headers,
  each with its collapse button, appear once at the top of the board; when
  grouped, they count every visible card in that column across all lanes.
  Below them, each lane is a row: a lane header (name and visible count) and
  then that lane's five column cells, aligned under the shared headers. A
  collapsed column collapses in every lane. Collapse buttons and their
  `id`/`aria-controls` therefore stay unique, and `[data-column="done"]
  .plan-column__toggle` still matches one element. Ungrouped, the board looks
  as it does today.
- **No flash of the wrong board on a filtered link** (agent's call). The
  server-rendered HTML is the full, ungrouped board (the no-JavaScript view).
  When the page's URL carries a filter or group parameter, the inline
  pre-paint script marks the board pending and CSS hides the board's content
  (keeping its space) until the island has applied the query on mount and
  clears the mark. A URL without parameters shows the server-rendered board
  immediately, as today.

## Non-goals

- Editing: no drag and drop, no moving cards. The site stays read-only.
- Multi-select within a filter, saved views, or a text search.
- Filters on any other page (the Roadmap timeline is R-011).
- A package version bump: per the brief (2026-11-18), nothing is published
  until R-013 releases `1.0.0`.
- The rest of the related inbox polish
  (`planning/inbox/2026-11-17-1928-docs-site-popup-a11y.md`): only the card
  tab-stop fix is folded in (below); aria-haspopup, backdrop close, heading
  levels, and the throwing-storage test stay parked.

## Anti-goals (a failure even if it technically works)

- A blank or broken Board without JavaScript, or before hydration. The island
  is server-rendered, so the HTML shows today's full board; the controls are
  inert until hydrated and are hidden without JavaScript.
- Counts or lanes that disagree with the visible cards.
- Breaking the existing browser tests: five columns in one row at 1440, 1024,
  and 700px; collapse persistence; junk storage.
- A board that hydrates in the build but not in the browser (astroc4 shipped a
  build that passed while islands failed to hydrate). Only browser tests
  against the built site prove it.

## Approaches

1. **Prerender three layouts; a small script toggles them and hides cards.**
   Lane assignment at build time, minimal client code. Cost: each card three
   times in the HTML; every later interactive view would need its own ad hoc
   script.
2. **One prerendered board; a script builds lanes in the browser.** Lighter
   HTML; lane logic in hand-written DOM code, and moving cards disturbs focus
   and tab order.
3. **A React island renders the board from the plan data** (chosen). The page
   passes the board's data to a server-rendered, hydrated React component that
   owns filtering, grouping, counts, collapse, and the URL. Cost: a React
   runtime on the Board page and a new dependency for every consumer.

Chosen by the user: 3, with React rather than Preact, because R-011 and R-012
will want React-first libraries (for example React Flow for the dependency
graph), so the switch is made once, now.

## Decided parts of the how

- **Dependencies**, exact-pinned like the rest of the package:
  `@astrojs/react`, `react`, `react-dom` as dependencies, `@types/react` and
  `@types/react-dom` as dev dependencies, versions compatible with the pinned
  `astro` 7.4.8 (astroc4 runs `@astrojs/react` 7.x on Astro 7.4). Lockfile
  updated with `bun install`.
- **The integration adds React itself**: `index.mjs` includes `react()` in the
  same `updateConfig({ integrations: [...] })` that adds Starlight, so a
  consumer site stays three files and needs no React configuration. The
  packed-install test (`test/install.test.ts`) must still pass from a folder
  outside the repository, which proves React resolves from the package.
- **Data at build time**: a pure function in `src/lib/` (for example
  `boardCards(planning)`) turns `planning.json` into one flat, serialisable
  list of cards: `{ id, title, column, owner, milestone, milestoneName, size,
  rag, detail, date, href, tagHref }` plus what the Now card needs (start
  date, plan progress). Lane and filter logic (`filterCards`, `laneGroups`,
  query parsing and serialising) are pure functions in a module the island
  imports, unit-tested with `bun test`.
- **The island**: `src/components/Board.tsx` (React), rendered by
  `board.astro` with `client:load` and the card list, the milestone list, and
  the filter options as props. The page keeps `ExportStamp`, `ItemDialog`, and
  one `ItemDetail` template per card outside the island, exactly once each.
- **Cards**: `KanbanItemCard.astro` and `TaskKanbanCard.astro` (Astro
  Components Kit, MIT) are ported to React components for the island, keeping
  their attribution comment and their markup and class names so the existing
  styles apply, except the pill (size instead of priority, above) and the tab
  stop (below). Linked IDs in a card's detail line are rendered with the same
  rule as `LinkedText.astro`, reusing `src/lib/references.ts` at build time
  (the island receives the resolved links, not the reference tables). The
  board's grid CSS in `components.css` is reworked for the shared header row
  and lanes; the 700px one-row rule and the collapsed-column width keep their
  current behaviour. The Astro versions stay for the pages that still use them
  (Roadmap, Now, Inbox).
- **Popup**: unchanged mechanism. Card title links keep `data-item`, and
  `src/scripts/plan.ts`'s document-level click handler still opens the dialog
  from the `ItemDetail` template, so the Roadmap and the Board share it.
- **Collapse moves into the island** for the Board (it must apply to every
  lane); `plan.ts` keeps only the popup handling and the Roadmap's needs. The
  inline pre-paint script stays, and the island reads the same key with the
  same tolerance of junk.
- **Tab stops** (from the inbox polish): the card wrapper loses `tabindex="0"`
  and `role="article"` in the React cards, so each card costs one tab stop (its
  title link) instead of two.
- **Fixture**: `test/fixtures/planning.json` gains cards so that every owner,
  both milestones and "No milestone", every size, and every RAG value
  (including "No risk") appear on the Board, in at least two columns each, with
  risks whose `affects` names the right items. `test/fixtures/expected-pages.txt`
  is updated for the new feature pages; the existing tests keep passing.
- **Browser tests** (`test/browser/board.browser.ts`, Chromium, against the
  built fixture site): for each filter field and value, only matching cards
  are visible and the counts match; grouping by milestone and by owner renders
  exactly one lane per non-empty group, in order; the URL round-trips (load a
  filtered URL, see the filtered board); collapse still persists, in every
  lane; the popup opens from a card in a lane; no page errors; the existing
  width and collapse tests still pass.

## Constraints

- `planning.json` `schemaVersion` 3 is unchanged: everything is derived from
  fields the export already has.
- Node 22 or later for the CLI; the package's `bun test`, `bun run check`
  (astro-check, 0 errors), and `bun run test:browser` must pass, as must
  `just package-test` and CI's `pm-docs-site package` job.
- The package's `package.json` version stays `0.1.0-pre.1`.
- Light and dark Starlight themes: the controls and RAG dots use Starlight
  theme variables, as the cards do.

## Left to the builder

- The visual design of the filter bar (native `<select>`s are acceptable)
  and the lane header, within Starlight's look.
- Exact component and module names, and how the island's state is structured.
- How the RAG dot colours map to theme variables.
- The fixture's exact new items, as long as the coverage above holds.
- The URL tokens for "No milestone", "No risk", and "No owner" (for example
  `none`), and how an unknown milestone value in the query is ignored.
