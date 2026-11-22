# R-038 ADR export and Decisions view: design

- Item: R-038 ADR export and Decisions view (M4 Recorded technical
  decisions, serves V5)
- Brief: `planning/briefs/2026-11-22-where-do-adrs-fit.md`
- Follows: `docs/superpowers/specs/2026-11-22-adr-record-design.md`
  (R-033, slice 1), section 7 and Follow-ups
- ADRs: ADR-001 ADRs live in the PM root (accepted, followed),
  ADR-002 ADR sections export as Markdown text (new, this spec)
- Branch: `feat/r-038-adr-export-and-decisions-view`

## Intent

R-033 made ADRs PM state in `<PM root>/decisions/`, owned by `pm-adr` and
linted by `pm-lint`. They are still only files. This slice makes them
findable: `pm-export` puts every ADR, whole, into `planning.json`, and the
`@purview-dev/pm-docs-site` package shows them in a Decisions view with
search and filters, one page per ADR, and the ADRs of an item on its
feature page. The why is the brief's problem: technical decisions were not
findable later, by the user or by an agent.

## Goals

- `planning.json` carries `adrs` at `schemaVersion` 5, each ADR with its
  header fields and its four sections as Markdown text.
- A Decisions view (React island) lists ADRs with text search, status and
  category chips, superseded hidden by default, group by category or
  status, and the state in the URL.
- One page per ADR, rendering the whole ADR, indexed by Pagefind.
- Feature pages list the ADRs whose `Item` names them.
- `ADR-NNN` in any rendered text links to its page.
- The demo has ADRs that fill the view.

## Non-goals (this slice)

- ADRs in the other PM skills (`pm-shape`, `pm-review`, `pm-status`, and
  the rest): R-039 ADRs across the PM skills.
- A Decisions view in the copied templates (`skills/pm-docs-site/templates/`):
  `Not doing` in `planning/STRATEGY.md` freezes them, so they only move to
  `schemaVersion` 5.
- ADR counts in `counts`: R-039 (`pm-status` counts ADRs by status).
- Parsing a spec's ADR IDs: R-039 (`pm-checkpoint` `done`).

## Anti-goals

- The site reading `decisions/` directly. The **Docs site** reads the
  **Export file** only.
- A partial ADR page (header and first line only): the user chose the whole
  ADR (2026-11-22).
- A Markdown parser inside the dependency-free exporter.

## Decisions made with the user

- 2026-11-22 An ADR page shows the whole ADR, not a summary. Search finds
  words in the reasoning, not only titles.
- 2026-11-22 Approach A: each section exported as Markdown text and
  rendered at build time (ADR-002).

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A. Each section as Markdown text, rendered by the site at build time with Astro's configured Markdown processor | Bigger export; the schema checks only that a section is a string; no new dependency (a content loader's `renderMarkdown`) | Chosen by the user |
| B. Sections parsed into structured blocks (paragraphs, bullets, table rows) in the export | Every part schema-checked, no Markdown dependency in the site; needs a Markdown parser in the dependency-free exporter, a much larger schema, and loses what the parser does not model | Rejected |
| C. Export the header and path only; the site reads the ADR file | Breaks the rule that the site reads the export only | Dropped |

## Design

### 1. Export (`skills/pm-export`)

`scripts/planning.ts`:

- `SCHEMA_VERSION = 5` (and the header comment).
- `adrs`: `folder("decisions")` (README excluded, by file name), keeping
  only files named `ADR-NNN-<slug>.md`. Per file: `sections(text, 2)`, the
  header `fields(...)` from the first part, and each section's body with
  comments stripped and surrounding blank lines trimmed, verbatim
  otherwise.
- Ordered by ID number ascending, with a numeric sort (`folder()` sorts
  by file name).
- The four section keys allow `null`: `pm-lint` `adr/sections` requires
  all four, but the exporter does not require a clean lint (builder's
  call).

ADR object (all keys present; a missing value is `null`):

| Key | Source |
| --- | --- |
| `id` | `ADR-NNN` from the level-1 heading (file name as fallback) |
| `path` | `<pmRoot>decisions/<file>` |
| `title` | the level-1 heading without the ID |
| `status` | `proposed`, `accepted`, `deprecated`, or `superseded` |
| `supersededBy` | the ID in `superseded by ADR-NNN`, else `null` |
| `date` | `Date` |
| `category` | `Category`, lower-cased, free text |
| `supersedes` | `Supersedes` ID, `none` as `null` |
| `item` | `Item` ID, `none` as `null` |
| `source` | `Source`, `none` as `null` |
| `context`, `decision`, `alternatives`, `consequences` | the section's Markdown, `""` when empty, `null` when the heading is missing |

`references/planning.schema.json`: `schemaVersion` const 5; `adrs`
required at the top level, `type: array` of `$defs/adr` (the keys above,
`additionalProperties: false`, ID patterns `^ADR-\d{3,}$` and
`^R-\d{3,}$`, `status` enum). `references/planning.example.json` gains two
ADRs (one superseding the other). `SKILL.md`: the field-map row for
`adrs`, the ADR object, and `decisions/` in the inputs of `write`.

The export's existing `strategy.decisions` (product decisions) keeps its
name; `adrs` is distinct.

Tests: `export.test.ts` asserts `schemaVersion` 5 and the ADRs of the
fixture. `scripts/__fixtures__/repo/planning/decisions/` gains a README and
two ADRs (accepted, and one superseded by it, one with a table in
`Alternatives`), which lint clean (`lint.test.ts` requires the fixture to).

### 2. Package (`packages/pm-docs-site`)

- **Version:** `lib/schema-version.ts` `SUPPORTED_SCHEMA_VERSIONS = [5]`.
  The tests that use 5 as "unsupported" use 6. `src/lib/planning-types.ts`:
  `schemaVersion: 5`, `Adr` type, `adrs: Adr[]`. The package version moves
  to the next prerelease (`0.1.0-pre.3`). `test/cli.test.ts` and
  `test/schema-version.test.ts` move their supported value to 5 and their
  unsupported value to 6. The README view list gains Decisions.
- **View:** `decisions` added to `ViewName` (`lib/types.ts`),
  `VIEW_NAMES` (`lib/options.ts`), and `VIEW_ROUTES` (`lib/index.ts`):
  `/plan/decisions` from `src/routes/plan/decisions.astro` and
  `/plan/decisions/[id]` from `src/routes/plan/decisions/[id].astro`. On by
  default like the other optional views. The sidebar shows `Decisions`
  whenever the view is on (`lib/sidebar.ts` sees the options only, not
  `planning.json`, as for Briefs); the page shows an empty state when
  `adrs` is empty, as `briefs.astro` does (call).
- **Decisions island** (`src/components/decisions/Decisions.tsx`,
  `client:load`, `data-pagefind-ignore`):
  - Text search box over ID, title, category, and the four sections'
    plain text, case-insensitive, all words must match.
  - Status chips (proposed, accepted, deprecated, superseded) and category
    chips (from the data), multi-select; `superseded` off by default.
  - Group by: category (default), status, or none; groups ordered by name,
    status in lifecycle order.
  - Each row: `ADR-NNN Title` linked to its page, status badge, category,
    date, and the item as a named reference; a superseded row names its
    successor.
  - Clear button; an empty state that names the active filters.
  - URL state like the Board: pure `parseDecisionsQuery` and
    `decisionsQuery` in `src/lib/decisions.ts` (keys `q`, `status`,
    `category`, `group`), a `useDecisionsUrlState` hook (default on SSR,
    parse on mount, `history.replaceState`). The default state writes no
    query.
  - The page renders the full list server-side inside the island's
    fallback, so the list is readable without JavaScript.
- **ADR page** (`decisions/[id].astro`): `getStaticPaths` from `adrs`;
  `ExportStamp kind="ADR"` (Pagefind filters Kind ADR and State status);
  header fields with named references for `item`, `supersedes`, and
  `supersededBy`; `LinkedFrom` for what links to it. A section that is
  `null` is omitted; `""` shows `None recorded.` without the `plan-empty`
  class, so `scripts/check-demo.ts` does not flag it (call).
- **Markdown rendering (call, replaces the first draft's
  `@astrojs/markdown-remark`, which Astro 7 does not install):** an `adrs`
  content collection whose loader (`src/loaders/adrs.ts`, beside
  `src/loaders/repo-docs.ts`) reads `adrs` from `planning.json` and stores
  each section with the loader's `renderMarkdown`, so ADRs use the site's
  configured Markdown processor and add no dependency or lockfile change.
  The ADR page renders the stored HTML.
- **Links inside rendered HTML (call):** `LinkedText` works on plain text,
  so a small pass over the rendered HTML wraps known IDs (`R-NNN`,
  `RK-NNN`, `ADR-NNN`, `M<n>`, brief paths) in links, skipping text inside
  `code`, `pre`, and `a`, so `test/links.test.ts` passes on ADR pages.
- **References:** `src/lib/references.ts` adds `ADR-\d{3,}` to `IDS` and
  the `adr` target kind (`ADR-NNN` to `/plan/decisions/adr-nnn/`), so
  `LinkedText`, `RefLink`, and `LinkedFrom` link ADRs everywhere. The
  Decisions page, each ADR page, and every page that renders a feature's
  Decisions list (feature pages, and Board and Roadmap through
  `ItemDetail`) are registered as sources in `references()`, so
  `LinkedFrom` agrees with the links each page really has.
- **Feature pages:** `adrsOf(planning, id)` in `src/lib/planning.ts`
  beside `dependents()`; `FeatureSummary.astro` lists them under
  `Decisions` (named reference and status) when there are any. Because
  `ItemDetail` reuses `FeatureSummary`, the list also shows in the Board
  and Roadmap item details (call).
- **Tests** (`bun test`): query parse and round-trip, filter and group
  functions, superseded hidden by default, `adrsOf`, the `adr` reference
  kind, the Markdown rendering of a table section, and the fixture
  (`test/fixtures/planning.json` at 5 with ADRs, `expected-pages.txt` with
  the ADR pages). `test/links.test.ts` gains `decisions` in `ALL_VIEWS`
  and in the `TARGET_PAGE` pattern. A browser test (`test/browser/`) types a search, toggles
  a chip, reloads, and finds the same state.

### 3. Templates and `docs-site/` (version only)

`skills/pm-docs-site/templates/site/src/lib/planning.ts`
`SCHEMA_VERSION = 5`; `planning-types.ts` literal 5 and the optional
`adrs` type; `__fixtures__/planning.json` at 5 with `adrs: []`;
`skills/pm-docs-site/SKILL.md` `This skill reads schemaVersion 5.`. No
view. Re-render `docs-site/` with
`bun skills/pm-docs-site/scripts/site.ts write docs-site`, and set
`"schemaVersion": 5` in `docs-site/pm-docs-site.json` by hand (a
site-owned file `scripts/validate.ts` checks against the schema).
`scripts/validate.ts` checks the schema const against 5 everywhere it
checks 4 today.

### 4. Demo

`examples/demo/planning/decisions/`: a README and four ADRs across two
categories and every status, one superseding another, linked to demo
items; one with a table. Regenerate its `planning.json`
(`bun skills/pm-export/scripts/export.ts write --frozen --root examples/demo --pm-root planning/`)
and add the pages to `examples/demo/expected-pages.txt`.

### 5. This repository

`planning/planning.json` is refreshed by the next PM commit (export on
commit) and carries ADR-001 and ADR-002.

### 6. Version and upgrade note

`main` is `21.0.0-pre.3` and `v21.0.0` is not tagged, so this skills change
stays on rules 21: `just bump prerelease` to `21.0.0-pre.4`. Extend the
`Version 21` upgrade note in the managed section: the export moves to
`schemaVersion` 5, which adds `adrs`; run `pm-export`, and
`pm-docs-site upgrade` for an installed site. Reinstall the section in
`AGENTS.md`.

## Done when

- `pm-export write` puts `adrs` in `planning/planning.json` at
  `schemaVersion` 5 with ADR-001 and ADR-002 whole, and `pm-export check`
  passes.
- `bun test` in `packages/pm-docs-site` covers the Decisions view's search,
  chips, grouping, URL state, the ADR page's rendered table, and feature
  pages listing their ADRs.
- `just demo-check` passes with the demo ADR pages built and listed.
- The templates and `docs-site/` read `schemaVersion` 5, and
  `just validate`, `just test`, `just docs-check`, and `just lint-check`
  pass.

## Follow-ups after the workflow

- `pm-item` edit R-013 Docs-site package: publish and migrate: its
  "scratch export at schemaVersion 5 fails the build" check becomes 6.
- R-037 Engineering export and docs-site view already names
  `schemaVersion` 6; no change.

## Calls made after the builder check

- Rendering through a content loader's `renderMarkdown`, not
  `@astrojs/markdown-remark` (not installed by Astro 7); ADR-002 updated.
- A link pass over rendered HTML; ADR, Decisions, and item-detail pages
  registered in `references()`.
- Sidebar shows Decisions whenever the view is on; empty state on the page.
- The feature Decisions list also shows in Board and Roadmap item details.
- `docs-site/pm-docs-site.json` hand-edited to 5; `cli.test.ts`,
  `schema-version.test.ts`, `links.test.ts`, and the README listed.
- `None recorded.` without `plan-empty`; section keys allow `null`.

## Left to the builder

- Exact component markup and styles, within the Board's conventions.
- Plain-text extraction for search (strip Markdown syntax simply; no
  parser needed).
- Demo ADR content.
- Where the Decisions link sits in the sidebar order (after Risks is the
  default call).
