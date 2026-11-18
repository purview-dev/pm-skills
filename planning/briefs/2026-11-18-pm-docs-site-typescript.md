# pm-docs-site package in TypeScript only

- Status: on roadmap (R-021), active
- Origin: planning/inbox/2026-11-18-0925-pm-docs-site-mjs-to-typescript.md
- Updated: 2026-11-18

## Problem

- The user's rule (2026-11-18): TypeScript only (`.mts`/`.ts`/`.tsx`, run with Bun), never `.js` or `.mjs`. The `@purview-dev/pm-docs-site` package still has ten JavaScript files, and R-017 Docs-site package: in-repo dev hydrates cannot add its helper until the package can load TypeScript.

## Who and evidence

- The maintainer, building R-017 and every later package item; consumers only through how they run the package.
- `git ls-files` in `packages/pm-docs-site`: `cli.mjs`, `index.mjs`, `lib/options.mjs`, `lib/repo-docs.mjs`, `lib/schema-version.mjs`, `lib/sidebar.mjs`, `lib/site-options.mjs`, `scripts/check-exports.mjs`, `test/browser/serve.mjs`, `test/fixtures/site/astro.config.mjs` (all `// @ts-check`).
- The package runs under Node: `cli.mjs` has `#!/usr/bin/env node`, `test/helpers.ts` and `test/browser/dev-server.ts` spawn `node`, and `engines` is `node >=22`.
- Node refuses `.ts` under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`); Bun loads it (scratch check, 2026-11-18). `docs-site/package.json` runs `astro dev`/`astro build`, which `bunx` starts under Node unless `--bun` is passed.

## Original idea

The user's rule (2026-11-18): TypeScript always, never JavaScript. The package still has ten JavaScript files: `index.mjs`, `cli.mjs`, `lib/options.mjs`, `lib/repo-docs.mjs`, `lib/schema-version.mjs`, `lib/sidebar.mjs`, `lib/site-options.mjs`, `scripts/check-exports.mjs`, `test/browser/serve.mjs`, and `test/fixtures/site/astro.config.mjs` (all `// @ts-check`). R-010 edits `index.mjs` in place and adds only `.ts`/`.tsx`. Converting the rest needs a decision: Node refuses to strip types from files under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), so a published `cli.ts`/`index.ts` needs a build step that emits JavaScript into the tarball (and `files`, `exports`, `bin`, the packed-install test, and `check-exports` change with it), or a supported loader. The repository's own `scripts/` are already `.ts` run by Bun.

## Proposal

- Convert all ten JavaScript files to TypeScript source: `cli.ts`, `index.ts`, `lib/*.ts`, `scripts/check-exports.ts`, `test/browser/serve.ts`, and the fixture's `astro.config.ts`.
- A build step (`tsc` or `bun build`, the design picks) emits the Node-loaded entry points (`cli`, `index`, `lib/`) as JavaScript with declarations into the tarball; the hand-written `index.d.ts` is replaced by emitted declarations.
- `src/` (pages, components, islands) stays as it is: Vite already transpiles it from `node_modules`.
- `exports`, `bin`, `files`, `check-exports`, the packed-install test, `just package-test`, and `publish-pm-docs-site.yml` build before they test or publish; Node consumers keep working unchanged.
- M1 Reproducible docs site's exit criterion names `astro.config.ts` instead of `astro.config.mjs`.

## Alternatives considered

- **Do nothing** (effort none). Benefit: no work. Cost: R-017 Docs-site package: in-repo dev hydrates stays blocked and the package breaks the TypeScript-only rule.
- **Run under Bun, ship `.ts` (recommended, M).** Rename the ten files to `.ts`/`.mts`; `cli.ts` gets `#!/usr/bin/env bun`; `exports` and `bin` point at the `.ts` files, and `index.d.ts` goes (types come from source); tests and the dev server spawn `bun`; `engines` and the README require Bun; the fixture config becomes `astro.config.ts`. Benefit: no build step, source equals what ships. Cost: every consumer needs Bun and must start Astro under it (`bun --bun astro …` or the `pm-docs-site` CLI). Strongest argument against: a consumer that runs plain `astro build` under Node gets `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` at config load, before any of the package's own messages can explain it.
- **Build step emitting JavaScript (M).** Source in `.ts`, `tsc` or `bun build` writes `dist/` into the tarball; `files`, `exports`, `bin`, `check-exports`, and the packed-install test change. Benefit: Node consumers keep working. Cost: a build step and generated JavaScript in every release, which the Out of scope line "Non-Bun tooling" says v1 does not need.
- Evidence for the Bun route (spike, 2026-11-18): `bun --bun ./cli.mjs build test/fixtures/site` built 40 pages in 5 s, exit 0; Bun imports `.ts` from `node_modules`.

## Challenges and answers

- 2026-11-18 Decided before shaping (user, R-017 design): TypeScript only, run with Bun; the conversion is its own roadmap item before R-017 Docs-site package: in-repo dev hydrates. Rejected: an `index.mjs`-side plugin, a Bun switch inside R-017.
- 2026-11-18 Challenge: under Bun only, a consumer running plain `astro build` under Node fails with a raw type-stripping error; a build step keeps Node working. Answer (user): "perhaps js is better - ignore the typescript ONLY, but be typescript STRONGLY preferred". The rule is now TypeScript strongly preferred, with JavaScript allowed where the runtime needs it; the Bun-only route is no longer required.
- 2026-11-18 Scope (user): everything, via a build step (M). Rejected: converting only the non-published files (S); keeping it parked.
- 2026-11-18 Challenge (strongest argument against): a build step means every release ships generated JavaScript and adds a stage that can drift from source; the packed-install test and `check-exports` must run against the built tarball, not the source, or a broken emit ships. Mitigation: build in `prepublishOnly`, `just package-test`, and the publish workflow, and keep the packed-install test running the tarball under `node`.
- 2026-11-18 Assumption: TypeScript 6 (`devDependencies`) rewrites `.ts` import specifiers to `.js` on emit (`rewriteRelativeImportExtensions`), so source imports stay `.ts`. Signal it is wrong: emitted files import `.ts` and Node fails to resolve them in the packed-install test.
- 2026-11-18 Challenge: M1 Reproducible docs site's exit criterion names `astro.config.mjs`. Answer (user): consumer and fixture Astro configs become `astro.config.ts`; the exit criterion changes with it.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | none found | none |
| Security and privacy | none found | none |
| Performance | No runtime change; `just package-test` and the publish workflow gain a build of a few seconds. | none |
| User experience | Node consumers unchanged; the import path stays `@purview-dev/pm-docs-site`. New sites use `astro.config.ts`. | The README shows `astro.config.ts`. |
| Operations and cost | `publish-pm-docs-site.yml` must build before `npm publish` and `check-exports`; a missed build publishes a broken tarball. GBP 0. | `scripts/workflows.test.ts` pins the build step. |
| Maintenance | Emitted output must stay out of git and in the tarball; source and published files differ. | Gitignore the emit folder; `files` lists it; the packed-install test runs the tarball under `node`. |
| Dependencies | R-017 Docs-site package: in-repo dev hydrates depends on it. R-019 Docs-site package: consumer-ready for 1.0.0 edits `cli.mjs` and `lib/*.mjs`, so it lands after this to avoid churn. R-013 Docs-site package: publish and migrate moves `docs-site/` to `astro.config.ts`. | Order Next accordingly. |
| Reversibility | High: one revert restores the `.mjs` files. | none |

## Done when

- `git ls-files packages/pm-docs-site` lists no `.js`, `.mjs`, or `.cjs` file.
- The package build emits JavaScript and declarations for `cli`, `index`, and `lib/`, and the packed tarball contains them and no `.ts` entry point that Node loads.
- The packed-install test runs the installed CLI with `node` and passes, and `just package-test` passes.
- The fixture site uses `astro.config.ts`, and `publish-pm-docs-site.yml` builds before `check-exports` and `npm publish`, pinned by `scripts/workflows.test.ts`.

## Size and slicing

- M, one item. Serves V4; Milestone M1 Reproducible docs site; Owner agent; Depends on none.

## Open questions

- None.

## Decision

- 2026-11-18 Added to Next (top) as R-021 Docs-site package: TypeScript source with a build step (agent, M, serves V4, M1). R-017 Docs-site package: in-repo dev hydrates and R-019 Docs-site package: consumer-ready for 1.0.0 depend on it; R-019 moved to the top of Later. Why: the user chose a build step so the source is TypeScript and Node consumers keep working.
