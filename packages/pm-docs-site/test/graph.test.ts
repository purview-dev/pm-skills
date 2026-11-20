import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { chainOf, dependencyRows, graphData, graphQuery, layoutKey, parseGraphQuery, resolveFocus } from '../src/lib/graph';
import type { GraphEdge } from '../src/lib/graph';
import { graphLayouts } from '../src/lib/graph-layout';
import type { GraphLayout } from '../src/lib/graph-layout';
import { loadPlanning } from '../src/lib/planning';
import type { Planning } from '../src/lib/planning-types';
import { targets } from '../src/lib/references';

// A synthetic export, never the project's own: the tests must not change when the plan does.
const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const ALL_VIEWS = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true };

const planning = loadPlanning(FIXTURE);
const known = targets(planning, ALL_VIEWS);

/** The fixture with some sections replaced, typed as a whole export. */
function withPlan(overrides: Partial<Planning>): Planning {
	return { ...planning, ...overrides };
}

describe('graphData', () => {
	const data = graphData(planning, known);
	const nodeById = new Map(data.nodes.map((node) => [node.id, node]));

	it('lists the open items, in features() order, then chips sorted by ID', () => {
		expect(data.nodes.map((node) => node.id)).toEqual(['R-012', 'R-013', 'R-014', 'R-021', 'R-022', 'R-023', 'R-024', 'R-020', 'R-009', 'R-010', 'R-025', 'R-099']);
	});

	it('gives each chip its kind, and a missing chip a null title and href', () => {
		expect(nodeById.get('R-009')).toMatchObject({ kind: 'dropped' });
		expect(nodeById.get('R-010')).toMatchObject({ kind: 'done' });
		expect(nodeById.get('R-025')).toMatchObject({ kind: 'done' });
		expect(nodeById.get('R-099')).toMatchObject({ kind: 'missing', title: null, href: null });
	});

	it('has no node for an item that is not named by an open item', () => {
		expect(nodeById.has('R-003')).toBe(false);
		expect(nodeById.has('R-011')).toBe(false);
	});

	it('builds exactly these eight edges, fromChip for the done, dropped, and missing sources', () => {
		const ids = data.edges.map((edge) => `${edge.source}>${edge.target}:${edge.kind}`);

		expect(ids).toEqual([
			'R-010>R-013:depends',
			'R-021>R-013:depends',
			'R-013>R-014:depends',
			'R-009>R-021:depends',
			'R-022>R-024:depends',
			'R-012>R-024:depends',
			'R-099>R-020:depends',
			'R-025>R-020:revisits',
		]);

		const fromChipOf = (source: string) => data.edges.find((edge) => edge.source === source)!.fromChip;

		expect(fromChipOf('R-010')).toBe(true);
		expect(fromChipOf('R-009')).toBe(true);
		expect(fromChipOf('R-099')).toBe(true);
		expect(fromChipOf('R-025')).toBe(true);
		expect(fromChipOf('R-021')).toBe(false);
		expect(fromChipOf('R-013')).toBe(false);
		expect(fromChipOf('R-022')).toBe(false);
		expect(fromChipOf('R-012')).toBe(false);
	});

	it('draws an edge into the active node', () => {
		expect(data.edges).toContainEqual(expect.objectContaining({ source: 'R-012', target: 'R-024', kind: 'depends' }));
		expect(nodeById.get('R-012')).toMatchObject({ active: true });
	});

	it('marks the active item', () => {
		expect(nodeById.get('R-012')).toMatchObject({ active: true, section: 'now' });
		expect(nodeById.get('R-012')).not.toHaveProperty('linksNotExported');
	});

	it("gives the active item's own done and missing dependencies the same chips as a roadmap item", () => {
		const active = withPlan({
			now: { ...planning.now, status: 'active', item: { id: 'R-012', title: 'Invoice export', serves: [], owner: 'agent', size: 'M', dependsOn: ['R-010', 'R-098'], revisits: null }, milestone: null, stage: 'execute' },
			roadmap: { next: [], later: [] },
			log: { ...planning.log, done: [{ date: '2026-11-04', id: 'R-010', title: 'Choose the invoice format', milestone: null, owner: 'user', plan: null, result: 'CSV.' }], dropped: [] },
			board: { ...planning.board, columns: { ...planning.board.columns, now: [{ id: 'R-012', title: 'Invoice export', owner: 'agent', size: 'M', detail: 'execute' }] } },
		});
		const activeData = graphData(active, new Map());
		const activeNodeById = new Map(activeData.nodes.map((node) => [node.id, node]));

		expect(activeNodeById.get('R-012')).toMatchObject({ active: true });
		expect(activeNodeById.get('R-010')).toMatchObject({ kind: 'done' });
		expect(activeNodeById.get('R-098')).toMatchObject({ kind: 'missing', title: null });
		expect(activeData.edges).toContainEqual(expect.objectContaining({ source: 'R-010', target: 'R-012', kind: 'depends' }));
		expect(activeData.edges).toContainEqual(expect.objectContaining({ source: 'R-098', target: 'R-012', kind: 'depends' }));

		const activeRow = dependencyRows(activeData).find((row) => row.id === 'R-012')!;

		expect(activeRow.waitsOn.map((ref) => ref.label)).toEqual(['R-010 Choose the invoice format', 'R-098 not found']);
	});

	it('marks a blocked item by label or status', () => {
		expect(nodeById.get('R-023')).toMatchObject({ blocked: true });
	});

	it('does not mark a waiting item as blocked', () => {
		expect(nodeById.get('R-014')).toMatchObject({ blocked: false });
	});

	it('counts done or dropped prerequisites among dependsOn and revisits, not a missing or open one', () => {
		expect(nodeById.get('R-013')).toMatchObject({ donePrerequisites: 1 });
		expect(nodeById.get('R-020')).toMatchObject({ donePrerequisites: 1 });
	});

	it('counts a done ID named twice in dependsOn and again in revisits once, not three times', () => {
		const repeated = withPlan({
			now: { ...planning.now, status: 'idle', item: null, milestone: null, stage: null },
			roadmap: {
				next: [
					{ id: 'R-102', title: 'Repeats a done prerequisite', section: 'next', position: 1, label: 'next', serves: [], milestone: null, owner: 'agent', doneWhen: 'none', size: 'S', dependsOn: ['R-010', 'R-010'], status: { value: 'ready', reason: null, since: null }, brief: null, note: null, revisits: 'R-010', claimable: true },
				],
				later: [],
			},
			log: { ...planning.log, done: [{ date: '2026-11-04', id: 'R-010', title: 'Choose the invoice format', milestone: null, owner: 'user', plan: null, result: 'CSV.' }], dropped: [] },
			board: { ...planning.board, columns: { ...planning.board.columns, now: [] } },
		});
		const repeatedData = graphData(repeated, new Map());

		expect(repeatedData.nodes.find((node) => node.id === 'R-102')).toMatchObject({ donePrerequisites: 1 });
	});

	it('gives every href null when the features view is off', () => {
		const off = graphData(planning, targets(planning, { ...ALL_VIEWS, features: false }));

		expect(off.nodes.every((node) => node.href === null)).toBe(true);
	});

	it('gives distinct edge IDs ending :0 and :1 for a repeated dependency', () => {
		const repeated = withPlan({
			now: { ...planning.now, status: 'idle', item: null, milestone: null, stage: null },
			roadmap: {
				next: [
					{ id: 'R-100', title: 'Repeats a dependency', section: 'next', position: 1, label: 'next', serves: [], milestone: null, owner: 'agent', doneWhen: 'none', size: 'S', dependsOn: ['R-010', 'R-010'], status: { value: 'ready', reason: null, since: null }, brief: null, note: null, revisits: null, claimable: true },
				],
				later: [],
			},
			log: { ...planning.log, done: [], dropped: [] },
			board: { ...planning.board, columns: { ...planning.board.columns, now: [] } },
		});
		const data2 = graphData(repeated, new Map());

		expect(data2.edges.map((edge) => edge.id)).toEqual(['R-010>R-100:depends:0', 'R-010>R-100:depends:1']);
	});

	it('gives one edge with source === target and no chip for a self-dependency', () => {
		const selfDep = withPlan({
			now: { ...planning.now, status: 'idle', item: null, milestone: null, stage: null },
			roadmap: {
				next: [
					{ id: 'R-101', title: 'Depends on itself', section: 'next', position: 1, label: 'next', serves: [], milestone: null, owner: 'agent', doneWhen: 'none', size: 'S', dependsOn: ['R-101'], status: { value: 'ready', reason: null, since: null }, brief: null, note: null, revisits: null, claimable: true },
				],
				later: [],
			},
			log: { ...planning.log, done: [], dropped: [] },
			board: { ...planning.board, columns: { ...planning.board.columns, now: [] } },
		});
		const data3 = graphData(selfDep, new Map());

		expect(data3.nodes.map((node) => node.id)).toEqual(['R-101']);
		expect(data3.edges).toHaveLength(1);
		expect(data3.edges[0]).toMatchObject({ source: 'R-101', target: 'R-101', fromChip: false });
	});
});

describe('dependencyRows', () => {
	const data = graphData(planning, known);
	const rows = dependencyRows(data);
	const rowById = new Map(rows.map((row) => [row.id, row]));

	it('gives one row per item node, in node order', () => {
		expect(rows.map((row) => row.id)).toEqual(['R-012', 'R-013', 'R-014', 'R-021', 'R-022', 'R-023', 'R-024', 'R-020']);
	});

	it("labels R-013's waitsOn and waitedOnBy", () => {
		const row = rowById.get('R-013')!;

		expect(row.waitsOn.map((ref) => ref.label)).toEqual(['R-010 Choose the invoice format', 'R-021 Tenant onboarding checklist']);
		expect(row.waitedOnBy.map((ref) => ref.label)).toEqual(['R-014 Retry failed invoice emails']);
	});

	it("gives R-020's revisits label and a not-found waitsOn ref", () => {
		const row = rowById.get('R-020')!;

		expect(row.revisits?.label).toBe('R-025 Tenant model');
		expect(row.waitsOn.map((ref) => ref.label)).toEqual(['R-099 not found']);
	});

	it('gives R-012 no linksNotExported property', () => {
		expect(rowById.get('R-012')).not.toHaveProperty('linksNotExported');
	});
});

describe('parseGraphQuery', () => {
	it('defaults lanes and done on with no focus', () => {
		expect(parseGraphQuery('')).toEqual({ lanes: true, done: true, focus: null });
	});

	it('reads lanes=off, done=off, and focus', () => {
		expect(parseGraphQuery('?lanes=off&done=off&focus=R-013')).toEqual({ lanes: false, done: false, focus: 'R-013' });
	});

	it('treats any value other than the exact "off" as the default true', () => {
		expect(parseGraphQuery('?lanes=no')).toMatchObject({ lanes: true });
	});
});

describe('graphQuery', () => {
	it('writes no key for every default, keeping other parameters', () => {
		expect(graphQuery({ lanes: true, done: true, focus: null }, '?x=1&lanes=off')).toBe('?x=1');
	});

	it('writes lanes, then done, then focus, for non-default values', () => {
		expect(graphQuery({ lanes: false, done: true, focus: 'R-013' }, '?x=1')).toBe('?x=1&lanes=off&focus=R-013');
	});
});

describe('layoutKey', () => {
	it('maps the four lanes/done combinations to the four layout keys', () => {
		expect(layoutKey({ lanes: true, done: true })).toBe('lanes-done');
		expect(layoutKey({ lanes: true, done: false })).toBe('lanes-open');
		expect(layoutKey({ lanes: false, done: true })).toBe('flow-done');
		expect(layoutKey({ lanes: false, done: false })).toBe('flow-open');
	});
});

describe('resolveFocus', () => {
	const data = graphData(planning, known);
	const layouts = graphLayouts(data, planning);

	it('drops a focus that is hidden in the current layout', () => {
		expect(resolveFocus('R-010', layouts['flow-open'])).toBeNull();
	});

	it('keeps a focus that is drawn in the current layout', () => {
		expect(resolveFocus('R-010', layouts['flow-done'])).toBe('R-010');
	});

	it('drops a focus naming a node that does not exist', () => {
		expect(resolveFocus('R-777', layouts['flow-done'])).toBeNull();
	});

	it('is null with no focus', () => {
		expect(resolveFocus(null, layouts['flow-done'])).toBeNull();
	});
});

describe('chainOf', () => {
	const data = graphData(planning, known);
	const layouts = graphLayouts(data, planning);

	it("traces R-013's chain through its done and dropped prerequisites and its dependant", () => {
		const chain = chainOf(data.edges, 'R-013', layouts['lanes-done']);

		for (const id of ['R-013', 'R-010', 'R-021', 'R-009', 'R-014']) expect(chain.has(id), id).toBe(true);
		expect(chain.has('R-022')).toBe(false);

		const edgeIds = [
			'R-010>R-013:depends:0',
			'R-021>R-013:depends:0',
			'R-013>R-014:depends:0',
			'R-009>R-021:depends:0',
		];

		for (const edgeId of edgeIds) expect(chain.has(edgeId), edgeId).toBe(true);
		expect([...chain].filter((entry) => entry.includes(':depends:'))).toHaveLength(edgeIds.length);
	});

	it('drops the done and dropped prerequisites that are hidden in lanes-open', () => {
		const chain = chainOf(data.edges, 'R-013', layouts['lanes-open']);

		expect(chain.has('R-010')).toBe(false);
		expect(chain.has('R-009')).toBe(false);
	});

	it('terminates on a two-item cycle and returns both nodes', () => {
		const edges: GraphEdge[] = [
			{ id: 'R-201>R-202:depends:0', source: 'R-201', target: 'R-202', kind: 'depends', fromChip: false },
			{ id: 'R-202>R-201:depends:0', source: 'R-202', target: 'R-201', kind: 'depends', fromChip: false },
		];
		const layout: GraphLayout = {
			boxes: { 'R-201': { x: 0, y: 0, width: 220, height: 64 }, 'R-202': { x: 300, y: 0, width: 220, height: 64 } },
			lanes: [],
			tray: null,
			width: 520,
			height: 64,
		};
		const chain = chainOf(edges, 'R-201', layout);

		expect(chain.has('R-201')).toBe(true);
		expect(chain.has('R-202')).toBe(true);
		expect(chain.has('R-201>R-202:depends:0')).toBe(true);
		expect(chain.has('R-202>R-201:depends:0')).toBe(true);
	});
});
