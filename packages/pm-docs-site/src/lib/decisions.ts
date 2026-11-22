// The Decisions view's state: search, status and category filters, grouping,
// and the query string that keeps them in the URL. Pure, so the island and its
// tests share it. All from planning.json's `adrs`.

import type { Adr, AdrStatus } from './planning-types';

/** Every status, in lifecycle order; also the order of status groups. */
export const ADR_STATUSES: readonly AdrStatus[] = ['proposed', 'accepted', 'deprecated', 'superseded'];

export type DecisionsGroup = 'category' | 'status' | 'none';

export interface DecisionsState {
	q: string;
	status: AdrStatus[];
	/** Empty means every category. */
	category: string[];
	group: DecisionsGroup;
}

/** Superseded ADRs are hidden until their chip is pressed. */
export const DEFAULT_DECISIONS_STATE: DecisionsState = { q: '', status: ['proposed', 'accepted', 'deprecated'], category: [], group: 'category' };

const GROUPS: readonly DecisionsGroup[] = ['category', 'status', 'none'];

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((value, i) => value === b[i]);

/** Parse a query string (with or without `?`); unknown values are dropped and an empty status list falls back to the default. */
export function parseDecisionsQuery(search: string, categories: string[]): DecisionsState {
	const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
	const listed = (key: string) => (params.get(key) ?? '').split(',').filter((value) => value !== '');
	const status = ADR_STATUSES.filter((value) => listed('status').includes(value));
	const group = params.get('group');

	return {
		q: params.get('q') ?? '',
		status: status.length ? status : [...DEFAULT_DECISIONS_STATE.status],
		category: [...categories].sort().filter((value) => listed('category').includes(value)),
		group: group !== null && (GROUPS as string[]).includes(group) ? (group as DecisionsGroup) : DEFAULT_DECISIONS_STATE.group,
	};
}

/** The query string for a state, keys in the order q, status, category, group; `''` for the default. */
export function decisionsQuery(state: DecisionsState): string {
	const pairs: [string, string][] = [];
	const status = ADR_STATUSES.filter((value) => state.status.includes(value));

	if (state.q !== '') pairs.push(['q', state.q]);
	if (!sameList(status, DEFAULT_DECISIONS_STATE.status)) pairs.push(['status', status.join(',')]);
	if (state.category.length) pairs.push(['category', [...state.category].sort().join(',')]);
	if (state.group !== DEFAULT_DECISIONS_STATE.group) pairs.push(['group', state.group]);

	return pairs.length ? `?${pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}` : '';
}

/** The words a search matches: ID, title, category, and the four sections without Markdown syntax, lower-cased. */
export function adrSearchText(adr: Adr): string {
	return [adr.id, adr.title, adr.category, adr.context, adr.decision, adr.alternatives, adr.consequences]
		.filter((text): text is string => !!text)
		.join(' ')
		.replace(/[*_`#>|[\]()]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

/** Its status and category are selected, and every word of the search appears in its text. */
export function matchesDecision(adr: Adr, state: DecisionsState, text: string = adrSearchText(adr)): boolean {
	if (adr.status && !state.status.includes(adr.status)) return false;
	if (state.category.length && !state.category.includes(adr.category ?? '')) return false;

	return state.q
		.toLowerCase()
		.split(/\s+/)
		.filter((word) => word !== '')
		.every((word) => text.includes(word));
}

export interface DecisionGroup<T extends Pick<Adr, 'id' | 'status' | 'category'> = Adr> {
	key: string;
	label: string;
	adrs: T[];
}

const byNumber = <T extends Pick<Adr, 'id'>>(a: T, b: T) => Number(a.id.slice(4)) - Number(b.id.slice(4));
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Category groups by name, status groups in lifecycle order, or one group; empty groups are left out, ADRs by ID inside each. */
export function groupDecisions<T extends Pick<Adr, 'id' | 'status' | 'category'>>(adrs: T[], group: DecisionsGroup): DecisionGroup<T>[] {
	if (group === 'none') return [{ key: 'all', label: 'All decisions', adrs }];

	const keyOf = (adr: T) => (group === 'status' ? (adr.status ?? 'unknown') : (adr.category ?? 'uncategorised'));
	const keys =
		group === 'status'
			? [...ADR_STATUSES, 'unknown']
			: [...new Set(adrs.map(keyOf))].sort();

	return keys
		.map((key) => ({ key, label: capital(key), adrs: adrs.filter((adr) => keyOf(adr) === key).sort(byNumber) }))
		.filter((entry) => entry.adrs.length > 0);
}
