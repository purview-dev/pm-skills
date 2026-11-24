import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { resolveOptions } from '../lib/options.ts';
import { pagesOf } from '../lib/repo-docs.ts';
import { buildSidebar } from '../lib/sidebar.ts';

const site = resolve(import.meta.dir, 'fixtures', 'site');
const guide = { label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' };

const link = (label: string, path: string) => ({ label, link: `/plan/${path}/` });

describe('buildSidebar', () => {
	it('lists every plan view in order when all views are on', () => {
		expect(buildSidebar(resolveOptions({ title: 'T' }, site))).toEqual([
			{
				label: 'Plan',
				items: [
					link('Now', 'now'),
					link('Board', 'board'),
					link('Roadmap', 'roadmap'),
					link('Graph', 'graph'),
					link('Milestones', 'milestones'),
					link('Features', 'features'),
					link('Log', 'log'),
					link('Risks', 'risks'),
					link('Decisions', 'decisions'),
					link('Inbox', 'inbox'),
					link('Briefs', 'briefs'),
					link('Strategy', 'strategy'),
				],
			},
		]);
	});

	it('leaves out the views that are off', () => {
		const [plan] = buildSidebar(resolveOptions({ title: 'T', views: ['now'] }, site));

		expect(plan).toEqual({
			label: 'Plan',
			items: [link('Now', 'now'), link('Board', 'board'), link('Roadmap', 'roadmap'), link('Log', 'log'), link('Risks', 'risks')],
		});
	});

	it('adds one group per docs source, with its pages', () => {
		const options = resolveOptions({ title: 'T', docs: { root: '../docs', sources: [guide] } }, site);
		const sidebar = buildSidebar(options);
		const ids = pagesOf(guide, options.docs!.root).map((page) => page.id);

		expect(ids).toContain('docs/readme');
		expect(ids).toContain('docs/guide/intro');
		expect(sidebar[1]).toEqual({ label: 'Guide', collapsed: false, items: ids });
		expect(sidebar).toHaveLength(2);
	});

	it('drops hidden sources and sources with no pages', () => {
		const sources = [
			{ ...guide, hidden: true },
			{ label: 'Empty', base: 'missing', include: ['*.md'] },
		];

		expect(buildSidebar(resolveOptions({ title: 'T', docs: { root: '../docs', sources } }, site))).toHaveLength(1);
	});

	it('adds an Architecture group after the plan group, one link per view group, when architecture.project is set', async () => {
		const project = await mkdtemp(join(tmpdir(), 'architecture-'));
		await mkdir(join(project, 'views'));
		await mkdir(join(project, 'views', 'billing'));
		await writeFile(join(project, 'views', 'landscape.c4'), 'views {\n  view c1-context {\n  }\n}\n');
		await writeFile(join(project, 'views', 'billing', 'flows.c4'), 'views {\n  view flow-invoice {\n  }\n}\n');

		const options = resolveOptions({ title: 'T', architecture: { project } }, site);
		const sidebar = buildSidebar(options);

		expect(sidebar[1]).toEqual({
			label: 'Architecture',
			items: [
				{ label: 'Overview', link: '/architecture/overview/' },
				{ label: 'Billing', link: '/architecture/billing/' },
			],
		});
	});

	it('leaves out the Architecture group when architecture.project is not set', () => {
		expect(buildSidebar(resolveOptions({ title: 'T' }, site))).toHaveLength(1);
	});
});
