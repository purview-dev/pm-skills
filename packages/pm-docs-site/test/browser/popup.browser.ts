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

for (const path of ['/plan/board/', '/plan/roadmap/']) {
	test(`every card link on ${path} says it opens a dialog`, async ({ page }) => {
		await page.goto(path);

		expect(await page.locator('a[data-item]').count()).toBeGreaterThan(0);
		expect(await page.locator('a[data-item]:not([aria-haspopup="dialog"])').count()).toBe(0);
	});
}

test('after filtering, card links still say they open a dialog', async ({ page }) => {
	await page.goto('/plan/board/');
	await expect(page.locator('.plan-board__filters')).toBeVisible();
	await page.selectOption('#board-owner', 'agent');

	expect(await page.locator('a[data-item]').count()).toBeGreaterThan(0);
	expect(await page.locator('a[data-item]:not([aria-haspopup="dialog"])').count()).toBe(0);
});

test('a backdrop click closes the popup; an inside click does not', async ({ page }) => {
	await page.goto('/plan/board/');
	const card = page.locator('a[data-item]').first();
	const id = (await card.getAttribute('data-item'))!;

	await card.click();
	const dialog = page.locator('dialog[data-item-dialog]');
	await expect(dialog).toHaveAttribute('open', '');
	const dialogBox = (await dialog.boundingBox())!;

	await page.mouse.click(dialogBox.x + 2, dialogBox.y + 2);
	await expect(dialog).toHaveAttribute('open', '');

	await dialog.locator('[data-item-dialog-body]').click();
	await expect(dialog).toHaveAttribute('open', '');

	await page.mouse.click(5, 5);
	await expect(dialog).not.toHaveAttribute('open', '');
	expect(await page.evaluate(() => document.activeElement?.getAttribute('data-item'))).toBe(id);
});

test('a drag across the popup edge keeps it open', async ({ page }) => {
	await page.goto('/plan/board/');
	const card = page.locator('a[data-item]').first();

	await card.click();
	const dialog = page.locator('dialog[data-item-dialog]');
	await expect(dialog).toHaveAttribute('open', '');
	const body = dialog.locator('[data-item-dialog-body]');
	const bodyBox = (await body.boundingBox())!;

	// Down inside the dialog body, released on the backdrop: a selection
	// dragged past the popup's edge must not close it.
	await page.mouse.move(bodyBox.x + 5, bodyBox.y + 5);
	await page.mouse.down();
	await page.mouse.move(5, 5);
	await page.mouse.up();
	await expect(dialog).toHaveAttribute('open', '');

	// The reverse drag: down on the backdrop, released inside the body.
	await page.mouse.move(5, 5);
	await page.mouse.down();
	await page.mouse.move(bodyBox.x + 5, bodyBox.y + 5);
	await page.mouse.up();
	await expect(dialog).toHaveAttribute('open', '');
});

test('popup section headings sit below the dialog title', async ({ page }) => {
	await page.goto('/plan/board/');
	const card = page.locator('a[data-item="R-012"]').first();

	await card.click();
	const dialog = page.locator('dialog[data-item-dialog]');
	await expect(dialog).toHaveAttribute('open', '');

	expect(await page.locator('#plan-dialog-title').evaluate((el) => el.tagName)).toBe('H2');
	expect(await page.locator('[data-item-dialog-body] h2').count()).toBe(0);
	expect(await page.locator('[data-item-dialog-body] h3').count()).toBeGreaterThan(0);
});

test('a feature page keeps its section headings at h2', async ({ page }) => {
	await page.goto('/plan/features/r-013/');

	await expect(page.getByRole('heading', { level: 2, name: 'Done when' })).toBeVisible();
});
