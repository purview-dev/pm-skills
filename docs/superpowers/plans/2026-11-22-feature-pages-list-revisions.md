# R-025 Feature pages list revisions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tested `revisers()` function in `packages/pm-docs-site` returns the items whose `Revisits` names an item, and the feature page's "Revised by" list uses it.

**Architecture:** Move the inline filter in `FeatureSummary.astro` into `src/lib/planning.ts` beside `dependents()`, and unit-test it against the existing fixture. The rendered output is unchanged.

**Tech Stack:** TypeScript, Astro, `bun:test`.

**Spec:** `docs/superpowers/specs/2026-11-22-feature-pages-list-revisions-design.md`

## Global Constraints

- Do not edit `skills/pm-docs-site/templates/` (frozen: `planning/STRATEGY.md` Not doing).
- Done revisions are out of scope (parked: `planning/inbox/2026-11-22-1809-done-revisions-lose-revised-by.md`).
- Commit subjects are lowercase conventional commits (commitlint `subject-case`).
- Work on the checked-out branch `feat/r-025-docs-site-package-feature-pages-list-revisions`; no new branch or worktree.

## Review Focus

- An active `NOW.md` item whose `revisits` is set must count as a reviser of its target (`features()` copies `now.item.revisits`). This is pinned in Task 1, Step 1.
- An ID that nobody revises must return `[]`, not `undefined`, because the page checks `revisedBy.length`. Pinned in Task 1, Step 1.
- Order follows `features()` (Now, Next, Later), so the page lists revisers in roadmap order. Pinned by the `toEqual` on IDs in Task 1, Step 1.

---

### Task 1: `revisers()` and the feature page

**Files:**
- Modify: `packages/pm-docs-site/src/lib/planning.ts` (beside `dependents()`, around line 338)
- Modify: `packages/pm-docs-site/src/components/FeatureSummary.astro` (the import on line 5, and line 25)
- Test: `packages/pm-docs-site/test/planning.test.ts` (the import list, and `describe('features')`, around line 369)

**Interfaces:**
- Produces: `export function revisers(all: Feature[], id: string): Feature[]`. It returns the items whose `revisits === id`, in `all` order.

- [x] **Step 1: Write the failing test**

Add `revisers` to the import list. Add this case inside `describe('features')`, after the `dependents` case:

```ts
it('finds the items that revise an item, an active one included', () => {
	expect(revisers(all, 'R-025').map((feature) => [feature.id, feature.title])).toEqual([['R-020', 'README matches the code']]);
	expect(revisers(all, 'R-013')).toEqual([]);

	const populated = {
		...planning,
		now: { ...planning.now, item: { id: 'R-012', title: 'Invoice export', serves: [], owner: 'agent', size: 'S', dependsOn: [], revisits: 'R-003' } },
	} as unknown as Planning;
	expect(revisers(features(populated), 'R-003').map((feature) => feature.id)).toEqual(['R-012']);
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `cd packages/pm-docs-site; bun test test/planning.test.ts`
Expected: FAIL, because `revisers` is not exported from `../src/lib/planning`.

- [x] **Step 3: Implement `revisers(all: Feature[], id: string): Feature[]` in `src/lib/planning.ts`**

Put it directly after `dependents()`, with the doc comment `/** The items whose \`Revisits\` names \`id\`. */`, and filter on `feature.revisits === id`.

- [x] **Step 4: Use it in `FeatureSummary.astro`**

Add `revisers` to the import from `'../lib/planning'`, and replace line 25 with `const revisedBy = revisers(all, feature.id);`. Leave the markup unchanged.

- [x] **Step 5: Run the package checks and confirm they pass**

Run: `cd packages/pm-docs-site; bun test test/planning.test.ts`
Expected: PASS, including the new case.

Run: `just package-test`
Expected: exit code 0.

- [x] **Step 6: Commit**

```bash
git add packages/pm-docs-site/src/lib/planning.ts packages/pm-docs-site/src/components/FeatureSummary.astro packages/pm-docs-site/test/planning.test.ts
git commit -m "feat(pm-docs-site): tested revisers() for the feature page revised by list (R-025)"
```
