import { resolve } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { resolveOptions, VIEW_NAMES } from '../lib/options.ts';

const root = resolve('/site');

describe('resolveOptions', () => {
	it('lists the eight optional views', () => {
		expect(VIEW_NAMES).toEqual(['now', 'milestones', 'graph', 'features', 'inbox', 'briefs', 'strategy', 'decisions']);
	});

	it('applies the defaults', () => {
		const resolved = resolveOptions({ title: 'T' }, root);

		expect(resolved.title).toBe('T');
		expect(resolved.description).toBeNull();
		expect(resolved.planning).toBe(resolve(root, '../planning/planning.json'));
		expect(resolved.docs).toBeNull();
		expect(Object.values(resolved.views)).toEqual([true, true, true, true, true, true, true, true]);
	});

	it('switches on only the listed views', () => {
		const { views } = resolveOptions({ title: 'T', views: ['now'] }, root);

		expect(views).toEqual({ now: true, milestones: false, graph: false, features: false, inbox: false, briefs: false, strategy: false, decisions: false });
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

	it.each([
		[{}, 'pm-docs-site: docs.root must be a path'],
		[{ root: '..' }, 'pm-docs-site: docs.sources must be a list of sources'],
		[{ root: 1, sources: [] }, 'pm-docs-site: docs.root must be a path'],
		[{ root: '..', sources: [{ label: 'X' }] }, 'pm-docs-site: docs source "X" needs base and include'],
	])('rejects a malformed docs option %p', (docs, message) => {
		// @ts-expect-error malformed on purpose
		expect(() => resolveOptions({ title: 'T', docs }, root)).toThrow(message);
	});

	it('rejects an unknown view', () => {
		// @ts-expect-error an unknown view on purpose
		expect(() => resolveOptions({ title: 'T', views: ['board'] }, root)).toThrow(
			'pm-docs-site: unknown view "board"; expected one of now, milestones, graph, features, inbox, briefs, strategy, decisions',
		);
	});
});

describe('architecture option', () => {
	it('is null when absent', () => {
		expect(resolveOptions({ title: 'T' }, root).architecture).toBeNull();
	});

	it('treats null like absent', () => {
		expect(resolveOptions({ title: 'T', architecture: null }, root).architecture).toBeNull();
	});

	it('applies the defaults from an empty object', () => {
		expect(resolveOptions({ title: 'T', architecture: {} }, root).architecture).toEqual({
			project: null,
			highlighting: true,
			markersRoot: root,
		});
	});

	it('resolves project from the site root and markersRoot from docs.root', () => {
		const resolved = resolveOptions({ title: 'T', architecture: { project: 'arch' }, docs: { root: '..', sources: [] } }, root);

		expect(resolved.architecture).toEqual({
			project: resolve(root, 'arch'),
			highlighting: true,
			markersRoot: resolve(root, '..'),
		});
	});

	it('keeps highlighting false when set', () => {
		expect(resolveOptions({ title: 'T', architecture: { highlighting: false } }, root).architecture).toEqual({
			project: null,
			highlighting: false,
			markersRoot: root,
		});
	});

	it.each([
		['x', 'pm-docs-site: architecture must be an object'],
		[1, 'pm-docs-site: architecture must be an object'],
		[[], 'pm-docs-site: architecture must be an object'],
		[true, 'pm-docs-site: architecture must be an object'],
	])('rejects a malformed architecture option %p', (architecture, message) => {
		// @ts-expect-error malformed on purpose
		expect(() => resolveOptions({ title: 'T', architecture }, root)).toThrow(message);
	});

	it.each([[''], [1]])('rejects an invalid architecture.project %p', (project) => {
		// @ts-expect-error malformed on purpose
		expect(() => resolveOptions({ title: 'T', architecture: { project } }, root)).toThrow('pm-docs-site: architecture.project must be a path');
	});

	it('rejects a non-boolean architecture.highlighting', () => {
		// @ts-expect-error malformed on purpose
		expect(() => resolveOptions({ title: 'T', architecture: { highlighting: 'yes' } }, root)).toThrow(
			'pm-docs-site: architecture.highlighting must be true or false',
		);
	});
});
