import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { adrHref, features, loadPlanning } from '../src/lib/planning';
import { linkify, references, refText, RELATION_LABELS, targets, type Backlink } from '../src/lib/references';

const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const planning = loadPlanning(FIXTURE);
const all = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true, decisions: true };
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

describe('refText', () => {
	const target = known.get('R-012');

	it('names a known target, or its key for label id', () => {
		expect(refText(target, 'R-012', 'full')).toBe(target!.label);
		expect(refText(target, 'R-012', 'id', 'unused')).toBe('R-012');
	});

	it('prints the fallback for an unknown key, else the key', () => {
		expect(refText(undefined, 'R-404', 'full', 'R-404 Lost item')).toBe('R-404 Lost item');
		expect(refText(undefined, 'none', 'full', 'No milestone')).toBe('No milestone');
		expect(refText(undefined, 'R-404', 'full')).toBe('R-404');
		expect(refText(undefined, null, 'full')).toBe('');
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

	it('does not link an ID after a slash or a brief path after ./', () => {
		const text = 'M1/M2 and R-012/R-011; ./planning/briefs/2026-11-07-referrals.md';
		const runs = linkify(text, known);

		expect(runs.filter((run) => run.target).map((run) => run.text)).toEqual(['M1', 'R-012']);
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

describe('ADR references', () => {
	const back = references(planning, all);

	it('targets every ADR at its page', () => {
		expect(known.get('ADR-002')).toEqual({ kind: 'adr', key: 'ADR-002', href: '/plan/decisions/adr-002/', label: 'ADR-002 Store invoices as rows' });
	});

	it('drops the ADR href when the Decisions view is off', () => {
		expect(targets(planning, { ...all, decisions: false }).get('ADR-002')?.href).toBeNull();
	});

	it('links ADR IDs in prose and never finds R- inside ADR-', () => {
		const runs = linkify('ADR-002 and R-012, not ADR-001x', known);

		expect(runs.filter((run) => run.target).map((run) => run.text)).toEqual(['ADR-002', 'R-012']);
		expect(linkify('ADR-012', known).some((run) => run.target?.key === 'R-012')).toBe(false);
	});

	it('lists an ADR on its item and the item on the ADR', () => {
		expect(back.get('R-012')).toContainEqual({ href: '/plan/decisions/adr-002/', label: 'ADR-002 Store invoices as rows', relation: 'decision' });
		expect(back.get('ADR-002')).toContainEqual({ href: '/plan/features/r-012/', label: 'R-012 Invoice export', relation: 'listed' });
		expect(back.get('ADR-002')).toContainEqual({ href: '/plan/decisions/', label: 'Decisions', relation: 'listed' });
	});

	it('links a supersede both ways', () => {
		expect(back.get('ADR-001')).toContainEqual({ href: '/plan/decisions/adr-002/', label: 'ADR-002 Store invoices as rows', relation: 'supersedes' });
		// ADR-001 is superseded by ADR-002: on ADR-002's page, ADR-001 is listed under Superseded by, never Supersedes.
		expect(back.get('ADR-002')).toContainEqual({ href: '/plan/decisions/adr-001/', label: 'ADR-001 Store invoices as events', relation: 'superseded by' });
		expect(back.get('ADR-002')!.some((link) => link.href === '/plan/decisions/adr-001/' && link.relation === 'supersedes')).toBe(false);
	});

	it('adds nothing for an Item that is not in the export', () => {
		expect(back.has('R-099')).toBe(false);
		expect(back.get('ADR-003')!.some((link) => link.href.startsWith('/plan/features/'))).toBe(false);
	});

	it('labels the new relations', () => {
		expect(RELATION_LABELS.decision).toBe('Decisions');
		expect(RELATION_LABELS.supersedes).toBe('Supersedes');
		expect(RELATION_LABELS['superseded by']).toBe('Superseded by');
	});
});

describe('references from rendered ADR HTML (ADR-011)', () => {
	it('ADR keys replace the raw-Markdown pass for an ADR page', () => {
		const copy = structuredClone(planning);
		const adr = copy.adrs[0]!;
		const item = features(copy)[0]!.id;
		const fromAdr = (back: Map<string, Backlink[]>) => back.get(item)!.some((entry) => entry.href === adrHref(adr.id) && entry.relation === 'mentions');

		adr.context = `See ${item}.`;
		expect(fromAdr(references(copy, all))).toBe(true);
		expect(fromAdr(references(copy, all, new Map([[adr.id, new Set<string>()]])))).toBe(false);
		expect(fromAdr(references(copy, all, new Map([[adr.id, new Set([item])]])))).toBe(true);
	});
});

describe('source hygiene', () => {
	it('src/lib/references.ts holds no control characters', () => {
		const text = readFileSync(fileURLToPath(new URL('../src/lib/references.ts', import.meta.url)), 'utf8');

		expect(text).not.toMatch(/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
	});
});
