# ADR relative images render unresolved

- Captured: 2026-11-25 09:31
- Source: agent (R-040 execute)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site/src/routes/plan/decisions/[id].astro
- Context: R-040 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

An ADR section with a relative image (`![a](x.png)`) renders as `<img __ASTRO_IMAGE_="{...}">` on the ADR page: the loader's renderMarkdown leaves an image placeholder that only Astro's render() resolves, and the page prints the HTML with set:html, so the image never shows. Remote image URLs render as plain img tags.

## Reproduction

Add `![a](x.png)` to an ADR section, build the docs site, and open the ADR page: the img tag has no src. Every time. Evidence: R-040 links.test.ts build output.

## Links

- packages/pm-docs-site/src/loaders/adrs.ts
