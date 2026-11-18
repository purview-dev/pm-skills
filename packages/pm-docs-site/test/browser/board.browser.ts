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
	await openBoard(page);
	const done = page.locator('[data-column="done"]');
	const toggle = done.locator('.plan-column__toggle');
	const expandedWidth = (await done.boundingBox())!.width;

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(done).toHaveAttribute('data-collapsed', '');
	expect((await done.boundingBox())!.width).toBeLessThan(64);

	await page.reload();
	await hydrated(page);
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	expect((await done.boundingBox())!.width).toBeLessThan(64);

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await page.reload();
	await hydrated(page);
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	expect((await done.boundingBox())!.width).toBeGreaterThanOrEqual(expandedWidth - 1);
});

test('a junk stored value leaves every column expanded and throws nothing', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await page.addInitScript((key) => localStorage.setItem(key, 'not json'), STORAGE_KEY);
	await openBoard(page);

	for (const name of COLUMNS) await expect(page.locator(`[data-column="${name}"] .plan-column__toggle`)).toHaveAttribute('aria-expanded', 'true');
	expect(errors).toEqual([]);
});

test('ungrouped, each column header joins its cards cell', async ({ page }) => {
	await openBoard(page);

	for (const name of COLUMNS) {
		const header = await page.locator(`[data-column="${name}"]`).evaluate((element) => getComputedStyle(element).borderBottomWidth);
		const cell = await page.locator(`#col-${name}-cards`).evaluate((element) => getComputedStyle(element).borderTopWidth);

		expect({ name, header, cell }).toEqual({ name, header: '0px', cell: '0px' });
	}
});

/** Waits for the Board island to hydrate: the filter bar shows once it has. */
async function hydrated(page: Page): Promise<void> {
	await expect(page.locator('.plan-board__filters')).toBeVisible();
}

/** Opens the board and waits for the island to hydrate. */
async function openBoard(page: Page): Promise<void> {
	await page.goto('/plan/board/');
	await hydrated(page);
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

test('the filter labels name what they filter, as the docs do', async ({ page }) => {
	await openBoard(page);

	expect(await page.locator('.plan-board__filter label').allTextContents()).toEqual(['Owner', 'Milestone', 'Size', 'RAG', 'Group by']);
});

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

/** The lanes' keys and their header counts, in page order. */
async function laneSummary(page: Page): Promise<{ keys: string[]; counts: string[] }> {
	const lanes = page.locator('[data-lane]');

	return {
		keys: await lanes.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-lane')!)),
		counts: await page.locator('[data-lane] .plan-lane__count').allTextContents(),
	};
}

test('grouping by milestone renders one lane per milestone', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-group', 'milestone');

	await expect(page.locator('[data-lane]')).toHaveCount(3);
	expect(await laneSummary(page)).toEqual({ keys: ['M1', 'M2', 'none'], counts: ['3', '3', '3'] });
	const inM1 = await page.locator('[data-lane="M1"] [data-card]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-milestone')));

	expect(inM1).toEqual(['M1', 'M1', 'M1']);
});

test('grouping by owner renders one lane per owner', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-group', 'owner');

	await expect(page.locator('[data-lane]')).toHaveCount(4);
	expect(await laneSummary(page)).toEqual({ keys: ['agent', 'user', 'both', 'none'], counts: ['3', '3', '2', '1'] });
});

test('grouping and filtering together drop empty lanes', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-owner', 'user');
	await page.selectOption('#board-group', 'milestone');

	await expect(page.locator('[data-lane]')).toHaveCount(3);
	expect(await laneSummary(page)).toEqual({ keys: ['M1', 'M2', 'none'], counts: ['1', '1', '1'] });

	await page.click('#board-clear');
	await page.selectOption('#board-rag', 'green');
	await page.selectOption('#board-group', 'owner');

	await expect(page.locator('[data-lane]')).toHaveCount(1);
	expect(await laneSummary(page)).toEqual({ keys: ['both'], counts: ['2'] });
});

test('Clear resets the group', async ({ page }) => {
	await openBoard(page);
	const clear = page.locator('#board-clear');

	await expect(clear).toBeDisabled();
	await page.selectOption('#board-group', 'owner');
	await expect(clear).toBeEnabled();

	await clear.click();
	await expect(page.locator('#board-group')).toHaveValue('none');
	await expect(page.locator('.plan-lane__header')).toHaveCount(0);
	await expect(page.locator('[data-card]:visible')).toHaveCount(9);
	await expect(clear).toBeDisabled();
	await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('the URL carries the state', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-owner', 'user');
	await page.selectOption('#board-group', 'owner');

	await expect.poll(() => page.url()).toMatch(/\?owner=user&group=owner$/);

	await page.reload();
	await hydrated(page);
	await expect(page.locator('#board-owner')).toHaveValue('user');
	await expect(page.locator('#board-group')).toHaveValue('owner');
	expect(await laneSummary(page)).toEqual({ keys: ['user'], counts: ['3'] });
});

test('a filtered link never shows the unfiltered board', async ({ page }) => {
	// Hydration is async and may finish before or after DOMContentLoaded, so at
	// DOMContentLoaded the board is either still marked pending and hidden, or
	// already unmarked and showing only the filtered lane.
	await page.addInitScript(() => {
		document.addEventListener('DOMContentLoaded', () => {
			const body = document.querySelector('.plan-board__body');

			(window as unknown as { atReady: unknown }).atReady = {
				body: body !== null,
				pending: document.documentElement.hasAttribute('data-board-pending'),
				visibility: body ? getComputedStyle(body).visibility : null,
				lanes: [...document.querySelectorAll('[data-lane]')].map((element) => element.getAttribute('data-lane')),
			};
		});
	});
	await page.goto('/plan/board/?owner=user&group=owner');
	await hydrated(page);

	const atReady = (await page.evaluate(() => (window as unknown as { atReady: unknown }).atReady)) as { body: boolean; pending: boolean; visibility: string | null; lanes: string[] };

	expect(atReady.body).toBe(true);
	if (atReady.pending) expect(atReady.visibility).toBe('hidden');
	else expect(atReady.lanes).toEqual(['user']);

	await expect(page.locator('html')).not.toHaveAttribute('data-board-pending');
	expect(await laneSummary(page)).toEqual({ keys: ['user'], counts: ['3'] });
	await expect(page.locator('[data-card]:visible')).toHaveCount(3);
	await expect(page.locator('.plan-board__body')).toHaveCSS('visibility', 'visible');
});

test('a filtered link still shows the board when the island never loads', async ({ page }) => {
	const url = await page.goto('/plan/board/').then(() => page.locator('astro-island').first().getAttribute('component-url'));

	expect(url).toMatch(/\/Board\..*\.js$/);
	// By path: Astro retries a failed island import with an `astro-retry` query.
	await page.route((request) => request.pathname === url, (route) => route.abort());
	await page.goto('/plan/board/?owner=user&group=owner');

	// The island never hydrates, so the pending mark stays and the filter bar stays hidden.
	await expect(page.locator('html')).toHaveAttribute('data-board-pending', '');
	await expect(page.locator('.plan-board__filters')).not.toBeVisible();
	// The board shows anyway, unfiltered, after a short delay.
	await expect(page.locator('.plan-board__body')).toHaveCSS('visibility', 'visible', { timeout: 10_000 });
	await expect(page.locator('[data-card]:visible')).toHaveCount(9);
});

test('junk in the URL gives the default board', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await page.goto('/plan/board/?owner=boss&size=XL&group=sideways&milestone=M9');
	await hydrated(page);

	await expect(page.locator('html')).not.toHaveAttribute('data-board-pending');
	await expect(page.locator('[data-card]:visible')).toHaveCount(9);
	await expect(page.locator('.plan-lane__header')).toHaveCount(0);
	await expect(page.locator('#board-group')).toHaveValue('none');
	expect(errors).toEqual([]);
});

test('a collapsed column collapses in every lane', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await openBoard(page);
	await page.selectOption('#board-group', 'owner');
	await page.locator('[data-column="done"] .plan-column__toggle').click();

	const check = async () => {
		const cells = page.locator('[data-lane-column="done"]');

		await expect(cells).toHaveCount(4);
		for (const cell of await cells.all()) {
			await expect(cell.locator('[data-card]:visible')).toHaveCount(0);
			expect((await cell.boundingBox())!.width).toBeLessThan(64);
		}
	};

	await check();
	await page.reload();
	await hydrated(page);
	await expect(page.locator('#board-group')).toHaveValue('owner');
	await check();
});

test('a card in a lane opens its popup', async ({ page }) => {
	await openBoard(page);
	await page.selectOption('#board-group', 'milestone');
	await page.locator('[data-lane="M1"] a.plan-item-link[data-item="R-022"]').click();
	const dialog = page.locator('dialog[data-item-dialog]');

	await expect(dialog).toHaveAttribute('open', '');
	await expect(dialog.locator('#plan-dialog-title')).toHaveText('R-022 Usage-based pricing tiers');
});

test('the board hydrates with no page errors', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await openBoard(page);
	await page.selectOption('#board-owner', 'both');
	await expect(page.locator('[data-card]:visible')).toHaveCount(2);
	expect(errors).toEqual([]);
});
