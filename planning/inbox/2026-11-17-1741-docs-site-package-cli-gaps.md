# Docs-site package CLI and README gaps

- Captured: 2026-11-17 17:41
- Source: agent (R-008 execute, final review)
- Kind: improvement
- Affects: packages/pm-docs-site/cli.mjs
- Context: R-008 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Gaps left in the R-008 package CLI, for R-013 before publishing: `pm-docs-site dev` has no automated test (smoke-tested by hand only); `--title` and `--planning` are ignored without a warning when the site has an `astro.config.*`; `check` imports an `astro.config.ts` or `.mts` with plain Node `import()`, which needs Node 22.18 or later while `engines` says `>=22`; a `planning.json` containing `null` gives a TypeError without the pm-export hint; and the README does not say the site and the package must be on the same Windows drive (a symlinked package on another drive fails the build).

## Links

- packages/pm-docs-site/cli.mjs
- packages/pm-docs-site/lib/site-options.mjs
- packages/pm-docs-site/README.md
