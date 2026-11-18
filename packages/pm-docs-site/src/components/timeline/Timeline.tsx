// The Timeline island on the Roadmap page: the milestone cards in strategy
// order, as a strip laid out left to right or top to bottom, with a toolbar
// for the layout and the zoom. It is server-rendered horizontal at 100%, so
// without JavaScript the strip still shows and only the toolbar stays hidden.
// The layout lives in the URL (useTimelineLayout.ts); the zoom lives only here
// and sizes the cards through `--timeline-zoom` (src/styles/timeline.css), so
// text stays sharp and the scroll extents stay real. The strip scrolls with
// the browser's own scrolling; the wheel listener below only adds Ctrl/Cmd +
// wheel zoom and a plain vertical wheel that scrolls a horizontal strip
// sideways while it can. It never calls scrollIntoView, which would move the page.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { wheelScrollsStrip, ZOOM, zoomFromWheel, zoomStep } from '../../lib/timeline';
import type { TimelineMilestone } from '../../lib/timeline';
import { useTimelineLayout } from './useTimelineLayout';

function Card({ milestone }: { milestone: TimelineMilestone }) {
	const { key, id, name, href, isFocus, status, target, progress } = milestone;
	const title = id === null ? 'No milestone' : `${id} ${name}`;

	return (
		<li className="plan-timeline__card" data-milestone={key} data-state={status.state} data-focus={isFocus ? '' : undefined}>
			<span className="plan-timeline__marker" aria-hidden="true" />
			<p className="plan-timeline__title">
				{href ? <a href={href}>{title}</a> : <span>{title}</span>}
				{isFocus && <span className="plan-timeline__focus">Focus</span>}
			</p>
			{key !== 'none' && (
				<p className="plan-timeline__status">
					{status.label}
					{status.doneOn && ` · ${status.doneOn}`}
				</p>
			)}
			{key !== 'none' && <p className="plan-timeline__target">{target ? `target ${target}` : 'No target'}</p>}
			<p className="plan-timeline__count">
				{progress.done} of {progress.total} done
			</p>
			{progress.total > 0 && <progress className="plan-timeline__bar" max={progress.total} value={progress.done} />}
		</li>
	);
}

export default function Timeline({ milestones }: { milestones: TimelineMilestone[] }) {
	const [layout, setLayout, applied] = useTimelineLayout();
	const [zoom, setZoom] = useState<number>(ZOOM.default);
	const zoomRef = useRef<number>(ZOOM.default);
	// Accumulated small (trackpad pinch) wheel deltas, in pixels, not yet a whole step.
	const pending = useRef(0);
	const strip = useRef<HTMLOListElement>(null);
	// The horizontal strip's scroll position and zoom just before a zoom change, so the centre stays put.
	const anchor = useRef<{ scrollLeft: number; prev: number } | null>(null);
	const scrolledToFocus = useRef(false);

	const changeZoom = (next: number) => {
		if (next === zoomRef.current) return;

		const element = strip.current;

		// Keep the earliest snapshot: a second zoom before the render must not read the
		// old scroll position against the new zoom. The layout effect clears it once applied.
		if (element && layout === 'horizontal') anchor.current ??= { scrollLeft: element.scrollLeft, prev: zoomRef.current };
		// Back at the rendered zoom before the render: the layout effect will not run, so drop the snapshot.
		if (anchor.current?.prev === next) anchor.current = null;
		zoomRef.current = next;
		setZoom(next);
	};

	// After the cards have their new size, before paint: keep the point at the strip's centre at its centre.
	useLayoutEffect(() => {
		const element = strip.current;
		const from = anchor.current;

		anchor.current = null;
		if (!element || !from) return;

		const half = element.clientWidth / 2;

		element.scrollLeft = ((from.scrollLeft + half) * zoom) / from.prev - half;
	}, [zoom]);

	// On first load, bring the focus card into view by scrolling the strip itself, never the page.
	useEffect(() => {
		if (!applied || scrolledToFocus.current) return;

		scrolledToFocus.current = true;
		const element = strip.current;
		const focus = element?.querySelector<HTMLElement>('.plan-timeline__card[data-focus]');

		if (!element || !focus || layout !== 'horizontal') return;

		if (focus.offsetLeft < element.scrollLeft || focus.offsetLeft + focus.offsetWidth > element.scrollLeft + element.clientWidth) {
			element.scrollLeft = Math.max(0, focus.offsetLeft - (element.clientWidth - focus.offsetWidth) / 2);
		}
	}, [applied, layout]);

	useEffect(() => {
		const element = strip.current;

		if (!element) return;

		const onWheel = (event: WheelEvent) => {
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault();
				const next = zoomFromWheel(zoomRef.current, pending.current, event.deltaY, event.deltaMode);

				pending.current = next.pending;
				changeZoom(next.zoom);
				return;
			}

			if (layout === 'horizontal' && wheelScrollsStrip(event, element)) {
				event.preventDefault();
				element.scrollLeft += event.deltaY;
			}
			// Every other wheel passes through, so the page scrolls.
		};

		element.addEventListener('wheel', onWheel, { passive: false });

		return () => element.removeEventListener('wheel', onWheel);
		// changeZoom reads refs and `layout`, which is a dependency.
	}, [layout]);

	return (
		<div className="plan-timeline not-content">
			<div className="plan-timeline__toolbar" hidden={!applied}>
				<div className="plan-timeline__group" role="group" aria-label="Layout">
					<button type="button" aria-pressed={layout === 'horizontal'} onClick={() => setLayout('horizontal')}>
						Left to right
					</button>
					<button type="button" aria-pressed={layout === 'vertical'} onClick={() => setLayout('vertical')}>
						Top to bottom
					</button>
				</div>
				<div className="plan-timeline__group" role="group" aria-label="Zoom">
					<button type="button" aria-label="Zoom out" disabled={zoom <= ZOOM.min} onClick={() => changeZoom(zoomStep(zoom, -1))}>
						−
					</button>
					<output className="plan-timeline__zoom" aria-live="polite">
						{Math.round(zoom * 100)}%
					</output>
					<button type="button" aria-label="Zoom in" disabled={zoom >= ZOOM.max} onClick={() => changeZoom(zoomStep(zoom, 1))}>
						+
					</button>
					<button type="button" disabled={zoom === ZOOM.default} onClick={() => changeZoom(ZOOM.default)}>
						Reset zoom
					</button>
				</div>
			</div>

			<ol ref={strip} className="plan-timeline__strip" aria-label="Milestones in order" tabIndex={0} data-layout={layout} style={{ '--timeline-zoom': zoom } as CSSProperties}>
				{milestones.map((milestone) => (
					<Card key={milestone.key} milestone={milestone} />
				))}
			</ol>
		</div>
	);
}
