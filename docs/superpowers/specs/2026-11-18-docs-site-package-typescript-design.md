# Docs-site package: TypeScript source with a build step (R-021)

- Item: R-021 Docs-site package: TypeScript source with a build step
- Brief: `planning/briefs/2026-11-18-pm-docs-site-typescript.md`
- Branch: `feat/r-021-docs-site-package-typescript-source-with-a-build-step`
- Date: 2026-11-18

## Intent

The maintainer's rule is TypeScript strongly preferred, JavaScript only where
the runtime needs it. `packages/pm-docs-site` still has ten hand-written
`.mjs` files, and R-017 Docs-site package: in-repo dev hydrates waits on this
item so its helper can be TypeScript. Node refuses to strip types under
`node_modules`, so the published entry points must be JavaScript: the source
is TypeScript, and a `tsc` build emits JavaScript and declarations into the
tarball. Consumers on plain Node keep working unchanged.

## Goals

- No `.js`, `.mjs`, or `.cjs` file in `git ls-files packages/pm-docs-site`.
- `tsc` emits `dist/` (JavaScript and `.d.ts`) for `cli`, `index`, and the
  `lib/` modules; `exports` and `bin` point at `dist/`.
- The packed-install test installs the tarball and runs its CLI under `node`.
- `just package-test` passes; `publish-pm-docs-site.yml` builds before
  `check-exports` and `npm publish`, pinned by `scripts/workflows.test.ts`.
- The fixture site, and the documented consumer site, use `astro.config.ts`.

## Non-goals

- `src/` (pages, components, islands) is unchanged apart from import paths:
  Vite already compiles it from `node_modules`.
- `skills/pm-docs-site/templates/` and `references/spec.md` (the template
  site, which still uses `astro.config.mjs`). Nothing under `skills/` changes,
  so the rules version does not move.
- `docs-site/` moves to `astro.config.ts` in R-013 Docs-site package: publish
  and migrate, not here.
- No bundling: `bun build` was rejected (it still needs `tsc` for declarations,
  and bundling an Astro integration risks inlining what must stay external).

## Anti-goals

- A tarball whose `exports` or `bin` points at a `.ts` file Node loads.
- A publish that can run without a fresh build (a stale or missing `dist/`).
- Tests that only exercise the source, so a broken emit ships unnoticed.

## Approaches

1. **Move `index` and `cli` into `lib/`, emit `lib/` to `dist/` (chosen).**
   `lib/index.ts` becomes `dist/index.js`. Source and output are both one
   level below the package root, so `new URL('../src/…', import.meta.url)`
   resolves the same from either. Cost: the two entry files move.
2. **Emit beside the source** (`index.ts` next to a gitignored `index.js`). No
   paths change, but the tree fills with ignored output and a stale emit is
   easy to miss.
3. **`bun build` bundle** into `dist/`. Rejected above.

The user chose 1 (2026-11-18).

## Design

### Layout

| Before | After |
| --- | --- |
| `index.mjs`, `index.d.ts` | `lib/index.ts` (types move into it, or a `lib/types.ts` it re-exports); `index.d.ts` deleted |
| `cli.mjs` | `lib/cli.ts` (`#!/usr/bin/env node`) |
| `lib/options.mjs`, `lib/repo-docs.mjs`, `lib/schema-version.mjs`, `lib/sidebar.mjs`, `lib/site-options.mjs` | same names, `.ts` |
| `scripts/check-exports.mjs` | `scripts/check-exports.ts` |
| `test/browser/serve.mjs` | `test/browser/serve.ts` |
| `test/fixtures/site/astro.config.mjs` | `test/fixtures/site/astro.config.ts` |

- JSDoc types become TypeScript types; `// @ts-check` goes. Source uses only
  erasable syntax (`erasableSyntaxOnly`), so Node can also run it directly.
- Relative imports name the `.ts` file (`./options.ts`); `tsc` rewrites them to
  `.js` on emit (`rewriteRelativeImportExtensions`), including `cli`'s dynamic
  `import('./index.ts')`.
- `lib/index.ts` resolves its files with `../src/…` (`srcDir`, the injected
  route entrypoints, `width.css`).
- `src/lib/planning.ts`, `src/loaders/repo-docs.ts`, and `src/env.d.ts` import
  `../../lib/repo-docs.ts`, `../../lib/schema-version.ts`, and types from
  `lib/index.ts` (type-only imports).

### Build

- `tsconfig.build.json` extends `tsconfig.json`: `include: ["lib"]`,
  `rootDir: "lib"`, `outDir: "dist"`, `declaration: true`, `noEmit: false`,
  `rewriteRelativeImportExtensions: true`.
- `tsconfig.json` drops `allowJs` and `checkJs`, keeps type-checking
  everything (`bun run check`), and excludes `dist`.
- `package.json`:
  - `"build": "tsc -p tsconfig.build.json"`
  - `"prepack": "tsc -p tsconfig.build.json && node scripts/check-exports.ts"`.
    It replaces `prepublishOnly`, because npm runs `prepublishOnly` before
    `prepack` and would check before the build. Every pack and every publish
    builds, then checks.
  - `bin`: `{ "pm-docs-site": "./dist/cli.js" }`
  - `exports`: `{ ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`
  - `files`: `dist`, `src`, `lib/repo-docs.ts`, `lib/schema-version.ts`,
    `README.md`, `LICENSE.md`. The two `lib` files ship because `src/`
    imports them and Vite compiles them; Node never loads them.
  - `engines.node`: `>=24` (see Constraints).
  - `version`: `0.1.0-pre.2`, so the merge publishes the built package.
- `.gitignore` adds `/dist/`.
- `scripts/check-exports.ts` stays plain Node (run as `node
  scripts/check-exports.ts`, no Bun needed) and gains one check: every
  `exports` and `bin` target ends in `.js`, so a `.ts` entry point fails.

### Tests

- Unit tests import `lib/*.ts` directly under Bun.
- `test/helpers.ts` `CLI` is `lib/cli.ts`, still spawned with `node` (Node
  strips the types outside `node_modules`); `siteConfig` imports
  `lib/index.ts` by file URL and scratch sites write `astro.config.ts`.
- `test/install.test.ts` is the built-output test: `bun pm pack` runs `prepack`,
  so the tarball holds a fresh `dist/`. It asserts the tarball lists
  `dist/cli.js` and `dist/index.js` and no `.ts` file under `exports` or
  `bin`, installs it, writes `astro.config.ts`, and builds through `bun run
  build`, whose `pm-docs-site` bin runs under `node`. It also runs `node
  node_modules/@purview-dev/pm-docs-site/dist/cli.js` once directly so the
  Node path is explicit.
- `test/browser/dev-server.ts` spawns the installed `dist/cli.js`;
  `playwright.config.ts` runs `node test/browser/serve.ts`, which builds with
  `lib/cli.ts`.

### Publish workflow and pins

- `publish-pm-docs-site.yml` gains `run: bun run build` after `bun run check`
  and before `node scripts/check-exports.ts`; `npm publish` runs `prepack`
  again.
- `scripts/workflows.test.ts` pins the order `bun test`, `bun run check`,
  `bun run build`, `node scripts/check-exports.ts`, `npm publish`, and pins
  `scripts.prepack` (replacing the `prepublishOnly` pin).
- `justfile` `package-test` is unchanged: `bun test` covers the build through
  the install test's pack.

### Documentation

Change `astro.config.mjs` to `astro.config.ts` and the file names to the new
layout in: `packages/pm-docs-site/README.md` (including its Releasing
section, which describes `prepublishOnly` and now describes `prepack`),
`README.md` (line 74),
`docs/wiki/guide/Docs-Site-Package.md`,
`docs/wiki/contributing/Repository-Layout.md`, and `.config/purview-docs.yml`.
Historical specs and plans under `docs/superpowers/` stay as written.

## Constraints

- The CLI loads a consumer's `astro.config.ts` with a plain `import()`, which
  needs Node's default type stripping. The user asked for Node 24 or 26
  (2026-11-18); `engines` becomes `>=24`, the version `ci.yml` and
  `publish-pm-docs-site.yml` already run (agent's call within that answer), so
  the floor is the version CI tests. "Node 22 or later" becomes "Node 24 or
  later" in `README.md`, `justfile` (`package-test` comment),
  `docs/wiki/guide/Docs-Site-Package.md`, `docs/wiki/contributing/Development.md`,
  the package README, and the comment in `publish-pm-docs-site.yml`.
- TypeScript 6.0.3 (already a devDependency) supports
  `rewriteRelativeImportExtensions` and `erasableSyntaxOnly`.
- `pm-docs-site-v0.1.0-pre.1` is already tagged and published. The user chose
  to bump to `0.1.0-pre.2` (2026-11-18), so the merge publishes this build;
  `scripts/check-version.ts` requires the bump to move forward and be untagged.
- After the merge, check that the published tarball (`npm pack
  @purview-dev/pm-docs-site@0.1.0-pre.2`) holds `dist/cli.js` and
  `dist/index.js`, and that its CLI runs under `node`.

## Assumptions

- `bun pm pack` runs `prepack`. Signal it is wrong: the tarball in the install
  test has no `dist/`. Fallback: the install test runs `bun run build` before
  packing.
- Vite compiles `lib/repo-docs.ts` and `lib/schema-version.ts` from
  `node_modules` the way it compiles `src/lib/planning.ts` today. Signal it is
  wrong: the install test's build fails on those imports.

## Left to the builder

- Whether the option types live in `lib/index.ts` or a `lib/types.ts`.
- Whether `tsc` needs extra flags beyond the Astro strict base (for example
  `noEmit` or `allowImportingTsExtensions` overrides) to emit.
- Comment wording in moved files.

## Open questions

- None.
