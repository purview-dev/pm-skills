import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { loadPlanning } from '../src/lib/planning';
import { linkify, targets } from '../src/lib/references';

const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const planning = loadPlanning(FIXTURE);
const all = { now: true, milestones: true, features: true, inbox: true, briefs: true, strategy: true };
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

describe('linkify', () => {
	it('links only exact known IDs and brief paths', () => {
		const text = 'See R-012, (RK-002). Not M10, R-0120 or R-999; brief planning/briefs/2026-11-07-referrals.md.';
		const runs = linkify(text, known);

		expect(runs.filter((run) => run.target).map((run) => run.text)).toEqual(['R-012', 'RK-002', 'planning/briefs/2026-11-07-referrals.md']);
		expect(runs.map((run) => run.text).join('')).toBe(text);
	});

	it('returns one plain run for text with no known ID', () => {
		expect(linkify('nothing here', known)).toEqual([{ text: 'nothing here' }]);
	});

	it('leaves an ID plain when its target has no page', () => {
		const off = targets(planning, { ...all, features: false });

		expect(linkify('R-012 waits', off)).toEqual([{ text: 'R-012 waits' }]);
	});
});
