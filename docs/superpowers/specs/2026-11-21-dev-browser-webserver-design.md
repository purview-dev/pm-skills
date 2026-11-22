# R-029 Dev browser webserver starts reliably — design

- Item: R-029 Docs-site package: dev browser webserver starts reliably
- Serves: V4 (M1 Reproducible docs site)
- Branch: `feat/r-029-dev-browser-webserver`
- Size: small change

## Intent

`bun run test:browser:dev` (part of `just package-test`, and so of
`just lint-check` and pre-push) timed out once on Windows after 300 s
waiting for the Playwright web server. A flaky gate blocks pushes and hides
real dev-mode regressions, and R-013 (publish) depends on this item.

## Done when

- The plan names the cause of the timeout, confirmed by a reproduction or,
  failing that, the most likely cause with the log evidence for it.
- 5 consecutive `just lint-check` runs on Windows pass `test:browser:dev`.

## What is known

- `packages/pm-docs-site/test/browser/dev-server.ts` packs the package,
  installs it into a fresh consumer under the temp folder, and runs the
  installed CLI's `dev` under Node. Every run starts with an empty Vite
  dependency cache.
- The logs (`Listen method has been called more than once without closing`,
  `transport was disconnected, cannot call "fetchModule"`,
  `transport invoke timed out`) indicate the Astro dev server restarted
  while the first server render was in flight, and the restarted server
  never answered.
- Likely restart triggers: Vite re-optimising dependencies it discovered
  on the cold cache, or Astro seeing the just-written `astro.config.ts`
  change. `lib/` adds no watch files.
- CI runs on Ubuntu only; the failure is Windows-only so far, after the
  full `bun test` suite (machine under load).

## Approaches

1. **Reproduce, then fix the trigger (chosen).** Capture the dev server's
   output to a log that survives a failed run, reproduce under the same
   load, and remove the trigger: for dependency discovery, add the missing
   dependencies to the package's `optimizeDeps.include`
   (`optimizedDependencies` in `lib/index.ts`), which also fixes the same
   first-load failure for consumers; for a config-watch restart, change how
   `dev-server.ts` writes the consumer before start.
2. **Harden the test server only.** `dev-server.ts` warms the three island
   pages and signals ready only once they render with no restart. Cheap and
   reliable, but on its own it hides a first-load failure a real consumer
   would see.
3. **Do nothing; rely on R-030** moving `package-test` off pre-push.
   Rejected: `just lint-check` stays flaky locally and the cause stays
   unknown.

Decision (user, 2026-11-21): approach 1. If about 10 instrumented runs do
not reproduce it, fall back to approach 2 and name the most likely cause
with its evidence instead of a confirmed one.

## Design

- **Evidence first.** `dev-server.ts` tees the dev server's stdout and
  stderr into `<temp>/pm-docs-site-dev-browser/dev.log` (still printed as
  now) and logs each Astro restart and Vite re-optimisation it sees, so a
  failed run leaves the cause on disk.
- **Reproduction.** A throwaway loop (not committed) runs `bun test` then
  `bun run test:browser:dev` repeatedly on Windows until a failure or
  about 10 passes.
- **Fix** per approach 1, at the trigger found.
- **Readiness gate (fallback only).** `dev-server.ts` fetches
  `/plan/board/`, `/plan/roadmap/`, and `/plan/graph/` until each returns
  200 with no restart in between, then opens a ready endpoint that
  `playwright.dev.config.ts` waits on instead of `/`.
- The 300 s web server timeout and the test assertions stay as they are.

## Non-goals

- No change to CI's OS matrix, to R-030's pre-push scope, or to the built-site
  browser tests (`playwright.config.ts`).

## Left to the builder

- The exact log line patterns to detect a restart and a re-optimisation.
- Whether `dev.log` is printed on a web server failure or only kept on disk.
