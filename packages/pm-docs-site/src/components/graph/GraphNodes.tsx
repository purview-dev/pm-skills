// The Graph island's React Flow node components: an open item, a chip (a
// done, dropped, or missing ID an item points at), a milestone lane band, and
// the `No links` tray label. Sizes come from the build-time layout (each node
// has an explicit width and height), so nothing here is measured. Every item
// and chip has one target handle on its left and one source handle on its
// right; the edges run between them. Styles are in src/styles/graph.css.
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { MouseEvent } from 'react';

import type { GraphNode } from '../../lib/graph';
import type { Lane } from '../../lib/graph-layout';

/** `milestoneHref`: the item's milestone page, or `null` when it has none or the Milestones view is off. */
export type ItemFlowNode = Node<{ node: GraphNode; showDoneCount: boolean; milestoneHref: string | null }, 'item'>;
export type ChipFlowNode = Node<{ node: GraphNode }, 'chip'>;
/** `href`: the lane's milestone page, or `null`. */
export type LaneFlowNode = Node<{ lane: Lane; href: string | null }, 'lane'>;
export type TrayFlowNode = Node<Record<string, never>, 'tray'>;
export type GraphFlowNode = ItemFlowNode | ChipFlowNode | LaneFlowNode | TrayFlowNode;

const SECTIONS = { now: 'Now', next: 'Next', later: 'Later' } as const;

/** The fixed handles: edges leave an item or chip on its right and enter on its left. */
function Handles() {
	return (
		<>
			<Handle type="target" position={Position.Left} isConnectable={false} className="plan-graph__handle" />
			<Handle type="source" position={Position.Right} isConnectable={false} className="plan-graph__handle" />
		</>
	);
}

/** An open item: its ID (a link to its feature page), title, meta line, and notices. */
export function ItemNode({ data }: NodeProps<ItemFlowNode>) {
	const { node, showDoneCount, milestoneHref } = data;
	const rest = [node.size, node.section ? SECTIONS[node.section] : null, node.owner ?? 'agent'].filter(Boolean).join(' · ');
	const notes = [showDoneCount && node.donePrerequisites > 0 ? `✓ ${node.donePrerequisites} done` : null].filter(Boolean);

	return (
		<div className="plan-graph__item" data-active={node.active ? '' : undefined} data-blocked={node.blocked ? '' : undefined}>
			<Handles />
			<p className="plan-graph__head">
				{node.href ? (
					<a className="plan-graph__id" href={node.href}>
						{node.id}
					</a>
				) : (
					<span className="plan-graph__id">{node.id}</span>
				)}{' '}
				<span className="plan-graph__title">{node.title}</span>
			</p>
			<p className="plan-graph__meta">
				{milestoneHref ? <a href={milestoneHref}>{node.milestone}</a> : (node.milestone ?? 'No milestone')}
				{` · ${rest}`}
			</p>
			{notes.length > 0 && <p className="plan-graph__note">{notes.join(' · ')}</p>}
		</div>
	);
}

/** The chip text: `✓ R-008` (done), `✗ R-003` (dropped), `? R-099 not found` (missing). */
function chipText(node: GraphNode): string {
	if (node.kind === 'done') return `✓ ${node.id}`;
	if (node.kind === 'dropped') return `✗ ${node.id}`;

	return `? ${node.id} not found`;
}

/**
 * A done, dropped, or missing ID. A chip with a feature page is a link, but
 * the first click only selects it (the island's node click handler); the
 * click on the selected chip follows the link.
 */
export function ChipNode({ data, selected }: NodeProps<ChipFlowNode>) {
	const { node } = data;
	const text = chipText(node);
	const follow = (event: MouseEvent<HTMLAnchorElement>) => {
		if (!selected) event.preventDefault();
	};

	return (
		<div className="plan-graph__chip" data-chip={node.kind}>
			<Handles />
			{node.href ? (
				<a className="plan-graph__chip-text" href={node.href} onClick={follow}>
					{text}
				</a>
			) : (
				<span className="plan-graph__chip-text">{text}</span>
			)}
		</div>
	);
}

/** A milestone lane band, drawn behind its nodes, with its label and the `Focus` badge. */
export function LaneNode({ data }: NodeProps<LaneFlowNode>) {
	const { lane, href } = data;

	return (
		<div className="plan-graph__lane" data-lane={lane.key}>
			<p className="plan-graph__lane-label">
				{href ? <a href={href}>{lane.label}</a> : lane.label}
				{lane.isFocus && <span className="plan-graph__focus">Focus</span>}
			</p>
		</div>
	);
}

/** The `No links` label above the flow layouts' row of isolated items. */
export function TrayNode() {
	return (
		<div className="plan-graph__tray">
			<p className="plan-graph__lane-label">No links</p>
		</div>
	);
}

/** The island's node types, defined once so React Flow never sees a new object. */
export const NODE_TYPES = { item: ItemNode, chip: ChipNode, lane: LaneNode, tray: TrayNode };
