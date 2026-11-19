// The Graph's switches and selection, kept in the page URL as `lanes=off`,
// `done=off`, and `focus=<ID>`. The server has no location, so the first render
// is always the default (lanes on, done chips on, nothing selected; hydration
// must match it); the query is read in an effect on mount, and a `focus` from
// it is kept only when it names a node drawn in that layout. Every later
// change is written back with history.replaceState through graphQuery, which
// keeps every other parameter and the hash. A change of switches that hides
// the focused node clears the focus. The pending mark (`data-graph-pending` on
// <html>, set before paint by the inline script in graph.astro when the URL
// turns a switch off) keeps the graph hidden until the parsed layout has
// rendered, so such a link never flashes the default layout first.
import { useCallback, useEffect, useState } from 'react';

import { graphQuery, layoutKey, parseGraphQuery, resolveFocus } from '../../lib/graph-state';
import type { GraphState } from '../../lib/graph-state';
import type { GraphLayout, LayoutKey } from '../../lib/graph-layout';

/** The default view: lanes on, done chips on, nothing selected. */
export const DEFAULT_GRAPH_STATE: GraphState = { lanes: true, done: true, focus: null };

/** `state` with its focus dropped unless the node is drawn in the state's layout. */
function resolved(state: GraphState, layouts: Record<LayoutKey, GraphLayout>): GraphState {
	return { ...state, focus: resolveFocus(state.focus, layouts[layoutKey(state)]) };
}

/**
 * The graph's URL state, a setter that merges a partial change (and clears a
 * focus the new layout does not draw), and whether the URL's state is applied.
 */
export function useGraphUrlState(layouts: Record<LayoutKey, GraphLayout>): [GraphState, (change: Partial<GraphState>) => void, boolean] {
	const [state, setState] = useState<GraphState>(DEFAULT_GRAPH_STATE);
	// True once the URL's state is applied: the render after it shows the parsed layout.
	const [applied, setApplied] = useState(false);

	useEffect(() => {
		setState(resolved(parseGraphQuery(location.search), layouts));
		setApplied(true);
		// Mount only: the layouts are fixed at build time.
	}, []);

	useEffect(() => {
		if (!applied) {
			return;
		}

		// This effect runs after the render that committed the parsed state, so the graph is already laid out when it shows.
		delete document.documentElement.dataset.graphPending;
		const url = location.pathname + graphQuery(state, location.search) + location.hash;

		if (url !== location.pathname + location.search + location.hash) {
			history.replaceState(history.state, '', url);
		}
	}, [state, applied]);

	const update = useCallback((change: Partial<GraphState>) => setState((current) => resolved({ ...current, ...change }, layouts)), [layouts]);

	return [state, update, applied];
}
