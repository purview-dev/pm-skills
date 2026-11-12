import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
	derivedRag,
	docsHref,
	initials,
	loadPlanning,
	PlanningExportError,
	riskMatrix,
	roadmapGroups,
	sizeToPriority,
} from './planning';

// A synthetic export, never the project's own: the tests must not change when the plan does.
const FIXTURE = fileURLToPath(new URL('./__fixtures__/planning.json', import.meta.url));

describe('loadPlanning', () => {
	it('reads the export', () => {
		expect(loadPlanning(FIXTURE).now.item?.id).toBe('R-012');
	});

	it('fails naming pm-export for a missing file', () => {
		const missing = join(tmpdir(), 'nowhere', 'planning.json');

		expect(() => loadPlanning(missing)).toThrow(PlanningExportError);
		expect(() => loadPlanning(missing)).toThrow(/^No plan export at .*pm-export/);
	});

	it('fails naming pm-export for invalid JSON', async () => {
		const file = join(await mkdtemp(join(tmpdir(), 'planning-')), 'planning.json');
		await writeFile(file, '{ not json');

		expect(() => loadPlanning(file)).toThrow(/is not valid JSON[\s\S]*pm-export/);
	});

	it('fails naming pm-export for an unread schemaVersion', async () => {
		const file = join(await mkdtemp(join(tmpdir(), 'planning-')), 'planning.json');
		await writeFile(file, JSON.stringify({ schemaVersion: 999 }));

		expect(() => loadPlanning(file)).toThrow(/schemaVersion 999[\s\S]*pm-export/);
	});
});

describe('sizeToPriority', () => {
	it('maps S/M/L/null', () => {
		expect(sizeToPriority('S')).toBe('low');
		expect(sizeToPriority('M')).toBe('medium');
		expect(sizeToPriority('L')).toBe('high');
		expect(sizeToPriority(null)).toBe('low');
	});
});

describe('initials', () => {
	it('abbreviates the owner', () => {
		expect(initials('agent')).toBe('AG');
		expect(initials('user')).toBe('YOU');
		expect(initials('both')).toBe('AG+U');
		expect(initials(null)).toBe('AG');
	});
});

describe('roadmapGroups', () => {
	const groups = roadmapGroups(loadPlanning(FIXTURE));

	it('orders by strategy.milestones and puts no-milestone last', () => {
		expect(groups.map((group) => group.milestone?.id ?? null)).toEqual(['M1', 'M2', null]);
	});

	it('marks the focus milestone', () => {
		expect(groups.find((group) => group.milestone?.id === 'M2')?.milestone?.isFocus).toBe(true);
		expect(groups.find((group) => group.milestone?.id === 'M1')?.milestone?.isFocus).toBe(false);
	});

	it('done entries are done, the Now item active, Next and Later pending', () => {
		const m2 = groups.find((group) => group.milestone?.id === 'M2')!;

		expect(m2.events).toEqual([
			{ title: 'R-010 Choose the invoice format', desc: 'CSV with one row per line item.', time: '2026-11-04', status: 'done' },
			{ title: 'R-013 Email invoices to tenants', desc: 'A tenant receives its invoice by email.', time: 'Next', status: 'pending' },
			{ title: 'R-014 Retry failed invoice emails', desc: 'A failed email is retried three times.', time: 'Next', status: 'pending' },
		]);

		const none = groups.at(-1)!;
		expect(none.events.map((event) => [event.title.split(' ')[0], event.status])).toEqual([
			['R-011', 'done'],
			['R-003', 'done'],
			['R-012', 'active'],
			['R-020', 'pending'],
		]);
	});

	it("counts each milestone's progress: done items of all its items", () => {
		expect(groups.find((group) => group.milestone?.id === 'M2')?.progress).toEqual({ done: 1, total: 3 });
		expect(groups.find((group) => group.milestone?.id === 'M1')?.progress).toEqual({ done: 0, total: 0 });
		expect(groups.at(-1)?.progress).toEqual({ done: 2, total: 4 });
	});

	it('keeps milestones with no items', () => {
		expect(groups.find((group) => group.milestone?.id === 'M1')?.events).toEqual([]);
	});
});

describe('derivedRag', () => {
	it('scores likelihood × impact: 6+ red, 3–4 amber, otherwise green', () => {
		expect(derivedRag('high', 'high')).toBe('red');
		expect(derivedRag('high', 'medium')).toBe('red');
		expect(derivedRag('medium', 'high')).toBe('red');
		expect(derivedRag('medium', 'medium')).toBe('amber');
		expect(derivedRag('high', 'low')).toBe('amber');
		expect(derivedRag('low', 'high')).toBe('amber');
		expect(derivedRag('medium', 'low')).toBe('green');
		expect(derivedRag('low', 'medium')).toBe('green');
		expect(derivedRag('low', 'low')).toBe('green');
	});
});

describe('riskMatrix', () => {
	const planning = loadPlanning(FIXTURE);
	const matrix = riskMatrix(planning.risks.open);

	it('puts high impact first and low likelihood first', () => {
		expect(matrix.map((row) => row[0]!.impact)).toEqual(['high', 'medium', 'low']);
		expect(matrix[0]!.map((cell) => cell.likelihood)).toEqual(['low', 'medium', 'high']);
	});

	it('colours each cell by the derived RAG, not by an override', () => {
		expect(matrix.map((row) => row.map((cell) => cell.rag))).toEqual([
			['amber', 'red', 'red'],
			['green', 'amber', 'red'],
			['green', 'green', 'amber'],
		]);
	});

	it('places each risk in its cell', () => {
		const placed = matrix.flatMap((row) => row.flatMap((cell) => cell.risks.map((risk) => [risk.id, cell.likelihood, cell.impact])));

		expect(placed).toEqual([
			['RK-002', 'high', 'high'],
			['RK-004', 'low', 'medium'],
			['RK-005', 'low', 'low'],
		]);
	});
});

describe('docsHref', () => {
	it('maps a plan path and rejects a non-docs path', () => {
		expect(docsHref('docs/superpowers/plans/2026-10-27-tenant-model.md')).toBe('/superpowers/plans/2026-10-27-tenant-model/');
		expect(docsHref('planning/briefs/x.md')).toBeNull();
		expect(docsHref('none (formatting commit)')).toBeNull();
		expect(docsHref(null)).toBeNull();
	});
});
