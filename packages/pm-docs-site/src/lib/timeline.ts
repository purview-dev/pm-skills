// Pure derivations for the Roadmap page's milestone timeline: the cards in
// strategy order, their status and target text, and their progress. All from
// planning.json through milestoneSummaries; nothing here touches the DOM.

import { milestoneSummaries, normaliseTarget } from './planning';
import type { Planning } from './planning-types';

export { normaliseTarget } from './planning';

export type MilestoneState = 'active' | 'planned' | 'done' | 'other';

export interface MilestoneStatus {
	state: MilestoneState;
	label: string;
	doneOn: string | null;
}

export interface TimelineMilestone {
	/** `null` for the no-milestone card. */
	id: string | null;
	/** `id`, or `none` for the no-milestone card. */
	key: string;
	name: string;
	href: string | null;
	isFocus: boolean;
	status: MilestoneStatus;
	target: string | null;
	progress: { done: number; total: number; percent: number };
}

const DONE = /^done(?:\s*\((\d{4}-\d{2}-\d{2})\))?$/i;

/** A milestone's status text as its state, label, and done date, if any. An unrecognised value is `other`, shown with its own text. */
export function parseMilestoneStatus(status: string | null): MilestoneStatus {
	const text = status?.trim() ?? '';

	if (!text) return { state: 'other', label: 'No status', doneOn: null };

	const done = DONE.exec(text);

	if (done) return { state: 'done', label: 'done', doneOn: done[1] ?? null };

	const lower = text.toLowerCase();

	return lower === 'active' || lower === 'planned' ? { state: lower, label: lower, doneOn: null } : { state: 'other', label: text, doneOn: null };
}

/**
 * The timeline's cards, in strategy order, then `No milestone` last. Drops the
 * `No milestone` card when every one of its items is dropped (its progress is
 * then `0` of `0`, since dropped items are never counted).
 */
export function timelineMilestones(planning: Planning, known: Map<string, { href: string | null }>): TimelineMilestone[] {
	return milestoneSummaries(planning)
		.filter((summary) => summary.id !== null || summary.progress.total > 0)
		.map((summary) => {
			const key = summary.id ?? 'none';
			const { done, total } = summary.progress;

			return {
				id: summary.id,
				key,
				name: summary.name,
				href: known.get(key)?.href ?? null,
				isFocus: summary.isFocus,
				status: parseMilestoneStatus(summary.status),
				target: normaliseTarget(summary.target),
				progress: { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) },
			};
		});
}

// Layout URL state, zoom maths, and the wheel rule: the strip's horizontal or
// vertical layout lives in the URL (never the zoom); zoom lives only in the
// island's own state, snapped to a fixed step; and the wheel rule tells a
// plain vertical wheel apart from a pinch-zoom gesture and from a gesture the
// strip's native horizontal scrolling already handles.

export type TimelineLayout = 'horizontal' | 'vertical';

/** The layout named by `?layout=`; anything other than the exact value `vertical` is horizontal. */
export function parseTimelineQuery(search: string): TimelineLayout {
	return new URLSearchParams(search).get('layout') === 'vertical' ? 'vertical' : 'horizontal';
}

/** `search` with `layout` set for `vertical` (appended last) or removed for `horizontal`; keeps every other parameter. `''` when none remain. */
export function timelineQuery(layout: TimelineLayout, search: string): string {
	const params = new URLSearchParams(search);

	params.delete('layout');

	if (layout === 'vertical') params.append('layout', 'vertical');

	const query = params.toString();

	return query === '' ? '' : `?${query}`;
}

export const ZOOM = { min: 0.5, max: 2, step: 0.25, default: 1 } as const;

/** The wheel delta, in pixels, that one pinch-zoom notch accumulates before the zoom steps. */
export const PINCH_STEP = 50;

const ZOOM_TICKS_PER_UNIT = Math.round(1 / ZOOM.step);
const ZOOM_MIN_TICKS = Math.round(ZOOM.min * ZOOM_TICKS_PER_UNIT);
const ZOOM_MAX_TICKS = Math.round(ZOOM.max * ZOOM_TICKS_PER_UNIT);

/** `zoom` snapped to the nearest step, moved one step in `direction`, then clamped to `[ZOOM.min, ZOOM.max]`. Integer ticks avoid float drift. */
export function zoomStep(zoom: number, direction: 1 | -1): number {
	const ticks = Math.round(zoom * ZOOM_TICKS_PER_UNIT) + direction;
	const clamped = Math.min(ZOOM_MAX_TICKS, Math.max(ZOOM_MIN_TICKS, ticks));

	return clamped / ZOOM_TICKS_PER_UNIT;
}

/**
 * One wheel event's effect on zoom. A mouse notch (`deltaMode !== 0`, or
 * pixels already past `PINCH_STEP`) steps immediately and clears `pending`. A
 * trackpad pinch accumulates `pending` in pixels and steps once per
 * `PINCH_STEP` crossed, keeping the remainder. `deltaY` `0` is a no-op.
 */
export function zoomFromWheel(zoom: number, pending: number, deltaY: number, deltaMode: number): { zoom: number; pending: number } {
	if (deltaY === 0) return { zoom, pending };

	if (deltaMode !== 0 || Math.abs(deltaY) >= PINCH_STEP) {
		return { zoom: zoomStep(zoom, deltaY < 0 ? 1 : -1), pending: 0 };
	}

	let nextZoom = zoom;
	let nextPending = pending + deltaY;

	while (Math.abs(nextPending) >= PINCH_STEP) {
		const negative = nextPending < 0;

		nextZoom = zoomStep(nextZoom, negative ? 1 : -1);
		nextPending += negative ? PINCH_STEP : -PINCH_STEP;
	}

	return { zoom: nextZoom, pending: nextPending };
}

/** Whether the strip's own horizontal scrolling should consume this wheel event, with 1px of tolerance at either end. */
export function wheelScrollsStrip(
	e: { deltaX: number; deltaY: number },
	s: { scrollLeft: number; scrollWidth: number; clientWidth: number },
): boolean {
	if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return false;
	if (s.scrollWidth <= s.clientWidth) return false;

	const TOLERANCE = 1;
	const maxScrollLeft = s.scrollWidth - s.clientWidth;

	if (e.deltaY > 0) return s.scrollLeft < maxScrollLeft - TOLERANCE;

	return s.scrollLeft > TOLERANCE;
}
