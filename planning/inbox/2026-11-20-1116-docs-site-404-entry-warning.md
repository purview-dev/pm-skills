# Docs-site build warns docs 404 entry missing

- Captured: 2026-11-20 11:16
- Source: agent (R-019 execute)
- Kind: improvement
- Affects: packages/pm-docs-site/src/content.config.ts
- Context: R-019 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Every pm-docs-site build, with or without the `docs` option, logs `[WARN] [content] Entry docs → 404 was not found.` while rendering /404.html: Starlight's 404 route calls `getEntry('docs', '404')` and falls back to its built-in page when the entry is missing. R-019 removed the missing-folder and empty-collection warnings but not this one. A `404` entry in the docs collection, or Starlight's `disable404Route` with the package's own 404 page, would remove it; check that a `404` entry is not also routed as /404/.
