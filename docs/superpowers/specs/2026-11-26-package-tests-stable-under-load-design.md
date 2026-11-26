# R-056 Package tests stable under full lint-check: design

- Item: R-056 Package tests stable under full lint-check (Serves V4, Milestone M5)
- Branch: `feat/r-056-package-tests-stable-under-full-lint-check`
- ADRs: none written or changed. Test code only; ADR-005 Docs sites consume the pm-docs-site package is unaffected.

## Intent

`just lint-check`, which the pre-push hook runs, fails about once per run on
Windows in `package-test`: a different package test each time, and each one
passes alone. A push must not fail on a fault-free branch.

## Done when

Two consecutive `just lint-check` runs on Windows pass `package-test`,
including `test/cli.test.ts` "still reads a site whose config is
astro.config.mjs" and `test/browser/graph.browser.ts` "usable at 320px".

## Findings

- **Browser waits.** `hydrated()` in `test/browser/graph.browser.ts`,
  `board.browser.ts`, and `timeline.browser.ts` waits for an island's toolbar
  to be visible with Playwright's default 5000ms expect timeout. The graph
  toolbar is `hidden` until the URL state is applied (`src/components/graph/Graph.tsx`
  line 217), and `playwright.config.ts` runs `fullyParallel`, so hydration
  under load passes 5000ms (482ms alone).
- **CLI hang.** `runCli` in `test/helpers.ts` calls `Bun.spawnSync` with no
  timeout. The `.mjs` build ran the full 180000ms test timeout (4.27s alone),
  which is a hang, not slowness, and the test died without the child's output.

## Approaches

1. Raise the timeouts only. Cheap; leaves the CLI hang unexplained.
2. **Chosen:** diagnose, then fix. Make a hung build fail with its output,
   give the hydration waits one shared longer timeout, reproduce under the
   full run, and fix the cause the output shows.
3. Cap Playwright workers. Simple; slows every run and leaves the CLI hang
   unexplained.

The user chose 2 (2026-11-26).

## Design

1. **`runCli` time limit.** `runCli` takes an optional timeout, defaulting
   below the 180000ms `BUILD` test timeout (builder's call: 170000ms), passed
   to `Bun.spawnSync` (`timeout`, `killSignal`). On a kill, the returned
   result says it timed out and carries the partial stdout and stderr, so the
   `expect(result.code, result.stderr)` message shows where the build stopped.
2. **One hydration timeout.** A shared constant in a browser test helper
   (builder's call: 30000ms) used by every `hydrated()` helper, so the waits
   agree and change in one place. Assertions after hydration keep the default.
3. **Reproduce.** Run `just lint-check` on Windows until a failure appears or
   two runs pass; record each run's result in the plan.
4. **Fix the cause** the CLI output shows (for example a Windows file lock in
   the scratch folder, or a child process left running by an earlier test).
   SCOPE CHANGE trigger: if the cause is a fault in the package itself rather
   than in the tests, stop and report it before changing package source.

## Non-goals

- Removing `package-test` from pre-push (that is R-030 Pre-push runs fast checks only).
- R-054 Git subprocess tests stable under load (the `scripts/` tests).
- Capping Playwright workers, unless step 4 shows the load itself is the cause.

## Left to the builder

The exact timeout values, the helper's file name, and the fix for the cause
found in step 4, within the scope above.
