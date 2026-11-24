// mermaidFences() renders ```mermaid fences to inline SVG with Pele, through
// the real Sätteri processor (the same one Astro's markdown.processor uses),
// so these tests exercise the actual pipeline, not a mock of it.
import { isSatteriProcessor, satteri } from '@astrojs/markdown-satteri';
import { describe, expect, it } from 'bun:test';

import { markdownProcessor, mermaidFences } from '../lib/mermaid.ts';

const SEQUENCE = '```mermaid\nsequenceDiagram\n  Alice->>Bob: Hello\n```\n';
const FLOWCHART = '```mermaid\nflowchart LR\n  A[Mermaid text] --> B[SVG]\n```\n';
const INVALID = '```mermaid\nsequenceDiagram\n  A->>\n```\n';
const TILDE_SEQUENCE = '~~~mermaid\nsequenceDiagram\n  Alice->>Bob: Hello\n~~~\n';

// Flowchart and sequence diagrams identify their elements with `data-id="<label>"`,
// never a literal, idPrefix-derived `id="..."`: Pele only writes idPrefix into the
// DOM for a diagram type that needs an SVG-referenced `<defs>`, confirmed by
// rendering one (a Sankey diagram's gradient fill). The id-uniqueness and
// id-stability tests below render Sankey fences so they exercise the actual
// `idPrefix` string mermaidFences() computes (the source hash and the
// per-document fence counter), not incidental label differences.
const SANKEY_A = '```mermaid\nsankey-beta\n\nA,B,10\n```\n';
const SANKEY_B = '```mermaid\nsankey-beta\n\nC,D,20\n```\n';
const TWO_SANKEY_FENCES = '```mermaid\nsankey-beta\n\nA,B,10\n```\n\n```mermaid\nsankey-beta\n\nC,D,20\n```\n';

/** Render Markdown through a fresh Sätteri processor carrying only the Mermaid fence. */
async function renderMarkdown(source: string, fileURL?: URL): Promise<string> {
	const processor = satteri({ mdastPlugins: [mermaidFences()] });
	const renderer = await processor.createRenderer({});
	const { code } = await renderer.render(source, fileURL ? { fileURL } : {});

	return code;
}

/** The literal `pele-<hash>-<n>-...` ids `mermaidFences()`'s `idPrefix` produces. */
function peleIds(html: string): string[] {
	return [...html.matchAll(/\bid="(pele-[^"]+)"/g)].map((match) => match[1]!);
}

describe('mermaidFences', () => {
	it('renders a sequenceDiagram fence to inline svg', async () => {
		const html = await renderMarkdown(SEQUENCE);

		expect(html).toContain('<svg');
		expect(html).not.toContain('language-mermaid');
		expect(html).not.toContain('<pre');
	});

	it('renders a flowchart LR fence', async () => {
		const html = await renderMarkdown(FLOWCHART);

		expect(html).toContain('<svg');
		expect(html).not.toContain('language-mermaid');
		expect(html).not.toContain('<pre');
	});

	it('renders a ~~~mermaid fence (tilde fence marker) to inline svg', async () => {
		const html = await renderMarkdown(TILDE_SEQUENCE);

		expect(html).toContain('<svg');
		expect(html).not.toContain('language-mermaid');
		expect(html).not.toContain('<pre');
	});

	it('ids are equal across two renders of the same source', async () => {
		const first = await renderMarkdown(SANKEY_A);
		const second = await renderMarkdown(SANKEY_A);

		expect(first).toBe(second);
		// The html equality above already implies this, but pin the mechanism
		// directly: the same idPrefix (hash of the source), not just the same output.
		expect(peleIds(first)).toEqual(peleIds(second));
		expect(peleIds(first).length).toBeGreaterThan(0);
	});

	it('two sources with one fence each get distinct ids', async () => {
		// Two separate renderMarkdown calls, one fence each: the case loaders/adrs.ts
		// hits when two different ADR sections each carry a fence (Review Focus 1).
		// A counter that restarted at 0 for each call, without hashing the source,
		// would give both their first fence the same id; the hash must tell them apart.
		const first = await renderMarkdown(SANKEY_A);
		const second = await renderMarkdown(SANKEY_B);
		const firstIds = peleIds(first);
		const secondIds = peleIds(second);

		expect(firstIds.length).toBeGreaterThan(0);
		expect(secondIds.length).toBeGreaterThan(0);
		for (const id of firstIds) expect(secondIds).not.toContain(id);
	});

	it('two fences in one source get sequential, distinct ids sharing one prefix', async () => {
		// One renderMarkdown call, two fences: the per-document counter (not the
		// hash) must tell them apart, since they share the same factory.source.
		const html = await renderMarkdown(TWO_SANKEY_FENCES);
		const ids = peleIds(html);
		const prefixes = ids.map((id) => id.replace(/^(pele-[^-]+)-\d+-.*$/, '$1'));
		const indices = ids.map((id) => id.replace(/^pele-[^-]+-(\d+)-.*$/, '$1'));

		expect(ids.length).toBe(2);
		expect(new Set(ids).size).toBe(2);
		expect(prefixes[0]).toBe(prefixes[1]);
		expect([...indices].sort()).toEqual(['0', '1']);
	});

	it('a fence that does not parse throws naming the file', async () => {
		const fileURL = new URL('file:///x/docs/bad.md');

		await expect(renderMarkdown(INVALID, fileURL)).rejects.toThrow(/bad\.md[\s\S]*mermaid/);
	});

	it('without a fileURL the error names the source as markdown', async () => {
		await expect(renderMarkdown(INVALID)).rejects.toThrow(/\(markdown\)/);
	});
});

describe('markdownProcessor', () => {
	it('undefined returns a Sätteri processor', () => {
		const processor = markdownProcessor(undefined, () => {});

		expect(isSatteriProcessor(processor as { name: string })).toBe(true);
	});

	it('appends the fence to an existing Sätteri processor, keeping its own plugin first', () => {
		const existingPlugin = { name: 'existing-plugin' };
		const existing = satteri({ mdastPlugins: [existingPlugin as never] });

		const processor = markdownProcessor(existing, () => {}) as { options: { mdastPlugins: unknown[] } };

		expect(processor.options.mdastPlugins).toHaveLength(2);
		expect(processor.options.mdastPlugins[0]).toBe(existingPlugin);
	});

	it('leaves a non-Sätteri processor alone and warns once, naming Mermaid', () => {
		const warnings: string[] = [];
		const existing = { name: 'unified' };

		const processor = markdownProcessor(existing, (message) => warnings.push(message));

		expect(processor).toBeUndefined();
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain('Mermaid');
	});
});
