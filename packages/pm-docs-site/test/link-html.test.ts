import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { linkHtml } from '../src/lib/link-html';
import { loadPlanning } from '../src/lib/planning';
import { targets } from '../src/lib/references';

const planning = loadPlanning(fileURLToPath(new URL('./fixtures/planning.json', import.meta.url)));
const all = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true, decisions: true };
const known = targets(planning, all);

describe('linkHtml', () => {
	it('links IDs in text', () => {
		expect(linkHtml('<p>See R-012 and ADR-002.</p>', known)).toBe(
			'<p>See <a href="/plan/features/r-012/">R-012</a> and <a href="/plan/decisions/adr-002/">ADR-002</a>.</p>',
		);
	});

	it('leaves code, pre, and existing links alone', () => {
		for (const html of ['<p><code>R-012</code></p>', '<pre><code>ADR-002\n</code></pre>', '<p><a href="/x">R-012</a></p>']) {
			expect(linkHtml(html, known)).toBe(html);
		}
	});

	it('links again after a closed code span', () => {
		expect(linkHtml('<p><code>x</code> R-012</p>', known)).toBe('<p><code>x</code> <a href="/plan/features/r-012/">R-012</a></p>');
	});

	it('keeps entities and attributes untouched', () => {
		expect(linkHtml('<p title="R-012">&lt;R-012&gt;</p>', known)).toBe('<p title="R-012">&lt;<a href="/plan/features/r-012/">R-012</a>&gt;</p>');
	});

	it('leaves an unknown ID as text', () => {
		expect(linkHtml('<p>R-099</p>', known)).toBe('<p>R-099</p>');
	});
});
