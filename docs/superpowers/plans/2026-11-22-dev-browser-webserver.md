# R-029 Dev browser webserver starts reliably Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find why the `test:browser:dev` web server sometimes never becomes ready on Windows, fix that trigger, and show 5 consecutive green `just lint-check` runs.

**Architecture:** `dev-server.ts` gains a dev log and a line classifier (a small pure module, unit-tested) so a failed run leaves the cause on disk. A throwaway loop reproduces the failure; the cause is written into this plan's `## Cause` section; Task 3 fixes the trigger found, or falls back to a readiness gate.

**Tech Stack:** Bun (`bun test`), TypeScript, Playwright, Astro 7.4, Vite 8.3, Node 24 (the dev server runs under Node).

**Spec:** `docs/superpowers/specs/2026-11-21-dev-browser-webserver-design.md`

## Global Constraints

- TypeScript only (`.ts`); no new dependencies.
- The 300 s web server timeout and the assertions in `test/browser/dev.browser.ts` stay as they are.
- No change to `.github/workflows/ci.yml`, `.config/lefthook.yml`, or `playwright.config.ts` (built-site tests).
- The reproduction loop is not committed; it lives in the job's temp folder.
- Run `just` recipes from the repository root; do not change the justfile's shell.

## Review Focus

- A run where the dev server restarts but then recovers must not fail the run: the log records it, the classifier never aborts the process.
- `dev.log` must be written even when Playwright tree-kills the process on Windows: append synchronously per chunk, never buffer to exit.
- A stale `dev.log` from the previous run must not be read as this run's evidence: it lives in the scratch folder that `rmSync` clears at start.
- A fix in `lib/index.ts` must keep the existing `integration.test.ts` `optimizeDeps` expectations for consumers that already pre-bundle (`adds nothing the consumer already pre-bundles`).
- The fallback ready endpoint (only if Task 3C) must not answer before all three island pages return 200.

## Cause

Confirmed 2026-11-22 on Windows, by forcing each link of the chain.

1. **Trigger: Astro's update check.** `astro dev` checks npm for a newer Astro when `_variables.lastUpdateCheck` in `.astro/settings.json` is older than 12 days, and skips the check on CI (`ci-info`), which is why Ubuntu CI never fails. `dev-server.ts` builds a fresh consumer every run, so the check runs every local run (`dev.log`: `update ▶ New version of Astro available: 7.4.13`). It then writes `.astro/settings.json` with `{ reloadServer: false }`, which sets `ignoreNextPreferenceReload` to skip **one** watcher event (`astro/dist/preferences/index.js`).
2. **Two events for one write on Windows.** One `writeFileSync` of a new `.astro/settings.json` gives `rename` then `change` (`fs.watch` probe). Astro's watcher handles add and change with the same restart handler (`astro/dist/core/dev/restart.js`, `shouldRestartContainer`): the first event uses up the ignore flag, the second restarts the server (`Configuration file updated. Restarting...`).
3. **Timing makes it a flake.** The write lands after the npm fetch returns. Usually that is before the watcher is ready, so no event fires. When the fetch is slow, for example on a loaded machine right after `bun test`, it lands after the watcher is ready and the restart follows.
4. **A restart during startup leaves the server broken.** A second `settings.json` write as soon as Astro's own write appears cut the content layer sync (`[content] transport was disconnected, cannot call "fetchModule"`). The `docs` collection came up empty (`The slug "docs/guide/intro" ... does not exist`), and `/` returned 500 then and 20 s later. Playwright's `webServer.url` check never accepts a 500, so it waited out the 300 s timeout: the failure seen on R-019's branch. A restart after startup also logs `transport was disconnected` and recovers.

The 2026-11-20 log's `Listen method has been called more than once` comes from the same in-place restart (`restartContainerInPlace` re-listens on the kept HTTP server). It was not reproduced separately.

Branch: **3B variant.** The fix stops the trigger, not the restart: no update check, so no settings write. See the Task 3 ruling in the ledger.

---

### Task 1: Dev log and restart detection

**Files:**

- Create: `packages/pm-docs-site/test/browser/dev-log.ts`
- Create: `packages/pm-docs-site/test/dev-log.test.ts`
- Modify: `packages/pm-docs-site/test/browser/dev-server.ts` (the `spawn` of the dev server and its `stdio`)

**Interfaces:**

- Produces: `export type DevEvent = 'restart' | 'reoptimise' | 'listen-twice' | 'transport-lost'` and `export function classifyDevLine(line: string): DevEvent | null` in `test/browser/dev-log.ts`.

- [ ] **Step 1: Write the failing test** `test/dev-log.test.ts`, `describe('classifyDevLine')`:

```ts
expect(classifyDevLine('12:00:01 [config] Configuration file updated. Restarting...')).toBe('restart');
expect(classifyDevLine('12:00:01 [vite] ✨ new dependencies optimized: @xyflow/react')).toBe('reoptimise');
expect(classifyDevLine('12:00:01 [vite] ✨ optimized dependencies changed. reloading')).toBe('reoptimise');
expect(classifyDevLine('Error [ERR_SERVER_ALREADY_LISTEN]: Listen method has been called more than once without closing.')).toBe('listen-twice');
expect(classifyDevLine('Error: transport was disconnected, cannot call "fetchModule"')).toBe('transport-lost');
expect(classifyDevLine('12:00:01 [200] /plan/board/ 41ms')).toBeNull();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/pm-docs-site && bun test test/dev-log.test.ts`
Expected: FAIL, cannot resolve `./browser/dev-log.ts`.

- [ ] **Step 3: Implement `classifyDevLine`** as a list of `[RegExp, DevEvent]` pairs, case-insensitive: `/restarting/` → restart, `/new dependencies optimized|optimized dependencies changed/` → reoptimise, `/listen method has been called more than once|ERR_SERVER_ALREADY_LISTEN/` → listen-twice, `/transport was disconnected|transport invoke timed out/` → transport-lost. Check the Astro and Vite wording against `node_modules/astro` and `node_modules/vite` sources (`grep -r "Restarting" node_modules/astro/dist`) and adjust the test strings to the real messages if they differ.

- [ ] **Step 4: Run it to verify it passes**

Run: `cd packages/pm-docs-site && bun test test/dev-log.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into `dev-server.ts`.** Spawn the dev server with `stdio: ['ignore', 'pipe', 'pipe']`; for each stdout and stderr chunk, write it to the process's own stream, `appendFileSync(join(DIR, 'dev.log'), chunk)`, and for each line whose `classifyDevLine` is not null append `[dev-server] <ISO time> <event>` to `dev.log` and to stderr. Keep the header comment accurate: add one sentence that `dev.log` in the scratch folder holds the last run's dev output.

- [ ] **Step 6: Verify the dev tests still pass and the log is written**

Run: `cd packages/pm-docs-site && bun run test:browser:dev`
Expected: 3 passed; `$env:TEMP\pm-docs-site-dev-browser\dev.log` exists and contains the Astro start banner.

- [ ] **Step 7: Commit**

```bash
git add packages/pm-docs-site/test/browser/dev-log.ts packages/pm-docs-site/test/dev-log.test.ts packages/pm-docs-site/test/browser/dev-server.ts
git commit -m "test(pm-docs-site): log dev server restarts in the dev browser tests (R-029)"
```

### Task 2: Reproduce and name the cause

**Files:**

- Create (not committed): `<job tmp>/repro-r029.ps1`
- Modify: this plan, `## Cause`

- [ ] **Step 1: Write the loop.** For run 1 to 10: in `packages/pm-docs-site`, run `bun test`, then `bun run test:browser:dev`; after each, copy `$env:TEMP\pm-docs-site-dev-browser\dev.log` to `<job tmp>/dev-<n>.log` and record pass or fail. Stop at the first failure.

- [ ] **Step 2: Run it** (background, up to about 60 minutes).
Expected: either a failure with its `dev-<n>.log`, or 10 passes.

- [ ] **Step 3: Read the evidence.** In every `dev-<n>.log`, list the `[dev-server]` events and what preceded them (a re-optimisation naming dependencies, a config restart, a file name). Passes with a `reoptimise` or `restart` event count as evidence too: they show the trigger fires and the race is timing.

- [ ] **Step 4: Write `## Cause`** in this plan: the trigger, the log lines, runs and failures (for example `1 failure in 4 runs; reoptimise of @astrojs/starlight > ... at first /plan/board/ request`), and which Task 3 branch applies: 3A (late dependency discovery), 3B (config-file restart), or 3C (not reproduced, or neither: most likely cause, with its evidence).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-11-22-dev-browser-webserver.md
git commit -m "docs(plan): name the R-029 dev server timeout cause"
```

### Task 3: Fix the trigger (do the one branch `## Cause` names)

**3A: Late dependency discovery.** Files: `packages/pm-docs-site/lib/index.ts` (`BROWSER_DEPENDENCIES`, line 69), `packages/pm-docs-site/test/integration.test.ts`.

- [ ] **Step 1:** Update the two expectations in `integration.test.ts` (`include: [...]` at lines 152 and 159) to list the dependencies `## Cause` names after the existing two, in that order, prefixed with `@purview-dev/pm-docs-site >` and a space in the installed case. Run `bun test test/integration.test.ts`; expected FAIL.
- [ ] **Step 2:** Append those names to `BROWSER_DEPENDENCIES`, and extend the JSDoc above `optimizedDependencies` with one sentence on why each was added. Run `bun test test/integration.test.ts`; expected PASS.
- [ ] **Step 3:** Run `bun run build` in `packages/pm-docs-site`, then `bun run test:browser:dev` and confirm `dev.log` has no `reoptimise` event on the first page load.
- [ ] **Step 4:** Commit `fix(pm-docs-site): pre-bundle <deps> so dev never re-optimises on first load (R-029)`.

**3B: Config-file restart.** Files: `packages/pm-docs-site/test/browser/dev-server.ts`.

- [ ] **Step 1:** Write the consumer's `astro.config.ts` and `package.json` before `bun install`, so no write lands within the watcher's start window, and set both files' mtimes 10 s in the past with `utimesSync`. Comment why, citing `## Cause`.
- [ ] **Step 2:** Run `bun run test:browser:dev`; expected 3 passed and no `restart` event in `dev.log`.
- [ ] **Step 3:** Commit `fix(pm-docs-site): stop the dev test consumer restarting on its own config (R-029)`.

**3C: Readiness gate (fallback).** Files: `packages/pm-docs-site/test/browser/dev-server.ts`, `packages/pm-docs-site/playwright.dev.config.ts`.

- [ ] **Step 1:** In `dev-server.ts`, after spawning, poll `http://localhost:${PORT}` paths `/plan/board/`, `/plan/roadmap/`, `/plan/graph/` with `fetch` every 1 s until all three return 200 in one pass with no `restart`, `listen-twice`, or `transport-lost` event since the pass began; if the dev process exits, exit with its code. Then open `node:http` on `PORT + 1` answering `GET /ready` with 200.
- [ ] **Step 2:** In `playwright.dev.config.ts`, set `webServer.url` to `http://localhost:${DEV_PORT + 1}/ready` with a comment naming the cause from `## Cause`. `baseURL` stays `DEV_PORT`.
- [ ] **Step 3:** Run `bun run test:browser:dev`; expected 3 passed.
- [ ] **Step 4:** Commit `fix(pm-docs-site): wait for a stable dev server in the dev browser tests (R-029)`.

### Task 4: Verify Done when

- [ ] **Step 1:** From the repository root, run `just lint-check` 5 times in a row on Windows (background; about 5 minutes each), each to its own log in the job temp folder.
Expected: 5 exit codes of 0, each log showing `3 passed` for `test:browser:dev`.
- [ ] **Step 2:** If any run fails, return to Task 2 with its `dev.log`; do not mark this step done.
- [ ] **Step 3:** Run `bunx markdownlint-cli2 docs/superpowers/plans/2026-11-22-dev-browser-webserver.md docs/superpowers/specs/2026-11-21-dev-browser-webserver-design.md`; expected 0 errors.
