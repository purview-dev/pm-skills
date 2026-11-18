import { expect, test, type Page } from '@playwright/test';

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

/** Opens the board and waits for the island to hydrate (the filter bar shows). */
async function openBoard(page: Page): Promise<void> {
	await page.goto('/plan/board/');
	await expect(page.locator('.plan-board__filters')).toBeVisible();
}

/** The visible cards' values of one data attribute, and their keys. */
async function visibleCards(page: Page, attribute: string): Promise<{ keys: string[]; values: string[] }> {
	const cards = page.locator('[data-card]:visible');

	return {
		keys: await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-card')!)),
		values: await cards.evaluateAll((elements, name) => elements.map((element) => element.getAttribute(name)!), `data-${attribute}`),
	};
}

// The fixture board (test/fixtures/planning.json): the expected visible-card
// count for each filter value.
const FILTERS: { filter: string; attribute: string; counts: Record<string, number> }[] = [
	{ filter: 'owner', attribute: 'owner', counts: { agent: 3, user: 3, both: 2 } },
	{ filter: 'milestone', attribute: 'milestone', counts: { M1: 3, M2: 3, none: 3 } },
	{ filter: 'size', attribute: 'size', counts: { S: 2, M: 2, L: 2 } },
	{ filter: 'rag', attribute: 'rag', counts: { red: 2, amber: 2, green: 2, none: 3 } },
];

for (const { filter, attribute, counts } of FILTERS) {
	test(`each ${filter} filter leaves only that ${filter}'s cards`, async ({ page }) => {
		await openBoard(page);

		for (const [value, count] of Object.entries(counts)) {
			await page.selectOption(`#board-${filter}`, value);
			await expect(page.locator('[data-card]:visible')).toHaveCount(count);
			const { keys, values } = await visibleCards(page, attribute);

			expect(values).toEqual(Array(count).fill(value));
			if (filter === 'owner') expect(keys).not.toContain('now:R-012');
			if (filter === 'size') expect(keys.filter((key) => key.startsWith('done:'))).toEqual([]);
		}
	});
}

test('filters combine', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-owner', 'user');
	await page.selectOption('#board-rag', 'amber');

	await expect(page.locator('[data-card]:visible')).toHaveCount(1);
	expect((await visibleCards(page, 'owner')).keys).toEqual(['foryou:R-023']);
});

test('counts follow the filter', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-size', 'L');

	await expect(page.locator('[data-column="next"] .plan-column__count')).toHaveText('1');
	await expect(page.locator('#col-now-cards')).toHaveText('Nothing matches');

	await page.click('#board-clear');
	await expect(page.locator('#board-size')).toHaveValue('');
	const counts = await Promise.all(COLUMNS.map((name) => page.locator(`[data-column="${name}"] .plan-column__count`).textContent()));

	expect(counts).toEqual(['1', '2', '2', '2', '2']);
});

test('a card opens its popup', async ({ page }) => {
	await openBoard(page);
	await page.locator('a.plan-item-link[data-item="R-013"]').click();
	const dialog = page.locator('dialog[data-item-dialog]');

	await expect(dialog).toHaveAttribute('open', '');
	await expect(dialog.locator('#plan-dialog-title')).toHaveText('R-013 Email invoices to tenants');
});

test('without JavaScript the full board renders', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();

	await page.goto('/plan/board/');
	await expect(page.locator('[data-card]:visible')).toHaveCount(9);
	await expect(page.locator('.plan-board__filters')).not.toBeVisible();
	await context.close();
});

test('the board hydrates with no page errors', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await openBoard(page);
	await page.selectOption('#board-owner', 'both');
	await expect(page.locator('[data-card]:visible')).toHaveCount(2);
	expect(errors).toEqual([]);
});
