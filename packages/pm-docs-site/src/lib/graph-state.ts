// The Graph island's URL state and chain tracing, kept apart from graph.ts so
// the island imports no module that reads planning.json: graph.ts imports
// planning.ts, which imports node:fs, and under `pm-docs-site dev` every
// module an island imports reaches the browser, used or not. `GraphState`
// lives in the URL like `TimelineLayout` in timeline.ts: defaults write no key,
// and every other parameter and the hash are kept. graph.ts re-exports all of
// it.

import type { GraphEdge } from './graph';
import type { GraphLayout, LayoutKey } from './graph-layout';

/** The graph page's own URL state: milestone lanes, done and dropped chips, and the focused node. */
export interface GraphState {
	lanes: boolean;
	done: boolean;
	focus: string | null;
}

/** `GraphState` from `?lanes=off&done=off&focus=<ID>`; a key's absence, or any value other than the exact `off`, is the default `true`. */
export function parseGraphQuery(search: string): GraphState {
	const params = new URLSearchParams(search);

	return {
		lanes: params.get('lanes') !== 'off',
		done: params.get('done') !== 'off',
		focus: params.get('focus'),
	};
}

/** `search` with `lanes`, `done`, and `focus` set for each non-default value, in that order (appended last); keeps every other parameter. `''` when none remain. */
export function graphQuery(state: GraphState, search: string): string {
	const params = new URLSearchParams(search);

	params.delete('lanes');
	params.delete('done');
	params.delete('focus');

	if (!state.lanes) params.append('lanes', 'off');
	if (!state.done) params.append('done', 'off');
	if (state.focus !== null) params.append('focus', state.focus);

	const query = params.toString();

	return query === '' ? '' : `?${query}`;
}

/** The layout key for the lanes/flow and done/open switches. */
export function layoutKey(state: Pick<GraphState, 'lanes' | 'done'>): LayoutKey {
	return `${state.lanes ? 'lanes' : 'flow'}-${state.done ? 'done' : 'open'}` as LayoutKey;
}

/** `focus` when it names a node drawn in `layout`, else `null` (no focus, or a hidden or missing ID). */
export function resolveFocus(focus: string | null, layout: GraphLayout): string | null {
	return focus !== null && layout.boxes[focus] ? focus : null;
}

/**
 * Every node and edge reached from `id` by walking drawn edges (both ends
 * boxed in `layout`) upstream and downstream, each direction with its own
 * visited set so a cycle terminates. Includes `id` itself.
 */
export function chainOf(edges: GraphEdge[], id: string, layout: GraphLayout): Set<string> {
	const drawn = edges.filter((edge) => Boolean(layout.boxes[edge.source]) && Boolean(layout.boxes[edge.target]));
	const result = new Set<string>([id]);

	const walk = (endpoint: (edge: GraphEdge) => string, neighbour: (edge: GraphEdge) => string) => {
		const visited = new Set<string>([id]);
		const queue = [id];

		while (queue.length > 0) {
			const current = queue.shift()!;

			for (const edge of drawn) {
				if (endpoint(edge) !== current) continue;

				result.add(edge.id);

				const other = neighbour(edge);

				result.add(other);
				if (!visited.has(other)) {
					visited.add(other);
					queue.push(other);
				}
			}
		}
	};

	walk(
		(edge) => edge.target,
		(edge) => edge.source,
	);
	walk(
		(edge) => edge.source,
		(edge) => edge.target,
	);

	return result;
}
