# Docs-site package: stable browser tests (R-023) — design

- Item: R-023 Docs-site package: stable browser tests
- Serves: V4 (M1 Reproducible docs site)
- Branch: `feat/r-023-docs-site-package-stable-browser-tests`
- Size: a small change

## Intent

The package's browser tests fail at random, so `just lint-check` (pre-push)
and CI fail on work that is correct. Make them deterministic, and tidy the
review findings parked on the item in the same pass.

## Goals

1. **Graph no-flash test.** `sampleFrames` (`test/browser/graph.browser.ts`)
   misses the pending mark when hydration sets and clears
   `data-graph-pending` before the first animation frame. Push one frame
   synchronously when the init script runs, and record every change of
   `data-graph-pending` on `document.documentElement` with a
   MutationObserver, so a set-and-clear between frames is still seen.
2. **One web server per run.** Split `playwright.config.ts` in two:
   - `playwright.config.ts`: project `chromium`, web server
     `node test/browser/serve.ts` only.
   - `playwright.dev.config.ts`: project `dev`, web server
     `bun test/browser/dev-server.ts` only, `testMatch` `dev.browser.ts`.
   - `package.json`: `test:browser` runs the first, `test:browser:dev` the
     second. `justfile` `package-test` and the CI package job run both, one
     after the other.
   - Project names stay `chromium` and `dev`, so existing `--project`
     commands keep working against the matching config.
3. **Chip test that can fail.** `test/graph-layout.test.ts:107-118` filters
   an object's keys for one ID, which can never be more than one. Assert on
   the layout's boxes and lanes so a duplicate chip box fails the test.
4. **`arrowheadFill` failure message.** When `marker-end` is not the
   `url(#<id>)` form, or the marker element is missing, fail with a message
   that names the attribute value, instead of returning `null`.
5. **fs-allow tests.** `test/integration.test.ts` finds the plugin by name
   (`find((p) => p.name === 'pm-docs-site:fs-allow')`), keeping the
   "is the last plugin" test as the one position check. The comment in
   `lib/index.ts` says the entry serves the whole package folder in in-repo
   and linked dev, that `server.fs.deny` still guards it, and that a
   case-only path difference on case-insensitive file systems appends a
   harmless duplicate.

## Non-goals

- Changing the graph island, its pending mark, or any product behaviour.
- Rewriting `arrowheadFill` to stop reading React Flow's marker format.
- Fixing case-only duplicate entries in `server.fs.allow` (comment only).

## Constraints

- TypeScript, Bun; sh-only `justfile` recipes.
- `playwright --project` is variadic: `--project chromium <file>` reads the
  file as a project name. Commands use `--project=chromium`; the config
  comment says so.

## Approaches

- **A. Two config files (chosen by the user).** Each run starts only its own
  server; one extra file.
- **B. One config, servers picked by an environment variable.** No extra
  file, but forgetting the variable starts both servers again, which is the
  failure being fixed.

## Done when

- `npx playwright test test/browser/graph.browser.ts --project=chromium --repeat-each=10`
  in `packages/pm-docs-site` passes 10 of 10 runs.
- `just package-test` passes twice in a row. (Agent's call: added so goal 2
  has its own check.)

## Left to the builder

- The exact shape of the replacement chip assertion.
- Whether the two configs share a small helper for common settings.
