# ADR-015 ADR page references come from adr-sections

- Status: accepted
- Date: 2026-11-26
- Category: architecture
- Supersedes: ADR-011
- Item: R-058
- Source: none

## Context

Every non-empty ADR section is rendered twice per build: the `adrs`
loader renders it so `siteRefs()` can collect the Linked from keys
(ADR-011), and the `adr-sections` loader renders it again for the page
(ADR-012), Mermaid included.

## Decision

The `adrs` collection holds the ADR as exported and renders nothing. The
ADR page reads a missing (`null`) or empty (`''`) section from the
Markdown. `siteRefs()` reads the `adr-sections` collection once and
collects the `linkHtml` keys from each entry's `rendered.html`, so a
page's links and its Linked from entries still come from the same
rendered HTML.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Render only in `adr-sections`; `siteRefs()` reads its `rendered.html` | One render per section, no cache; supersedes ADR-011 | Chosen |
| Memoise `renderMarkdown` per section, shared by both loaders | Keeps ADR-011; a module cache that grows in dev, and two copies of the HTML | Rejected |
| Do nothing | Two renders per section, Mermaid included | Rejected |

## Consequences

- Each ADR section is rendered once per build.
- `RenderedAdr`'s `html` field goes.
- `adr-sections` is empty when the Decisions view is off, and
  `siteRefs()` already skips ADR keys then.
- Follows ADR-002 ADR sections export as Markdown text, ADR-006 Mermaid
  renders at build time with Pele, and ADR-012 The site reads image files
  beside an ADR.
