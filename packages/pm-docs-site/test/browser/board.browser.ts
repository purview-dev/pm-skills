import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'pm-docs-site:board:collapsed';
const COLUMNS = ['now', 'next', 'foryou', 'waiting', 'done'];

for (const width of [1440, 1024, 700]) {
	test(`the five columns sit in one row at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/plan/board/');
		const tops = await Promise.all(COLUMNS.map(async (name) => (await page.locator(`[data-column="${name}"]`).boundingBox())!.y));

		for (const top of tops) expect(Math.abs(top - tops[0]!)).toBeLessThanOrEqual(1);
	});
}

test('a collapsed column stays collapsed after a reload, and expands again', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/plan/board/');
	const done = page.locator('[data-column="done"]');
	const toggle = done.locator('.plan-column__toggle');
	const expandedWidth = (await done.boundingBox())!.width;

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(done).toHaveAttribute('data-collapsed', '');
	expect((await done.boundingBox())!.width).toBeLessThan(64);

	await page.reload();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	expect((await done.boundingBox())!.width).toBeLessThan(64);

	await toggle.click();
	await page.reload();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	expect((await done.boundingBox())!.width).toBeGreaterThanOrEqual(expandedWidth - 1);
});

test('a junk stored value leaves every column expanded and throws nothing', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await page.addInitScript((key) => localStorage.setItem(key, 'not json'), STORAGE_KEY);
	await page.goto('/plan/board/');

	for (const name of COLUMNS) await expect(page.locator(`[data-column="${name}"] .plan-column__toggle`)).toHaveAttribute('aria-expanded', 'true');
	expect(errors).toEqual([]);
});
