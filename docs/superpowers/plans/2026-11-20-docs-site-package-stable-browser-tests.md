# Docs-site package: stable browser tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `@purview-dev/pm-docs-site` browser tests deterministic and tidy the review findings parked on R-023.

**Architecture:** The graph no-flash sampler sees the pending mark through a synchronous first sample and a MutationObserver. The Playwright config splits in two, so each run starts only its own web server. The remaining fixes are test-only, plus one comment.

**Tech Stack:** TypeScript, Bun (`bun test`), Playwright (`@playwright/test`, Chromium), Astro.

**Spec:** `docs/superpowers/specs/2026-11-20-docs-site-package-stable-browser-tests-design.md`

## Global Constraints

- All paths below are relative to `packages/pm-docs-site/` unless they start with `.github/` or `justfile`.
- TypeScript only; `justfile` recipes stay sh (no shell setting).
- No product behaviour changes: nothing under `src/` changes; `lib/index.ts` changes a comment only.
- Project names stay `chromium` and `dev`.
- Use `--project=chromium` / `--project=dev` (with `=`) in every command: `--project` is variadic.
- Done when: `npx playwright test test/browser/graph.browser.ts --project chromium --repeat-each=10` passes 10 of 10; `just package-test` passes twice in a row.

## Review Focus

- A hydration that sets and clears `data-graph-pending` within one task, before any animation frame: the sampler must still record a pending frame (Task 1, the synchronous sample covers the SSR-set mark; the observer covers a later set).
- `bun run test:browser` with no arguments must run only the `chromium` project and start only `serve.ts` (Task 2, Step 4 checks the dev server does not start).
- `bunx playwright test -c playwright.dev.config.ts` must find `dev.browser.ts` only (Task 2, Step 5).
- A `marker-end` value that is not `url(#id)` must fail with a message containing the value, not a bare `null` mismatch (Task 3).
- A second plugin appended after `pm-docs-site:fs-allow` must not break the fs-allow behaviour tests, only the "is the last plugin" test (Task 4).

---

### Task 1: Graph sampler records every pending change

**Files:**

- Modify: `test/browser/graph.browser.ts:44-80` (`sampleFrames`)

**Interfaces:**

- Consumes: none.
- Produces: `sampleFrames(page: Page, path: string): Promise<GraphFrame[]>`, signature unchanged; callers at lines 187 and 326 unchanged.

- [x] **Step 1: Reproduce the flake.** Run (in `packages/pm-docs-site`): `npx playwright test test/browser/graph.browser.ts --project=chromium --repeat-each=10 -g "both switches off"`. Expected: at least one failure on `expect(frames.some((frame) => frame.pending)).toBe(true)` is likely but not guaranteed; record the result either way.
- [x] **Step 2: Change `sampleFrames`'s init script.**
  - Call `sample()` once synchronously at the end of the init script, before the first `requestAnimationFrame(sample)`; the synchronous call must not schedule a frame itself (split the push into a `record()` helper that `sample` and the observer both call, and keep the rAF scheduling and stop logic in `sample`).
  - Create a `MutationObserver` on `document.documentElement` with `{ attributes: true, attributeFilter: ['data-graph-pending'] }` whose callback calls `record()` once per mutation record. For a removal record, push a frame with `pending: true` (the attribute was set until this mutation: `mutation.oldValue !== null`, observed with `attributeOldValue: true`) and then the current state.
  - Disconnect the observer when `graphFrames` is published.
  - Update the doc comment above `sampleFrames` to say it also samples at document start and on every pending-mark change.
- [x] **Step 3: Run** `npx playwright test test/browser/graph.browser.ts --project=chromium --repeat-each=10`. Expected: every test passes, 10 of 10 runs each.
- [x] **Step 4: Commit**

```bash
git add packages/pm-docs-site/test/browser/graph.browser.ts
git commit -m "test(pm-docs-site): graph sampler sees every pending change (R-023)"
```

### Task 2: One web server per Playwright run

**Files:**

- Modify: `playwright.config.ts`
- Create: `playwright.dev.config.ts`
- Modify: `package.json:52` (scripts)
- Modify: `test/browser/dev-server.ts:1` and `test/browser/dev.browser.ts:2` (comments naming the config)
- Modify: `justfile` (`package-test`, repository root)
- Modify: `.github/workflows/ci.yml` (package job, after `Browser tests`)

**Interfaces:**

- Consumes: none.
- Produces: scripts `test:browser` (`playwright test`) and `test:browser:dev` (`playwright test -c playwright.dev.config.ts`).

- [x] **Step 1: `playwright.config.ts`.** Keep `testDir`, `testMatch`, `fullyParallel`, `reporter`. Projects: only `chromium` (keep `testIgnore: '**/dev.browser.ts'`). `webServer`: only the `node test/browser/serve.ts` entry, as an object. Rewrite the header comment: this config is the built fixture site; the dev-server tests live in `playwright.dev.config.ts`, so each run starts one server; pass `--project=chromium` with `=` because `--project` is variadic.
- [x] **Step 2: `playwright.dev.config.ts`.** Same `testDir`, `fullyParallel`, `reporter`; `testMatch: '**/dev.browser.ts'`; one project `dev` with `devices['Desktop Chrome']` and `baseURL` `http://localhost:4398`; `webServer` the `bun test/browser/dev-server.ts` entry exactly as it is today (timeout 300_000, `reuseExistingServer: false`, `env.PORT`). Header comment: the packed-install consumer under `pm-docs-site dev`, run by `bun run test:browser:dev`.
- [x] **Step 3: Scripts and wiring.** `package.json`: add `"test:browser:dev": "playwright test -c playwright.dev.config.ts"`. `justfile` `package-test`: add `bun run test:browser:dev` after `bun run test:browser`. `ci.yml`: add a step `- name: Dev browser tests` / `run: bun run test:browser:dev` after `Browser tests`. Update the two comments in `dev-server.ts` and `dev.browser.ts` to name `playwright.dev.config.ts`.
- [x] **Step 4: Run** `bun run test:browser`. Expected: PASS, output lists only `[chromium]` tests, and no `dev-server.ts` output (no `bun pm pack` line) appears.
- [x] **Step 5: Run** `bun run test:browser:dev`. Expected: PASS, output lists only `[dev]` tests from `dev.browser.ts`.
- [x] **Step 6: Run** `bun run check`. Expected: 0 errors (the new config is type-checked by `include: ["**/*"]`).
- [x] **Step 7: Commit**

```bash
git add packages/pm-docs-site/playwright.config.ts packages/pm-docs-site/playwright.dev.config.ts packages/pm-docs-site/package.json packages/pm-docs-site/test/browser/dev-server.ts packages/pm-docs-site/test/browser/dev.browser.ts justfile .github/workflows/ci.yml
git commit -m "test(pm-docs-site): one web server per browser test run (R-023)"
```

### Task 3: Assertions that can fail

**Files:**

- Modify: `test/graph-layout.test.ts:107-118`
- Modify: `test/browser/graph.browser.ts:347-365` (`arrowheadFill`) and its two callers

**Interfaces:**

- Consumes: `graphLayouts(...)['lanes-done'].boxes: Record<string, Box>` (existing).
- Produces: `arrowheadFill(page: Page, edgeId: string): Promise<string>`, which throws instead of returning `null`.

- [x] **Step 1: Chip test.** Replace the `chipBoxes` filter and `toHaveLength(1)` with `expect(Object.keys(twoLane.boxes).sort()).toEqual(['R-300', 'R-301', 'R-302'])`, so an extra box for the chip under any key fails. Keep the lane assertions that follow.
- [x] **Step 2: Run** `bun test test/graph-layout.test.ts`. Expected: PASS.
- [x] **Step 3: `arrowheadFill`.** Return a `{ fill: string | null; markerEnd: string | null; reason: string | null }` from `page.evaluate`, with `reason` set to `'marker-end is not url(#id)'`, `'no marker element'`, or `'no polyline'`. Outside the evaluate, throw an `Error` whose message is `arrowheadFill(<edgeId>): <reason> (marker-end: <markerEnd>)` when `reason` is set; otherwise return `fill`. Update the doc comment to say it fails loudly when React Flow's marker format changes. Remove the two `expect(...).not.toBeNull()` lines at the callers, which the throw replaces.
- [x] **Step 4: Run** `npx playwright test test/browser/graph.browser.ts --project=chromium -g "arrowhead"`. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add packages/pm-docs-site/test/graph-layout.test.ts packages/pm-docs-site/test/browser/graph.browser.ts
git commit -m "test(pm-docs-site): chip and arrowhead checks can fail (R-023)"
```

### Task 4: fs-allow tests find the plugin by name

**Files:**

- Modify: `test/integration.test.ts:180-215`
- Modify: `lib/index.ts:143-146` (comment only)

**Interfaces:**

- Consumes: `setup({ title })[0]!.vite.plugins` (existing test helper).
- Produces: none.

- [x] **Step 1: Tests.** Change `plugin()` to `plugins().find((p) => p.name === 'pm-docs-site:fs-allow')!`, where `plugins()` returns `setup({ title: 'T' })[0]!.vite.plugins`. Change the `'is the last plugin'` test to `expect(plugins().at(-1)!.name).toBe('pm-docs-site:fs-allow')`.
- [x] **Step 2: Comment.** Add to the comment above `name: 'pm-docs-site:fs-allow'`: the entry serves the whole package folder in in-repo and linked dev, `server.fs.deny` still guards it, and on a case-insensitive file system a case-only path difference appends a harmless duplicate entry.
- [x] **Step 3: Run** `bun test test/integration.test.ts` and `bun run check`. Expected: PASS, 0 errors.
- [x] **Step 4: Commit**

```bash
git add packages/pm-docs-site/test/integration.test.ts packages/pm-docs-site/lib/index.ts
git commit -m "test(pm-docs-site): fs-allow tests find the plugin by name (R-023)"
```

### Task 5: Verify Done when

**Files:** none.

- [x] **Step 1: Run** (in `packages/pm-docs-site`) `npx playwright test test/browser/graph.browser.ts --project chromium --repeat-each=10`. Expected: all passed, 0 failed.
- [x] **Step 2: Run** (repository root) `just package-test`. Expected: exit 0.
- [x] **Step 3: Run** `just package-test` again. Expected: exit 0.
- [x] **Step 4: Run** `just lint-check`. Expected: exit 0.
