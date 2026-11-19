// Pure derivation of the dependency graph's nodes, chips, and edges, and the
// Dependencies list's rows, from planning.json's items. graph-layout.ts turns
// GraphData into positioned React Flow nodes and edges; nothing here lays
// anything out or touches the DOM. The URL state and chain tracing the island
// uses live in graph-state.ts, re-exported at the end.

import { features } from './planning';
import type { Feature } from './planning';
import type { Size } from './planning-types';
import type { Planning } from './planning-types';
import type { Target } from './references';

export type GraphNodeKind = 'item' | 'done' | 'dropped' | 'missing';

export interface GraphNode {
	id: string;
	kind: GraphNodeKind;
	/** `null` for a `missing` chip. */
	title: string | null;
	/** `known.get(id)?.href ?? null`. */
	href: string | null;
	/** Items only; `null` for a chip. */
	milestone: string | null;
	size: Size | null;
	/** Items only; `null` for a chip. */
	section: 'now' | 'next' | 'later' | null;
	/** Items only; `null` for a chip. */
	owner: string | null;
	/** `label === 'blocked' || status?.value === 'blocked'`. */
	blocked: boolean;
	/** `section === 'now'`. */
	active: boolean;
	/** Distinct Depends on + Revisits IDs that resolve to a done or dropped node; a repeated ID counts once. */
	donePrerequisites: number;
	/** `true` for the active item: its own `dependsOn`/`revisits` are not exported. */
	linksNotExported: boolean;
}

export interface GraphEdge {
	/** `${source}>${target}:${kind}:${n}`, `n` counts repeats of the same source, target, and kind from 0. */
	id: string;
	/** The prerequisite, or the item being revisited. */
	source: string;
	/** The waiting item, or the revision. */
	target: string;
	kind: 'depends' | 'revisits';
	/** `true` when `source` is a done, dropped, or missing node. */
	fromChip: boolean;
}

export interface GraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

export interface Ref {
	id: string;
	/** `<ID> <title>`, or `<ID> not found` when the ID resolves to no node. */
	label: string;
	href: string | null;
}

export interface DependencyRow {
	id: string;
	title: string;
	href: string | null;
	waitsOn: Ref[];
	waitedOnBy: Ref[];
	/** The row's own `Revisits` target, or `null`. */
	revisits: Ref | null;
	/** Open items whose `Revisits` names this row's item. */
	revisedBy: Ref[];
	linksNotExported: boolean;
}

const OPEN_STATES = new Set<Feature['state']>(['now', 'next', 'later']);

/** An ID's node kind, from the full feature list: an open item, its log state, or missing. */
function classify(id: string, all: Feature[]): GraphNodeKind {
	const feature = all.find((candidate) => candidate.id === id);

	if (!feature) return 'missing';

	return OPEN_STATES.has(feature.state) ? 'item' : (feature.state as 'done' | 'dropped');
}

/** The next `${source}>${target}:${kind}` edge ID, counting repeats of the same triple from 0. */
function nextEdgeId(counts: Map<string, number>, source: string, target: string, kind: GraphEdge['kind']): string {
	const key = `${source}>${target}:${kind}`;
	const n = counts.get(key) ?? 0;

	counts.set(key, n + 1);

	return `${key}:${n}`;
}

/**
 * The graph's nodes and edges: one node per open item (Now, Next, Later, in
 * `features()` order), then one chip per done, dropped, or missing ID an open
 * item's `Depends on` or `Revisits` names, sorted by ID. An edge runs from the
 * prerequisite or original to the waiting or revising item.
 */
export function graphData(planning: Planning, known: Map<string, Pick<Target, 'href'>>): GraphData {
	const all = features(planning);
	const open = all.filter((feature) => OPEN_STATES.has(feature.state));
	const chipIds = new Set<string>();
	const edgeCounts = new Map<string, number>();
	const edges: GraphEdge[] = [];

	const addEdge = (source: string, target: string, kind: GraphEdge['kind']) => {
		const kindOfSource = classify(source, all);

		edges.push({ id: nextEdgeId(edgeCounts, source, target, kind), source, target, kind, fromChip: kindOfSource !== 'item' });
		if (kindOfSource !== 'item') chipIds.add(source);
	};

	for (const feature of open) {
		for (const dep of feature.dependsOn) addEdge(dep, feature.id, 'depends');
		if (feature.revisits) addEdge(feature.revisits, feature.id, 'revisits');
	}

	const donePrerequisites = (feature: Feature): number =>
		new Set(
			[...feature.dependsOn, ...(feature.revisits ? [feature.revisits] : [])].filter((id) => {
				const kind = classify(id, all);

				return kind === 'done' || kind === 'dropped';
			}),
		).size;

	const itemNodes: GraphNode[] = open.map((feature) => ({
		id: feature.id,
		kind: 'item',
		title: feature.title,
		href: known.get(feature.id)?.href ?? null,
		milestone: feature.milestone,
		size: feature.size,
		section: feature.state as 'now' | 'next' | 'later',
		owner: feature.owner,
		blocked: feature.label === 'blocked' || feature.status?.value === 'blocked',
		active: feature.state === 'now',
		donePrerequisites: donePrerequisites(feature),
		linksNotExported: feature.state === 'now',
	}));

	const chipNodes: GraphNode[] = [...chipIds]
		.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
		.map((id) => {
			const feature = all.find((candidate) => candidate.id === id) ?? null;

			return {
				id,
				kind: classify(id, all),
				title: feature?.title ?? null,
				href: known.get(id)?.href ?? null,
				milestone: null,
				size: null,
				section: null,
				owner: null,
				blocked: false,
				active: false,
				donePrerequisites: 0,
				linksNotExported: false,
			};
		});

	return { nodes: [...itemNodes, ...chipNodes], edges };
}

/** One row per item node, in node order, with its waits-on, waited-on-by, revisits, and revised-by references. */
export function dependencyRows(data: GraphData): DependencyRow[] {
	const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
	const ref = (id: string): Ref => {
		const title = nodeById.get(id)?.title ?? null;

		return { id, label: title ? `${id} ${title}` : `${id} not found`, href: nodeById.get(id)?.href ?? null };
	};
	const depends = data.edges.filter((edge) => edge.kind === 'depends');
	const revisits = data.edges.filter((edge) => edge.kind === 'revisits');

	return data.nodes
		.filter((node) => node.kind === 'item')
		.map((node) => {
			const ownRevisits = revisits.find((edge) => edge.target === node.id) ?? null;

			return {
				id: node.id,
				title: node.title!,
				href: node.href,
				waitsOn: depends.filter((edge) => edge.target === node.id).map((edge) => ref(edge.source)),
				waitedOnBy: depends.filter((edge) => edge.source === node.id).map((edge) => ref(edge.target)),
				revisits: ownRevisits ? ref(ownRevisits.source) : null,
				revisedBy: revisits.filter((edge) => edge.source === node.id).map((edge) => ref(edge.target)),
				linksNotExported: node.linksNotExported,
			};
		});
}

export { chainOf, graphQuery, layoutKey, parseGraphQuery, resolveFocus } from './graph-state';
export type { GraphState } from './graph-state';
