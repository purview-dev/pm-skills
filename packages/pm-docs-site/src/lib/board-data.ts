// Builds the Board's flat, serialisable card list at build time, from
// planning.json and the site's known targets. All filter, lane, and query
// logic lives in board.ts and runs in the browser; this module only shapes
// the data once, at build time, the same way board.astro did before it.

import { cardRag, COLUMNS } from './board';
import type { BoardCard, ColumnName, LinkRun } from './board';
import { features, milestoneId, planProgress } from './planning';
import type { Owner, Planning } from './planning-types';
import { linkify } from './references';
import type { Target } from './references';

/** The milestone tag and its page, exactly as board.astro's `tagOf` computes it today. */
function tagOf(milestone: string | null, known: Map<string, Target>): { tag: string; tagHref: string | null } {
	const key = milestone ?? 'none';

	return { tag: key === 'none' ? 'No milestone' : key, tagHref: known.get(key)?.href ?? null };
}

/** Every board card, flat, in `COLUMNS` order and export order, for the Board island. */
export function boardCards(planning: Planning, known: Map<string, Target>): BoardCard[] {
	const items = new Map(features(planning).map((feature) => [feature.id, feature]));
	const openRisks = planning.risks.open;
	const runsOf = (text: string): LinkRun[] => linkify(text, known).map((run) => ({ text: run.text, href: run.target?.href ?? null, label: run.target?.label ?? null }));

	const queueCard = (column: Exclude<ColumnName, 'done'>, card: Planning['board']['columns']['now'][number]): BoardCard => {
		const feature = items.get(card.id);
		const milestone = feature?.milestone ?? null;
		const title = `${card.id} ${card.title}`;

		return {
			key: `${column}:${card.id}`,
			id: card.id,
			title,
			titleRuns: runsOf(title),
			column,
			owner: card.owner ?? ((feature?.owner ?? null) as Owner | null),
			milestone,
			...tagOf(milestone, known),
			size: card.size ?? feature?.size ?? null,
			rag: cardRag(card.id, openRisks),
			detail: runsOf(card.detail ?? ''),
			href: known.get(card.id)?.href ?? null,
			started: column === 'now' ? planning.now.started : null,
			progress: column === 'now' ? planProgress(planning.plan) : null,
		};
	};

	const doneCard = (entry: Planning['board']['columns']['done'][number], index: number): BoardCard => {
		const title = entry.id ? `${entry.id} ${entry.title}` : entry.title;
		const milestone = milestoneId(entry.milestone, planning.strategy.milestones);

		return {
			key: `done:${entry.id ?? index}`,
			id: entry.id,
			title,
			titleRuns: runsOf(title),
			column: 'done',
			owner: (entry.owner ?? null) as Owner | null,
			milestone,
			...tagOf(milestone, known),
			size: null,
			rag: cardRag(entry.id, openRisks),
			detail: runsOf(entry.date),
			href: entry.id ? (known.get(entry.id)?.href ?? null) : null,
			started: null,
			progress: null,
		};
	};

	return COLUMNS.flatMap(({ name }) => (name === 'done' ? planning.board.columns.done.map(doneCard) : planning.board.columns[name].map((card) => queueCard(name, card))));
}
