# ADR-011 ADR page references come from rendered HTML

- Status: accepted
- Date: 2026-11-25
- Category: architecture
- Supersedes: none
- Item: R-040
- Source: none

## Context

The docs site links the IDs in an ADR page's rendered HTML with
`linkHtml`, but builds that page's Linked from entries from the raw
Markdown in `planning.json` (`references()` through `linkify`). The two
texts differ, so `_R-012_` gives a link with no Linked from entry, and
`[R-012](url)` or image alt text gives a Linked from entry with no link.

## Decision

`linkHtml` returns the keys it linked as well as the HTML. `siteRefs()`
becomes async: it reads the `adrs` content collection once, and
`references()` takes those keys for each ADR page in place of the
raw-Markdown prose pass over the four sections. Every caller awaits
`siteRefs()`.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| References from the rendered HTML, `siteRefs()` async | Links and Linked from entries share one source; ten callers change | Chosen |
| Strip Markdown syntax before `linkify` | Synchronous and one file, but a regex imitation of rendering that drifts again on autolinks, inline HTML, or footnotes | Rejected |
| Render Markdown inside `references()` with its own parser | A new dependency, against ADR-002 | Rejected |
| Do nothing | Links and Linked from entries keep disagreeing on emphasis, links, and images | Rejected |

## Consequences

- An ADR page's links and its targets' Linked from entries come from the
  same HTML, so they cannot disagree.
- Ten callers change from `siteRefs()` to `await siteRefs()`; the cache
  holds a promise.
- Follows ADR-002 ADR sections export as Markdown text and ADR-005 Docs
  sites consume the pm-docs-site package.
