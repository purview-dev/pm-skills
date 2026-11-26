# R-052 Docs-site package: brief and inbox pages

- Item: R-052 Docs-site package: brief and inbox pages (serves V4, milestone M5 Docs-site package 1.0.0)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md`
- Branch: `feat/r-052-docs-site-package-brief-and-inbox-pages`
- ADRs followed: ADR-002 ADR sections export as Markdown text, ADR-005 Docs sites consume the pm-docs-site package, ADR-006 Mermaid renders at build time with Pele, ADR-012 The site reads image files beside an ADR, ADR-015 ADR page references come from adr-sections
- ADRs written: ADR-016 Briefs and inbox files export ordered sections, ADR-017 The site reads image files beside briefs and inbox files (both `proposed`)

## Intent

`@purview-dev/pm-docs-site` must contain every PM record before 1.0.0
(user, 2026-11-23). Items, risks, and ADRs each have a page; briefs and inbox
files do not. Briefs are one section each on `/plan/briefs/`, and a link to a
brief is an anchor there. Inbox files are cards on `/plan/inbox/` and are not
link targets at all.

The user chose **full** pages (2026-11-26): a brief page shows the whole brief
(Problem through Decision and Revisions), and an inbox page the whole file
(Idea, Reproduction, Links, Notes). Today's export carries only a brief's
`problem`, `doneWhen`, and `decision` first lines and an inbox file's `idea`,
so the export changes too. SCOPE CHANGE: the item grows from S to about M.

## Goals

- One page per brief at `/plan/briefs/<slug>/` and one per inbox file at
  `/plan/inbox/<slug>/`, where `<slug>` is the file name without `.md`, lower
  case (`briefAnchor` in `src/lib/planning.ts` already computes it).
- Each page shows the record's header fields and every level-2 section of the
  file in file order, rendered as Markdown (tables, lists, code, Mermaid,
  relative images), with every known ID and path linked.
- Each page ends with `<LinkedFrom>`, and every link to it from another page
  appears there, as on item, risk, and ADR pages.
- A link to a brief anywhere on the site goes to its page; a link to an inbox
  file goes to its page.
- The Briefs and Inbox list pages stay and link each entry to its page.

## Non-goals

- The research reports view (its own M5 item).
- Changing the Briefs or Inbox list layouts beyond adding the link.
- Changing the PM file format: no `pm-lint` rule changes.

## Anti-goals

- The site reading a brief or inbox Markdown file directly. Records come from
  `planning.json` only; only image files beside them are read (ADR-017).
- A heading in a brief or inbox file that the page silently drops.
- A link on a page that is missing from its target's Linked from list, or the
  reverse.

## Approaches

Two decisions, each with the user's pick (2026-11-26).

How the export carries the sections:

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| An ordered `sections` list, `{ heading, markdown }`, on each brief and inbox entry | Every heading comes through, including optional and consumer-added ones; the schema checks only shape | Chosen |
| One named field per heading, as ADRs have | Schema names every section (11 brief, 4 inbox), but loses an unmodelled heading, as ADR-002 rejected | Rejected |
| Do nothing (summary pages from today's fields) | Size S, but a brief page adds little beyond Linked from | Rejected by the user |

How the site renders them:

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| The ADR pipeline: `brief-sections` and `inbox-sections` content collections rendered once with `renderMarkdown`, Linked from collected from the same HTML | Same fidelity and link guarantees as ADR pages; widens ADR-012's image reading to two folders | Chosen |
| Plain text through `LinkedText` | Cheaper; briefs are mostly lists and tables, which flatten | Rejected |

## Design

### Export (`skills/pm-export`)

- `briefs[]` and `inbox[]` entries gain `sections`: an array of
  `{ heading: string, markdown: string }`, one per level-2 section after the
  header block, in file order. `heading` is the heading text as written;
  `markdown` is the body without surrounding blank lines (as `sectionText`
  does for ADRs), with HTML comments stripped outside code and kept inside
  code (`stripCommentsOutsideCode`, ADR-002). An empty section is `''`.
- Every existing brief and inbox field stays, with the same values, so the
  list pages and other readers are unchanged.
- `schemaVersion` moves 5 to 6. The schema
  (`skills/pm-export/references/planning.schema.json`), its example
  (`planning.example.json`), the SKILL.md field map, and `planning.ts` change
  together (repository AGENTS.md). `export.test.ts` covers `sections` for a
  brief (with a table and `## Revisions`) and an inbox bug (with
  `## Reproduction`), including a comment inside and outside a code fence.
- Regenerate the derived exports: this repository's `planning/planning.json`
  (through the PM commit) and `examples/demo/planning/planning.json`. The
  docs-site fixture `packages/pm-docs-site/test/fixtures/planning.json` is
  hand-edited (as before): `sections` added to its briefs and inbox entries,
  then validated against the schema by `just validate`.
- Upgrade note: add a `Version 21 also moves the export to schemaVersion 6`
  paragraph to `skills/pm-setup/references/AGENTS-section.md` (run
  `pm-export`, then `pm-docs-site upgrade`; the package reads 6 from
  `0.1.0-pre.7`), reinstall the section here, and `just bump prerelease`
  (rules stay 21: `v21.0.0` is not tagged).

### Package (`packages/pm-docs-site`)

- `SUPPORTED_SCHEMA_VERSIONS` becomes `[6]` (my call: it reads 5 only today,
  and a 5 export has no sections to show). The package version moves to
  `0.1.0-pre.7`; `skills/pm-docs-site/SKILL.md` says `This skill reads
  schemaVersion 6.` and `Minimum package version: 0.1.0-pre.7`.
- `lib/planning-types.ts` adds `sections` to `Brief` and `InboxEntry`.
- Loaders: `src/loaders/adrs.ts`'s render step becomes a shared helper used
  by new `brief-sections` and `inbox-sections` collections (registered in
  `src/content.config.ts`). Entry id `<slug>/<index>`; data names the record
  and the section heading. A collection is filled only when its view is on,
  and an empty collection is never looked up (as for ADRs).
- Relative images in a section resolve against `briefs/<file>` or
  `inbox/<file>` beside the configured `planning.json` (ADR-017); a missing
  image fails the build, as for ADRs.
- Routes in `lib/index.ts`: `/plan/briefs/[slug]` with the `briefs` view and
  `/plan/inbox/[slug]` with the `inbox` view, from new
  `src/routes/plan/briefs/[slug].astro` and `src/routes/plan/inbox/[slug].astro`.
- Brief page: title `<R-NNN> <title>` (ID when the brief has one); facts
  Status (linked text), Origin, Updated, File; a link back to All briefs;
  each section as an `h2` with its rendered HTML in `<LinkedHtml>`, an empty
  one as `None recorded.`; then `<LinkedFrom ref={brief.path} />`.
- Inbox page: title; facts Captured, Source, Kind, Severity (bugs), Affects,
  Context, Discuss, Related, Brief, Reviewed, File; a link back to the Inbox;
  sections as on a brief page; then `<LinkedFrom ref={entry.file} />`.
- `src/lib/references.ts`:
  - The brief target's `href` becomes its page (`/plan/briefs/<slug>/`).
  - A new `inbox` `TargetKind`, keyed by the exported `file`, labelled with
    its title, `href` `/plan/inbox/<slug>/` when the inbox view is on.
  - `linkify` matches inbox paths as it matches brief paths.
  - Brief and inbox pages are sources: their header fields through `prose`
    and `link` (Related, Brief, Affects), their section keys from the
    rendered HTML through `siteRefs()` (as `adrKeys`, ADR-015).
  - The Inbox and Briefs list pages link each entry (`listed`). The Briefs
    list keeps its `id` anchors so old `/plan/briefs/#<slug>` links still
    land (my call).
- Search: the pages are indexed like item pages; Linked from stays
  `data-pagefind-ignore`.
- `test/fixtures/expected-pages.txt` lists the new pages.

### Tests

- `packages/pm-docs-site/test/`: a unit test of the new targets and
  backlinks in `references.test.ts`; `links.test.ts` extends its
  every-link-is-in-Linked-from check to brief and inbox targets; an
  integration test builds the fixture and asserts a brief page renders a
  table and a relative image and an inbox page renders `## Reproduction`,
  and that turning off the `briefs` or `inbox` view builds neither page.
- `just test`, `just package-test`, `just docs-check`, and `just lint-check`
  pass.

### Docs site surface

This item is the surface: two record pages and their links. The package
README documents both pages and the views that turn them on.

## Left to the builder

- Section rendering helper's exact shape and file name.
- How `Related` entries that name inbox files by bare file name (without
  the PM root) are matched, so long as the matched ones link and appear in
  Linked from.
- Facts layout details and CSS, reusing `plan-facts`.
