import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import {
	briefAnchor,
	briefOf,
	dependents,
	derivedRag,
	docsHref,
	docsPages,
	featureHref,
	features,
	initials,
	loadPlanning,
	milestoneHref,
	milestoneId,
	milestoneSummaries,
	PlanningExportError,
	planProgress,
	riskMatrix,
	roadmapGroups,
	severityToPriority,
	sizeToPriority,
	sourceInitials,
} from '../src/lib/planning';
import type { Planning } from '../src/lib/planning-types';

// A synthetic export, never the project's own: the tests must not change when the plan does.
const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));

describe('loadPlanning', () => {
	it('reads the export', () => {
		expect(loadPlanning(FIXTURE).now.item?.id).toBe('R-012');
	});

	it('reads the export named in the integration options by default', () => {
		// test/setup.ts points virtual:pm-docs-site/config at the fixture.
		expect(loadPlanning().now.item?.id).toBe('R-012');
	});

	it('fails naming pm-export for a missing file', () => {
		const missing = join(tmpdir(), 'nowhere', 'planning.json');

		expect(() => loadPlanning(missing)).toThrow(PlanningExportError);
		expect(() => loadPlanning(missing)).toThrow(/^No plan export at .*pm-export/);
	});

	it('fails naming pm-export for invalid JSON', async () => {
		const file = join(await mkdtemp(join(tmpdir(), 'planning-')), 'planning.json');
		await writeFile(file, '{ not json');

		expect(() => loadPlanning(file)).toThrow(/is not valid JSON[\s\S]*pm-export/);
	});

	it('fails naming pm-export for an unread schemaVersion', async () => {
		const file = join(await mkdtemp(join(tmpdir(), 'planning-')), 'planning.json');
		await writeFile(file, JSON.stringify({ schemaVersion: 999 }));

		expect(() => loadPlanning(file)).toThrow(/schemaVersion 999[\s\S]*pm-export/);
	});
});

describe('sizeToPriority', () => {
	it('maps S/M/L/null', () => {
		expect(sizeToPriority('S')).toBe('low');
		expect(sizeToPriority('M')).toBe('medium');
		expect(sizeToPriority('L')).toBe('high');
		expect(sizeToPriority(null)).toBe('low');
	});
});

describe('initials', () => {
	it('abbreviates the owner', () => {
		expect(initials('agent')).toBe('AG');
		expect(initials('user')).toBe('YOU');
		expect(initials('both')).toBe('AG+U');
		expect(initials(null)).toBe('AG');
	});
});

describe('roadmapGroups', () => {
	const groups = roadmapGroups(loadPlanning(FIXTURE));

	it('gives each event the ID of its item', () => {
		const events = groups.flatMap((group) => group.events);

		expect(events.find((event) => event.title.startsWith('R-012 '))?.id).toBe('R-012');
		expect(events.every((event) => event.id === null || event.title.startsWith(`${event.id} `))).toBe(true);
	});

	it('orders by strategy.milestones and puts no-milestone last', () => {
		expect(groups.map((group) => group.milestone?.id ?? null)).toEqual(['M1', 'M2', null]);
	});

	it('marks the focus milestone', () => {
		expect(groups.find((group) => group.milestone?.id === 'M2')?.milestone?.isFocus).toBe(true);
		expect(groups.find((group) => group.milestone?.id === 'M1')?.milestone?.isFocus).toBe(false);
	});

	it('done entries are done, the Now item active, Next and Later pending', () => {
		const m2 = groups.find((group) => group.milestone?.id === 'M2')!;

		expect(m2.events).toEqual([
			{ id: 'R-010', title: 'R-010 Choose the invoice format', desc: 'CSV with one row per line item.', time: '2026-11-04', status: 'done' },
			{ id: 'R-013', title: 'R-013 Email invoices to tenants', desc: 'A tenant receives its invoice by email.', time: 'Next', status: 'pending' },
			{ id: 'R-014', title: 'R-014 Retry failed invoice emails', desc: 'A failed email is retried three times.', time: 'Next', status: 'pending' },
			{ id: 'R-023', title: 'R-023 Approve the pricing copy', desc: 'Marketing approves the pricing page copy for the new tiers.', time: 'Next', status: 'pending' },
		]);

		const none = groups.at(-1)!;
		expect(none.events.map((event) => [event.title.split(' ')[0], event.status])).toEqual([
			['R-011', 'done'],
			['R-003', 'done'],
			['R-012', 'active'],
			['R-024', 'pending'],
			['R-020', 'pending'],
		]);
	});

	it("counts each milestone's progress: done items of all its items", () => {
		expect(groups.find((group) => group.milestone?.id === 'M2')?.progress).toEqual({ done: 1, total: 4 });
		expect(groups.find((group) => group.milestone?.id === 'M1')?.progress).toEqual({ done: 1, total: 3 });
		expect(groups.at(-1)?.progress).toEqual({ done: 2, total: 5 });
	});

	it('keeps milestones with no items', () => {
		// The fixture's own milestones (M1, M2) now both carry items (R-010 added M1 and
		// M2 roadmap work), so this behaviour is shown with a minimal planning object
		// instead of relying on an accidental gap in the shared fixture.
		const empty = {
			strategy: { focus: { milestone: null }, milestones: [{ id: 'M9', name: 'Empty milestone', serves: [], exitCriteria: null, target: null, status: null }] },
			now: { item: null, milestone: null, stage: null },
			log: { done: [] },
			roadmap: { next: [], later: [] },
		} as unknown as Planning;

		expect(roadmapGroups(empty).find((group) => group.milestone?.id === 'M9')?.events).toEqual([]);
	});
});

describe('derivedRag', () => {
	it('scores likelihood × impact: 6+ red, 3–4 amber, otherwise green', () => {
		expect(derivedRag('high', 'high')).toBe('red');
		expect(derivedRag('high', 'medium')).toBe('red');
		expect(derivedRag('medium', 'high')).toBe('red');
		expect(derivedRag('medium', 'medium')).toBe('amber');
		expect(derivedRag('high', 'low')).toBe('amber');
		expect(derivedRag('low', 'high')).toBe('amber');
		expect(derivedRag('medium', 'low')).toBe('green');
		expect(derivedRag('low', 'medium')).toBe('green');
		expect(derivedRag('low', 'low')).toBe('green');
	});
});

describe('riskMatrix', () => {
	const planning = loadPlanning(FIXTURE);
	const matrix = riskMatrix(planning.risks.open);

	it('puts high impact first and low likelihood first', () => {
		expect(matrix.map((row) => row[0]!.impact)).toEqual(['high', 'medium', 'low']);
		expect(matrix[0]!.map((cell) => cell.likelihood)).toEqual(['low', 'medium', 'high']);
	});

	it('colours each cell by the derived RAG, not by an override', () => {
		expect(matrix.map((row) => row.map((cell) => cell.rag))).toEqual([
			['amber', 'red', 'red'],
			['green', 'amber', 'red'],
			['green', 'green', 'amber'],
		]);
	});

	it('places each risk in its cell', () => {
		const placed = matrix.flatMap((row) => row.flatMap((cell) => cell.risks.map((risk) => [risk.id, cell.likelihood, cell.impact])));

		expect(placed).toEqual([
			['RK-002', 'high', 'high'],
			['RK-008', 'high', 'high'],
			['RK-004', 'low', 'medium'],
			['RK-006', 'low', 'medium'],
			['RK-007', 'medium', 'medium'],
			['RK-005', 'low', 'low'],
			['RK-009', 'low', 'low'],
		]);
	});
});

describe('milestoneId', () => {
	const milestones = [{ id: 'M1' }, { id: 'M2' }, { id: 'M12' }];

	it('accepts an ID or an ID and name, and nothing else', () => {
		expect(milestoneId('M2', milestones)).toBe('M2');
		expect(milestoneId('M2 Billing', milestones)).toBe('M2');
		expect(milestoneId('M12', milestones)).toBe('M12');
		expect(milestoneId('M3', milestones)).toBeNull();
		expect(milestoneId('none', milestones)).toBeNull();
		expect(milestoneId(null, milestones)).toBeNull();
	});
});

describe('features', () => {
	const planning = loadPlanning(FIXTURE);
	const all = features(planning);

	it('lists every item with an ID: Now, Next, Later, Done, then Dropped', () => {
		expect(all.map((feature) => [feature.id, feature.state])).toEqual([
			['R-012', 'now'],
			['R-013', 'next'],
			['R-014', 'next'],
			['R-021', 'next'],
			['R-022', 'next'],
			['R-023', 'next'],
			['R-024', 'next'],
			['R-020', 'later'],
			['R-025', 'done'],
			['R-011', 'done'],
			['R-010', 'done'],
			['R-003', 'done'],
			['R-009', 'dropped'],
		]);
	});

	it('keeps the fields each place holds, with a known milestone or none', () => {
		const byId = new Map(all.map((feature) => [feature.id, feature]));

		expect(byId.get('R-012')).toMatchObject({ stage: 'execute', doneWhen: ['An invoice downloads as CSV'], milestone: null });
		expect(byId.get('R-014')).toMatchObject({ label: 'waiting', dependsOn: ['R-013'], position: 2, milestone: 'M2' });
		expect(byId.get('R-011')).toMatchObject({ milestone: null, date: '2026-11-09', result: 'planning.json validates.' });
		expect(byId.get('R-009')).toMatchObject({ reason: 'CSV covers it.' });
	});

	it('finds what depends on an item and the brief it links to', () => {
		expect(dependents(all, 'R-013').map((feature) => feature.id)).toEqual(['R-014']);
		expect(dependents(all, 'R-020')).toEqual([]);
		expect(briefOf(planning, all[0]!)?.path).toBe('planning/briefs/2026-11-09-invoice-export.md');
		expect(briefOf(planning, { id: 'R-013', brief: null })).toBeNull();
	});
});

describe('milestoneSummaries', () => {
	const summaries = milestoneSummaries(loadPlanning(FIXTURE));

	it('follows strategy order and adds No milestone last', () => {
		expect(summaries.map((summary) => [summary.slug, summary.name, summary.isFocus])).toEqual([
			['m1', 'First release', false],
			['m2', 'Billing', true],
			['none', 'No milestone', false],
		]);
	});

	it('counts done items against every item that is not dropped', () => {
		expect(summaries.map((summary) => summary.progress)).toEqual([
			{ done: 1, total: 3 },
			{ done: 1, total: 4 },
			{ done: 2, total: 5 },
		]);
		expect(summaries[2]!.features.map((feature) => feature.id)).toEqual(['R-012', 'R-024', 'R-020', 'R-011', 'R-003', 'R-009']);
	});
});

describe('page derivations', () => {
	it('computes plan progress', () => {
		expect(planProgress({ checked: 3, total: 5 })).toBe(60);
		expect(planProgress({ checked: 0, total: 0 })).toBe(0);
		expect(planProgress(null)).toBe(0);
	});

	it('maps inbox severity and source', () => {
		expect([severityToPriority('blocker'), severityToPriority('major'), severityToPriority('minor'), severityToPriority('cosmetic'), severityToPriority(null)]).toEqual([
			'urgent',
			'high',
			'medium',
			'low',
			'low',
		]);
		expect([sourceInitials('agent (R-012 execute)'), sourceInitials('user'), sourceInitials(null)]).toEqual(['AG', 'YOU', 'YOU']);
	});

	it('builds the item, milestone and brief links', () => {
		expect(featureHref('R-012')).toBe('/plan/features/r-012/');
		expect(milestoneHref('M2')).toBe('/plan/milestones/m2/');
		expect(milestoneHref(null)).toBe('/plan/milestones/none/');
		expect(briefAnchor('planning/briefs/R-007-Tenant-billing.md')).toBe('r-007-tenant-billing');
	});
});

describe('docsPages', () => {
	const docs = {
		root: fileURLToPath(new URL('./fixtures/docs/', import.meta.url)),
		sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }],
	};

	it('maps each built docs file, relative to the docs root, to its page', () => {
		const pages = docsPages(docs);

		expect(pages.get('guide/intro.md')).toBe('/docs/guide/intro/');
		expect(pages.get('README.md')).toBe('/docs/readme/');
	});

	it('is empty without repository docs', () => {
		expect(docsPages(null).size).toBe(0);
	});
});

describe('docsHref', () => {
	const pages = new Map([['guide/intro.md', '/docs/guide/intro/']]);

	it('links a path only when that page is built', () => {
		expect(docsHref('guide/intro.md', pages)).toBe('/docs/guide/intro/');
		expect(docsHref('./guide/intro.md', pages)).toBe('/docs/guide/intro/');
		expect(docsHref('docs/superpowers/plans/2026-10-27-tenant-model.md', pages)).toBeNull();
		expect(docsHref('none (formatting commit)', pages)).toBeNull();
		expect(docsHref(null, pages)).toBeNull();
	});
});
