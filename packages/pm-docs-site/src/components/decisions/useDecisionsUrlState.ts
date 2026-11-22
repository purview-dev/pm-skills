// The Decisions view's search, filters, and grouping, kept in the page URL. The
// server has no location, so the first render is DEFAULT_DECISIONS_STATE
// (hydration must match it); the query is read in an effect on mount, and
// every later change is written back with history.replaceState.
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { DEFAULT_DECISIONS_STATE, decisionsQuery, parseDecisionsQuery, type DecisionsState } from '../../lib/decisions';

export function useDecisionsUrlState(categories: string[]): [DecisionsState, Dispatch<SetStateAction<DecisionsState>>] {
	const [state, setState] = useState<DecisionsState>(DEFAULT_DECISIONS_STATE);
	const [applied, setApplied] = useState(false);

	useEffect(() => {
		setState(parseDecisionsQuery(location.search, categories));
		setApplied(true);
		// Mount only: the categories are fixed at build time.
	}, []);

	useEffect(() => {
		if (!applied) return;

		const url = location.pathname + decisionsQuery(state) + location.hash;

		if (url !== location.pathname + location.search + location.hash) history.replaceState(null, '', url);
	}, [state, applied]);

	return [state, setState];
}
