import { expect, test, type Page } from '@playwright/test';

// The fixture (test/fixtures/planning.json): M1 First release, M2 Billing
// (focus). Open items, with their milestone: R-012 now (none, the active
// item), R-013 next (M2), R-014 next (M2), R-021 next (M1), R-022 next (M1),
// R-023 next (M2, blocked, isolated), R-024 next (none), R-020 later (none).
// The seven edges in `lanes-done`: R-010>R-013:depends:0,
// R-021>R-013:depends:0, R-013>R-014:depends:0, R-009>R-021:depends:0,
// R-022>R-024:depends:0, R-099>R-020:depends:0 (R-099 missing),
// R-025>R-020:revisits:0. Chips: R-010 and R-025 (done), R-009 (dropped),
// R-099 (missing).

const EDGE_IDS = ['R-010>R-013:depends:0', 'R-021>R-013:depends:0', 'R-013>R-014:depends:0', 'R-009>R-021:depends:0', 'R-022>R-024:depends:0', 'R-099>R-020:depends:0', 'R-025>R-020:revisits:0'];

/** Waits for the Graph island to hydrate: the toolbar shows once the URL state is applied. */
async function hydrated(page: Page): Promise<void> {
	await expect(page.locator('.plan-graph__toolbar')).toBeVisible();
}

/** Opens the Graph page and waits for the island to hydrate. */
async function openGraph(page: Page, query = ''): Promise<void> {
	await page.goto(`/plan/graph/${query}`);
	await hydrated(page);
}

const graph = (page: Page) => page.locator('.plan-graph');
const node = (page: Page, id: string) => page.locator(`[data-graph-node="${id}"]`);
const lane = (page: Page, key: string) => page.locator(`.plan-graph__lane[data-lane="${key}"]`);
const toolbarButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const toolbarSwitch = (page: Page, name: string) => page.getByRole('switch', { name, exact: true });

test('item nodes link to their feature pages; known chips link, the missing chip does not', async ({ page }) => {
	await openGraph(page);

	for (const id of ['R-012', 'R-013', 'R-014', 'R-021', 'R-022', 'R-023', 'R-024', 'R-020']) {
		await expect(node(page, id).locator('a.plan-graph__id')).toHaveAttribute('href', `/plan/features/${id.toLowerCase()}/`);
	}

	for (const id of ['R-010', 'R-025']) {
		await expect(node(page, id).locator('a.plan-graph__chip-text')).toHaveAttribute('href', `/plan/features/${id.toLowerCase()}/`);
	}

	await expect(node(page, 'R-099').locator('.plan-graph__chip-text')).toHaveText('? R-099 not found');
	await expect(node(page, 'R-099').locator('a')).toHaveCount(0);
});

test('the default layout is lanes-done, with M1, M2, none lanes in order and M2 focused', async ({ page }) => {
	await openGraph(page);

	await expect(graph(page)).toHaveAttribute('data-layout', 'lanes-done');
	const keys = await page.locator('.plan-graph__lane').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-lane')));

	expect(keys).toEqual(['M1', 'M2', 'none']);
	await expect(lane(page, 'M2').locator('.plan-graph__focus')).toHaveText('Focus');
	await expect(lane(page, 'M1').locator('.plan-graph__focus')).toHaveCount(0);
});

test('turning off Milestone lanes writes lanes=off, keeps other parameters and the hash, and switches to flow-done', async ({ page }) => {
	await openGraph(page, '?x=1#top');
	await toolbarSwitch(page, 'Milestone lanes').click();

	await expect(graph(page)).toHaveAttribute('data-layout', 'flow-done');
	await expect.poll(() => new URL(page.url()).search).toBe('?x=1&lanes=off');
	expect(new URL(page.url()).hash).toBe('#top');
	await expect(page.locator('.plan-graph__tray .plan-graph__lane-label')).toHaveText('No links');
});

test('turning off Show done prerequisites writes done=off, hides the R-010 chip, and shows the done count', async ({ page }) => {
	await openGraph(page);
	await toolbarSwitch(page, 'Show done prerequisites').click();

	await expect(graph(page)).toHaveAttribute('data-layout', 'lanes-open');
	await expect.poll(() => new URL(page.url()).search).toBe('?done=off');
	await expect(node(page, 'R-010')).toHaveCount(0);
	await expect(node(page, 'R-013').locator('.plan-graph__note')).toHaveText('✓ 1 done');
});

test('opening with both switches off shows flow-open, with no sampled frame of lanes-done', async ({ page }) => {
	await page.addInitScript(() => {
		document.addEventListener('DOMContentLoaded', () => {
			const element = document.querySelector('.plan-graph');

			(window as unknown as { atReady: unknown }).atReady = {
				pending: document.documentElement.hasAttribute('data-graph-pending'),
				visibility: element ? getComputedStyle(element).visibility : null,
				layout: element?.getAttribute('data-layout') ?? null,
			};
		});
	});
	await page.goto('/plan/graph/?lanes=off&done=off');
	await hydrated(page);

	const atReady = (await page.evaluate(() => (window as unknown as { atReady: unknown }).atReady)) as { pending: boolean; visibility: string | null; layout: string | null };

	if (atReady.pending) expect(atReady.visibility).toBe('hidden');
	else expect(atReady.layout).toBe('flow-open');

	await expect(page.locator('html')).not.toHaveAttribute('data-graph-pending');
	await expect(graph(page)).toHaveAttribute('data-layout', 'flow-open');
});

test('clicking a node selects it, dims unrelated nodes, and opens its page on a second click', async ({ page }) => {
	await openGraph(page);
	await node(page, 'R-013').locator('.plan-graph__meta').click();

	await expect.poll(() => new URL(page.url()).search).toBe('?focus=R-013');
	await expect(node(page, 'R-013')).toHaveAttribute('data-selected', '');
	await expect(node(page, 'R-014')).not.toHaveAttribute('data-dimmed', '');
	await expect(node(page, 'R-021')).not.toHaveAttribute('data-dimmed', '');
	await expect(node(page, 'R-022')).toHaveAttribute('data-dimmed', '');

	await node(page, 'R-013').locator('.plan-graph__meta').click();
	await page.waitForURL('**/plan/features/r-013/');
	expect(new URL(page.url()).pathname).toBe('/plan/features/r-013/');
});

test('Escape clears a clicked selection', async ({ page }) => {
	await openGraph(page);
	await node(page, 'R-013').locator('.plan-graph__meta').click();
	await expect.poll(() => new URL(page.url()).search).toBe('?focus=R-013');

	await page.keyboard.press('Escape');
	await expect.poll(() => new URL(page.url()).search).toBe('');
	await expect(node(page, 'R-013')).not.toHaveAttribute('data-selected', '');
});

test('a focus naming a chip hidden by done=off opens unselected, with no focus key', async ({ page }) => {
	await openGraph(page, '?focus=R-010&done=off');

	await expect(graph(page)).toHaveAttribute('data-layout', 'lanes-open');
	await expect(page.locator('[data-selected]')).toHaveCount(0);
	await expect.poll(() => new URL(page.url()).search).toBe('?done=off');
});

test('Zoom in changes the viewport transform; Fit restores it', async ({ page }) => {
	await openGraph(page);
	const viewport = page.locator('.react-flow__viewport');
	const before = await viewport.evaluate((element) => element.style.transform);

	expect(before).not.toBe('');

	await toolbarButton(page, 'Zoom in').click();
	await expect.poll(() => viewport.evaluate((element) => element.style.transform)).not.toBe(before);

	await toolbarButton(page, 'Fit').click();
	await expect.poll(() => viewport.evaluate((element) => element.style.transform)).toBe(before);
});

test('a wheel outside the canvas scrolls the page', async ({ page }) => {
	await openGraph(page);
	const canvasBox = (await page.locator('.plan-graph__canvas').boundingBox())!;

	await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height + 40);
	const before = await page.evaluate(() => window.scrollY);

	await page.mouse.wheel(0, 400);
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test('usable at 320px', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await openGraph(page);

	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
	await expect(page.locator('.plan-graph__canvas')).toBeVisible();
	await expect(page.locator('.plan-graph__toolbar')).toBeVisible();
});

test('the server-rendered HTML has every node of the default layout; hydration adds and removes none', async ({ page, request }) => {
	const itemIds = ['R-012', 'R-013', 'R-014', 'R-021', 'R-022', 'R-023', 'R-024', 'R-020'];

	const response = await request.get('/plan/graph/');
	const html = await response.text();
	const ssrIds = [...html.matchAll(/data-graph-node="([^"]+)"/g)].map((match) => match[1]!);

	for (const id of itemIds) expect(ssrIds).toContain(id);
	expect(html).toContain('data-layout="lanes-done"');

	await openGraph(page);
	const hydratedIds = await page.locator('[data-graph-node]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-graph-node')));

	expect(new Set(hydratedIds)).toEqual(new Set(ssrIds));
	await expect(graph(page)).toHaveAttribute('data-layout', 'lanes-done');
});

test('Enter on a focused, unselected node selects it once; Escape clears it', async ({ page }) => {
	await openGraph(page);
	const target = node(page, 'R-013');

	await target.focus();
	await expect(target).not.toHaveAttribute('data-selected', '');

	await page.keyboard.press('Enter');
	await expect(target).toHaveAttribute('data-selected', '');
	await expect.poll(() => new URL(page.url()).search).toBe('?focus=R-013');

	await page.keyboard.press('Escape');
	await expect(target).not.toHaveAttribute('data-selected', '');
	await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('the lane layer paints below the edges layer', async ({ page }) => {
	await openGraph(page);

	// Hit-testing is unreliable here: edges are selectable: false and
	// focusable: false, so React Flow gives the whole edges layer
	// pointer-events: none (confirmed with a throwaway script against the
	// built fixture) and elementFromPoint falls straight through it to
	// whatever paints beneath, lane or not, regardless of z-order. The
	// z-index each layer resolves to is the fallback the task names.
	const stacking = await page.evaluate(() => {
		const laneNode = document.querySelector('.plan-graph__lane')?.closest('.react-flow__node');
		const edgesContainer = document.querySelector('.react-flow__edges');

		return { laneZ: laneNode ? getComputedStyle(laneNode).zIndex : null, edgesZ: edgesContainer ? getComputedStyle(edgesContainer).zIndex : null };
	});

	expect(Number(stacking.laneZ)).toBeLessThan(0);
	expect(stacking.edgesZ === 'auto' || Number(stacking.edgesZ) >= 0).toBe(true);
});

test('?lanes=off alone clears the pending mark once hydrated, with no sampled frame of lanes-done', async ({ page }) => {
	await page.addInitScript(() => {
		document.addEventListener('DOMContentLoaded', () => {
			const element = document.querySelector('.plan-graph');

			(window as unknown as { atReady: unknown }).atReady = {
				pending: document.documentElement.hasAttribute('data-graph-pending'),
				visibility: element ? getComputedStyle(element).visibility : null,
				layout: element?.getAttribute('data-layout') ?? null,
			};
		});
	});
	await page.goto('/plan/graph/?lanes=off');
	await hydrated(page);

	const atReady = (await page.evaluate(() => (window as unknown as { atReady: unknown }).atReady)) as { pending: boolean; visibility: string | null; layout: string | null };

	if (atReady.pending) expect(atReady.visibility).toBe('hidden');
	else expect(atReady.layout).toBe('flow-done');

	await expect(page.locator('html')).not.toHaveAttribute('data-graph-pending');
	await expect(graph(page)).toHaveAttribute('data-layout', 'flow-done');
});

test('every fixture edge carries data-graph-edge on its react-flow__edge element', async ({ page }) => {
	await openGraph(page);

	for (const id of EDGE_IDS) await expect(page.locator(`g.react-flow__edge[data-graph-edge="${id}"]`)).toHaveCount(1);
});

test('the graph hydrates with no page errors', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await openGraph(page);
	await toolbarButton(page, 'Zoom in').click();
	await expect.poll(() => page.locator('.react-flow__viewport').evaluate((element) => element.style.transform)).not.toBe('');
	expect(errors).toEqual([]);
});
