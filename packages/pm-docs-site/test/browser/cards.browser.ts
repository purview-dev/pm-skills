import { expect, test } from '@playwright/test';

for (const path of ['/plan/board/', '/plan/roadmap/', '/plan/inbox/']) {
	test(`cards are not tab stops on ${path}`, async ({ page }) => {
		await page.goto(path);

		if (path === '/plan/inbox/') {
			expect(await page.locator('.k-item').count()).toBeGreaterThan(0);
		}
		expect(await page.locator('.k-item[tabindex], .task-card[tabindex]').count()).toBe(0);
	});
}
