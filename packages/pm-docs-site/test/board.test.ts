import { describe, expect, it } from 'bun:test';

import { boardQuery, boardUrl, cardRag, COLUMNS, DEFAULT_STATE, isFiltered, lanes, matches, parseBoardQuery } from '../src/lib/board';
import type { BoardCard, BoardState } from '../src/lib/board';

// A minimal card, overridden per test. Fields not exercised by a test keep a
// plain default so each test states only what it cares about.
function card(overrides: Partial<BoardCard> = {}): BoardCard {
	return {
		key: 'next:R-1',
		id: 'R-1',
		title: 'R-1 Title',
		titleRuns: [{ text: 'R-1 Title', href: null, label: null }],
		column: 'next',
		owner: 'agent',
		initials: 'AG',
		milestone: 'M1',
		tag: 'M1',
		tagHref: null,
		size: 'S',
		rag: 'none',
		detail: [],
		href: null,
		started: null,
		progress: null,
		...overrides,
	};
}

describe('COLUMNS', () => {
	it('names and titles every column in board order', () => {
		expect(COLUMNS.map((column) => [column.name, column.title])).toEqual([
			['now', 'Now'],
			['next', 'Next'],
			['foryou', 'For you'],
			['waiting', 'Waiting'],
			['done', 'Done'],
		]);
	});
});

describe('cardRag', () => {
	it('is the worst of red, amber, green over the risks that affect the card', () => {
		expect(
			cardRag('R-1', [
				{ affects: 'R-1', rag: 'green' },
				{ affects: 'R-1', rag: 'red' },
				{ affects: 'R-1', rag: 'amber' },
			]),
		).toBe('red');
	});

	it('is none when no open risk affects the card', () => {
		expect(cardRag('R-1', [{ affects: 'R-2', rag: 'red' }])).toBe('none');
	});

	it('is none for a card with no ID', () => {
		expect(cardRag(null, [{ affects: 'R-1', rag: 'red' }])).toBe('none');
	});

	it('matches affects exactly, not as a substring', () => {
		expect(cardRag('R-1', [{ affects: 'R-1, R-2', rag: 'red' }])).toBe('none');
	});
});

describe('parseBoardQuery', () => {
	const milestoneIds = ['M1', 'M2'];

	it('reads every known key, with or without the leading ?', () => {
		const expected: BoardState = { filters: { owner: 'user', milestone: 'none', size: 'L', rag: 'none' }, group: 'owner' };

		expect(parseBoardQuery('?owner=user&milestone=none&size=L&rag=none&group=owner', milestoneIds)).toEqual(expected);
		expect(parseBoardQuery('owner=user&milestone=none&size=L&rag=none&group=owner', milestoneIds)).toEqual(expected);
	});

	it('ignores junk or unknown values and falls back to the default', () => {
		expect(parseBoardQuery('?owner=boss&size=XL&group=sideways&milestone=M9&rag=pink', ['M1'])).toEqual(DEFAULT_STATE);
	});
});

describe('boardQuery', () => {
	it('is empty for the default state', () => {
		expect(boardQuery(DEFAULT_STATE)).toBe('');
	});

	it('writes the keys in a fixed order', () => {
		const state: BoardState = { filters: { owner: 'both', milestone: 'M2', size: 'S', rag: 'red' }, group: 'milestone' };

		expect(boardQuery(state)).toBe('?owner=both&milestone=M2&size=S&rag=red&group=milestone');
	});

	it('round-trips through parseBoardQuery', () => {
		const state: BoardState = { filters: { owner: 'both', milestone: 'M2', size: 'S', rag: 'red' }, group: 'milestone' };

		expect(parseBoardQuery(boardQuery(state), ['M1', 'M2'])).toEqual(state);
	});
});

describe('isFiltered', () => {
	it('is true when any filter is set', () => {
		expect(isFiltered({ filters: { owner: 'user', milestone: null, size: null, rag: null }, group: 'none' })).toBe(true);
	});

	it('ignores group alone', () => {
		expect(isFiltered({ filters: { owner: null, milestone: null, size: null, rag: null }, group: 'owner' })).toBe(false);
	});

	it('is false for the default state', () => {
		expect(isFiltered(DEFAULT_STATE)).toBe(false);
	});
});

describe('matches', () => {
	it('hides a card with no owner when an owner filter is set', () => {
		expect(matches(card({ owner: null }), { owner: 'user', milestone: null, size: null, rag: null })).toBe(false);
	});

	it('hides a card with no size when a size filter is set', () => {
		expect(matches(card({ size: null }), { owner: null, milestone: null, size: 'L', rag: null })).toBe(false);
	});

	it('matches milestone: none only to a card with no milestone', () => {
		expect(matches(card({ milestone: null }), { owner: null, milestone: 'none', size: null, rag: null })).toBe(true);
		expect(matches(card({ milestone: 'M1' }), { owner: null, milestone: 'none', size: null, rag: null })).toBe(false);
	});

	it('matches rag: none only to a card with no risk', () => {
		expect(matches(card({ rag: 'none' }), { owner: null, milestone: null, size: null, rag: 'none' })).toBe(true);
		expect(matches(card({ rag: 'red' }), { owner: null, milestone: null, size: null, rag: 'none' })).toBe(false);
	});

	it('combines filters with AND', () => {
		const filters = { owner: 'agent' as const, milestone: 'M1', size: 'S' as const, rag: null };

		expect(matches(card({ owner: 'agent', milestone: 'M1', size: 'S' }), filters)).toBe(true);
		expect(matches(card({ owner: 'agent', milestone: 'M1', size: 'M' }), filters)).toBe(false);
		expect(matches(card({ owner: 'user', milestone: 'M1', size: 'S' }), filters)).toBe(false);
	});
});

describe('lanes', () => {
	const milestones = [
		{ id: 'M1', name: 'First release' },
		{ id: 'M2', name: 'Billing' },
	];

	it('puts every card in one lane when not grouping', () => {
		const cards = [card({ key: 'a' }), card({ key: 'b' })];

		expect(lanes(cards, 'none', milestones)).toEqual([{ key: 'all', label: '', cards }]);
	});

	it('groups by milestone, in strategy order, with unknowns and no-milestone last', () => {
		const m1 = card({ key: 'a', milestone: 'M1' });
		const m2 = card({ key: 'b', milestone: 'M2' });
		const none = card({ key: 'c', milestone: null });
		const unknown = card({ key: 'd', milestone: 'M9' });

		const result = lanes([m1, m2, none, unknown], 'milestone', milestones);

		expect(result.map((lane) => [lane.key, lane.label])).toEqual([
			['M1', 'M1 First release'],
			['M2', 'M2 Billing'],
			['none', 'No milestone'],
		]);
		expect(result.find((lane) => lane.key === 'M1')?.cards).toEqual([m1]);
		expect(result.find((lane) => lane.key === 'none')?.cards).toEqual([none, unknown]);
	});

	it('omits an empty milestone lane', () => {
		const result = lanes([card({ milestone: 'M1' })], 'milestone', milestones);

		expect(result.map((lane) => lane.key)).toEqual(['M1']);
	});

	it('groups by owner in a fixed order, omitting empty lanes', () => {
		const agent = card({ key: 'a', owner: 'agent' });
		const user = card({ key: 'b', owner: 'user' });
		const both = card({ key: 'c', owner: 'both' });
		const none = card({ key: 'd', owner: null });

		const result = lanes([agent, user, both, none], 'owner', milestones);

		expect(result.map((lane) => [lane.key, lane.label])).toEqual([
			['agent', 'agent'],
			['user', 'user'],
			['both', 'both'],
			['none', 'No owner'],
		]);
	});

	it('omits an empty owner lane', () => {
		const result = lanes([card({ owner: 'agent' })], 'owner', milestones);

		expect(result.map((lane) => lane.key)).toEqual(['agent']);
	});
});

describe('boardUrl', () => {
	const agent: BoardState = { filters: { owner: 'agent', milestone: null, size: null, rag: null }, group: 'none' };

	it('keeps the query keys the board does not own, and the hash', () => {
		expect(boardUrl(agent, { pathname: '/plan/board/', search: '?utm=x&owner=user', hash: '#top' })).toBe('/plan/board/?utm=x&owner=agent#top');
	});

	it('keeps other keys for the default state and drops only the board keys', () => {
		expect(boardUrl(DEFAULT_STATE, { pathname: '/plan/board/', search: '?utm=x', hash: '' })).toBe('/plan/board/?utm=x');
		expect(boardUrl(DEFAULT_STATE, { pathname: '/plan/board/', search: '?owner=agent', hash: '' })).toBe('/plan/board/');
	});
});

describe('lanes, ungrouped', () => {
	it('returns a copy of the cards, never the input array', () => {
		const cards = [card({ key: 'a' }), card({ key: 'b' })];
		const [lane] = lanes(cards, 'none', []);

		expect(lane!.cards).not.toBe(cards);
		expect(lane!.cards).toEqual(cards);
	});
});