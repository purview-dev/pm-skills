// Build-time layouts for the dependency graph: four fixed sets of node boxes
// (milestone lanes or one flow, with or without done and dropped chips),
// computed with dagre in page frontmatter and shipped to the island as data.
// Only this module imports dagre, so the island never bundles it. Edges are
// not routed here: React Flow draws each as a bezier between node handles.

import { Graph, layout } from '@dagrejs/dagre';

import type { GraphData, GraphEdge, GraphNode } from './graph';
import { milestoneSummaries } from './planning';
import type { Planning } from './planning-types';

export type LayoutKey = 'lanes-done' | 'lanes-open' | 'flow-done' | 'flow-open';

/** A node's box: top-left corner and size, in whole pixels. */
export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** One milestone lane, top to bottom. */
export interface Lane {
	/** The milestone ID, or `none` for the items with no milestone. */
	key: string;
	/** `<ID> <name>`, or `No milestone`. */
	label: string;
	isFocus: boolean;
	y: number;
	height: number;
}

/** One positioned graph. A node absent from `boxes` is hidden; an edge is drawn only when both ends have boxes. */
export interface GraphLayout {
	boxes: Record<string, Box>;
	/** Empty in the flow layouts. */
	lanes: Lane[];
	/** The `No links` row of isolated items in the flow layouts; `null` when there is none. */
	tray: { y: number } | null;
	width: number;
	height: number;
}

/** Node sizes, in pixels. */
export const SIZES = {
	item: { width: 220, height: 64 },
	chip: { width: 120, height: 28 },
} as const;

const NODE_SEP = 24;
const RANK_SEP = 80;
/** The lane's label band, above its nodes. */
const LABEL_BAND = 32;
/** The space below the label band and below a lane's nodes. */
const LANE_PADDING = 16;
/** The space between the linked graph and the tray, and between tray boxes. */
const TRAY_GAP = 48;
/** Tray boxes per row when no node is linked. */
const TRAY_COLUMNS = 4;
const NONE = 'none';

const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const sizeOf = (node: GraphNode) => (node.kind === 'item' ? SIZES.item : SIZES.chip);

/** dagre's position for each node, as a whole-pixel top-left box, over `nodes` and the edges between them. */
function dagreBoxes(nodes: GraphNode[], edges: GraphEdge[]): Map<string, Box> {
	const graph = new Graph();

	graph.setGraph({ rankdir: 'LR', nodesep: NODE_SEP, ranksep: RANK_SEP });
	graph.setDefaultEdgeLabel(() => ({}));
	for (const node of [...nodes].sort((a, b) => byId(a.id, b.id))) graph.setNode(node.id, { ...sizeOf(node) });

	const pairs = [...new Set(edges.map((edge) => `${edge.source}\n${edge.target}`))].sort(byId);

	for (const pair of pairs) {
		const [source, target] = pair.split('\n') as [string, string];

		graph.setEdge(source, target);
	}
	layout(graph);

	const boxes = new Map<string, Box>();

	for (const node of nodes) {
		const { x, y, width, height } = graph.node(node.id) as { x: number; y: number; width: number; height: number };

		boxes.set(node.id, { x: Math.round(x - width / 2), y: Math.round(y - height / 2), width, height });
	}

	return boxes;
}

/** The candidate lanes, in `milestoneSummaries` order, with `No milestone` last. */
function laneCandidates(planning: Planning): Omit<Lane, 'y' | 'height'>[] {
	const milestones = milestoneSummaries(planning).filter((summary) => summary.id !== null);

	return [
		...milestones.map((summary) => ({ key: summary.id!, label: `${summary.id} ${summary.name}`, isFocus: summary.isFocus })),
		{ key: NONE, label: 'No milestone', isFocus: false },
	];
}

/** Lanes: dagre's columns, each node in its lane, stacked per lane and column in dagre's order. */
function lanesLayout(nodes: GraphNode[], edges: GraphEdge[], placed: Map<string, Box>, planning: Planning): GraphLayout {
	const candidates = laneCandidates(planning);
	const laneIndex = new Map(candidates.map((lane, index) => [lane.key, index]));
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const itemLane = (node: GraphNode): number => laneIndex.get(node.milestone ?? NONE) ?? laneIndex.get(NONE)!;
	const laneOf = (node: GraphNode): number => {
		if (node.kind === 'item') return itemLane(node);

		const dependants = edges.map((edge) => (edge.source === node.id ? nodeById.get(edge.target) : undefined)).filter((target): target is GraphNode => target?.kind === 'item');

		return dependants.length > 0 ? Math.min(...dependants.map(itemLane)) : laneIndex.get(NONE)!;
	};

	// Group by lane, then by column (dagre's x), keeping dagre's top-to-bottom order.
	const grouped = new Map<number, Map<number, GraphNode[]>>();

	for (const node of nodes) {
		const lane = laneOf(node);
		const columns = grouped.get(lane) ?? new Map<number, GraphNode[]>();
		const box = placed.get(node.id)!;
		const column = box.x + box.width / 2;

		columns.set(column, [...(columns.get(column) ?? []), node]);
		grouped.set(lane, columns);
	}

	const boxes: Record<string, Box> = {};
	const lanes: Lane[] = [];
	let top = 0;

	candidates.forEach((candidate, index) => {
		const columns = grouped.get(index);

		if (!columns) return;

		let tallest = 0;

		for (const column of columns.values()) {
			column.sort((a, b) => placed.get(a.id)!.y - placed.get(b.id)!.y || byId(a.id, b.id));

			let y = top + LABEL_BAND + LANE_PADDING;

			for (const node of column) {
				const box = placed.get(node.id)!;

				boxes[node.id] = { ...box, y };
				y += box.height + NODE_SEP;
			}
			tallest = Math.max(tallest, y - NODE_SEP - (top + LABEL_BAND + LANE_PADDING));
		}

		const height = LABEL_BAND + LANE_PADDING + tallest + LANE_PADDING;

		lanes.push({ ...candidate, y: top, height });
		top += height;
	});

	return { boxes, lanes, tray: null, width: extent(boxes, 'x'), height: top };
}

/** Flow: dagre's positions for linked nodes, and isolated items in a tray below, wrapping at the linked width. */
function flowLayout(nodes: GraphNode[], edges: GraphEdge[], placed: Map<string, Box>): GraphLayout {
	const linkedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
	const linkedNodes = nodes.filter((node) => linkedIds.has(node.id));
	const isolated = nodes.filter((node) => !linkedIds.has(node.id));
	const minY = Math.min(...linkedNodes.map((node) => placed.get(node.id)!.y));
	const boxes: Record<string, Box> = {};

	for (const node of linkedNodes) {
		const box = placed.get(node.id)!;

		boxes[node.id] = { ...box, y: box.y - minY };
	}

	const linkedWidth = extent(boxes, 'x');
	const linkedHeight = extent(boxes, 'y');
	let tray: GraphLayout['tray'] = null;

	if (isolated.length > 0) {
		const step = SIZES.item.width + NODE_SEP;
		const perRow = linkedNodes.length > 0 ? Math.max(1, Math.floor((linkedWidth + NODE_SEP) / step)) : TRAY_COLUMNS;
		const trayY = linkedNodes.length > 0 ? linkedHeight + TRAY_GAP : 0;

		tray = { y: trayY };
		isolated.forEach((node, index) => {
			const size = sizeOf(node);

			boxes[node.id] = {
				x: (index % perRow) * step,
				y: trayY + LABEL_BAND + Math.floor(index / perRow) * (SIZES.item.height + NODE_SEP),
				width: size.width,
				height: size.height,
			};
		});
	}

	return { boxes, lanes: [], tray, width: extent(boxes, 'x'), height: extent(boxes, 'y') };
}

/** The furthest right (`x`) or bottom (`y`) edge of any box, or 0 with none. */
function extent(boxes: Record<string, Box>, axis: 'x' | 'y'): number {
	return Object.values(boxes).reduce((max, box) => Math.max(max, axis === 'x' ? box.x + box.width : box.y + box.height), 0);
}

/** The two layouts for one set of drawn nodes, from a single dagre run so columns line up across them. */
function variant(data: GraphData, showDone: boolean, planning: Planning): { lanes: GraphLayout; flow: GraphLayout } {
	const nodes = data.nodes.filter((node) => showDone || (node.kind !== 'done' && node.kind !== 'dropped'));

	if (nodes.length === 0) {
		const empty = (): GraphLayout => ({ boxes: {}, lanes: [], tray: null, width: 0, height: 0 });

		return { lanes: empty(), flow: empty() };
	}

	const drawn = new Set(nodes.map((node) => node.id));
	const edges = data.edges.filter((edge) => drawn.has(edge.source) && drawn.has(edge.target));
	const placed = dagreBoxes(nodes, edges);

	return { lanes: lanesLayout(nodes, edges, placed, planning), flow: flowLayout(nodes, edges, placed) };
}

/**
 * The graph's four layouts: milestone lanes or one flow, each with done and
 * dropped chips (`*-done`) or without them (`*-open`); missing chips stay in
 * all four. Deterministic, in whole pixels.
 */
export function graphLayouts(data: GraphData, planning: Planning): Record<LayoutKey, GraphLayout> {
	const done = variant(data, true, planning);
	const open = variant(data, false, planning);

	return { 'lanes-done': done.lanes, 'lanes-open': open.lanes, 'flow-done': done.flow, 'flow-open': open.flow };
}
