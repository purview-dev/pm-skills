import { resolve } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { resolveOptions, VIEW_NAMES } from '../lib/options.mjs';

const root = resolve('/site');

describe('resolveOptions', () => {
	it('lists the six optional views', () => {
		expect(VIEW_NAMES).toEqual(['now', 'milestones', 'features', 'inbox', 'briefs', 'strategy']);
	});

	it('applies the defaults', () => {
		const resolved = resolveOptions({ title: 'T' }, root);

		expect(resolved.title).toBe('T');
		expect(resolved.description).toBeNull();
		expect(resolved.planning).toBe(resolve(root, '../planning/planning.json'));
		expect(resolved.docs).toBeNull();
		expect(Object.values(resolved.views)).toEqual([true, true, true, true, true, true]);
	});

	it('switches on only the listed views', () => {
		const { views } = resolveOptions({ title: 'T', views: ['now'] }, root);

		expect(views).toEqual({ now: true, milestones: false, features: false, inbox: false, briefs: false, strategy: false });
	});

	it('resolves the planning path and the docs root from the site root', () => {
		const resolved = resolveOptions({ title: 'T', planning: 'plan.json', docs: { root: '..', sources: [] } }, root);

		expect(resolved.planning).toBe(resolve(root, 'plan.json'));
		expect(resolved.docs).toEqual({ root: resolve(root, '..'), sources: [] });
	});

	it('labels the export with the path as written, so pages never show a machine path', () => {
		expect(resolveOptions({ title: 'T' }, root).planningLabel).toBe('../planning/planning.json');
		expect(resolveOptions({ title: 'T', planning: 'data\\plan.json' }, root).planningLabel).toBe('data/plan.json');
	});

	it('keeps the description', () => {
		expect(resolveOptions({ title: 'T', description: 'D' }, root).description).toBe('D');
	});

	it('requires a title', () => {
		// @ts-expect-error the title is missing on purpose
		expect(() => resolveOptions({}, root)).toThrow('pm-docs-site: title is required');
	});

	it('rejects an unknown view', () => {
		// @ts-expect-error an unknown view on purpose
		expect(() => resolveOptions({ title: 'T', views: ['board'] }, root)).toThrow(
			'pm-docs-site: unknown view "board"; expected one of now, milestones, features, inbox, briefs, strategy',
		);
	});
});
