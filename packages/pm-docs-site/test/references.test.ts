import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { loadPlanning } from '../src/lib/planning';
import { linkify, references, RELATION_LABELS, targets } from '../src/lib/references';

const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const planning = loadPlanning(FIXTURE);
const all = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true };
const known = targets(planning, all);

describe('targets', () => {
	it('has one target per item, milestone, risk and brief', () => {
		expect(known.get('R-012')).toEqual({ kind: 'item', key: 'R-012', href: '/plan/features/r-012/', label: 'R-012 Invoice export' });
		expect(known.get('M1')?.href).toBe('/plan/milestones/m1/');
		expect(known.get('none')?.href).toBe('/plan/milestones/none/');
		expect(known.get('RK-002')?.href).toBe('/plan/risks/rk-002/');
		expect(known.get('RK-001')?.href).toBe('/plan/risks/rk-001/');
		expect(known.get('RK-003')?.href).toBe('/plan/risks/#rk-003');
		expect(known.get('planning/briefs/2026-11-07-referrals.md')?.href).toBe('/plan/briefs/#2026-11-07-referrals');
	});

	it('links done and dropped items too', () => {
		expect(known.get('R-003')?.href).toBe('/plan/features/r-003/');
		expect(known.get('R-009')?.href).toBe('/plan/features/r-009/');
	});

	it('drops the href of a target whose view is off; risks are core', () => {
		const off = targets(planning, { ...all, features: false, milestones: false, briefs: false });

		expect(off.get('R-012')?.href).toBeNull();
		expect(off.get('M1')?.href).toBeNull();
		expect(off.get('planning/briefs/2026-11-07-referrals.md')?.href).toBeNull();
		expect(off.get('RK-002')?.href).toBe('/plan/risks/rk-002/');
	});
});

describe('references', () => {
	const back = references(planning, all);
	const from = (key: string) => back.get(key)!.map((link) => `${link.relation} ${link.href}`);

	it('lists every page that links an item, by relation', () => {
		expect(from('R-012')).toContain('listed /plan/board/');
		expect(from('R-012')).toContain('listed /plan/now/');
		expect(from('R-013')).toContain('affects /plan/risks/rk-002/');
		expect(from('R-010')).toContain('depends on /plan/features/r-013/');
	});

	it('records prose mentions', () => {
		expect(from('RK-002')).toContain('mentions /plan/features/r-013/');
		expect(from('M2')).toContain('mentions /plan/features/r-013/');
		expect(from('R-011')).toContain('mentions /plan/now/');
	});

	it('labels each source page', () => {
		expect(back.get('R-012')!.find((link) => link.href === '/plan/board/')?.label).toBe('Board');
		expect(back.get('R-010')!.find((link) => link.href === '/plan/features/r-013/')?.label).toBe('R-013 Email invoices to tenants');
	});

	it('never lists a page as linking to itself, and lists each page once per relation', () => {
		for (const [key, links] of back) {
			const own = known.get(key)!.href;

			expect(links.map((link) => link.href)).not.toContain(own);
			expect(new Set(links.map((link) => `${link.relation} ${link.href}`)).size).toBe(links.length);
		}
	});

	it('has an entry for every target, empty when nothing links to it', () => {
		expect([...back.keys()].sort()).toEqual([...known.keys()].sort());
	});

	it('leaves out source pages of views that are off', () => {
		const off = references(planning, { ...all, now: false });

		expect(off.get('R-012')!.map((link) => link.href)).not.toContain('/plan/now/');
	});

	it('names every relation', () => {
		expect(RELATION_LABELS.listed).toBe('Listed on');
		expect(RELATION_LABELS.mentions).toBe('Mentioned on');
		expect(RELATION_LABELS['depends on']).toBe('Depends on');
	});
});

describe('linkify', () => {
	it('links only exact known IDs and brief paths', () => {
		const text = 'See R-012, (RK-002). Not M10, R-0120 or R-999; brief planning/briefs/2026-11-07-referrals.md.';
		const runs = linkify(text, known);

		expect(runs.filter((run) => run.target).map((run) => run.text)).toEqual(['R-012', 'RK-002', 'planning/briefs/2026-11-07-referrals.md']);
		expect(runs.map((run) => run.text).join('')).toBe(text);
	});

	it('never links an ID inside a path or a longer token', () => {
		const text = 'R-012 starts; see docs/plans/R-012-x.md and R-012-draft.';
		const linked = linkify(text, known).filter((run) => run.target).map((run) => run.text);

		expect(linked).toEqual(['R-012']);
	});

	it('returns one plain run for text with no known ID', () => {
		expect(linkify('nothing here', known)).toEqual([{ text: 'nothing here' }]);
	});

	it('leaves an ID plain when its target has no page', () => {
		const off = targets(planning, { ...all, features: false });

		expect(linkify('R-012 waits', off)).toEqual([{ text: 'R-012 waits' }]);
	});
});
