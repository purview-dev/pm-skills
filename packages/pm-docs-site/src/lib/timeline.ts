// Pure derivations for the Roadmap page's milestone timeline: the cards in
// strategy order, their status and target text, and their progress. All from
// planning.json through milestoneSummaries; nothing here touches the DOM.

import { milestoneCards, normaliseTarget } from './planning';
import type { Planning } from './planning-types';
import type { MilestoneStatus, TimelineMilestone } from './timeline-state';

export { normaliseTarget } from './planning';
export * from './timeline-state';

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
 * The timeline's cards, in strategy order, then `No milestone` last, from
 * `milestoneCards`: it drops `No milestone` when every one of its items is
 * dropped (its progress is then `0` of `0`, since dropped items are never
 * counted).
 */
export function timelineMilestones(planning: Planning, known: Map<string, { href: string | null }>): TimelineMilestone[] {
	return milestoneCards(planning).map((summary) => {
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
