import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { boardCards } from '../src/lib/board-data';
import { loadPlanning, planProgress } from '../src/lib/planning';
import { targets } from '../src/lib/references';

const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const planning = loadPlanning(FIXTURE);
const views = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true };
const known = targets(planning, views);
const cards = boardCards(planning, known);

describe('boardCards', () => {
	it('builds exactly the fixture\'s 9 board cards', () => {
		expect(cards).toHaveLength(9);
	});

	it('places each card in its column, in export order', () => {
		const idsOf = (column: string) => cards.filter((card) => card.column === column).map((card) => card.id);

		expect(idsOf('now')).toEqual(['R-012']);
		expect(idsOf('next')).toEqual(['R-013', 'R-022']);
		expect(idsOf('foryou')).toEqual(['R-021', 'R-023']);
		expect(idsOf('waiting')).toEqual(['R-014', 'R-024']);
		expect(idsOf('done')).toEqual(['R-025', 'R-011']);
	});

	it('falls back to the feature for a card with no owner, size, or milestone, and reports Now progress', () => {
		const card = cards.find((candidate) => candidate.id === 'R-012')!;

		expect(card.owner).toBeNull();
		expect(card.size).toBeNull();
		expect(card.milestone).toBeNull();
		expect(card.tag).toBe('No milestone');
		expect(card.rag).toBe('amber');
		expect(card.started).toBe('2026-11-09');
		expect(card.progress).toBe(planProgress(planning.plan));
	});

	it('labels each card with its owner\'s initials, and a card with no owner with none, as the owner filter treats it', () => {
		expect(cards.map((card) => [card.key, card.owner, card.initials])).toEqual(
			cards.map((card) => [card.key, card.owner, card.owner === 'user' ? 'YOU' : card.owner === 'both' ? 'AG+U' : card.owner === 'agent' ? 'AG' : null]),
		);
		expect(cards.find((card) => card.id === 'R-012')!.initials).toBeNull();
		expect(new Set(cards.map((card) => card.initials))).toEqual(new Set(['AG', 'YOU', 'AG+U', null]));
	});

	it('never lets a closed risk colour a card, even when it names it', () => {
		const card = cards.find((candidate) => candidate.id === 'R-021')!;

		expect(card.rag).toBe('none');
	});

	it('derives a Done card\'s milestone from the log entry, with no size', () => {
		const card = cards.find((candidate) => candidate.id === 'R-025')!;

		expect(card.milestone).toBe('M1');
		expect(card.size).toBeNull();
		expect(card.rag).toBe('green');
	});

	it('linkifies a card\'s detail line', () => {
		const card = cards.find((candidate) => candidate.id === 'R-024')!;
		const run = card.detail.find((candidate) => candidate.text === 'R-022');

		expect(run).toBeDefined();
		expect(run?.href).not.toBeNull();
	});

	it('gives every card a unique key', () => {
		expect(new Set(cards.map((card) => card.key)).size).toBe(cards.length);
	});
});
