import { expect, test, type Page } from '@playwright/test';

const rows = (page: Page) => page.locator('[data-adr]:visible');

/** Opens a Decisions URL and waits for the island to hydrate (Astro drops `ssr` once it has). */
async function openDecisions(page: Page, path = '/plan/decisions/'): Promise<void> {
	await page.goto(path);
	await expect(page.locator('astro-island:has(.decisions)')).not.toHaveAttribute('ssr', '');
}

const ids = async (page: Page) => rows(page).evaluateAll((items) => items.map((item) => item.getAttribute('data-adr')));

test('hides superseded ADRs by default', async ({ page }) => {
	await openDecisions(page);

	expect(await ids(page)).toEqual(['ADR-003', 'ADR-004', 'ADR-002']);
	await expect(page.locator('[data-adr="ADR-001"]')).toBeHidden();
});

test('keeps the search and a chip in the URL across a reload, and Clear restores the default', async ({ page }) => {
	await openDecisions(page);
	const superseded = page.getByRole('button', { name: 'superseded' });

	await page.getByLabel('Search decisions').fill('invoices');
	await superseded.click();
	await expect(superseded).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => ids(page)).toEqual(['ADR-001', 'ADR-002']);
	await expect.poll(() => new URL(page.url()).search).toBe('?q=invoices&status=proposed%2Caccepted%2Cdeprecated%2Csuperseded');

	await page.reload();
	await expect(page.locator('astro-island:has(.decisions)')).not.toHaveAttribute('ssr', '');
	await expect(page.getByLabel('Search decisions')).toHaveValue('invoices');
	await expect(superseded).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => ids(page)).toEqual(['ADR-001', 'ADR-002']);

	await page.getByRole('button', { name: 'Clear' }).click();
	await expect.poll(() => new URL(page.url()).search).toBe('');
	await expect(page.getByLabel('Search decisions')).toHaveValue('');
	await expect(superseded).toHaveAttribute('aria-pressed', 'false');
});

test('groups by status in lifecycle order', async ({ page }) => {
	await openDecisions(page, '/plan/decisions/?group=status');

	await expect.poll(() => page.locator('.decisions section:visible h2').allTextContents()).toEqual(['Proposed (1)', 'Accepted (1)', 'Deprecated (1)']);
});
