# R-040 ADR link and export edge cases: design

- Item: R-040 ADR link and export edge cases (Serves V4, V5; M4 Recorded technical decisions)
- Branch: `feat/r-040-adr-link-export-edge-cases`
- ADRs: writes ADR-011 ADR page references come from rendered HTML (proposed); follows ADR-002 ADR sections export as Markdown text and ADR-005 Docs sites consume the pm-docs-site package.
- Size: small change (short design)

## Intent

Close the R-038 final-review findings (inbox 2026-11-22-1554, 1555, 1556)
so an ADR page's links, its targets' Linked from lists, the export, and
the Decisions view agree with each other and with ADR-002's promise that
ADR sections export verbatim.

## Goals

1. **Links agree with Linked from.** An ADR whose Context holds
   `_R-012_`, `[R-012](https://x)`, and `![a > R-012](x.png)` renders
   links exactly where Linked from entries exist, and the image's `alt`
   attribute is intact.
2. **Comments in code survive the export.** An ADR section keeps
   `<!-- x -->` inside an inline code span or fenced code block through
   `pm-export write`.
3. **A mismatched heading cannot duplicate an ID.** `ADR-004-x.md` headed
   `# ADR-003 ...` exports as ADR-004.
4. **The Decisions view's edge states are pinned by tests.**

Non-goals: changing the export schema or `schemaVersion`; changing how
non-ADR prose is linked; new Decisions view features.

## Approaches (links)

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A. References from the rendered HTML; `siteRefs()` async | One source for links and entries; ten callers change | Chosen by the user |
| B. Strip Markdown syntax before `linkify` | Sync, one file; a regex imitation of rendering that drifts again | Rejected |
| C. Render Markdown in `references()` with its own parser | New dependency, against ADR-002 | Rejected |

Recorded as ADR-011.

## Design

### 1. Links (package, ADR-011)

- `src/lib/link-html.ts`: `linkHtml` returns `{ html, keys }`, where
  `keys` is the set of target keys it linked. Split tags with the
  attribute-safe pattern `<(?:"[^"]*"|'[^']*'|[^'">])*>`, so a `>` inside
  an attribute value (image `alt`) never splits a tag. Skip text inside
  `a`, `script`, and `style`.
- `src/lib/references.ts`: `references(planning, views, adrKeys?)` takes
  an optional `Map<adrId, Set<key>>`. When given, each ADR page's four
  sections contribute those keys as `mentions` instead of the
  raw-Markdown `prose()` pass; `source` stays on `prose()` (it is printed
  through `LinkedText`). Without it (unit tests), the current pass runs.
- `siteRefs()` becomes async: on first call it reads
  `getCollection('adrs')` (only when `planning.adrs` is not empty and the
  Decisions view is on), runs `linkHtml` over each section's HTML to
  collect keys, then builds `targets` and `references`. The cache holds
  the promise.
- Every caller (10 files: `LinkedFrom.astro`, `LinkedText.astro`,
  `RefLink.astro`, `board.astro`, `log.astro`, `roadmap.astro`,
  `decisions.astro`, `decisions/[id].astro`, `graph.astro`, `now.astro`)
  uses `await siteRefs()`. The ADR page prints `linkHtml(...).html`.

### 2. Export (skills, rules bump)

- `skills/pm-export/scripts/planning.ts`: `parseAdr` strips HTML comments
  outside code only: fenced code blocks and inline code spans keep them.
  The header fields are still parsed from comment-free text.
- `parseAdr` takes the ID from the file name. When the heading names
  another ID, it records an assumption
  (`<path> is headed <heading ID>; exported as <file ID>.`), and the
  title is the heading's text after its ID. `pm-lint`'s `adr/id` rule
  still reports the mismatch as an error; no lint change.
- The `pm-export` SKILL.md field map states both rules.
- Skills change on the unreleased 21 prerelease line: `just bump
  prerelease` (21.0.0-pre.10 to 21.0.0-pre.11); the rules marker stays 21.

### 3. Decisions view (package)

In `src/lib/decisions.ts`, `Decisions.tsx`, and `decisions.astro`:

- **All status chips off:** `decisionsQuery` writes `?status=none`, and
  `parseDecisionsQuery` reads `none` as an empty list (nothing shown,
  the empty message says `with status none`). A missing or unparseable
  `status` still falls back to the default.
- **No status:** an ADR whose `status` is null has the status `unknown`.
  An `unknown` chip appears only when such an ADR exists, pressed by
  default; `matchesDecision` filters it like the others.
- **One category:** with fewer than two categories, `parseDecisionsQuery`
  drops the `category` parameter, so nothing is filtered without a
  visible chip.
- **No JavaScript:** `decisions.astro` adds
  `<noscript><style>` that shows `[data-adr][hidden]` rows and their
  hidden sections, so every ADR, superseded included, is listed.

### 4. Tests

- `test/link-html.test.ts`: the attribute-safe split, `script` and
  `style` skipped, returned keys.
- `test/links.test.ts` (built-site link test): the fixture gains an ADR
  whose Context holds `_R-012_`, `[R-012](https://x)`, and
  `![a > R-012](x.png)`; the test passes, and the page's `img` keeps
  `alt="a > R-012"`.
- `test/references.test.ts`: ADR keys replace the prose pass when given.
- `skills/pm-export/scripts/export.test.ts`: a comment in inline code and
  in a fence survives; outside code it is stripped; `ADR-004-x.md` headed
  `# ADR-003` exports as ADR-004 with an assumption.
- `test/decisions.test.ts`: `?status=none` round-trip, the `unknown`
  status, one-category drop; a build test asserts the `noscript` style.
- `just test` and `just package-test` pass.

## Left to the builder

- Whether the fixture ADR goes in `packages/pm-docs-site/test/fixtures/planning.json`
  or a test-only fixture, as long as `planning.json` still validates.
- The package version: bump `packages/pm-docs-site/package.json` to
  `0.1.0-pre.5` so the fix publishes; the skill's minimum stays
  `0.1.0-pre.4`.
