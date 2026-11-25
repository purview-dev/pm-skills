# ADR image review minors from R-050

- Captured: 2026-11-25 14:17
- Source: agent (R-050 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/src/loaders/adrs.ts, packages/pm-docs-site/test/integration.test.ts
- Context: R-050 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Two minors deferred from R-050's final review. (1) No test pins a remote ADR image staying a plain img with its src; a consumer who sets Astro `image.domains` would get it optimised and its src rewritten. Append `![r](https://example.com/r.png)` to the existing relative-image test and assert `src="https://example.com/r.png"`. (2) Every non-empty ADR section is rendered twice per build (the `adrs` html and the `adr-sections` entry), Mermaid included; share one memoised render per section.

## Links

- docs/superpowers/specs/2026-11-25-adr-relative-images-design.md
