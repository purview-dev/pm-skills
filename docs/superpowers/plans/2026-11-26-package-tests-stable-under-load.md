# R-056 Package tests stable under load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `package-test` passes under two consecutive `just lint-check` runs on Windows.

**Architecture:** A hung CLI child is killed just before the bun test timeout and reports its output; the browser hydration waits share one longer timeout; then the hang is reproduced and its cause fixed.

**Tech Stack:** Bun 1.4 (`bun test`, `Bun.spawnSync`), Node 24 (the CLI), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-26-package-tests-stable-under-load-design.md`

## Global Constraints

- Test code only, in `packages/pm-docs-site/test/`. A cause in package source is a SCOPE CHANGE: stop and report it before changing `lib/` or `src/`.
- `runCli` child timeout for a build: 170000ms, under the 180000ms `BUILD` test timeout.
- Hydration timeout: 30000ms, one shared constant.
- ADRs: none. Principles: none (`planning/ENGINEERING.md` does not exist).
- No change to `package-test`, `.config/lefthook.yml`, or Playwright `workers` (R-030 and spec non-goals).
- TypeScript only; files keep the package's tab indentation and a final newline.

## Review Focus

1. A `check` call inside a 60000ms `CHECK` test that hangs: with a 170000ms child limit bun still kills the test first with no output. The child limit follows the command: `build` gets `BUILD - 10_000`, anything else `CHECK - 10_000` (Task 1 test).
2. A child that finishes in time: `timedOut` is `false` and stderr is unchanged, so existing `toContain` assertions on stderr still match (Task 1 test).
3. A new `*.browser.ts` file that adds its own `hydrated()` with the default 5000ms wait (Task 2 guard test).
4. `integration.test.ts` and `links.test.ts` keep their own `BUILD` constants and drift from `cli.test.ts` (Task 1 moves `BUILD` and `CHECK` into `helpers.ts`).
5. A killed build on Windows leaves its scratch folder locked, so `afterAll`'s `rmSync` throws (Task 3 checks the run output for it).

---

### Task 1: `runCli` stops a hung child and reports it

**Files:**

- Modify: `packages/pm-docs-site/test/helpers.ts:10-14`
- Modify: `packages/pm-docs-site/test/cli.test.ts:10-13`, `packages/pm-docs-site/test/integration.test.ts:325`, `packages/pm-docs-site/test/links.test.ts:14` (import `BUILD`, `CHECK` from `./helpers` instead of declaring them)
- Create: `packages/pm-docs-site/test/helpers.test.ts`

**Interfaces:**

- Produces: `export const BUILD = 180_000`, `export const CHECK = 60_000` (with the existing comment on `CHECK` moved beside it), `export function childTimeout(args: string[]): number`, and `runCli(args: string[], cwd?: string, options?: { timeout?: number }): { code: number; stdout: string; stderr: string; timedOut: boolean }` in `test/helpers.ts`.

- [ ] **Step 1: Write the failing tests** in `test/helpers.test.ts`:

```ts
describe('runCli', () => {
  it('childTimeout gives a build 10s under BUILD and anything else 10s under CHECK', () => {
    expect(childTimeout(['build', 'site'])).toBe(170_000);
    expect(childTimeout(['check', 'site'])).toBe(50_000);
    expect(childTimeout([])).toBe(50_000);
  });

  it('kills a child that passes its timeout and says so on stderr', () => {
    const result = runCli(['build', join(FIXTURES, 'site')], PACKAGE, { timeout: 50 });

    expect(result.timedOut).toBe(true);
    expect(result.code).not.toBe(0);
    expect(result.stderr.startsWith('runCli: timed out after 50ms: node lib/cli.ts build')).toBe(true);
  }, CHECK);

  it('a child that finishes in time is not marked and keeps its stderr', () => {
    const result = runCli(['nope'], PACKAGE);

    expect(result.timedOut).toBe(false);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('usage: pm-docs-site <dev | build | check>');
    expect(result.stderr).not.toContain('runCli: timed out');
  }, CHECK);
});
```

Add an `afterAll` that removes `test/fixtures/site/dist` and `.astro`, as `cli.test.ts` does.

- [ ] **Step 2: Run to verify they fail**

Run (in `packages/pm-docs-site`): `bun test test/helpers.test.ts`
Expected: FAIL, `childTimeout` is not exported.

- [ ] **Step 3: Implement** in `test/helpers.ts`: `childTimeout` returns `BUILD - 10_000` when `args[0] === 'build'`, else `CHECK - 10_000`. `runCli` passes `timeout: options?.timeout ?? childTimeout(args)` and `killSignal: 'SIGKILL'` to `Bun.spawnSync`, sets `timedOut` from the result's `exitedDueToTimeout === true`, maps a `null` exit code to `-1`, and on a timeout prefixes stderr with `runCli: timed out after <ms>ms: node lib/cli.ts <args joined by spaces>\n`. Move `BUILD` and `CHECK` here and import them in the three test files.

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/helpers.test.ts test/cli.test.ts`
Expected: PASS, 0 fail.

- [ ] **Step 5: Type-check and commit**

Run: `bun run check` — expected 0 errors.

```bash
git add packages/pm-docs-site/test/helpers.ts packages/pm-docs-site/test/helpers.test.ts packages/pm-docs-site/test/cli.test.ts packages/pm-docs-site/test/integration.test.ts packages/pm-docs-site/test/links.test.ts
git commit -m "test(pm-docs-site): runCli kills a hung child and reports it (R-056)"
```

### Task 2: One hydration timeout for the browser tests

**Files:**

- Create: `packages/pm-docs-site/test/browser/hydration.ts`
- Modify: `hydrated()` in `packages/pm-docs-site/test/browser/graph.browser.ts:17-19`, `board.browser.ts:66-68`, `timeline.browser.ts:11-13`
- Create: `packages/pm-docs-site/test/hydration.test.ts` (a `bun test` guard; browser specs are not run by `bun test`)

**Interfaces:**

- Produces: `export const HYDRATED = 30_000;` in `test/browser/hydration.ts`, with a one-line comment: hydration under a parallel full run can pass Playwright's 5000ms default (R-056).

- [ ] **Step 1: Write the failing guard test** in `test/hydration.test.ts`:

```ts
it('every hydrated() helper in a browser spec waits HYDRATED, not the default', () => {
  const specs = readdirSync(BROWSER).filter((file) => file.endsWith('.browser.ts'));
  const helpers = specs.flatMap((file) => {
    const source = readFileSync(join(BROWSER, file), 'utf8');
    const body = source.match(/async function hydrated\([^)]*\)[^{]*\{([\s\S]*?)\n\}/)?.[1];
    return body === undefined ? [] : [{ file, body }];
  });

  expect(helpers.map((helper) => helper.file).sort()).toEqual(['board.browser.ts', 'graph.browser.ts', 'timeline.browser.ts']);
  for (const helper of helpers) expect(helper.body, helper.file).toContain('{ timeout: HYDRATED }');
});
```

`BROWSER` is `join(PACKAGE, 'test', 'browser')`.

- [ ] **Step 2: Run to verify it fails**

Run: `bun test test/hydration.test.ts`
Expected: FAIL on `board.browser.ts` lacking `{ timeout: HYDRATED }`.

- [ ] **Step 3: Implement** `hydration.ts`, and in each `hydrated()` call `toBeVisible({ timeout: HYDRATED })`, importing `HYDRATED` from `./hydration.ts`.

- [ ] **Step 4: Run to verify**

Run: `bun test test/hydration.test.ts` — expected PASS.
Run: `bun run test:browser -- --project=chromium test/browser/graph.browser.ts` — expected all pass, including "usable at 320px".

- [ ] **Step 5: Commit**

```bash
git add packages/pm-docs-site/test/browser/hydration.ts packages/pm-docs-site/test/browser/graph.browser.ts packages/pm-docs-site/test/browser/board.browser.ts packages/pm-docs-site/test/browser/timeline.browser.ts packages/pm-docs-site/test/hydration.test.ts
git commit -m "test(pm-docs-site): one hydration timeout for the browser tests (R-056)"
```

### Task 3: Reproduce under the full run and fix the cause

**Files:**

- Record: this plan's Run log below.
- Modify: decided by the finding, inside `packages/pm-docs-site/test/` only.

- [ ] **Step 1: Run the full check, output to a file**

Run (repository root, PowerShell): `just lint-check *> "$env:TEMP\r056-run1.log"; $LASTEXITCODE`
Expected: exit 0, or a failure whose output names the test. Repeat once more as run 2.

- [ ] **Step 2: Record each run** in the Run log: exit code, failing test name, and for a `runCli: timed out` line the 20 stderr lines after it. Note any `EBUSY`/`EPERM` from `afterAll` (Review Focus 5).

- [ ] **Step 3: Fix the cause** the output shows, with a test that fails before the fix. If the cause is in `lib/` or `src/`, stop: write `SCOPE CHANGE: <cause, file>` in the Run log and report to the user before any change. If both runs passed and no `timed out` line appeared, write `No hang reproduced in 2 runs; Task 1 reports it if it recurs.` and skip to Task 4.

- [ ] **Step 4: Commit** the fix with `fix(pm-docs-site): <cause> (R-056)`.

### Task 4: Done when

- [ ] **Step 1:** Run `just lint-check` twice in a row on Windows. Expected: both exit 0, and both logs show `still reads a site whose config is astro.config.mjs` and `usable at 320px` passing. Record both in the Run log.
- [ ] **Step 2:** Commit the Run log update: `git add docs/superpowers/plans/2026-11-26-package-tests-stable-under-load.md` and `git commit -m "docs(plan): R-056 run log"`.

## Run log

- (filled in by Tasks 3 and 4)
