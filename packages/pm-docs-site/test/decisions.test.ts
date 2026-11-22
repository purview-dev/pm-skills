import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
	ADR_STATUSES,
	adrSearchText,
	DEFAULT_DECISIONS_STATE,
	decisionsQuery,
	groupDecisions,
	matchesDecision,
	parseDecisionsQuery,
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
