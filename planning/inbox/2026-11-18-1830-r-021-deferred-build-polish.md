# R-021 deferred build and docs polish

- Captured: 2026-11-18 18:30
- Source: agent (R-021 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site
- Context: R-021 execute
- Discuss: no
- Related: none
- Brief: planning/briefs/2026-11-18-pm-docs-site-typescript.md
- Reviewed: never

## Idea

Minor findings from R-021's final review, deferred:

- `tsconfig.build.json` sets `types: ["node"]`, but `@types/node` arrives only through `@types/bun`; add it to `devDependencies` so a lockfile change cannot break `prepack`.
- `scripts/build.ts` rewrites `.ts` specifiers only in the top level of `dist/`, and the install-test guard reads only the top level; a nested `lib/` folder would escape both (use `readdirSync(..., { recursive: true })`).
- `scripts/check-exports.ts` rejects valid `.mjs`/`.cjs` entry points and accepts a `.d.ts` outside a `types` condition.
- Shipped `src/` type-imports `../lib/types.ts`, which the tarball omits (runtime unaffected); ship it or note why not.
- The `astro.config.ts` examples in `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md` are fenced as `js`.
- `README.md:69` and `.config/purview-docs.yml:23` say `0.1.0-pre.1` is on npm; stale once `0.1.0-pre.2` publishes.

## Links

- docs/superpowers/specs/2026-11-18-docs-site-package-typescript-design.md
- docs/superpowers/plans/2026-11-18-docs-site-package-typescript.md
