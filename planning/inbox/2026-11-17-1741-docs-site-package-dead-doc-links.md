# Docs-site package links docs to missing pages

- Captured: 2026-11-17 17:41
- Source: agent (R-008 execute, final review)
- Kind: improvement
- Affects: packages/pm-docs-site/src/lib/planning.ts
- Context: R-008 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`docsHref` in `packages/pm-docs-site/src/lib/planning.ts` turns any `docs/<x>.md` path into `/<x>/` whatever the `docs` option holds. With `docs` omitted (the default) the Now, Log, and feature pages link specs and plans to pages that do not exist; with a source `prefix` the links miss the prefixed pages. Inherited from the templates. Resolve the link against the configured docs sources and return no link when no source maps the path; R-009's link test should catch it.

## Links

- packages/pm-docs-site/src/lib/planning.ts
- planning/briefs/2026-11-17-docs-site-package.md
