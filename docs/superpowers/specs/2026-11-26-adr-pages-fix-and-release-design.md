# R-058 ADR pages: fix and release

Short design (small change). Item: R-058 ADR pages: fix and release
(Serves V4, M5 Docs-site package 1.0.0). ADRs: writes ADR-015 ADR page
references come from adr-sections (supersedes ADR-011); follows ADR-002,
ADR-006, and ADR-012.

## Intent

Fix the four ADR-page review findings (26, 28, 29, 30) and release the
package as `0.1.0-pre.6`, so the ADR site ships.

## Goals and non-goals

- Goals: the four fixes, each with a test; the version bump; `just
  package-test` and `just docs-check` pass.
- Non-goals: the other R-042 Docs-site package: deferred review minors;
  any change to the export or `planning.json`.

## Changes

1. **Script and style bodies (26).** `src/lib/link-html.ts`: when a
   `script` or `style` open tag is read, copy the input unchanged up to its
   matching close tag (case-insensitive `</script` or `</style`), or to the
   end when there is none, then continue tag-splitting after it. A raw `<`
   in the body is no longer read as a tag. Test in `test/link-html.test.ts`:
   `<script>if (a<b) x='R-012'</script><p>R-013</p>` links R-013 only, and
   its keys hold only R-013.
2. **Decisions page without JavaScript (28).** `test/links.test.ts`, "the
   Decisions page": besides the noscript style, assert that every fixture
   ADR has its `data-adr="<ID>"` row in the static HTML.
3. **Remote ADR image (29).** `test/integration.test.ts`, the
   relative-image test: append `![r](https://example.com/r.png)` and
   assert its `img` has `src="https://example.com/r.png"`.
4. **One render per section (30, ADR-015).**
   - `src/loaders/adrs.ts`: `adrsLoader` stores the ADR as exported and no
     longer calls `renderMarkdown`; `RenderedAdr` and its `html` field go.
     `adrSectionsLoader` is unchanged.
   - `src/routes/plan/decisions/[id].astro`: a section is missing when its
     Markdown is `null`, empty when it is blank, otherwise its
     `adr-sections` entry is rendered as now.
   - `src/lib/site-refs.ts`: read `getCollection('adr-sections')` once and
     add `linkHtml(entry.rendered.html, known).keys` to its ADR's set
     (`entry.data.adr`). Keep the existing guard (ADRs exist and the
     Decisions view is on).
   - Test: a unit test of `adrsLoader` with a stub context whose
     `renderMarkdown` counts calls asserts zero calls, so each section is
     rendered only by `adr-sections`. The existing links tests keep
     showing that links and Linked from entries agree.
5. **Release.** `packages/pm-docs-site/package.json` `version` to
   `0.1.0-pre.6`.

## Approaches (for 30)

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Render only in `adr-sections`; `siteRefs()` reads `rendered.html` | One render, no cache; supersedes ADR-011 | Chosen by the user |
| Memoise `renderMarkdown` per section | Keeps ADR-011; module cache grows in dev; two HTML copies | Rejected |

## Left to the builder

- Whether the loader test stubs `virtual:pm-docs-site/config` and
  `loadPlanning` with Bun's module mock or exercises the loader another
  way; any form that asserts no render call in `adrsLoader` meets it.
- Whether the pinned version in the package docs or the skill's
  `Minimum package version` needs a move: run `just validate` and follow
  it.
