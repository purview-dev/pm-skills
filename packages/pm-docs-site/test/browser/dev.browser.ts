// Every island page under `pm-docs-site dev` in a packed-install consumer
// (dev-server.ts, playwright.config.ts project `dev`): the Board, the Roadmap
// timeline, and the Graph. The built site cannot show this: Vite serves
// dependencies differently in dev, a dependency it does not pre-bundle reaches
// the browser as raw CommonJS, and every module an island imports reaches the
// browser, so one that imports `node:fs` breaks the island.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Collects the page's console errors and page errors. Astro reports a failed island with console.error, not a page error. */
function collectErrors(page: Page): string[] {
	const errors: string[] = [];

	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));

	return errors;
}

test('a filtered board hydrates under pm-docs-site dev', async ({ page }) => {
	test.setTimeout(120_000);
	const errors = collectErrors(page);

	await page.goto('/plan/board/?owner=user&group=owner', { timeout: 90_000 });

	const html = page.locator('html');

	// Report the console errors first: they say why the island did not hydrate.
	await expect(html).not.toHaveAttribute('data-board-pending', { timeout: 30_000 }).catch(() => {});
	expect(errors).toEqual([]);
	await expect(html).not.toHaveAttribute('data-board-pending', { timeout: 1_000 });
	await expect(page.locator('.plan-board__filters')).toBeVisible();
	const lanes = await page.locator('[data-lane]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-lane')));

	expect(lanes).toEqual(['user']);
	expect(errors).toEqual([]);
});

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

	// The toolbar shows only once the island has applied its state; the nodes
	// and `data-graph-pending` (absent without `lanes=off` or `done=off`) are
	// already right in the server HTML, so neither proves hydration.
	const toolbar = page.locator('.plan-graph__toolbar');

	await expect(toolbar).toBeVisible({ timeout: 30_000 }).catch(() => {});
	expect(errors).toEqual([]);
	await expect(toolbar).toBeVisible({ timeout: 1_000 });
	await expect(page.locator('.react-flow__node').first()).toBeVisible();
	expect(errors).toEqual([]);
});
