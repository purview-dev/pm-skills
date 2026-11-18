// The Board under `pm-docs-site dev` in a packed-install consumer
// (dev-server.ts, playwright.config.ts project `dev`). The built site cannot
// show this: Vite serves dependencies differently in dev, and a dependency it
// does not pre-bundle reaches the browser as raw CommonJS.
import { expect, test } from '@playwright/test';

test('a filtered board hydrates under pm-docs-site dev', async ({ page }) => {
	test.setTimeout(120_000);
	const errors: string[] = [];

	// Astro reports a failed island with console.error, not a page error.
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));

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
