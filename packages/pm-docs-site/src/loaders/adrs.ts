// planning.json's ADRs as the `adrs` content collection, with each section's
// Markdown rendered to HTML by the site's own Markdown processor (ADR-002), so
// an ADR page shows its tables, lists, and code as written.

import type { Loader } from 'astro/loaders';

import { loadPlanning } from '../lib/planning';
import type { Adr } from '../lib/planning-types';

export const ADR_SECTIONS = [
	{ key: 'context', label: 'Context' },
	{ key: 'decision', label: 'Decision' },
	{ key: 'alternatives', label: 'Alternatives' },
	{ key: 'consequences', label: 'Consequences' },
] as const;

export type AdrSection = (typeof ADR_SECTIONS)[number]['key'];

/** An ADR with each section as HTML: `null` when the section is missing, `''` when it is empty. */
export type RenderedAdr = Adr & { html: Record<AdrSection, string | null> };

export function adrsLoader(): Loader {
	return {
		name: 'adrs',
		async load({ store, parseData, renderMarkdown }) {
			store.clear();

			for (const adr of loadPlanning().adrs) {
				const html = {} as Record<AdrSection, string | null>;

				for (const { key } of ADR_SECTIONS) {
					const markdown = adr[key];

					html[key] = markdown === null ? null : markdown.trim() === '' ? '' : (await renderMarkdown(markdown)).html;
				}

				const id = adr.id.toLowerCase();

				store.set({ id, data: await parseData({ id, data: { ...adr, html } }) });
			}
		},
	};
}
