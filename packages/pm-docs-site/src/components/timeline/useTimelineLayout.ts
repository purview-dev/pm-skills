// The Timeline's layout, kept in the page URL as `?layout=vertical`. The
// server has no location, so the first render is always horizontal (hydration
// must match it); the query is read in an effect on mount. Every later change
// is written back with history.replaceState through timelineQuery, which keeps
// every other parameter and the hash. The pending mark (`data-timeline-pending`
// on <html>, set before paint by the inline script in roadmap.astro when the
// URL asks for vertical) keeps the strip hidden until the vertical layout has
// rendered, so a vertical link never flashes horizontal first.
import { useEffect, useState } from 'react';

import { parseTimelineQuery, timelineQuery } from '../../lib/timeline-state';
import type { TimelineLayout } from '../../lib/timeline-state';

export function useTimelineLayout(): [TimelineLayout, (layout: TimelineLayout) => void, boolean] {
	const [layout, setLayout] = useState<TimelineLayout>('horizontal');
	// True once the URL's layout is applied: the render after it shows that layout.
	const [applied, setApplied] = useState(false);

	useEffect(() => {
		setLayout(parseTimelineQuery(location.search));
		setApplied(true);
	}, []);

	useEffect(() => {
		if (!applied) {
			return;
		}

		// This effect runs after the render that committed the parsed layout, so the strip is already laid out when it shows.
		delete document.documentElement.dataset.timelinePending;
		const url = location.pathname + timelineQuery(layout, location.search) + location.hash;

		if (url !== location.pathname + location.search + location.hash) {
			history.replaceState(history.state, '', url);
		}
	}, [layout, applied]);

	return [layout, setLayout, applied];
}
