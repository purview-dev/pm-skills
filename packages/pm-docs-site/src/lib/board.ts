// Pure filter, lane, and query-string model for the Board island. No Astro,
// no node:*, no runtime import from planning.ts: the island loads this module
// in the browser, so it only takes types from planning-types.ts.
import type { Owner, Rag, Size } from './planning-types';

export type ColumnName = 'now' | 'next' | 'foryou' | 'waiting' | 'done';

export const COLUMNS: readonly { name: ColumnName; title: string }[] = [
	{ name: 'now', title: 'Now' },
	{ name: 'next', title: 'Next' },
	{ name: 'foryou', title: 'For you' },
	{ name: 'waiting', title: 'Waiting' },
	{ name: 'done', title: 'Done' },
];

export type CardRag = Rag | 'none';

export interface LinkRun {
	text: string;
	href: string | null;
	label: string | null;
}

export interface BoardCard {
	key: string; // unique per card: `${column}:${id ?? index}`
	id: string | null; // null for a Done entry without an ID
	title: string; // "R-013 Email invoices to tenants"
	titleRuns: LinkRun[]; // linked title text, used when href is null
	column: ColumnName;
	owner: Owner | null;
	initials: string | null; // the owner as the card's initials; null with no owner, which every owner filter hides
	milestone: string | null; // a known milestone ID, or null
	tag: string; // milestone ID or "No milestone"
	tagHref: string | null;
	size: Size | null;
	rag: CardRag;
	detail: LinkRun[]; // the detail line (Done: the date)
	href: string | null; // the item page; null when not built
	started: string | null; // Now card only
	progress: number | null; // Now card only, 0..100
}

export interface BoardFilters {
	owner: Owner | null;
	milestone: string | null;
	size: Size | null;
	rag: CardRag | null;
}

export type GroupBy = 'none' | 'milestone' | 'owner';

export interface BoardState {
	filters: BoardFilters;
	group: GroupBy;
}

export const DEFAULT_STATE: BoardState = {
	filters: { owner: null, milestone: null, size: null, rag: null },
	group: 'none',
};

const OWNERS: readonly Owner[] = ['agent', 'user', 'both'];
const SIZES: readonly Size[] = ['S', 'M', 'L'];
const RAGS: readonly Rag[] = ['red', 'amber', 'green'];
const GROUPS: readonly GroupBy[] = ['none', 'milestone', 'owner'];
const RAG_RANK: Record<Rag, number> = { red: 3, amber: 2, green: 1 };

/** The worst of red, amber, green over the open risks that affect this card's ID exactly; 'none' otherwise. */
export function cardRag(id: string | null, openRisks: { affects: string | null; rag: Rag }[]): CardRag {
	if (id === null) {
		return 'none';
	}

	let worst: Rag | null = null;

	for (const risk of openRisks) {
		if (risk.affects === id && (worst === null || RAG_RANK[risk.rag] > RAG_RANK[worst])) {
			worst = risk.rag;
		}
	}

	return worst ?? 'none';
}

/** Parses a board query string (with or without the leading '?'); an unknown or junk value is ignored (All / None). */
export function parseBoardQuery(search: string, milestoneIds: string[]): BoardState {
	const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

	const owner = params.get('owner');
	const milestone = params.get('milestone');
	const size = params.get('size');
	const rag = params.get('rag');
	const group = params.get('group');

	return {
		filters: {
			owner: owner !== null && (OWNERS as string[]).includes(owner) ? (owner as Owner) : null,
			milestone: milestone === 'none' || (milestone !== null && milestoneIds.includes(milestone)) ? milestone : null,
			size: size !== null && (SIZES as string[]).includes(size) ? (size as Size) : null,
			rag: rag === 'none' || (rag !== null && (RAGS as string[]).includes(rag)) ? (rag as CardRag) : null,
		},
		group: group !== null && (GROUPS as string[]).includes(group) ? (group as GroupBy) : 'none',
	};
}

/** The query string for this state, in the fixed key order owner, milestone, size, rag, group; '' for DEFAULT_STATE. */
export function boardQuery(state: BoardState): string {
	const { filters, group } = state;
	const pairs: [string, string][] = [];

	if (filters.owner !== null) {
		pairs.push(['owner', filters.owner]);
	}
	if (filters.milestone !== null) {
		pairs.push(['milestone', filters.milestone]);
	}
	if (filters.size !== null) {
		pairs.push(['size', filters.size]);
	}
	if (filters.rag !== null) {
		pairs.push(['rag', filters.rag]);
	}
	if (group !== 'none') {
		pairs.push(['group', group]);
	}

	if (pairs.length === 0) {
		return '';
	}

	return `?${pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}

/** Any filter set; group alone is not a filter. */
export function isFiltered(state: BoardState): boolean {
	const { owner, milestone, size, rag } = state.filters;

	return owner !== null || milestone !== null || size !== null || rag !== null;
}

export function matches(card: BoardCard, filters: BoardFilters): boolean {
	if (filters.owner !== null && card.owner !== filters.owner) {
		return false;
	}
	if (filters.size !== null && card.size !== filters.size) {
		return false;
	}
	if (filters.milestone !== null) {
		const wantsNone = filters.milestone === 'none';

		if (wantsNone ? card.milestone !== null : card.milestone !== filters.milestone) {
			return false;
		}
	}
	if (filters.rag !== null && card.rag !== filters.rag) {
		return false;
	}

	return true;
}

export interface Lane {
	key: string;
	label: string;
	cards: BoardCard[];
}

function bucket(cards: BoardCard[], keyOf: (card: BoardCard) => string): Map<string, BoardCard[]> {
	const buckets = new Map<string, BoardCard[]>();

	for (const card of cards) {
		const key = keyOf(card);
		const existing = buckets.get(key);

		if (existing) {
			existing.push(card);
		} else {
			buckets.set(key, [card]);
		}
	}

	return buckets;
}

/** Groups cards into lanes: ungrouped is one lane holding every card in order; milestone and owner follow a fixed lane order and omit empty lanes. */
export function lanes(cards: BoardCard[], group: GroupBy, milestones: { id: string; name: string }[]): Lane[] {
	if (group === 'none') {
		return [{ key: 'all', label: '', cards }];
	}

	if (group === 'milestone') {
		const knownIds = new Set(milestones.map((milestone) => milestone.id));
		const buckets = bucket(cards, (card) => (card.milestone !== null && knownIds.has(card.milestone) ? card.milestone : 'none'));
		const order = [...milestones.map((milestone) => ({ key: milestone.id, label: `${milestone.id} ${milestone.name}` })), { key: 'none', label: 'No milestone' }];

		return order.filter(({ key }) => (buckets.get(key)?.length ?? 0) > 0).map(({ key, label }) => ({ key, label, cards: buckets.get(key)! }));
	}

	// group === 'owner'
	const buckets = bucket(cards, (card) => card.owner ?? 'none');
	const order = [
		{ key: 'agent', label: 'agent' },
		{ key: 'user', label: 'user' },
		{ key: 'both', label: 'both' },
		{ key: 'none', label: 'No owner' },
	];

	return order.filter(({ key }) => (buckets.get(key)?.length ?? 0) > 0).map(({ key, label }) => ({ key, label, cards: buckets.get(key)! }));
}
