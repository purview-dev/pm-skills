import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
	ADR_STATUSES,
	DECISIONS_STATUSES,
	adrSearchText,
	DEFAULT_DECISIONS_STATE,
	decisionsQuery,
	groupDecisions,
	matchesDecision,
	parseDecisionsQuery,
	toggleStatus,
	type DecisionsState,
} from '../src/lib/decisions';
import type { Adr } from '../src/lib/planning-types';

const planning = JSON.parse(readFileSync(join(import.meta.dir, 'fixtures', 'planning.json'), 'utf8'));
const adrs: Adr[] = planning.adrs;
const categories = ['architecture', 'data'];
const byId = (id: string) => adrs.find((adr) => adr.id === id)!;

describe('decisions URL state', () => {
	it('writes no query for the default state', () => {
		expect(decisionsQuery(DEFAULT_DECISIONS_STATE)).toBe('');
	});

	it('round-trips a full state', () => {
		const state: DecisionsState = { q: 'astro pin', status: ['accepted', 'superseded'], category: ['data'], group: 'status' };

		expect(parseDecisionsQuery(decisionsQuery(state), categories)).toEqual(state);
	});

	it('ignores unknown statuses, categories, and groups', () => {
		const state = parseDecisionsQuery('?status=bogus,accepted&category=gone&group=x&q=', categories);

		expect(state).toEqual({ q: '', status: ['accepted'], category: [], group: 'category' });
	});

	it('keeps the default statuses when none is valid', () => {
		expect(parseDecisionsQuery('?status=', categories).status).toEqual(DEFAULT_DECISIONS_STATE.status);
		expect(parseDecisionsQuery('?status=nope', categories).status).toEqual(DEFAULT_DECISIONS_STATE.status);
	});
});

describe('matchesDecision', () => {
	it('hides superseded ADRs by default', () => {
		const shown = adrs.filter((adr) => matchesDecision(adr, DEFAULT_DECISIONS_STATE)).map((adr) => adr.id);

		expect(shown).toEqual(['ADR-002', 'ADR-003', 'ADR-004']);
	});

	it('matches every word of the search, ignoring case and Markdown', () => {
		const state = (q: string) => ({ ...DEFAULT_DECISIONS_STATE, q });

		expect(matchesDecision(byId('ADR-003'), state('BUN'))).toBe(true);
		expect(matchesDecision(byId('ADR-003'), state('bun email'))).toBe(true);
		expect(matchesDecision(byId('ADR-003'), state('bun zebra'))).toBe(false);
	});

	it('filters by category', () => {
		const state = { ...DEFAULT_DECISIONS_STATE, category: ['architecture'] };

		expect(adrs.filter((adr) => matchesDecision(adr, state)).map((adr) => adr.id)).toEqual(['ADR-003', 'ADR-004']);
	});
});

describe('adrSearchText', () => {
	it('strips Markdown syntax and lower-cases', () => {
		const text = adrSearchText(byId('ADR-003'));

		expect(text).toContain('adr-003');
		expect(text).toContain('bun');
		expect(text).not.toContain('*');
		expect(text).not.toContain('`');
	});

	it('reads null and empty sections', () => {
		expect(adrSearchText(byId('ADR-004'))).toContain('mjml');
	});
});

describe('groupDecisions', () => {
	it('groups by status in lifecycle order, skipping empty groups', () => {
		const groups = groupDecisions(adrs, 'status');

		expect(groups.map((group) => group.key)).toEqual([...ADR_STATUSES]);
		expect(groupDecisions([byId('ADR-002')], 'status').map((group) => group.key)).toEqual(['accepted']);
	});

	it('groups by category name, ADRs by ID', () => {
		const groups = groupDecisions([byId('ADR-004'), byId('ADR-002'), byId('ADR-003')], 'category');

		expect(groups.map((group) => [group.key, group.adrs.map((adr) => adr.id)])).toEqual([
			['architecture', ['ADR-003', 'ADR-004']],
			['data', ['ADR-002']],
		]);
	});

	it('puts everything in one group for none', () => {
		expect(groupDecisions(adrs, 'none')).toEqual([{ key: 'all', label: 'All decisions', adrs }]);
	});
});

describe('edge states', () => {
	it('status none: every chip off round-trips as ?status=none', () => {
		const state: DecisionsState = { ...DEFAULT_DECISIONS_STATE, status: [] };

		expect(decisionsQuery(state)).toBe('?status=none');
		expect(parseDecisionsQuery('?status=none', categories).status).toEqual([]);
	});

	it('no status: an ADR with a null status is unknown and follows its chip', () => {
		const adr = { ...byId('ADR-002'), status: null };

		expect(matchesDecision(adr, DEFAULT_DECISIONS_STATE)).toBe(true);
		expect(matchesDecision(adr, { ...DEFAULT_DECISIONS_STATE, status: ['accepted'] })).toBe(false);
		expect(parseDecisionsQuery('?status=unknown', categories).status).toEqual(['unknown']);
	});

	it('toggleStatus: turning off the last visible chip leaves no status, so the URL is ?status=none', () => {
		const visible = DECISIONS_STATUSES.filter((status) => status !== 'unknown');
		let state: DecisionsState = DEFAULT_DECISIONS_STATE;

		for (const status of ['proposed', 'accepted', 'deprecated'] as const) state = { ...state, status: toggleStatus(state.status, status, visible) };
		expect(state.status).toEqual([]);
		expect(decisionsQuery(state)).toBe('?status=none');
		expect(toggleStatus([], 'accepted', visible)).toEqual(['accepted']);
	});

	it('a hidden chip never reaches the URL', () => {
		const visible = DECISIONS_STATUSES.filter((status) => status !== 'unknown');

		expect(decisionsQuery(DEFAULT_DECISIONS_STATE, visible)).toBe('');
		expect(decisionsQuery({ ...DEFAULT_DECISIONS_STATE, status: [...DEFAULT_DECISIONS_STATE.status, 'superseded'] }, visible)).toBe('?status=proposed%2Caccepted%2Cdeprecated%2Csuperseded');
		expect(decisionsQuery({ ...DEFAULT_DECISIONS_STATE, status: ['unknown'] }, visible)).toBe('?status=none');
	});

	it('one category: the category parameter is dropped', () => {


		expect(parseDecisionsQuery('?category=data', ['data']).category).toEqual([]);
		expect(parseDecisionsQuery('?category=data', []).category).toEqual([]);
	});
});
