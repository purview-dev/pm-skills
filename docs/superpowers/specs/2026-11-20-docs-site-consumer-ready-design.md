# R-019 Docs-site package: consumer-ready for 1.0.0 — design

- Item: R-019 Docs-site package: consumer-ready for 1.0.0 (Serves V4, Milestone M1)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md`
- Size: a small change (short design)
- Approved: 2026-11-20

## Intent

A consumer who installs `@purview-dev/pm-docs-site` sees nothing that belongs
to this repository, gets no spurious warnings, no dead links, readable
fallbacks instead of bare keys, and a CLI that says what it ignores and why
it fails. These are the five inbox findings from the R-008 and R-009 final
reviews, folded into the item's `Done when`.

## Goals

Every check in R-019's `Done when`, each covered by a test:

1. The package home page has no `just docs-preview`.
2. A build without the `docs` option logs no Starlight missing-folder or
   empty-collection warning.
3. `docsHref` returns no link for a spec or plan path no docs source maps,
   and honours a source `prefix`.
4. RefLink prints fallback text (the entry title, "No milestone") for an
   unknown key.
5. `linkify` uses the link scanner's boundaries, so an ID inside a path is
   not linked.
6. The CLI warns when `--title` or `--planning` is ignored.
7. A `planning.json` holding `null` prints the pm-export hint.
8. `check` loads an `astro.config.ts` on the `engines` Node floor.
9. The README names the same-drive requirement on Windows.

## Non-goals

- Build hardening (R-027) and accessibility, timeline, and empty-card fixes
  (R-028).
- Publishing (R-013).
- Any change to the export schema or `schemaVersion`.

## Current state (2026-11-20)

- Goal 3 is already implemented: `docsHref` (`src/lib/planning.ts`) looks a
  path up in `docsPages()`, built from the configured sources through
  `pagesOf`/`pageId`, and `pageId` applies the source `prefix`. Only a test
  through a prefixed source is missing.
- Goal 8 is already met by R-021: `engines.node` is `>=24`, and Node 24 strips
  erasable TypeScript natively. Only a test that pins it is missing.

## Approaches

- **Chosen: targeted fixes in place.** Each finding is fixed where it lives,
  with one test each; the `linkify` boundary becomes one shared constant.
- Rejected: rewriting references around the scanner (out of scope; the
  scanner is a test helper and the boundary is the only shared rule).
- Rejected: turning ignored flags into errors (the `Done when` asks for a
  warning, and a config file is the documented way to set options).

## Design

- **Home (goal 1):** `src/pages/index.astro` says the search covers every
  page "once the site is built (`pm-docs-site build`)" instead of
  `just docs-preview`.
- **Docs collection (goal 2):** `src/content.config.ts` uses an empty inline
  loader (`loader: () => []`) when `config.docs` is null, instead of
  Starlight's `docsLoader()`. A build test asserts the output has neither
  Starlight warning.
- **docsHref (goal 3):** a test builds `docsPages` from a source with
  `prefix` and checks `docsHref` returns the prefixed URL, and `null` for an
  unmapped `docs/superpowers/plans/...` path.
- **RefLink (goal 4):** `src/components/RefLink.astro` takes an optional
  `fallback` prop, printed when the key has no target. `log.astro` passes the
  entry title; the milestone RefLinks (`roadmap.astro`, `FeatureSummary.astro`,
  `FeatureTable.astro`) pass `No milestone` for the `none` key. The fallback
  choice is a pure function so it is unit-tested.
- **linkify (goal 5):** `src/lib/references.ts` exports the boundary pattern
  (lookbehind `(?<![\w/-])`, lookahead `(?![\w-])`) and uses it for IDs and
  brief paths; `test/scan.ts` imports the same constant. A test shows
  `docs/plans/R-009-x.md` yields no link.
- **Ignored flags (goal 6):** `lib/site-options.ts` warns once per flag given
  while a config file exists: `pm-docs-site: --title is ignored: <config file>
  sets the options.` A CLI test checks stderr.
- **Null export (goal 7):** anything that is not a JSON object throws
  `PlanningExportError` (which appends the pm-export hint), in both
  `loadPlanning` and the CLI's `check`. Tests cover `null` and an array.
- **Node floor (goal 8):** a test asserts `engines.node` is `>=24` and the
  existing `check` test loads an `astro.config.ts` under Node; the README's
  "erasable TypeScript" note stays.
- **README (goal 9):** one line in `packages/pm-docs-site/README.md`: on
  Windows the site and the package must be on the same drive; a package linked
  from another drive fails the build.

## Left to the builder

- Exact test file placement (existing `cli.test.ts`, `planning.test.ts`,
  `references.test.ts`, `build.test.ts` preferred).
- Wording of the README line and warnings, within the text above.
