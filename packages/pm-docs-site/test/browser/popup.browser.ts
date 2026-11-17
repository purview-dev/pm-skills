import { expect, test, type Page } from '@playwright/test';

/** The text of a card's popup template, whitespace collapsed. */
const templateText = (page: Page, id: string) =>
	page.evaluate((item) => document.querySelector<HTMLTemplateElement>(`template[data-item-detail="${item}"]`)!.content.textContent!.replace(/\s+/g, ' ').trim(), id);

for (const path of ['/plan/board/', '/plan/roadmap/']) {
	test(`a plain click on a card on ${path} opens its popup, and Escape closes it`, async ({ page }) => {
		await page.goto(path);
		const card = page.locator('a[data-item]').first();
		const id = (await card.getAttribute('data-item'))!;
		const href = (await card.getAttribute('href'))!;

		await card.click();
		const dialog = page.locator('dialog[data-item-dialog]');

		await expect(dialog).toHaveAttribute('open', '');
		await expect(dialog.locator('[data-item-dialog-open]')).toHaveAttribute('href', href);
		await expect(dialog.locator('#plan-dialog-title')).toHaveText((await card.textContent())!.trim());
		expect((await dialog.locator('[data-item-dialog-body]').textContent())!.replace(/\s+/g, ' ').trim()).toBe(await templateText(page, id));
		expect(new URL(page.url()).pathname).toBe(path);

		await page.keyboard.press('Escape');
		await expect(dialog).not.toHaveAttribute('open', '');
		expect(await page.evaluate(() => document.activeElement?.getAttribute('data-item'))).toBe(id);
	});
}

test('a ctrl-click on a card opens its page in a new tab and no popup', async ({ page, context }) => {
	await page.goto('/plan/board/');
	const card = page.locator('a[data-item]').first();
	const href = (await card.getAttribute('href'))!;
	const opened = context.waitForEvent('page');

	await card.click({ modifiers: ['ControlOrMeta'] });
	const tab = await opened;

	await tab.waitForLoadState();
	expect(new URL(tab.url()).pathname).toBe(href);
	await expect(page.locator('dialog[data-item-dialog]')).not.toHaveAttribute('open', '');
});

test('a click on a card milestone tag goes to the milestone page, with no popup', async ({ page }) => {
	await page.goto('/plan/board/');
	const tag = page.locator('a.k-item__tag').first();
	const href = (await tag.getAttribute('href'))!;

	await tag.click();
	await page.waitForURL(`**${href}`);
	expect(new URL(page.url()).pathname).toBe(href);
});
