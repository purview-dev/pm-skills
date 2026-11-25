# ADR-012 The site reads image files beside an ADR

- Status: proposed
- Date: 2026-11-25
- Category: architecture
- Supersedes: none
- Item: R-050
- Source: none

## Context

An ADR section with a relative image (`![a](x.png)`) renders on its docs-site
page as an unresolved `__ASTRO_IMAGE_` placeholder: the loader's
`renderMarkdown` leaves it for Astro's `render()`, and the page prints the HTML
with `set:html`. The image file sits beside the ADR in `<PM root>/decisions/`,
and `planning.json` carries text only.

## Decision

The docs site may read the image files that an ADR section references from
`<PM root>/decisions/`, found as `decisions/<basename of adr.path>` beside the
configured `planning.json`, through Astro's image pipeline: an `adr-sections`
content collection of rendered entries with `filePath` and `assetImports`,
rendered with `render()` and linked with `linkHtml`. Every PM record is still
read only from `planning.json`. A missing image file fails the build.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Astro's image pipeline through rendered entries | Hashed, sized images and Astro's missing-file error; more moving parts, and dev may need the folder allowed | Chosen |
| Rewrite the placeholder to a copied file served by a static route | Page pipeline untouched; no optimisation; own missing-file and `../` handling | Rejected |
| Do nothing, or render the alt text only | Keeps the site export-only; fails R-050's Done when | Rejected |

## Consequences

- Relative images in ADR sections build to hashed, sized files.
- ADR-002 ADR sections export as Markdown text still holds for text; the site
  reads image files only, never a PM record, outside `planning.json`.
- Follows ADR-002 ADR sections export as Markdown text and ADR-011 ADR page
  references come from rendered HTML.
- Spec: `docs/superpowers/specs/2026-11-25-adr-relative-images-design.md`.
