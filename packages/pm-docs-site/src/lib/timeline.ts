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
