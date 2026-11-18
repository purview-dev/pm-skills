# Convert the pm-docs-site package's .mjs files to TypeScript

- Captured: 2026-11-18 09:25
- Source: agent (R-010 plan)
- Kind: tech-debt
- Affects: packages/pm-docs-site
- Context: R-010 plan
- Discuss: yes
- Related: none
- Brief: none
- Reviewed: never

## Idea

The user's rule (2026-11-18): TypeScript always, never JavaScript. The package still has ten JavaScript files: `index.mjs`, `cli.mjs`, `lib/options.mjs`, `lib/repo-docs.mjs`, `lib/schema-version.mjs`, `lib/sidebar.mjs`, `lib/site-options.mjs`, `scripts/check-exports.mjs`, `test/browser/serve.mjs`, and `test/fixtures/site/astro.config.mjs` (all `// @ts-check`). R-010 edits `index.mjs` in place and adds only `.ts`/`.tsx`. Converting the rest needs a decision: Node refuses to strip types from files under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), so a published `cli.ts`/`index.ts` needs a build step that emits JavaScript into the tarball (and `files`, `exports`, `bin`, the packed-install test, and `check-exports` change with it), or a supported loader. The repository's own `scripts/` are already `.ts` run by Bun.

## Links

- packages/pm-docs-site/package.json
- packages/pm-docs-site/test/install.test.ts
