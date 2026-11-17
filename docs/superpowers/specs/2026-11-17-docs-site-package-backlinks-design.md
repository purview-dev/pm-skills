# R-009 Docs-site package: backlinks everywhere — design

- Item: R-009 Docs-site package: backlinks everywhere (Serves V4, Milestone M1)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md` (problem, alternatives, challenges, ramifications)
- Builds on: `docs/superpowers/specs/2026-11-17-docs-site-package-skeleton-design.md` (R-008)
- Branch: `feat/r-009-docs-site-package-backlinks`
- Date: 2026-11-17

## Intent

The package site renders the plan, but most IDs on it are dead text: Board
cards, roadmap rows, log, inbox, and prose fields name `R-NNN`, `M1`, and
`RK-NNN` without linking them, and no page says what points at it. The brief
asks for best-in-class kanban and roadmap views "with backlinking, so board
items link to their project page". R-009 makes every reference navigable in
both directions, and (added in design, 2026-11-17) makes the Board and
Roadmap work like a planning tool: a detail popup per item, collapsible
Board columns, and pages that use the full width of the screen.

## Done when

This replaces R-009's original Done when (user decision, 2026-11-17: the
popup, collapse, and full width go into R-009). All checks run against the
fixture build in `packages/pm-docs-site/test/fixtures/`.

1. **Link test** (`bun test`): on every built page, every item, milestone,
   and risk ID that the export knows, and every brief path, is inside an
   `<a>`, except the page's own ID in its own title; and every internal
   `href` resolves to a built page, and every `#fragment` to an element `id`
   on that page.
2. **Backlinks** (`bun test`): every item, milestone, and risk page has a
   `Linked from` section, and for every link in the build that points at one
   of those pages, the target's `Linked from` lists the source page. Links
   inside a `Linked from` section and inside popup `<template>`s are not
   sources: they are derived from links elsewhere (check 1 still applies to
   them).
3. **Browser tests** (Playwright, Chromium):
   - the Board's five columns sit in one row (equal top offset) at 1440,
     1024, and 700px wide;
   - collapsing a Board column narrows it, and it is still collapsed after a
     reload; expanding it restores it after a reload;
   - a plain click on a Board card and on a Roadmap row opens a popup with
     the item's details and an `Open page` link to its feature page; Escape
     closes it and focus returns to the card;
   - a ctrl-click (cmd-click on macOS) on a card follows the link and opens
     no popup.
4. **Full width** (Playwright): at 1440px, the main content of a plan page
   (Roadmap) and of a repository docs page is wider than Starlight's
   default 45rem content column.
5. `expected-pages.txt` lists the new risk pages, and `bun test`,
   `bun run check`, and `just version-check` pass.

## Goals

- One reference index, computed once from `planning.json`, feeds every link
  and every `Linked from` list, so links and backlinks cannot disagree.
- IDs in prose (Done when, results, notes, reasons, brief problem and
  decision, risk trigger and mitigation, inbox ideas) are linked too.
- Every interaction works as a plain link without JavaScript.

## Non-goals

- Board filters and swimlanes (R-010), the milestone timeline (R-011), and
  the dependency graph (R-012). R-009 leaves room for them: the client
  script is the place R-010 extends.
- Links for `V` lines and bets. They stay as rendered today.
- A page per brief or per inbox file: briefs keep their anchored rows on the
  Briefs page, inbox files their cards on the Inbox page.
- Any change to `skills/**`, `docs-site/`, or the templates (R-013 migrates).

## Anti-goals

- A popup that is the only way to reach an item: the card is always a real
  link, so middle-click, ctrl-click, "open in new tab", and no-JS all reach
  the page.
- A runtime UI framework or any new runtime dependency.
- Parsing PM Markdown: data comes only from `planning.json`.

## Constraints

- The package's Astro Components Kit files keep their MIT attribution; any
  change to one is named in its header comment ("the only changes are…").
- Code that runs while `astro.config.mjs` loads stays plain `.mjs` (R-008
  constraint). Page and client code under `src/` may be TypeScript.
- Tests that build a site run under Node (R-008 call). Playwright runs
  under Node with its own runner, not under `bun test`.
- Windows: scratch sites live in `test/.tmp/` (same drive as `src/`).

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A. Build-time reference index; popup content rendered inline as a `<template>` per card; one small Astro `<script>` for popup and collapse | No new dependency, instant and offline; 1 to 3 KB of HTML per card | **Chosen** by the user |
| B. Same index; popup fetches the feature page and shows a slice | Lighter pages; a round trip per click, and the popup breaks when the feature page's markup changes | Rejected |
| C. A framework island (Preact or Solid) for Board and Roadmap | Easier client state, reusable for R-010; a new pinned dependency and integration for one popup and one toggle | Rejected; R-010 may revisit |

## Design

### Reference index (`src/lib/references.ts`)

- `type Target = { kind: 'item' | 'milestone' | 'risk' | 'brief'; id: string; href: string; label: string }`.
  Items link to `/plan/features/<id>/`, milestones to
  `/plan/milestones/<id>/` (and `No milestone` to `/none/`), risks to
  `/plan/risks/<id>/`, removed risks to `/plan/risks/#<id>`, and briefs to
  `/plan/briefs/#<briefAnchor>`.
- `targets(planning)`: every known target, keyed by ID (briefs by path).
  A target whose view is switched off (`config.views`) has no `href`, and
  is rendered as plain text; the link test runs on the all-views fixture.
- `references(planning)`: for each target, the list of source pages that
  link to it, as `{ href, label, relation }` (`relation`: `depends on`,
  `revisits`, `milestone`, `affects`, `mitigation`, `related`, `brief`,
  `mentions`, `listed`). `listed` is a link from an index view (Board,
  Roadmap, Log, Features, Milestones, Now, Inbox, Briefs, Risks, Strategy)
  and shows as `Listed on`; `mentions` is only an ID found in prose by
  `linkify`. Sources are every page that renders a link: feature,
  milestone, and risk pages, Board, Roadmap, Log, Inbox, Briefs, Now,
  Strategy, Features, and Milestones. The list is deduplicated by source
  page and excludes the target's own page.
- Prose IDs come from one tokenizer, `linkify(text)`, that splits text into
  plain runs and known-ID runs (`R-\d{3,}`, `RK-\d{3,}`, `M\d+`, matched on
  word boundaries). The same tokenizer feeds `references` (relation
  `mentions`) and the `<LinkedText>` component, which is what makes check 2
  hold by construction. Unknown IDs stay plain text.

### Components

- `LinkedText.astro`: renders `linkify(text)`; a known ID becomes
  `<a href>`, with the target's label as its `title`.
- `RefLink.astro`: one target as a link with its named reference
  (`R-012 Dependency graph`), or plain text when it has no `href`.
- `LinkedFrom.astro`: the `Linked from` section, grouped by relation, each
  entry a link to the source page. Shows `Nothing links here yet.` when
  empty, so the section is always present (check 2).
- `FeatureSummary.astro`: an item's facts, Done when, milestone, depends on,
  brief, and risks. Used on the feature page and inside each popup
  `<template>`, so the two never drift.
- `ItemDialog.astro`: one `<dialog>` per page with a heading, the summary
  slot, an `Open page` link, and a close button.

### Pages

- **Feature, milestone pages:** every reference through `RefLink` or
  `LinkedText`; a `LinkedFrom` section last.
- **Risk pages (new)**, `src/routes/plan/risks/[id].astro`, one per open
  and closed risk (user decision, 2026-11-17): RAG, likelihood, impact,
  override, status, owner, affects, trigger, mitigation, raised, reviewed,
  closed, then `LinkedFrom`. The Risks page links each row and matrix cell
  to it and keeps its row anchors (removed risks are linked to their
  anchor). Risk pages are not in the sidebar. They are part of the core,
  not a view, matching the Risks page.
- **Board:** each card's title is `<a href="/plan/features/<id>/">` with
  `data-item="<id>"`, followed by a `<template data-item-detail="<id>">`
  holding `FeatureSummary`. Done cards with an ID link and pop up the same
  way.
- **Roadmap:** each `StatusTimelineFeed` event title becomes the same link
  plus template.
- **Log, Inbox, Briefs, Now, Strategy, Features, Milestones:** every ID and
  brief path through `RefLink` or `LinkedText`.

`KanbanItemCard`, `TaskKanbanCard`, and `StatusTimelineFeed` gain an
optional `href` prop for the title, and `KanbanItemCard` an optional
`tagHref` for its tag; each header comment adds that change.

Every ID outside a title is linked too, with no exemptions in the link
test: the milestone tag on each Board card (including Done cards) links to
its milestone page, as do the Roadmap group headings and the risk-matrix
cells (to risk pages). The `ExportStamp` milestone is a hidden Pagefind
filter attribute, not page text, so it is unchanged.
Only the title link carries `data-item`, so a click on the tag navigates
and never opens the popup.

### Client behaviour (`src/scripts/plan.ts`, loaded by one `<script>` in a `PlanInteractions.astro` placed on Board and Roadmap)

- **Popup:** a click on `a[data-item]` with no modifier (no ctrl, meta,
  shift, alt; primary button) calls `preventDefault`, copies the matching
  `<template>` into the dialog, sets `Open page` to the link's `href`, and
  calls `showModal()`. Escape and the close button close it; focus returns
  to the card link. Any other click falls through to the browser.
- **Collapse:** each Board column header has a `<button aria-expanded
  aria-controls>`. A collapsed column becomes a narrow strip (about 3rem)
  showing its name and count vertically, and the other columns take the
  space. State is one `localStorage` key, `pm-docs-site:board:collapsed`,
  holding the collapsed column names; it is applied before first paint (an
  inline script in the page head) so a collapsed Done does not flash open.
  Without JavaScript or storage, every column is expanded.

### Full width (user decision, 2026-11-17: every page)

The integration adds a package stylesheet to Starlight's `customCss` that
sets `--sl-content-width: 100%` for every page, replacing the Board's
page-local rule. Plan pages set `tableOfContents: false`; repository docs
pages keep their table of contents beside the wider content.

### Tests

- **Unit (`bun test`):** `linkify` (known, unknown, adjacent, and
  word-boundary IDs, e.g. `M10` versus `M1`), `targets` (views off remove
  `href`), and `references` (each relation, deduplication, no self-links).
- **Link test (`bun test`):** builds the fixture once, walks every
  `dist/**/*.html` with Bun's built-in `HTMLRewriter` inside Starlight's
  main content (`main`), and checks Done when 1 and 2. Known IDs come from
  the fixture `planning.json`.
- **Browser (`bun run test:browser`):** `@playwright/test` with Chromium,
  pinned exactly as a dev dependency, serving the fixture's `dist/` with a
  small static server under `test/` (no new dependency). Checks Done when 3
  and 4.
- **Parity:** `expected-pages.txt` gains `plan/risks/rk-<n>/index.html` for
  each open and closed fixture risk. It is regenerated by hand, as R-008
  decided for a deliberate page addition.

### Repository wiring

- `justfile` `package-test`: adds `bunx playwright install chromium` and
  `bun run test:browser`. Sh recipes only; no shell setting.
- `.github/workflows/ci.yml` package job: installs Chromium with
  `npx playwright install --with-deps chromium` and runs the browser tests.

## Decided by the user

- Approach A: build-time index, inline popup templates, one small script
  (2026-11-17).
- The popup, collapsible columns, and full width belong to R-009, which
  widens its Done when and its size (2026-11-17).
- One page per risk (2026-11-17).
- Every page is full width, docs pages included (2026-11-17).
- Board and Roadmap cards open a popup whose detail links to the page,
  with ctrl-click opening the page in a new tab (2026-11-17).
- Any Board column collapses, Done included, remembered in `localStorage`
  (2026-11-17).

## Calls made in design (correct any)

- A page's own ID in its title is not linked to itself.
- Every column collapses, not only Done; one storage key for the site.
- Playwright with Chromium only, as an exact-pinned dev dependency; this
  adds a browser download to CI.
- Risk pages are core pages, not a switchable view, and are not listed in
  the sidebar.
- `Linked from` is always present, with an empty-state line.
- Plan pages drop the right-hand table of contents; docs pages keep it.
- Removed risks have no page; they link to their row on the Risks page.
- `Linked from` sections and popup templates are not backlink sources, so
  `Linked from` means "what points here", not "everything connected".
- Links from index views form their own `Listed on` group (`listed`).
- The milestone tag on Board cards and the other non-title IDs are links;
  the link test has no field exemptions.

## Left to the builder

- The exact HTML of the collapsed strip and the popup layout, within the
  existing `components.css` style.
- Whether the link test shares one fixture build with the parity test.
- The static server's implementation for the browser tests.
- How the pre-paint collapse script is injected (Starlight `head` or the
  page).
