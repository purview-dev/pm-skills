import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { graphData } from '../src/lib/graph';
import type { GraphData, GraphNode } from '../src/lib/graph';
import { graphLayouts, SIZES } from '../src/lib/graph-layout';
import type { Box, GraphLayout, LayoutKey } from '../src/lib/graph-layout';
import { loadPlanning } from '../src/lib/planning';
import { targets } from '../src/lib/references';

// A synthetic export, never the project's own: the tests must not change when the plan does.
const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const ALL_VIEWS = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true };
const KEYS: LayoutKey[] = ['lanes-done', 'lanes-open', 'flow-done', 'flow-open'];

const planning = loadPlanning(FIXTURE);
const data = graphData(planning, targets(planning, ALL_VIEWS));
const layouts = graphLayouts(data, planning);

const overlaps = (a: Box, b: Box): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The IDs of nodes with at least one drawn edge in `layout`. */
function linked(layout: GraphLayout): string[] {
	const ids = new Set<string>();

	for (const edge of data.edges) {
		if (layout.boxes[edge.source] && layout.boxes[edge.target]) {
			ids.add(edge.source);
			ids.add(edge.target);
		}
	}

	return [...ids];
}

/** A one-item node with the given ID and milestone, for synthetic graphs. */
function item(id: string, milestone: string | null = null): GraphNode {
	return { id, kind: 'item', title: id, href: null, milestone, size: 'S', section: 'next', owner: 'agent', blocked: false, active: false, donePrerequisites: 0, linksNotExported: false };
}

describe('graphLayouts', () => {
	it('gives every layout boxes that never overlap and edges that run left to right', () => {
		for (const key of KEYS) {
			const { boxes } = layouts[key];
			const ids = Object.keys(boxes);

			for (let i = 0; i < ids.length; i++) {
				for (let j = i + 1; j < ids.length; j++) {
					expect(overlaps(boxes[ids[i]!]!, boxes[ids[j]!]!), `${key}: ${ids[i]} overlaps ${ids[j]}`).toBe(false);
				}
			}

			for (const edge of data.edges) {
				const source = boxes[edge.source];
				const target = boxes[edge.target];

				if (!source || !target || edge.source === edge.target) continue;
				expect(source.x + source.width, `${key}: ${edge.id}`).toBeLessThanOrEqual(target.x);
			}
		}
	});

	it('sizes items and chips from SIZES', () => {
		const { boxes } = layouts['lanes-done'];

		expect(boxes['R-013']).toMatchObject(SIZES.item);
		expect(boxes['R-010']).toMatchObject(SIZES.chip);
	});

	describe('lanes-done', () => {
		const layout = layouts['lanes-done'];
		const lane = (key: string) => layout.lanes.find((candidate) => candidate.key === key)!;
		const inLane = (id: string, key: string) => {
			const box = layout.boxes[id]!;
			const band = lane(key);

			return box.y >= band.y && box.y + box.height <= band.y + band.height;
		};

		it('stacks the lanes M1, M2, then none, labelled and with the focus marked', () => {
			expect(layout.lanes.map((band) => band.key)).toEqual(['M1', 'M2', 'none']);
			expect(lane('M1')).toMatchObject({ label: 'M1 First release', isFocus: false });
			expect(lane('M2')).toMatchObject({ label: 'M2 Billing', isFocus: true });
			expect(lane('none')).toMatchObject({ label: 'No milestone', isFocus: false });
			expect(layout.tray).toBeNull();
		});

		it('puts each item inside its milestone lane', () => {
			for (const node of data.nodes.filter((candidate) => candidate.kind === 'item')) {
				expect(inLane(node.id, node.milestone ?? 'none'), node.id).toBe(true);
			}
		});

		it("puts each chip in its first dependant's lane", () => {
			expect(inLane('R-010', 'M2')).toBe(true);
			expect(inLane('R-009', 'M1')).toBe(true);
			expect(inLane('R-099', 'none')).toBe(true);
			expect(inLane('R-025', 'none')).toBe(true);
		});

		it('keeps every linked node in the same column as in flow-done', () => {
			const flow = layouts['flow-done'];

			for (const id of linked(flow)) expect(layout.boxes[id]!.x, id).toBe(flow.boxes[id]!.x);
		});
	});

	it('drops done and dropped chips, but not missing ones, from the open layouts', () => {
		for (const key of ['lanes-open', 'flow-open'] as const) {
			const { boxes } = layouts[key];

			expect(boxes['R-009'], key).toBeUndefined();
			expect(boxes['R-010'], key).toBeUndefined();
			expect(boxes['R-025'], key).toBeUndefined();
			expect(boxes['R-099'], key).toBeDefined();
		}
	});

	it('puts flow-done isolated items in the tray, below every linked node', () => {
		const layout = layouts['flow-done'];
		const tray = layout.tray!;
		const linkedIds = linked(layout);
		const isolated = Object.keys(layout.boxes).filter((id) => !linkedIds.includes(id));

		expect(layout.lanes).toEqual([]);
		expect(tray).not.toBeNull();
		expect(isolated.sort()).toEqual(['R-012', 'R-023']);
		for (const id of isolated) expect(layout.boxes[id]!.y, id).toBeGreaterThanOrEqual(tray.y);
		for (const id of linkedIds) {
			const box = layout.boxes[id]!;

			expect(box.y + box.height, id).toBeLessThanOrEqual(tray.y);
		}
	});

	it('lays out a two-item cycle and a self-dependency without throwing', () => {
		const cyclic: GraphData = {
			nodes: [item('R-201'), item('R-202'), item('R-203')],
			edges: [
				{ id: 'R-201>R-202:depends:0', source: 'R-201', target: 'R-202', kind: 'depends', fromChip: false },
				{ id: 'R-202>R-201:depends:0', source: 'R-202', target: 'R-201', kind: 'depends', fromChip: false },
				{ id: 'R-203>R-203:depends:0', source: 'R-203', target: 'R-203', kind: 'depends', fromChip: false },
			],
		};
		const result = graphLayouts(cyclic, planning);

		for (const key of KEYS) {
			expect(Object.keys(result[key].boxes).sort(), key).toEqual(['R-201', 'R-202', 'R-203']);
		}
	});

	it('gives four empty layouts for empty data', () => {
		const result = graphLayouts({ nodes: [], edges: [] }, planning);

		for (const key of KEYS) {
			expect(result[key], key).toEqual({ boxes: {}, lanes: [], tray: null, width: 0, height: 0 });
		}
	});

	it('is deterministic and uses whole pixels', () => {
		const json = JSON.stringify(graphLayouts(data, planning));

		expect(JSON.stringify(graphLayouts(data, planning))).toBe(json);

		const numbers: number[] = [];

		JSON.parse(json, (_key, value) => {
			if (typeof value === 'number') numbers.push(value);

			return value;
		});
		expect(numbers.length).toBeGreaterThan(0);
		for (const value of numbers) expect(Number.isInteger(value)).toBe(true);
	});
});
