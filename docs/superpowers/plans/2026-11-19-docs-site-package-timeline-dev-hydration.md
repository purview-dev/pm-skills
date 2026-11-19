# R-022 Timeline hydrates in dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Roadmap timeline island hydrates under `pm-docs-site dev` in a packed-install consumer, and the dev browser test checks every island page (Board, Roadmap timeline, Graph).

**Architecture:** Move the timeline island's browser-safe exports out of `src/lib/timeline.ts` (which imports `planning.ts` and so `node:fs`) into a new `src/lib/timeline-state.ts`, as R-012 did with `src/lib/graph-state.ts`. `timeline.ts` re-exports it, so server callers do not change. The islands import only `timeline-state.ts`.

**Tech Stack:** TypeScript, React islands in Astro, Bun test, Playwright (`dev` project).

**Spec:** `docs/superpowers/specs/2026-11-19-docs-site-package-timeline-dev-hydration-design.md`

## Global Constraints

- Work on the checked-out branch `feat/r-022-docs-site-package-timeline-hydrates-in-dev`; create no branch or worktree.
- TypeScript only; no new dependency.
- `roadmap.astro` and `test/timeline.test.ts` keep their imports from `src/lib/timeline` unchanged.
- `timeline-state.ts` imports nothing that reaches `planning.ts` or a `node:` module.
- All commands run in `packages/pm-docs-site` unless stated.

## Review Focus

- A type-only import from `timeline.ts` left in an island: `import type` is erased, but a value import of the same path is not; after the change, `git grep -n "lib/timeline'" -- src/components` must print nothing.
- `MilestoneStatus` is used by `TimelineMilestone`; moving one without the other makes `timeline-state.ts` import `timeline.ts` and re-creates the chain. Both move.
- A console error from another island on the same page fails the new tests, as it should; the tests report the errors before the visibility assertion so the failure says why.
- The Graph page's fixture must have at least one open item, or `graph.astro` renders "No open items" and no island; assert a `.react-flow__node` is visible so an empty fixture fails loudly.

---

### Task 1: Browser-safe timeline state, with dev tests for every island

**Files:**
- Create: `packages/pm-docs-site/src/lib/timeline-state.ts`
- Modify: `packages/pm-docs-site/src/lib/timeline.ts` (remove the moved declarations, lines 10-29 and 73-156, the section comment at 73-77 moving with them; add a re-export)
- Modify: `packages/pm-docs-site/src/components/timeline/Timeline.tsx:14-15`
- Modify: `packages/pm-docs-site/src/components/timeline/useTimelineLayout.ts:11-12`
- Test: `packages/pm-docs-site/test/browser/dev.browser.ts`

**Interfaces:**
- Produces, from `src/lib/timeline-state.ts`, unchanged in name and signature: `MilestoneState`, `MilestoneStatus`, `TimelineMilestone`, `TimelineLayout`, `parseTimelineQuery(search: string): TimelineLayout`, `timelineQuery(layout: TimelineLayout, search: string): string`, `ZOOM`, `PINCH_STEP`, `zoomStep(zoom: number, direction: 1 | -1): number`, `zoomFromWheel(zoom: number, pending: number, deltaY: number, deltaMode: number): { zoom: number; pending: number }`, `wheelScrollsStrip(...)`, and the private constants `ZOOM_TICKS_PER_UNIT`, `ZOOM_MIN_TICKS`, `ZOOM_MAX_TICKS` (lines 104-106). `DONE` (line 31) stays in `timeline.ts`.
- `src/lib/timeline.ts` keeps `parseMilestoneStatus`, `timelineMilestones`, the `normaliseTarget` re-export, and adds `export * from './timeline-state';`.

- [ ] **Step 1: Write the failing dev tests**

In `dev.browser.ts`, extract the existing console and pageerror collection into `function collectErrors(page: Page): string[]` and use it in the Board test. Update the file's header comment to say it covers every island page. Add:

```ts
test('the roadmap timeline hydrates under pm-docs-site dev', async ({ page }) => {
	test.setTimeout(120_000);
	const errors = collectErrors(page);

	await page.goto('/plan/roadmap/', { timeout: 90_000 });
	const toolbar = page.locator('.plan-timeline__toolbar');

	await expect(toolbar).toBeVisible({ timeout: 30_000 }).catch(() => {});
	expect(errors).toEqual([]);
	await expect(toolbar).toBeVisible({ timeout: 1_000 });
	await expect(page.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
	expect(errors).toEqual([]);
});

test('the dependency graph hydrates under pm-docs-site dev', async ({ page }) => {
	test.setTimeout(120_000);
	const errors = collectErrors(page);

	await page.goto('/plan/graph/', { timeout: 90_000 });
	const html = page.locator('html');

	await expect(html).not.toHaveAttribute('data-graph-pending', { timeout: 30_000 }).catch(() => {});
	expect(errors).toEqual([]);
	await expect(html).not.toHaveAttribute('data-graph-pending', { timeout: 1_000 });
	await expect(page.locator('.react-flow__node').first()).toBeVisible();
	expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run them to see the timeline test fail**

Run: `bunx playwright test --project=dev`
Expected: the Board and Graph tests pass; the roadmap timeline test FAILS on `expect(errors).toEqual([])` with an error naming `node:fs` (or the failed island import). If the Graph test fails, stop and report: R-012's fix has regressed and is outside this plan.

- [ ] **Step 3: Create `src/lib/timeline-state.ts` and move the browser-safe declarations into it**

Move the declarations listed under Interfaces verbatim (bodies and doc comments unchanged), with a header comment in the style of `graph-state.ts`: the island's types, URL layout state, and zoom and wheel maths, kept apart from `timeline.ts` because it imports `planning.ts`, which imports `node:fs`, and under `pm-docs-site dev` every module an island imports reaches the browser. Remove them from `timeline.ts`, add `export * from './timeline-state';` there, and have `timeline.ts` import `MilestoneStatus` and `TimelineMilestone` as types from `./timeline-state`.

- [ ] **Step 4: Point the islands at `timeline-state.ts`**

In `Timeline.tsx` and `useTimelineLayout.ts`, change both the value and `import type` lines from `'../../lib/timeline'` to `'../../lib/timeline-state'`.

Run: `git grep -n "lib/timeline'" -- src/components`
Expected: no output.

- [ ] **Step 5: Run the dev tests to see them pass**

Run: `bunx playwright test --project=dev`
Expected: 3 passed.

- [ ] **Step 6: Run the unit tests, type check, and built-site browser tests**

Run: `bun test && bun run check && bunx playwright test --project=chromium`
Expected: all pass; `astro-check` reports 0 errors; `test/timeline.test.ts` passes unchanged.

- [ ] **Step 7: Run the repository checks**

Run (repository root): `just lint-check`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add packages/pm-docs-site/src/lib/timeline-state.ts packages/pm-docs-site/src/lib/timeline.ts packages/pm-docs-site/src/components/timeline/Timeline.tsx packages/pm-docs-site/src/components/timeline/useTimelineLayout.ts packages/pm-docs-site/test/browser/dev.browser.ts
git commit -m "fix(pm-docs-site): timeline hydrates in dev (R-022)"
```
