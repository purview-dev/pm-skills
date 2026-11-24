// mermaidFences() renders ```mermaid fences to inline SVG with Pele, through
// the real Sätteri processor (the same one Astro's markdown.processor uses),
// so these tests exercise the actual pipeline, not a mock of it.
import { isSatteriProcessor, satteri } from '@astrojs/markdown-satteri';
import { describe, expect, it } from 'bun:test';

import { markdownProcessor, mermaidFences } from '../lib/mermaid.ts';

const SEQUENCE = '```mermaid\nsequenceDiagram\n  Alice->>Bob: Hello\n```\n';
const FLOWCHART = '```mermaid\nflowchart LR\n  A[Mermaid text] --> B[SVG]\n```\n';
const INVALID = '```mermaid\nsequenceDiagram\n  A->>\n```\n';

/** Render Markdown through a fresh Sätteri processor carrying only the Mermaid fence. */
async function renderMarkdown(source: string, fileURL?: URL): Promise<string> {
	const processor = satteri({ mdastPlugins: [mermaidFences()] });
	const renderer = await processor.createRenderer({});
	const { code } = await renderer.render(source, fileURL ? { fileURL } : {});

	return code;
}

/** Literal `id="..."` attributes; the `\b` boundary also catches `data-id="..."`, which is what Pele's non-Sankey diagrams carry. */
function idsOf(html: string): string[] {
	return [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]!);
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

	it('ids are equal across two renders of the same source', async () => {
		const first = await renderMarkdown(SEQUENCE);
		const second = await renderMarkdown(SEQUENCE);

		expect(first).toBe(second);
	});

	it('two sources with one fence each get distinct ids', async () => {
		const first = await renderMarkdown(SEQUENCE);
		const second = await renderMarkdown(FLOWCHART);
		const firstIds = idsOf(first);
		const secondIds = idsOf(second);

		expect(firstIds.length).toBeGreaterThan(0);
		for (const id of firstIds) expect(secondIds).not.toContain(id);
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
