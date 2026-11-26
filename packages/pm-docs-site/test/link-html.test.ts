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
		expect(linkHtml('<p>See R-012 and ADR-002.</p>', known).html).toBe(
			'<p>See <a href="/plan/features/r-012/">R-012</a> and <a href="/plan/decisions/adr-002/">ADR-002</a>.</p>',
		);
	});

	it('leaves existing links alone', () => {
		expect(linkHtml('<p><a href="/x">R-012</a> and <a href="/y">ADR-002</a></p>', known).html).toBe('<p><a href="/x">R-012</a> and <a href="/y">ADR-002</a></p>');
	});

	it('links IDs inside code too, as LinkedText does (the link test requires every known ID to be a link)', () => {
		expect(linkHtml('<p><code>R-012</code></p>', known).html).toBe('<p><code><a href="/plan/features/r-012/">R-012</a></code></p>');
		expect(linkHtml('<pre><code>ADR-002\n</code></pre>', known).html).toBe('<pre><code><a href="/plan/decisions/adr-002/">ADR-002</a>\n</code></pre>');
	});

	it('links again after a closed link', () => {
		expect(linkHtml('<p><a href="/x">x</a> R-012</p>', known).html).toBe('<p><a href="/x">x</a> <a href="/plan/features/r-012/">R-012</a></p>');
	});

	it('keeps entities and attributes untouched', () => {
		expect(linkHtml('<p title="R-012">&lt;R-012&gt;</p>', known).html).toBe('<p title="R-012">&lt;<a href="/plan/features/r-012/">R-012</a>&gt;</p>');
	});

	it('leaves an unknown ID as text', () => {
		expect(linkHtml('<p>R-099</p>', known).html).toBe('<p>R-099</p>');
	});

	it('attribute with >: never splits the tag', () => {
		const out = linkHtml('<p><img src="x.png" alt="a > R-012"> R-012</p>', known);

		expect(out.html).toBe('<p><img src="x.png" alt="a > R-012"> <a href="/plan/features/r-012/">R-012</a></p>');
		expect([...out.keys]).toEqual(['R-012']);
	});

	it('script and style: text inside is never linked', () => {
		const out = linkHtml('<script>R-012</script><style>/* ADR-002 */</style><p>x</p>', known);

		expect(out.html).toBe('<script>R-012</script><style>/* ADR-002 */</style><p>x</p>');
		expect(out.keys.size).toBe(0);
	});

	it('copies a script body to its close tag, so a raw < never opens a tag', () => {
		const result = linkHtml("<script>if (a<b) x='R-012'</script><p>R-013</p>", known);

		expect(result.html).toBe("<script>if (a<b) x='R-012'</script><p><a href=\"/plan/features/r-013/\">R-013</a></p>");
		expect([...result.keys]).toEqual(['R-013']);
	});

	it('matches the close tag in any case, for style too', () => {
		expect(linkHtml('<STYLE>a<b{}</Style><p>R-013</p>', known).html).toBe('<STYLE>a<b{}</Style><p><a href="/plan/features/r-013/">R-013</a></p>');
	});

	it('copies an unclosed script to the end', () => {
		expect(linkHtml('<p>R-013</p><script>a<b R-012', known).html).toBe('<p><a href="/plan/features/r-013/">R-013</a></p><script>a<b R-012');
	});

	it('keys: every linked key, none from inside links or unknown IDs', () => {
		const out = linkHtml('<p><em>R-012</em> <a href="/x">ADR-002</a> R-099</p>', known);

		expect([...out.keys]).toEqual(['R-012']);
	});
});