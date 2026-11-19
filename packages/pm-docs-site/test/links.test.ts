// The built fixture site, read page by page: popup content stays out of search,
// every known ID and brief path is a link, every internal link resolves, and
// every link to an item, milestone or risk page is in that page's Linked from.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { loadPlanning } from '../src/lib/planning';
import { targets } from '../src/lib/references';
import { FIXTURES, htmlPages, runCli, scratchFixture, siteConfig } from './helpers';
import { scanPage, type PageScan } from './scan';

const BUILD = 180_000;
// The fixture site's own options (test/fixtures/site/astro.config.ts), every view on.
export const FIXTURE_OPTIONS = `{ title: 'Fixture plan', planning: '../planning.json', docs: { root: '../docs', sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }] } }`;
const ALL_VIEWS = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true };
const planning = loadPlanning(join(FIXTURES, 'planning.json'));

interface Build {
	dist: string;
	pages: string[];
	scans: Record<string, PageScan>;
}

const scratches: string[] = [];

/** Build a scratch copy of the fixture with these options and scan every page for these known keys. */
async function build(prefix: string, options: string, known: Set<string>): Promise<Build> {
	const dir = scratchFixture(prefix);

	scratches.push(dir);
	writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(options));
	const result = runCli(['build', join(dir, 'site')]);

	if (result.code !== 0) throw new Error(result.stderr);
	const dist = join(dir, 'site', 'dist');
	const pages = htmlPages(dist);
	const scans: Record<string, PageScan> = {};

	for (const page of pages) scans[page] = await scanPage(readFileSync(join(dist, page), 'utf8'), known);

	return { dist, pages, scans };
}

/** Known keys that have a page in a build with these views (`none` is a page, not text). */
const keysWithPages = (views: typeof ALL_VIEWS) => new Set([...targets(planning, views).values()].filter((target) => target.href && target.key !== 'none').map((target) => target.key));

/** `plan/x/index.html` → `/plan/x/`; `index.html` → `/`. */
const urlOf = (page: string) => `/${page.replace(/index\.html$/, '')}`;
/** `/plan/x/` → `plan/x/index.html`. */
const fileOf = (path: string) => `${path.replace(/^\//, '')}${path.endsWith('/') || path === '' ? 'index.html' : ''}`.replace(/^$/, 'index.html');
const TARGET_PAGE = /^\/plan\/(features|milestones|risks)\/[^/]+\/$/;

let site: Build;
let dist = '';

beforeAll(async () => {
	site = await build('links-', FIXTURE_OPTIONS, keysWithPages(ALL_VIEWS));
	dist = site.dist;
}, BUILD);

afterAll(() => {
	for (const dir of scratches) rmSync(dir, { recursive: true, force: true });
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
		// Astro may inline the client script, whose selectors name these attributes too.
		const board = html('plan/board/index.html').replace(/<script[\s\S]*?<\/script>/g, '');
		const triggers = [...board.matchAll(/data-item="([^"]+)"/g)].map((match) => match[1]);
		const details = [...board.matchAll(/data-item-detail="([^"]+)"/g)].map((match) => match[1]);

		expect(triggers.length).toBeGreaterThan(0);
		expect(new Set(details)).toEqual(new Set(triggers));
	});
});


/** Every unlinked key and every link that does not resolve, page by page. */
function problems({ pages, scans }: Build) {
	const unlinked = pages.flatMap((page) => scans[page]!.unlinked.map((key) => `${page}: ${key}`));
	const dead = pages.flatMap((page) =>
		scans[page]!.links.flatMap((link) => {
			const [path = '', fragment] = link.href.split('#');
			const file = fileOf(path || urlOf(page));

			if (!pages.includes(file)) return [`${page}: ${link.href} (no page)`];
			if (fragment && !scans[file]!.ids.has(decodeURIComponent(fragment))) return [`${page}: ${link.href} (no #${fragment})`];

			return [];
		}),
	);

	return { unlinked, dead };
}

describe('the fixture build', () => {
	it('links every known ID and brief path on every page', () => {
		expect(problems(site).unlinked).toEqual([]);
	});

	it('resolves every internal link and anchor', () => {
		expect(problems(site).dead).toEqual([]);
	});

	it('gives every item, milestone and risk page a Linked from section', () => {
		const missing = site.pages.filter((page) => TARGET_PAGE.test(urlOf(page)) && !site.scans[page]!.hasLinkedFrom);

		expect(missing).toEqual([]);
	});

	it('lists every link to an item, milestone or risk page in the Linked from of that page', () => {
		const missing = site.pages.flatMap((page) =>
			site.scans[page]!.links
				.filter((link) => !link.derived)
				.map((link) => link.href.split('#')[0]!)
				.filter((path) => TARGET_PAGE.test(path) && path !== urlOf(page))
				.filter((path) => !site.scans[fileOf(path)]?.linkedFrom.has(urlOf(page)))
				.map((path) => `${urlOf(page)} -> ${path}`),
		);

		expect([...new Set(missing)]).toEqual([]);
	});

	it('lists in Linked from only pages that do link to that page', () => {
		const extra = site.pages
			.filter((page) => TARGET_PAGE.test(urlOf(page)))
			.flatMap((page) =>
				[...site.scans[page]!.linkedFrom]
					.filter((source) => {
						const scan = site.scans[fileOf(source)];

						return !scan?.links.some((link) => !link.derived && link.href.split('#')[0] === urlOf(page));
					})
					.map((source) => `${urlOf(page)} lists ${source}`),
			);

		expect(extra).toEqual([]);
	});
});

describe('a build with views off', () => {
	const views = { ...ALL_VIEWS, milestones: false, features: false, inbox: false, briefs: false, strategy: false };
	let off: Build;

	beforeAll(async () => {
		off = await build('links-off-', `{ title: 'Views', planning: '../planning.json', views: ['now'] }`, keysWithPages(views));
	}, BUILD);

	it('links only to pages that were built, and links what still has a page', () => {
		expect(problems(off)).toEqual({ unlinked: [], dead: [] });
	});
});