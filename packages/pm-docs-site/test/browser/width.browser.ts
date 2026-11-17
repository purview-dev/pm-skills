import { expect, test } from '@playwright/test';

// Starlight's default content column is 45rem (720px at a 16px root).
const DEFAULT_COLUMN = 720;

test.use({ viewport: { width: 1440, height: 900 } });

for (const path of ['/plan/roadmap/', '/docs/guide/intro/']) {
	test(`${path} uses the full width at 1440px`, async ({ page }) => {
		await page.goto(path);
		const box = await page.locator('main .sl-container').first().boundingBox();

		expect(box?.width ?? 0).toBeGreaterThan(DEFAULT_COLUMN);
	});
}
