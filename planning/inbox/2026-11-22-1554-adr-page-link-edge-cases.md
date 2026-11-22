# ADR page link edge cases

- Captured: 2026-11-22 15:54
- Source: agent (R-038 final review)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site/src/lib/link-html.ts, src/lib/references.ts
- Context: R-038 finish
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

references() linkifies an ADR's raw Markdown while the ADR page links the rendered HTML, so `_R-012_` gives a link with no Linked from entry, and `[R-012](url)` or image alt text gives a Linked from entry with no link. linkHtml also splits tags on a `>` inside an attribute value (image alt text), which breaks the markup, and links IDs inside raw script and style blocks. Fix: build the ADR page's references from the rendered HTML (or have linkHtml return the keys it linked), and use the tag pattern `<(?:"[^"]*"|'[^']*'|[^'">])*>`.

## Reproduction

Add an ADR whose Context holds `_R-012_`, `[R-012](https://x)`, and `![a > R-012](x.png)`; run `pm-export write` and build the site; `test/links.test.ts` reports the mismatches and the image's alt attribute is broken.
