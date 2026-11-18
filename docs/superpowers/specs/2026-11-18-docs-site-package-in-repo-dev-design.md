# R-017 Docs-site package: in-repo dev hydrates

- Item: R-017 Docs-site package: in-repo dev hydrates (serves V4, milestone M1)
- Branch: `feat/r-017-docs-site-package-in-repo-dev-hydrates`
- Size: a small change

## Intent

`pm-docs-site dev` on the package's in-repo fixture (`test/fixtures/site`)
never hydrates the Board island. Vite's default `server.fs.allow` is the
workspace root it finds from the site root, which here is the fixture folder,
so it refuses `packages/pm-docs-site/node_modules/@astrojs/react/dist/client.js`.
R-012 Docs-site package: dependency graph and later views are developed
against that fixture, so dev must hydrate there. A consumer that links the
package (`bun link`, a `file:` dependency) hits the same refusal, because
Vite resolves the link to its real path outside the site.

## Goals

- From `packages/pm-docs-site`, `bun lib/cli.ts dev test/fixtures/site` serves
  `/plan/board/?group=owner` with the Board island hydrated, and the dev
  server logs no `server.fs.allow` error.
- Linked consumers hydrate in dev for the same reason.

## Non-goals and anti-goals

- No change for a packed-install consumer (the package is under the site's
  own `node_modules`, already allowed; R-010's `dev` Playwright project
  pins it).
- Never narrow the allow list: Vite's default workspace root and any
  `server.fs.allow` the consumer set must stay allowed.
- No new dependency and no new Playwright project (the inbox already flags
  the cost of the `dev` project).

## Approaches

1. **Append in `configResolved` (picked).** A plugin in the integration's
   Vite config appends the package's real directory to the resolved
   `server.fs.allow` when no entry already contains it. Keeps the defaults
   and consumer entries, no dependency, fixes linked consumers. Trade-off:
   it mutates the resolved config, which works but is not Vite's documented
   extension point.
2. **Set `server.fs.allow` with `searchForWorkspaceRoot`.** The documented
   API, but setting the option replaces Vite's default, so the package
   would need `vite` as a direct dependency pinned to Astro's.
3. **Fixture-only config.** Smallest, but linked consumers keep failing.

The user picked 1.

## Design

- In `packages/pm-docs-site/lib/index.ts`, add a plugin
  `pm-docs-site:fs-allow` to the existing `vite.plugins` list. Its
  `configResolved(config)` appends `PACKAGE_DIR` to `config.server.fs.allow`
  unless an entry already contains it.
- `PACKAGE_DIR` is the package's real directory:
  `realpathSync(fileURLToPath(new URL('../', import.meta.url)))`. The
  integration runs from `lib/index.ts` in the repository (the fixture
  imports it directly) and from `dist/index.js` when installed, and both
  sit one level below the package folder, as the existing
  `new URL('../src/', import.meta.url)` already assumes.
- The containment check is a pure helper in a new `lib/` module, beside the
  other option helpers and emitted to `dist/` by R-021's build: an entry
  contains a path when `path.relative(entry, path)` is empty or neither
  starts with `..` nor is absolute (covers Windows drives and case through
  `path`).
- Language: TypeScript only (user, 2026-11-18). The helper and the plugin
  are `.ts` source in `lib/`; no new `.js` or `.mjs`.
- Tests: a `bun test` unit test for the helper (inside, equal, outside,
  sibling with a shared prefix, other drive on Windows) and for the plugin
  hook appending once and not when covered. Confirm the `Done when` check
  by hand with the dev server and a browser. No new Playwright project.

## Decision 2026-11-18: wait for the TypeScript conversion (resolved)

- The user chose to convert the package to TypeScript first, as its own
  roadmap item (R-021 Docs-site package: TypeScript source with a build
  step). Rejected: putting the plugin into the old `index.mjs` (adds
  JavaScript); a Bun runtime switch inside R-017 (scope change to M).
- R-021 merged (0951720) and is merged into this branch. Design reviewed
  against the converted layout on 2026-11-18: approach 1 is unchanged, and
  only the file paths and the `PACKAGE_DIR` base moved.

## Left to the builder

- The helper's file and export names, and whether the hook also skips when
  `server.fs.strict` is `false` (nothing to do then).
