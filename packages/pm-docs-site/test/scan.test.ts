import { describe, expect, it } from 'bun:test';

import { scanPage } from './scan';

const known = new Set(['R-012', 'M1', 'planning/briefs/a.md']);

describe('scanPage', () => {
	it('finds an ID outside a link', async () => {
		const scan = await scanPage('<main><h1>Board</h1><p>R-012 and <a href="/plan/milestones/m1/">M1</a></p></main>', known);

		expect(scan.unlinked).toEqual(['R-012']);
	});

	it('exempts the h1 and ignores text outside main', async () => {
		const scan = await scanPage('<nav>R-012</nav><main><h1>R-012 Graph</h1></main>', known);

		expect(scan.unlinked).toEqual([]);
		expect(scan.title).toBe('R-012 Graph');
	});

	it('matches whole IDs and brief paths only', async () => {
		const scan = await scanPage('<main><p>M10 R-0120 planning/briefs/a.md</p></main>', known);

		expect(scan.unlinked).toEqual(['planning/briefs/a.md']);
	});

	it('finds an ID split across elements in one text run', async () => {
		expect((await scanPage('<main><p><strong>R-012</strong> done</p></main>', known)).unlinked).toEqual(['R-012']);
	});

	it('ignores script and style text', async () => {
		expect((await scanPage('<main><script>const a = "R-012";</script><style>.M1{}</style></main>', known)).unlinked).toEqual([]);
	});

	it('lists internal links and marks those in Linked from and templates as derived', async () => {
		const scan = await scanPage(
			'<main><a href="/a/">x</a><a href="https://e.org/">e</a><section data-linked-from><a href="/b/">y</a></section><template><a href="/c/#d">z</a></template></main>',
			known,
		);

		expect(scan.links).toEqual([
			{ href: '/a/', derived: false },
			{ href: '/b/', derived: true },
			{ href: '/c/#d', derived: true },
		]);
		expect(scan.hasLinkedFrom).toBe(true);
		expect([...scan.linkedFrom]).toEqual(['/b/']);
	});

	it('finds IDs inside templates too', async () => {
		expect((await scanPage('<main><template><p>M1</p></template></main>', known)).unlinked).toEqual(['M1']);
	});

	it('collects every id attribute on the page', async () => {
		const scan = await scanPage('<div id="top"><main><img id="pic"><p id="rk-003">x</p></main></div>', known);

		expect([...scan.ids].sort()).toEqual(['pic', 'rk-003', 'top']);
	});
});
