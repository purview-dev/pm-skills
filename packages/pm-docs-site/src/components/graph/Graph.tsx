// The Graph island on the Graph page: open items, the done, dropped, and
// missing IDs they point at, and their Depends on and Revisits links, drawn
// with React Flow. Every position comes from the four build-time layouts
// (src/lib/graph-layout.ts, run in graph.astro's frontmatter); this file only
// picks one, so no layout code reaches the browser. It may only `import type`
// from graph-layout.ts, which imports dagre, and from graph.ts, which imports
// planning.ts (node:fs); its runtime helpers come from graph-state.ts.
//
// The server renders the default layout (lanes on, done chips on) fitted to a
// nominal canvas size, and hydration starts from the same nodes and the same
// transform (`defaultViewport`), so the two match; the island then fits the
// real canvas. The switches and the
// selection live in the URL (useGraphUrlState.ts). Clicking a node, or Enter
// on it, selects it and highlights its chain (chainOf); everything else gets
// `data-dimmed`. Clicking the selected node again, or an item's ID link,
// opens its feature page. Escape, or a click on the background or a lane,
// clears the selection. The wheel zooms only over the canvas, as React Flow
// does by default, so the page still scrolls past it.
import { getViewportForBounds, MarkerType, Position, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import type { Edge, NodeMouseHandler, Viewport } from '@xyflow/react';
import { useEffect, useMemo } from 'react';
import type { KeyboardEvent } from 'react';

import type { GraphEdge, GraphNode } from '../../lib/graph';
import { chainOf, layoutKey } from '../../lib/graph-state';
import type { GraphState } from '../../lib/graph-state';
import type { GraphLayout, LayoutKey } from '../../lib/graph-layout';
import { NODE_TYPES } from './GraphNodes';
import type { GraphFlowNode } from './GraphNodes';
import { DEFAULT_GRAPH_STATE, useGraphUrlState } from './useGraphUrlState';

interface Props {
	nodes: GraphNode[];
	edges: GraphEdge[];
	layouts: Record<LayoutKey, GraphLayout>;
	/** Milestone page by milestone ID (and `none`), for the lane labels and item meta lines; absent without a page. */
	milestoneHrefs: Record<string, string>;
}

/** The canvas size the server render (and so the first client render) is fitted to. */
const SERVER_VIEW = { width: 960, height: 540 };
/** How far a lane band reaches past the outermost nodes on each side. */
const LANE_PAD = 16;
/** The lane and tray label band's height (graph-layout.ts LABEL_BAND). */
const LABEL_BAND = 32;
const ZOOM = { min: 0.25, max: 2 };
/** The space kept around the graph when it is fitted. */
const FIT = { padding: '16px' } as const;

/** Data attributes on a node's or edge's React Flow element: present when `true`, absent otherwise. */
function flag(on: boolean): string | undefined {
	return on ? '' : undefined;
}

/** React Flow's `domAttributes` take no data attributes in their type; they are spread onto the element. */
function dataAttributes(attributes: Record<string, string | undefined>): Record<string, string> {
	return Object.fromEntries(Object.entries(attributes).filter((entry): entry is [string, string] => entry[1] !== undefined));
}

/** The React Flow nodes for one layout: lane bands and the tray label first, then every boxed item and chip. */
function flowNodes(data: GraphNode[], layout: GraphLayout, state: GraphState, chain: Set<string> | null, milestoneHrefs: Record<string, string>): GraphFlowNode[] {
	const backdrop: GraphFlowNode[] = layout.lanes.map((lane) => ({
		id: `lane:${lane.key}`,
		type: 'lane',
		position: { x: -LANE_PAD, y: lane.y },
		width: layout.width + LANE_PAD * 2,
		height: lane.height,
		zIndex: -1,
		selectable: false,
		focusable: false,
		draggable: false,
		data: { lane, href: milestoneHrefs[lane.key] ?? null },
	}));

	if (layout.tray) {
		backdrop.push({
			id: 'tray',
			type: 'tray',
			position: { x: 0, y: layout.tray.y },
			width: layout.width,
			height: LABEL_BAND,
			zIndex: -1,
			selectable: false,
			focusable: false,
			draggable: false,
			data: {},
		});
	}

	const boxed = data.flatMap((node): GraphFlowNode[] => {
		const box = layout.boxes[node.id];

		if (!box) return [];

		const shared = {
			id: node.id,
			position: { x: box.x, y: box.y },
			width: box.width,
			height: box.height,
			selected: state.focus === node.id,
			draggable: false,
			// The accessible name carries the full title, which the node truncates.
			ariaLabel: node.title === null ? `${node.id} not found` : node.kind === 'item' ? `${node.id} ${node.title}` : `${node.id} ${node.title} (${node.kind})`,
			// Fixed handles, so edges are placed without measuring the DOM (and on the server).
			handles: [
				{ type: 'target' as const, position: Position.Left, x: 0, y: Math.round(box.height / 2), width: 1, height: 1 },
				{ type: 'source' as const, position: Position.Right, x: box.width - 1, y: Math.round(box.height / 2), width: 1, height: 1 },
			],
			domAttributes: dataAttributes({
				'data-graph-node': node.id,
				'data-kind': node.kind,
				'data-selected': flag(state.focus === node.id),
				'data-dimmed': flag(chain !== null && !chain.has(node.id)),
			}),
		};

		return [node.kind === 'item' ? { ...shared, type: 'item', data: { node, showDoneCount: !state.done, milestoneHref: node.milestone ? (milestoneHrefs[node.milestone] ?? null) : null } } : { ...shared, type: 'chip', data: { node } }];
	});

	return [...backdrop, ...boxed];
}

/** The React Flow edges drawn in one layout: both ends boxed. */
function flowEdges(edges: GraphEdge[], layout: GraphLayout, chain: Set<string> | null): Edge[] {
	return edges
		.filter((edge) => layout.boxes[edge.source] && layout.boxes[edge.target])
		.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			type: 'default',
			className: ['plan-graph__edge', `plan-graph__edge--${edge.kind}`, edge.fromChip ? 'plan-graph__edge--muted' : ''].filter(Boolean).join(' '),
			...(edge.kind === 'revisits' ? { label: 'revisits' } : {}),
			// A muted (from-chip) edge colours its own arrowhead; a full-contrast one is
			// left uncoloured inline so the CSS rule on .react-flow__arrowhead polyline applies.
			markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, ...(edge.fromChip ? { color: 'var(--sl-color-gray-5)' } : {}) },
			selectable: false,
			focusable: false,
			domAttributes: dataAttributes({
				'data-graph-edge': edge.id,
				'data-kind': edge.kind,
				'data-dimmed': flag(chain !== null && !chain.has(edge.id)),
			}),
		}));
}

/**
 * The default layout fitted to SERVER_VIEW: the transform the provider's `fitView` gives the server render.
 * React Flow's pan and zoom start from `defaultViewport` on the client, so passing this keeps hydration on the
 * server's frame until the island fits the real canvas.
 */
function fittedViewport(list: GraphFlowNode[]): Viewport {
	const left = Math.min(...list.map((node) => node.position.x));
	const top = Math.min(...list.map((node) => node.position.y));
	const right = Math.max(...list.map((node) => node.position.x + (node.width ?? 0)));
	const bottom = Math.max(...list.map((node) => node.position.y + (node.height ?? 0)));

	return getViewportForBounds({ x: left, y: top, width: right - left, height: bottom - top }, SERVER_VIEW.width, SERVER_VIEW.height, ZOOM.min, ZOOM.max, FIT.padding);
}

function GraphView({ nodes, edges, layouts, milestoneHrefs, initialViewport }: Props & { initialViewport: Viewport }) {
	const [state, update, applied] = useGraphUrlState(layouts);
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const key = layoutKey(state);
	const layout = layouts[key];
	const chain = useMemo(() => (state.focus ? chainOf(edges, state.focus, layout) : null), [edges, state.focus, layout]);
	const flowNodeList = useMemo(() => flowNodes(nodes, layout, state, chain, milestoneHrefs), [nodes, layout, state, chain, milestoneHrefs]);
	const flowEdgeList = useMemo(() => flowEdges(edges, layout, chain), [edges, layout, chain]);
	const hrefs = useMemo(() => new Map(nodes.map((node) => [node.id, node.href])), [nodes]);

	// A new layout has new extents: fit it once its nodes are in the store.
	useEffect(() => {
		if (applied) void fitView(FIT);
	}, [key, applied]);

	const open = (id: string) => {
		const href = hrefs.get(id);

		if (href) location.assign(href);
	};

	const onNodeClick: NodeMouseHandler<GraphFlowNode> = (event, node) => {
		if (node.type === 'lane' || node.type === 'tray') {
			update({ focus: null });
			return;
		}

		// A link inside the node follows itself (a chip's link only once it is selected).
		if (event.target instanceof Element && event.target.closest('a')) {
			if (state.focus !== node.id) update({ focus: node.id });
			return;
		}

		if (state.focus === node.id) open(node.id);
		else update({ focus: node.id });
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Escape') {
			update({ focus: null });
			return;
		}

		if (event.key !== 'Enter' || !(event.target instanceof HTMLElement)) return;

		const id = event.target.dataset.graphNode;

		if (!id) return;

		event.preventDefault();
		if (state.focus === id) open(id);
		else update({ focus: id });
	};

	return (
		<div className="plan-graph not-content" data-layout={key} data-pagefind-ignore onKeyDown={onKeyDown}>
			<div className="plan-graph__toolbar" hidden={!applied}>
				<div className="plan-graph__group" role="group" aria-label="View">
					<button type="button" role="switch" aria-checked={state.lanes} onClick={() => update({ lanes: !state.lanes })}>
						Milestone lanes
					</button>
					<button type="button" role="switch" aria-checked={state.done} onClick={() => update({ done: !state.done })}>
						Show done prerequisites
					</button>
				</div>
				<div className="plan-graph__group" role="group" aria-label="Zoom">
					<button type="button" aria-label="Zoom out" onClick={() => void zoomOut()}>
						−
					</button>
					<button type="button" aria-label="Zoom in" onClick={() => void zoomIn()}>
						+
					</button>
					<button type="button" onClick={() => void fitView(FIT)}>
						Fit
					</button>
				</div>
			</div>

			<div className="plan-graph__canvas">
				<ReactFlow<GraphFlowNode, Edge>
					nodes={flowNodeList}
					edges={flowEdgeList}
					nodeTypes={NODE_TYPES}
					nodesDraggable={false}
					nodesConnectable={false}
					elementsSelectable
					fitView
					fitViewOptions={FIT}
					defaultViewport={initialViewport}
					minZoom={ZOOM.min}
					maxZoom={ZOOM.max}
					defaultMarkerColor={null}
					deleteKeyCode={null}
					selectionKeyCode={null}
					multiSelectionKeyCode={null}
					onNodeClick={onNodeClick}
					onPaneClick={() => update({ focus: null })}
					aria-label="Dependency graph"
				/>
			</div>
		</div>
	);
}

/** The Graph island: `nodes` and `edges` once, the four build-time layouts they are placed by, and the milestone pages. */
export default function Graph({ nodes, edges, layouts, milestoneHrefs }: Props) {
	// The provider's first state is the default layout fitted to SERVER_VIEW, on the server and on hydration alike.
	const initial = useMemo(() => {
		const layout = layouts[layoutKey(DEFAULT_GRAPH_STATE)];

		const first = flowNodes(nodes, layout, DEFAULT_GRAPH_STATE, null, milestoneHrefs);

		return { nodes: first, edges: flowEdges(edges, layout, null), viewport: fittedViewport(first) };
	}, [nodes, edges, layouts, milestoneHrefs]);

	return (
		<ReactFlowProvider
			initialNodes={initial.nodes}
			initialEdges={initial.edges}
			initialWidth={SERVER_VIEW.width}
			initialHeight={SERVER_VIEW.height}
			initialMinZoom={ZOOM.min}
			initialMaxZoom={ZOOM.max}
			initialFitViewOptions={FIT}
			fitView
		>
			<GraphView nodes={nodes} edges={edges} layouts={layouts} milestoneHrefs={milestoneHrefs} initialViewport={initial.viewport} />
		</ReactFlowProvider>
	);
}
