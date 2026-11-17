# Docs-site package shows repository-only text

- Captured: 2026-11-17 17:41
- Source: agent (R-008 execute, final review)
- Kind: improvement
- Affects: packages/pm-docs-site/src/pages/index.astro
- Context: R-008 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Two things a package consumer sees that belong to this repository: the home page tells the reader to run `just docs-preview`, a recipe in this repository's justfile only (inherited from the templates); and every build without the `docs` option logs Starlight's warning that `node_modules/@purview-dev/pm-docs-site/src/content/docs/` does not exist, plus an empty-collection warning. Use consumer-neutral text, and an empty inline loader instead of Starlight's `docsLoader()` when `docs` is omitted.

## Links

- packages/pm-docs-site/src/pages/index.astro
- packages/pm-docs-site/src/content.config.ts
