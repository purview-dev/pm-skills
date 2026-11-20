import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { graphData } from '../src/lib/graph';
import type { GraphData, GraphEdge, GraphNode } from '../src/lib/graph';
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
	return { id, kind: 'item', title: id, href: null, milestone, size: 'S', section: 'next', owner: 'agent', blocked: false, active: false, donePrerequisites: 0 };
}

/** A done chip node with the given ID, for synthetic graphs. */
function doneChip(id: string): GraphNode {
	return { id, kind: 'done', title: id, href: null, milestone: null, size: null, section: null, owner: null, blocked: false, active: false, donePrerequisites: 0 };
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

		it('gives a chip two open items in different lanes both depend on exactly one box, in the first dependant lane in lane order', () => {
			const chip = doneChip('R-300');
			const nodes = [item('R-301', 'M2'), item('R-302', 'M1'), chip];
			const edges: GraphEdge[] = [
				{ id: 'R-300>R-301:depends:0', source: 'R-300', target: 'R-301', kind: 'depends', fromChip: true },
				{ id: 'R-300>R-302:depends:0', source: 'R-300', target: 'R-302', kind: 'depends', fromChip: true },
			];
			const twoLane = graphLayouts({ nodes, edges }, planning)['lanes-done'];
			// One box per node: an extra box for the chip, under any key, fails this.
			expect(Object.keys(twoLane.boxes).sort()).toEqual(['R-300', 'R-301', 'R-302']);

			const band = twoLane.lanes.find((candidate) => candidate.key === 'M1')!;
			const box = twoLane.boxes['R-300']!;

			expect(box.y >= band.y && box.y + box.height <= band.y + band.height).toBe(true);
		});

		it('puts an isolated item in the first column of its lane, inside the band', () => {
			const firstX = Math.min(...linked(layout).map((id) => layout.boxes[id]!.x));

			expect(firstX).toBe(0);
			for (const id of ['R-012', 'R-023']) {
				const node = data.nodes.find((candidate) => candidate.id === id)!;

				expect(layout.boxes[id]!.x, id).toBe(firstX);
				expect(inLane(id, node.milestone ?? 'none'), id).toBe(true);
			}
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
		expect(isolated.sort()).toEqual(['R-023']);
		for (const id of isolated) expect(layout.boxes[id]!.y, id).toBeGreaterThanOrEqual(tray.y);
		for (const id of linkedIds) {
			const box = layout.boxes[id]!;

			expect(box.y + box.height, id).toBeLessThanOrEqual(tray.y);
		}
	});

	it('wraps the tray at TRAY_COLUMNS even when the linked graph is narrow', () => {
		const linkedPair = [item('R-310', 'M1'), item('R-311', 'M1')];
		const isolated = Array.from({ length: 12 }, (_, index) => item(`R-4${String(index).padStart(2, '0')}`));
		const edges: GraphEdge[] = [{ id: 'R-310>R-311:depends:0', source: 'R-310', target: 'R-311', kind: 'depends', fromChip: false }];
		const layout = graphLayouts({ nodes: [...linkedPair, ...isolated], edges }, planning)['flow-done'];
		const isolatedIds = isolated.map((node) => node.id);
		const firstRowY = Math.min(...isolatedIds.map((id) => layout.boxes[id]!.y));
		const firstRow = isolatedIds.filter((id) => layout.boxes[id]!.y === firstRowY);

		expect(firstRow.length).toBeGreaterThanOrEqual(4);
	});

	it('starts the flow linked graph and the tray at x 0', () => {
		const layout = layouts['flow-done'];
		const linkedIds = linked(layout);

		expect(Math.min(...linkedIds.map((id) => layout.boxes[id]!.x))).toBe(0);
		expect(Math.min(...linkedIds.map((id) => layout.boxes[id]!.y))).toBe(0);
		expect(layout.boxes['R-012']!.x).toBe(0);
	});

	it('does not move the linked flow graph when isolated items are added', () => {
		// IDs that sort before every fixture ID, so a layout that ranked them with the linked nodes would interleave them.
		const extra = Array.from({ length: 20 }, (_, index) => item(`R-00${String(index).padStart(2, '0')}`, index % 2 === 0 ? 'M2' : null));
		const padded = graphLayouts({ nodes: [...data.nodes, ...extra], edges: data.edges }, planning)['flow-done'];
		const base = layouts['flow-done'];
		const linkedIds = linked(base);
		const linkedHeight = (layout: GraphLayout) => Math.max(...linkedIds.map((id) => layout.boxes[id]!.y + layout.boxes[id]!.height));

		expect(linkedHeight(padded)).toBe(linkedHeight(base));
		for (const id of linkedIds) expect(padded.boxes[id], id).toEqual(base.boxes[id]!);
		for (const node of extra) expect(padded.boxes[node.id]!.y, node.id).toBeGreaterThanOrEqual(padded.tray!.y);

		// The fixture's own isolated items leave no gap either: the linked graph is the same without them.
		const bare = graphLayouts({ nodes: data.nodes.filter((node) => linkedIds.includes(node.id)), edges: data.edges }, planning)['flow-done'];

		expect(bare.tray).toBeNull();
		for (const id of linkedIds) expect(base.boxes[id], id).toEqual(bare.boxes[id]!);
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

		// dagre reverses one edge of a cycle to rank it, so exactly one of the two runs right to left.
		const { boxes } = result['flow-done'];
		const leftToRight = (source: string, target: string) => boxes[source]!.x + boxes[source]!.width <= boxes[target]!.x;

		expect([leftToRight('R-201', 'R-202'), leftToRight('R-202', 'R-201')].filter(Boolean)).toHaveLength(1);
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
