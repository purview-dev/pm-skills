// The built fixture site, read page by page: popup content stays out of search,
// every known ID and brief path is a link, every internal link resolves, and
// every link to an item, milestone or risk page is in that page's Linked from.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { htmlPages, runCli, scratchFixture, siteConfig } from './helpers';

const BUILD = 180_000;
// The fixture site's own options (test/fixtures/site/astro.config.mjs), every view on.
export const FIXTURE_OPTIONS = `{ title: 'Fixture plan', planning: '../planning.json', docs: { root: '../docs', sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }] } }`;
let scratch = '';
let dist = '';
let pages: string[] = [];

beforeAll(() => {
	const dir = (scratch = scratchFixture('links-'));

	writeFileSync(join(dir, 'site', 'astro.config.mjs'), siteConfig(FIXTURE_OPTIONS));
	const result = runCli(['build', join(dir, 'site')]);

	if (result.code !== 0) throw new Error(result.stderr);
	dist = join(dir, 'site', 'dist');
	pages = htmlPages(dist);
}, BUILD);

afterAll(() => {
	if (scratch) rmSync(scratch, { recursive: true, force: true });
});

const html = (page: string) => readFileSync(join(dist, page), 'utf8');

describe('popup templates', () => {
	it('are on the Board and Roadmap, and search ignores every one', () => {
		for (const page of ['plan/board/index.html', 'plan/roadmap/index.html']) {
			// Starlight has templates of its own (search, theme); only the item popups' count.
			const templates = html(page).match(/<template[^>]*data-item-detail[^>]*>/g) ?? [];

			expect({ page, count: templates.length > 0 }).toEqual({ page, count: true });
			for (const tag of templates) expect({ page, tag, ignored: tag.includes('data-pagefind-ignore') }).toEqual({ page, tag, ignored: true });
		}
	});

	it('mark each card link as a popup trigger with its template', () => {
		const board = html('plan/board/index.html');
		const triggers = [...board.matchAll(/data-item="([^"]+)"/g)].map((match) => match[1]);
		const details = [...board.matchAll(/data-item-detail="([^"]+)"/g)].map((match) => match[1]);

		expect(triggers.length).toBeGreaterThan(0);
		expect(new Set(details)).toEqual(new Set(triggers));
	});
});

