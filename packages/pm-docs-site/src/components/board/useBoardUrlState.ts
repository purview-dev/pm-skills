// The Board's filter and group state, kept in the page URL. The server has no
// location, so the first render is always DEFAULT_STATE (hydration must match
// it); the query is read in an effect on mount. Every later change is written
// back with history.replaceState (boardUrl: other query keys, the hash, and
// history.state are kept), in boardQuery's fixed key order. The pending
// mark (`data-board-pending` on <html>, set before paint by the inline script
// in PlanInteractions.astro on the Board page when the URL has a board key)
// keeps the board hidden until the parsed state has rendered, so a filtered
// link never shows the unfiltered board first. components.css reveals the
// board after 3s regardless, so it is never blank: when hydration is slow but
// succeeds after 3s, the unfiltered board shows until the island applies the
// URL. That is accepted.
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { boardUrl, DEFAULT_STATE, parseBoardQuery } from '../../lib/board';
import type { BoardState } from '../../lib/board';

export function useBoardUrlState(milestoneIds: string[]): [BoardState, Dispatch<SetStateAction<BoardState>>, boolean] {
	const [state, setState] = useState<BoardState>(DEFAULT_STATE);
	// True once the URL's state is applied: the render after it shows the parsed state.
	const [applied, setApplied] = useState(false);

	useEffect(() => {
		setState(parseBoardQuery(location.search, milestoneIds));
		setApplied(true);
		// Mount only: the milestone list is fixed at build time.
	}, []);

	useEffect(() => {
		if (!applied) {
			return;
		}

		// This effect runs after the render that committed the parsed state, so the board is already filtered when it shows.
		delete document.documentElement.dataset.boardPending;
		// Other query keys and history.state belong to someone else: keep them.
		const url = boardUrl(state, location);

		if (url !== location.pathname + location.search + location.hash) {
			history.replaceState(history.state, '', url);
		}
	}, [state, applied]);

	return [state, setState, applied];
}
