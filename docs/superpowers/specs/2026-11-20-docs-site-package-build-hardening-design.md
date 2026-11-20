# R-027 Docs-site package: build hardening

- Item: R-027 Docs-site package: build hardening (serves V4, milestone M1)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md`
- Branch: `feat/r-027-docs-site-package-build-hardening`
- Size: a small change

## Intent

Close the build and documentation gaps found in the R-021 final review
before `@purview-dev/pm-docs-site` reaches 1.0.0. A published version can
never be republished, so the pack must fail on anything that would make an
installed copy unusable, and the consumer docs must not name a stale
version.

## Goals

1. `@types/node` is a direct `devDependency`, so `prepack` does not depend
   on `@types/bun` pulling it in.
2. `scripts/build.ts` rewrites `.ts` specifiers in every `.d.ts` under
   `dist/`, walking it with `readdirSync(..., { recursive: true })`.
3. The install-test guard in `test/install.test.ts` walks the installed
   `dist/` recursively and checks relative imports with `./` and `../`.
4. `scripts/check-exports.ts` accepts `.js`, `.mjs`, and `.cjs` entry
   points, and accepts a `.d.ts` only as the value of a `types` condition.
5. `lib/types.ts` ships: add it to `files`. Four `src/` files type-import
   it (`src/lib/references.ts`, `src/lib/planning.ts`,
   `src/loaders/repo-docs.ts`, `src/env.d.ts`), and it imports nothing, so
   shipping it is cheaper than inlining the types. The install test asserts
   every relative import in shipped `src/` resolves inside the tarball.
6. The `astro.config.ts` examples in `packages/pm-docs-site/README.md` and
   `docs/wiki/guide/Docs-Site-Package.md` are fenced as `ts`.
7. No file names `0.1.0-pre.1` as the published version.

## Non-goals

- The `latest` dist-tag on a prerelease: the publish workflow does this on
  purpose until a stable release exists (README, publishing section).
- Any change R-019 makes on its own branch to the same README sections.

## Approaches (version in the docs)

- **No version in prose, plus a pinned example kept equal to
  `package.json` (chosen).** Prose says "in prerelease on npm under the
  `prerelease` dist-tag" with no number. The `package.json` examples pin
  the current version, and a check fails when they differ from
  `packages/pm-docs-site/package.json`. It cannot go stale silently.
- **Pin `0.1.0-pre.2` everywhere.** Smallest, but stale at the next
  release.
- **Dist-tag only, no version anywhere.** Never stale, but the example is
  no longer reproducible.

## Design

- The version check lives in `scripts/validate.ts`, beside the
  repository's other drift checks, and covers the two `package.json`
  examples (README and wiki page). Bumping the package version then needs
  the two examples bumped in the same commit. (Builder's call: placement.)
- Prose that names a version: `docs/wiki/guide/Docs-Site-Package.md`
  Status, `.config/purview-docs.yml` outcome, and the README publishing
  section (the dist-tag example and the first-publish step) are reworded
  without a number.
- Unit tests: `test/build.test.ts` gains a case for a nested `dist/`
  declaration; a new `check-exports` test covers `.mjs`/`.cjs` accepted and
  a `.d.ts` under `default` rejected.

## Left to the builder

- Test fixtures for `check-exports.ts` (a temporary package root or a
  function export), as long as the CLI behaviour stays the same.
