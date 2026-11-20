import { expect, test, type Page } from '@playwright/test';

// The fixture (test/fixtures/planning.json): M1 First release (done
// 2026-11-03, no target), M2 Billing (active, focus, target 2026-12-15, 1 of 4
// done), M3 Self-serve upgrades (planned, target 2027-02-01), M4 Partner
// billing (on hold, no target), and the No milestone card. The Now item,
// R-012, is also queued in Later under M2; the Roadmap page lists it once,
// as active (roadmapGroups in src/lib/planning.ts dedupes).

/** Waits for the Timeline island to hydrate: the toolbar shows once the URL state is applied. */
async function hydrated(page: Page): Promise<void> {
	await expect(page.locator('.plan-timeline__toolbar')).toBeVisible();
}

/** Opens the Roadmap page and waits for the island to hydrate. */
async function openRoadmap(page: Page, query = ''): Promise<void> {
	await page.goto(`/plan/roadmap/${query}`);
	await hydrated(page);
}

const strip = (page: Page) => page.locator('ol.plan-timeline__strip');
const card = (page: Page, key: string) => page.locator(`li.plan-timeline__card[data-milestone="${key}"]`);
const readout = (page: Page) => page.locator('.plan-timeline__zoom');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Clicks a toolbar button `times` times. */
async function press(page: Page, name: string, times = 1): Promise<void> {
	for (let i = 0; i < times; i++) await button(page, name).click();
}

test('each card links to its milestone page', async ({ page }) => {
	await openRoadmap(page);

	const keys = await page.locator('li.plan-timeline__card').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-milestone')));

	expect(keys).toEqual(['M1', 'M2', 'M3', 'M4', 'none']);
	await expect(card(page, 'M1').locator('a')).toHaveAttribute('href', '/plan/milestones/m1/');
	await expect(card(page, 'M1').locator('a')).toHaveText('M1 First release');
	await expect(card(page, 'M1')).toContainText('No target');

	const m2 = card(page, 'M2');

	for (const text of ['Focus', 'active', '2026-12-15', '1 of 4 done']) await expect(m2).toContainText(text);
	await expect(card(page, 'none')).toContainText('No milestone');
});

test('planned and other milestones render their state and marker', async ({ page }) => {
	await openRoadmap(page);

	const m3 = card(page, 'M3');

	await expect(m3).toHaveAttribute('data-state', 'planned');
	await expect(m3).toContainText('planned');
	await expect(m3.locator('.plan-timeline__marker')).toBeVisible();

	const m4 = card(page, 'M4');

	await expect(m4).toHaveAttribute('data-state', 'other');
	await expect(m4).toContainText('on hold');
	await expect(m4.locator('.plan-timeline__marker')).toBeVisible();
});

test('the Now item is listed once on the Roadmap page', async ({ page }) => {
	await openRoadmap(page);

	// Scoped to the event feed (StatusTimelineFeed): the timeline strip's cards
	// and the item popup templates are not roadmap item links.
	await expect(page.locator('.status-feed a[data-item="R-012"]')).toHaveCount(1);
});

test('the toggle switches layout and keeps other parameters', async ({ page }) => {
	await openRoadmap(page, '?x=1#top');
	await button(page, 'Top to bottom').click();

	await expect(strip(page)).toHaveAttribute('data-layout', 'vertical');
	await expect.poll(() => new URL(page.url()).search).toBe('?x=1&layout=vertical');
	expect(new URL(page.url()).hash).toBe('#top');
	await expect(button(page, 'Top to bottom')).toHaveAttribute('aria-pressed', 'true');
	await expect(button(page, 'Left to right')).toHaveAttribute('aria-pressed', 'false');

	const first = (await card(page, 'M1').boundingBox())!;
	const second = (await card(page, 'M2').boundingBox())!;

	expect(second.y).toBeGreaterThan(first.y + first.height);

	await button(page, 'Left to right').click();
	await expect(strip(page)).toHaveAttribute('data-layout', 'horizontal');
	await expect.poll(() => new URL(page.url()).search).toBe('?x=1');
});

test('a vertical link renders vertical', async ({ page }) => {
	await openRoadmap(page, '?layout=vertical');

	await expect(strip(page)).toHaveAttribute('data-layout', 'vertical');
	await expect(page.locator('html')).not.toHaveAttribute('data-timeline-pending');
	await expect(button(page, 'Top to bottom')).toHaveAttribute('aria-pressed', 'true');
});

test('a vertical link with no island script still shows the strip', async ({ page }) => {
	await page.route('**/_astro/**/*.js', (route) => route.abort());
	await page.goto('/plan/roadmap/?layout=vertical');

	// The pending mark stays set when the island script never runs; the CSS reveal shows the strip anyway.
	await expect(page.locator('html')).toHaveAttribute('data-timeline-pending', '');
	await expect(strip(page)).toBeVisible({ timeout: 5_000 });
	await expect(strip(page)).toHaveAttribute('data-layout', 'horizontal');
	await expect(page.locator('.plan-timeline__toolbar')).not.toBeVisible();
});

test('zoom buttons resize cards and stop at the limits', async ({ page }) => {
	await openRoadmap(page);
	const width = async () => (await card(page, 'M1').boundingBox())!.width;

	await expect(readout(page)).toHaveText('100%');
	const w = await width();

	await press(page, 'Zoom in');
	await expect(readout(page)).toHaveText('125%');
	expect(Math.abs((await width()) - 1.25 * w)).toBeLessThanOrEqual(2);

	await press(page, 'Zoom in', 3);
	await expect(readout(page)).toHaveText('200%');
	await expect(button(page, 'Zoom in')).toHaveAttribute('aria-disabled', 'true');
	await expect(button(page, 'Zoom out')).toHaveAttribute('aria-disabled', 'false');

	await press(page, 'Reset zoom');
	await expect(readout(page)).toHaveText('100%');
	expect(Math.abs((await width()) - w)).toBeLessThanOrEqual(2);

	await press(page, 'Zoom out', 2);
	await expect(readout(page)).toHaveText('50%');
	await expect(button(page, 'Zoom out')).toHaveAttribute('aria-disabled', 'true');
	await expect(button(page, 'Zoom in')).toHaveAttribute('aria-disabled', 'false');
});

test('a zoom button keeps focus and stays at the limit', async ({ page }) => {
	await openRoadmap(page);

	const zoomIn = button(page, 'Zoom in');

	await zoomIn.focus();
	for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
	await expect(readout(page)).toHaveText('200%');
	await expect(zoomIn).toBeFocused();
	await expect(zoomIn).toHaveAttribute('aria-label', 'Zoom in');

	await page.keyboard.press('Enter');
	await expect(readout(page)).toHaveText('200%');
	await expect(zoomIn).toBeFocused();

	const zoomOut = button(page, 'Zoom out');

	await zoomOut.focus();
	for (let i = 0; i < 6; i++) await page.keyboard.press('Enter');
	await expect(readout(page)).toHaveText('50%');
	await expect(zoomOut).toBeFocused();
	await expect(zoomOut).toHaveAttribute('aria-label', 'Zoom out');

	await page.keyboard.press('Enter');
	await expect(readout(page)).toHaveText('50%');
	await expect(zoomOut).toBeFocused();

	const reset = button(page, 'Reset zoom');

	await reset.focus();
	await page.keyboard.press('Enter');
	await expect(readout(page)).toHaveText('100%');
	await expect(reset).toBeFocused();

	await page.keyboard.press('Enter');
	await expect(readout(page)).toHaveText('100%');
	await expect(reset).toBeFocused();
});

test('Ctrl + wheel over the strip zooms the strip, not the page', async ({ page }) => {
	await openRoadmap(page);
	// A bubbling listener on window sees whether the strip cancelled the browser's page zoom.
	await page.evaluate(() => {
		window.addEventListener('wheel', (event) => {
			(window as unknown as { wheelPrevented?: boolean }).wheelPrevented = event.defaultPrevented;
		});
	});
	await strip(page).hover();
	await page.keyboard.down('Control');
	await page.mouse.wheel(0, -100);
	await page.keyboard.up('Control');

	await expect(readout(page)).toHaveText('125%');
	await expect.poll(() => page.evaluate(() => (window as unknown as { wheelPrevented?: boolean }).wheelPrevented)).toBe(true);
});

test('zooming keeps the point at the centre of the strip', async ({ page }) => {
	await page.setViewportSize({ width: 700, height: 900 });
	await openRoadmap(page);
	await press(page, 'Zoom in', 2);
	await expect(readout(page)).toHaveText('150%');
	await strip(page).evaluate((element) => (element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2));

	const ratio = () => strip(page).evaluate((element) => (element.scrollLeft + element.clientWidth / 2) / element.scrollWidth);
	const before = await ratio();

	expect(await strip(page).evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
	await press(page, 'Zoom in');
	await expect(readout(page)).toHaveText('175%');
	expect(Math.abs((await ratio()) - before)).toBeLessThanOrEqual(0.02);
});

test('the zoom anchor holds across two zoom changes before one render', async ({ page }) => {
	await page.setViewportSize({ width: 700, height: 900 });
	await openRoadmap(page);
	await press(page, 'Zoom in', 2);
	await expect(readout(page)).toHaveText('150%');
	await strip(page).evaluate((element) => (element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2));

	const ratio = () => strip(page).evaluate((element) => (element.scrollLeft + element.clientWidth / 2) / element.scrollWidth);
	const before = await ratio();

	await strip(page).evaluate((element) => {
		element.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true, bubbles: true }));
		element.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true, bubbles: true }));
	});

	await expect(readout(page)).toHaveText('200%');
	expect(Math.abs((await ratio()) - before)).toBeLessThanOrEqual(0.02);
});

/** At 700×900, zooms to 200% so the strip overflows, and hovers it. */
async function overflowingStrip(page: Page): Promise<void> {
	await page.setViewportSize({ width: 700, height: 900 });
	await openRoadmap(page);
	await press(page, 'Zoom in', 4);
	await expect(readout(page)).toHaveText('200%');
	await strip(page).hover();
	expect(await strip(page).evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
}

test('a line-mode wheel scrolls the strip by lines', async ({ page }) => {
	await overflowingStrip(page);
	await strip(page).evaluate((element) => (element.scrollLeft = 0));

	await strip(page).evaluate((element) => {
		element.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true }));
	});

	expect(await strip(page).evaluate((element) => element.scrollLeft)).toBeGreaterThan(3);
});

test('a plain wheel scrolls an overflowing strip sideways', async ({ page }) => {
	await overflowingStrip(page);
	await strip(page).evaluate((element) => (element.scrollLeft = 0));
	const before = await page.evaluate(() => window.scrollY);

	await page.mouse.wheel(0, 200);

	await expect.poll(() => strip(page).evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
	expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test("a plain wheel at the strip's end scrolls the page", async ({ page }) => {
	await overflowingStrip(page);
	await strip(page).evaluate((element) => (element.scrollLeft = element.scrollWidth - element.clientWidth));
	const before = await page.evaluate(() => window.scrollY);

	await page.mouse.wheel(0, 200);

	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test('usable at 320px', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await openRoadmap(page);

	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
	await expect(strip(page)).toBeVisible();
	await expect(page.locator('.plan-timeline__toolbar')).toBeVisible();
});

test('the timeline hydrates with no page errors', async ({ page }) => {
	const errors: Error[] = [];

	page.on('pageerror', (error) => errors.push(error));
	await openRoadmap(page);
	await press(page, 'Zoom in');
	await expect(readout(page)).toHaveText('125%');
	expect(errors).toEqual([]);
});
