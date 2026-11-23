# ADR-006 Mermaid renders at build time with Pele

- Status: proposed
- Date: 2026-11-23
- Category: architecture
- Supersedes: none
- Item: R-013
- Source: none

## Context

The wiki pages `docs-site/` serves hold 12 Mermaid fences that render as code blocks. Diagrams too small for LikeC4 need a light option, and builds must stay byte-identical. The user chose Pele (<https://hideoo.dev/notes/starlight-add-mermaid-diagrams-using-pele>). Spec: `docs/superpowers/specs/2026-11-23-docs-site-package-publish-and-migrate-design.md`.

## Decision

`@purview-dev/pm-docs-site` renders every ```` ```mermaid ```` fence to inline SVG at build time with Pele, through a Sätteri mdast plugin, or a remark plugin on Astro's default processor if Sätteri does not work with the pinned Astro. Pele's CSS variables map to Starlight's for light and dark mode. A fence that does not parse fails the build and names the file. It applies wherever the package renders Markdown, including ADR sections (ADR-002).

## Alternatives

- Client-side `mermaid` script: adds JavaScript to every page and breaks build determinism.
- `rehype-mermaid`: needs a headless browser (Playwright) at build time.
- Do nothing: diagrams stay code blocks.

## Consequences

- No browser and no client JavaScript for diagrams.
- `pele`, `satteri`, and `@astrojs/markdown-satteri` become exact-pinned package dependencies.
- A diagram type Pele cannot render is rewritten, never rendered in the browser.
