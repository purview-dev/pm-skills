import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import {
	adrHref,
	adrsOf,
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
	milestoneCards,
	milestoneHref,
	milestoneId,
	milestoneSummaries,
	PlanningExportError,
	planProgress,
	revisers,
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
		expect(groups.map((group) => group.milestone?.id ?? null)).toEqual(['M1', 'M2', 'M3', 'M4', null]);
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
		]);
	});

	it('lists the Now item once, as active, when it is also queued', () => {
		// The fixture queues R-012 again, in Later under M2, while it is still the active Now item.
		const events = groups.flatMap((group) => group.events);
		const r012Events = events.filter((event) => event.id === 'R-012');

		expect(r012Events).toHaveLength(1);
		expect(r012Events[0]!.status).toBe('active');
	});

	it('lists the Now item once, as active, when it is also logged done', () => {
		const planning = structuredClone(loadPlanning(FIXTURE));

		planning.log.done.push({ date: '2026-11-11', id: 'R-012', title: 'Invoice export', milestone: 'M1', owner: 'agent', plan: null, result: 'Not really done.' });

		const events = roadmapGroups(planning).flatMap((group) => group.events);
		const r012Events = events.filter((event) => event.id === 'R-012');

		expect(r012Events).toHaveLength(1);
		expect(r012Events[0]!.status).toBe('active');
	});

	it("counts each milestone's progress: done items of all its items", () => {
		expect(groups.find((group) => group.milestone?.id === 'M2')?.progress).toEqual({ done: 1, total: 4 });
		expect(groups.find((group) => group.milestone?.id === 'M1')?.progress).toEqual({ done: 1, total: 3 });
		expect(groups.find((group) => group.milestone?.id === 'M3')?.progress).toEqual({ done: 0, total: 1 });
		expect(groups.find((group) => group.milestone?.id === 'M4')?.progress).toEqual({ done: 0, total: 1 });
		expect(groups.at(-1)?.progress).toEqual({ done: 2, total: 4 });
	});

	it('keeps milestones with no items', () => {
		// The fixture's own milestones (M1, M2) now both carry items (R-010 added M1 and
		// M2 roadmap work), so this behaviour is shown with a minimal planning object
		// instead of relying on an accidental gap in the shared fixture.
		const empty = {
			strategy: { focus: { milestone: null }, milestones: [{ id: 'M9', name: 'Empty milestone', serves: [], exitCriteria: null, target: null, status: null }] },
			now: { item: null, milestone: null, stage: null },
			board: { columns: { now: [] } },
			log: { done: [], dropped: [] },
			roadmap: { next: [], later: [] },
		} as unknown as Planning;

		expect(roadmapGroups(empty).find((group) => group.milestone?.id === 'M9')?.events).toEqual([]);
	});

	it('takes progress from milestoneSummaries', () => {
		const summaries = milestoneSummaries(loadPlanning(FIXTURE));

		for (const group of groups) {
			const id = group.milestone?.id ?? null;

			expect(group.progress).toEqual(summaries.find((summary) => summary.id === id)!.progress);
		}
	});

	it('lists an item once, in the state features() counts', () => {
		const minimal = {
			strategy: { focus: { milestone: null }, milestones: [{ id: 'M9', name: 'Empty milestone', serves: [], exitCriteria: null, target: null, status: null }] },
			now: { item: null, milestone: null, stage: null },
			board: { columns: { now: [] } },
			roadmap: {
				next: [],
				later: [
					{ id: 'R-050', title: 'Some later item', section: 'later', position: 1, label: 'later', serves: [], milestone: 'M9', owner: 'agent', doneWhen: 'Some done when.', size: 'S', dependsOn: [], status: { value: 'ready', reason: null, since: null }, brief: null, note: null, revisits: null, claimable: false },
				],
			},
			log: {
				done: [
					{ date: '2026-11-10', id: null, title: 'Review note', milestone: 'M9', owner: null, plan: null, result: 'Housekeeping only.' },
					{ date: '2026-11-09', id: 'R-050', title: 'Some later item', milestone: 'M9', owner: 'agent', plan: null, result: 'Merged.' },
				],
				dropped: [],
			},
		} as unknown as Planning;

		const m9 = roadmapGroups(minimal).find((group) => group.milestone?.id === 'M9')!;

		expect(m9.events).toEqual([
			{ id: null, title: 'Review note', desc: 'Housekeeping only.', time: '2026-11-10', status: 'done' },
			{ id: 'R-050', title: 'R-050 Some later item', desc: 'Some done when.', time: 'Later', status: 'pending' },
		]);
		expect(m9.progress).toEqual({ done: 0, total: 1 });
	});

	it('leaves out the no-milestone group when it counts no item', () => {
		const minimal = {
			strategy: { focus: { milestone: null }, milestones: [{ id: 'M9', name: 'Empty milestone', serves: [], exitCriteria: null, target: null, status: null }] },
			now: { item: null, milestone: null, stage: null },
			board: { columns: { now: [] } },
			roadmap: { next: [], later: [] },
			log: {
				done: [{ date: '2026-11-10', id: null, title: 'Review note', milestone: null, owner: null, plan: null, result: 'Housekeeping only.' }],
				dropped: [],
			},
		} as unknown as Planning;

		expect(roadmapGroups(minimal).map((group) => group.milestone?.id ?? null)).toEqual(['M9']);
	});

	it('lists an ID only in the group that counts it, across the page', () => {
		const milestone = (id: string) => ({ id, name: `Milestone ${id}`, serves: [], exitCriteria: null, target: null, status: null });
		const minimal = {
			strategy: { focus: { milestone: null }, milestones: [milestone('M1'), milestone('M2')] },
			now: { item: null, milestone: null, stage: null },
			board: { columns: { now: [] } },
			roadmap: {
				next: [],
				later: [
					{ id: 'R-060', title: 'Moved item', section: 'later', position: 1, label: 'later', serves: [], milestone: 'M2', owner: 'agent', doneWhen: 'Some done when.', size: 'S', dependsOn: [], status: { value: 'ready', reason: null, since: null }, brief: null, note: null, revisits: null, claimable: false },
				],
			},
			log: {
				done: [{ date: '2026-11-09', id: 'R-060', title: 'Moved item', milestone: 'M1', owner: 'agent', plan: null, result: 'Merged.' }],
				dropped: [],
			},
		} as unknown as Planning;

		const groups = roadmapGroups(minimal);
		const m1 = groups.find((group) => group.milestone?.id === 'M1')!;
		const m2 = groups.find((group) => group.milestone?.id === 'M2')!;
		const summaries = milestoneSummaries(minimal);

		expect(m1.events.map((event) => event.id)).not.toContain('R-060');
		expect(m2.events.map((event) => [event.id, event.status])).toEqual([['R-060', 'pending']]);
		expect(m1.progress).toEqual(summaries.find((summary) => summary.id === 'M1')!.progress);
		expect(m2.progress).toEqual(summaries.find((summary) => summary.id === 'M2')!.progress);
	});

	it('exposes the target', () => {
		expect(groups.find((group) => group.milestone?.id === 'M2')?.milestone?.target).toBe('2026-12-15');
		expect(groups.find((group) => group.milestone?.id === 'M1')?.milestone?.target).toBeNull();
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
			['R-026', 'later'],
			['R-025', 'done'],
			['R-011', 'done'],
			['R-010', 'done'],
			['R-003', 'done'],
			['R-009', 'dropped'],
		]);
	});

	it('keeps the fields each place holds, with a known milestone or none', () => {
		const byId = new Map(all.map((feature) => [feature.id, feature]));

		expect(byId.get('R-012')).toMatchObject({
			stage: 'execute',
			doneWhen: ['An invoice downloads as CSV'],
			milestone: null,
			owner: null,
			size: null,
			serves: [],
			dependsOn: [],
			revisits: null,
		});
		expect(byId.get('R-014')).toMatchObject({ label: 'waiting', dependsOn: ['R-013'], position: 2, milestone: 'M2' });
		expect(byId.get('R-011')).toMatchObject({ milestone: null, date: '2026-11-09', result: 'planning.json validates.' });
		expect(byId.get('R-009')).toMatchObject({ reason: 'CSV covers it.' });
	});

	it("gives the Now feature its own owner, size, serves, and links from now.item, not the board card", () => {
		const populated = {
			...planning,
			now: { ...planning.now, item: { id: 'R-012', title: 'Invoice export', serves: ['V2'], owner: 'agent', size: 'M', dependsOn: ['R-010', 'R-098'], revisits: 'R-003' } },
		} as unknown as Planning;
		const now = features(populated).find((feature) => feature.state === 'now')!;

		expect(now).toMatchObject({ id: 'R-012', owner: 'agent', size: 'M', serves: ['V2'], dependsOn: ['R-010', 'R-098'], revisits: 'R-003' });
	});

	it('finds what depends on an item and the brief it links to', () => {
		expect(dependents(all, 'R-013').map((feature) => feature.id)).toEqual(['R-014']);
		expect(dependents(all, 'R-020')).toEqual([]);
		expect(briefOf(planning, all[0]!)?.path).toBe('planning/briefs/2026-11-09-invoice-export.md');
		expect(briefOf(planning, { id: 'R-013', brief: null })).toBeNull();
	});

	it('finds the items that revise an item, an active one included', () => {
		expect(revisers(all, 'R-025').map((feature) => [feature.id, feature.title])).toEqual([['R-020', 'README matches the code']]);
		expect(revisers(all, 'R-013')).toEqual([]);

		const populated = {
			...planning,
			now: { ...planning.now, item: { id: 'R-012', title: 'Invoice export', serves: [], owner: 'agent', size: 'S', dependsOn: [], revisits: 'R-003' } },
			roadmap: { ...planning.roadmap, later: planning.roadmap.later.map((item) => (item.id === 'R-020' ? { ...item, revisits: 'R-003' } : item)) },
		} as unknown as Planning;
		const order = features(populated).map((feature) => feature.id);

		// Two revisers come back in features() order: the active item first, then the roadmap.
		expect(revisers(features(populated), 'R-003').map((feature) => feature.id)).toEqual(['R-012', 'R-020']);
		expect(order.indexOf('R-012')).toBeLessThan(order.indexOf('R-020'));
	});
});

describe('milestoneSummaries', () => {
	const summaries = milestoneSummaries(loadPlanning(FIXTURE));

	it('follows strategy order and adds No milestone last', () => {
		expect(summaries.map((summary) => [summary.slug, summary.name, summary.isFocus])).toEqual([
			['m1', 'First release', false],
			['m2', 'Billing', true],
			['m3', 'Self-serve upgrades', false],
			['m4', 'Partner billing', false],
			['none', 'No milestone', false],
		]);
	});

	it('counts done items against every item that is not dropped', () => {
		expect(summaries.map((summary) => summary.progress)).toEqual([
			{ done: 1, total: 3 },
			{ done: 1, total: 4 },
			{ done: 0, total: 1 },
			{ done: 0, total: 1 },
			{ done: 2, total: 4 },
		]);
		expect(summaries[4]!.features.map((feature) => feature.id)).toEqual(['R-012', 'R-024', 'R-011', 'R-003', 'R-009']);
	});
});

describe('milestoneCards', () => {
	it('keeps No milestone while an unassigned item is not dropped', () => {
		// The fixture's unassigned items are R-012, R-024, R-011, and R-003 (not
		// dropped) plus R-009 (dropped); only the last entry is dropped.
		const cards = milestoneCards(loadPlanning(FIXTURE));

		expect(cards.map((card) => card.slug)).toEqual(['m1', 'm2', 'm3', 'm4', 'none']);
	});

	it('drops No milestone when every unassigned item is dropped', () => {
		const planning = loadPlanning(FIXTURE);
		const clone = JSON.parse(JSON.stringify(planning)) as Planning;
		const unassigned = (milestone: string | null) => milestone === null || milestone === 'none';

		clone.now.milestone = 'M1';
		clone.roadmap.next = clone.roadmap.next.map((item) => (unassigned(item.milestone) ? { ...item, milestone: 'M1' } : item));
		clone.roadmap.later = clone.roadmap.later.map((item) => (unassigned(item.milestone) ? { ...item, milestone: 'M1' } : item));
		clone.log.done = clone.log.done.map((entry) => (unassigned(entry.milestone) ? { ...entry, milestone: 'M1' } : entry));
		// log.dropped carries no milestone field: features() always treats a dropped
		// item as unassigned, so R-009 keeps the No milestone group non-empty.

		expect(milestoneSummaries(clone).map((summary) => summary.id ?? 'none')).toContain('none');
		expect(milestoneCards(clone).map((card) => card.id ?? 'none')).not.toContain('none');
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

	it('links through a source prefix and not a path no source maps', () => {
		const root = fileURLToPath(new URL('./fixtures/docs/', import.meta.url));
		const prefixed = docsPages({ root, sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }] });

		expect(docsHref('guide/intro.md', prefixed)).toBe('/docs/guide/intro/');
		expect(docsHref('docs/superpowers/plans/2026-10-27-tenant-model.md', prefixed)).toBeNull();
	});
});

describe('adrsOf', () => {
	const fixture = loadPlanning(fileURLToPath(new URL('./fixtures/planning.json', import.meta.url)));

	it('lists the ADRs whose Item is the item, by ID', () => {
		expect(adrsOf(fixture, 'R-012').map((adr) => adr.id)).toEqual(['ADR-001', 'ADR-002']);
		expect(adrsOf(fixture, 'R-014')).toEqual([]);
	});

	it('links an ADR page by its lower-case ID', () => {
		expect(adrHref('ADR-002')).toBe('/plan/decisions/adr-002/');
	});
});