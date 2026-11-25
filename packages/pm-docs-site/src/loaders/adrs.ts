// planning.json's ADRs as the `adrs` content collection, with each section's
// Markdown rendered to HTML by the site's own Markdown processor (ADR-002), so
// an ADR page shows its tables, lists, and code as written. The same sections
// are also the `adr-sections` collection, one rendered entry each, so Astro
// resolves a relative image against the ADR's file in the decisions folder
// beside planning.json (ADR-012).

import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Loader } from 'astro/loaders';
import config from 'virtual:pm-docs-site/config';

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

/** One `adr-sections` entry's data; its id is `<adr id, lower case>/<section key>`. */
export type AdrSectionData = { adr: string; section: AdrSection };

/** The ADR's file: `<PM root>/decisions/<file>`, beside `<PM root>/planning.json`. */
export function adrFile(planningPath: string, adrPath: string): string {
	return join(dirname(planningPath), 'decisions', basename(adrPath));
}

/** The `adr-sections` entry id for one section. */
export const adrSectionId = (adrId: string, section: AdrSection) => `${adrId.toLowerCase()}/${section}`;

/** Each present, non-empty section's Markdown, with the ADR's file URL that relative images resolve against. */
function sectionsOf(adr: Adr): { key: AdrSection; markdown: string; file: string }[] {
	const file = adrFile(config.planning, adr.path);

	return ADR_SECTIONS.flatMap(({ key }) => {
		const markdown = adr[key];

		return markdown === null || markdown.trim() === '' ? [] : [{ key, markdown, file }];
	});
}

export function adrsLoader(): Loader {
	return {
		name: 'adrs',
		async load({ store, parseData, renderMarkdown }) {
			store.clear();

			for (const adr of loadPlanning().adrs) {
				const html = {} as Record<AdrSection, string | null>;

				for (const { key } of ADR_SECTIONS) html[key] = adr[key] === null ? null : '';
				for (const { key, markdown, file } of sectionsOf(adr)) html[key] = (await renderMarkdown(markdown, { fileURL: pathToFileURL(file) })).html;

				const id = adr.id.toLowerCase();

				store.set({ id, data: await parseData({ id, data: { ...adr, html } }) });
			}
		},
	};
}

export function adrSectionsLoader(): Loader {
	return {
		name: 'adr-sections',
		async load({ config: astro, store, parseData, renderMarkdown }) {
			const siteRoot = fileURLToPath(astro.root);

			store.clear();
			// No Decisions view, no ADR pages: import no image, so a missing one cannot fail the build.
			if (!config.views.decisions) return;

			for (const adr of loadPlanning().adrs) {
				for (const { key, markdown, file } of sectionsOf(adr)) {
					const id = adrSectionId(adr.id, key);
					const rendered = await renderMarkdown(markdown, { fileURL: pathToFileURL(file) });

					store.set({
						id,
						data: await parseData({ id, data: { adr: adr.id, section: key } satisfies AdrSectionData }),
						// The ADR's expected file, which need not exist: it is only the importer relative images resolve against.
						filePath: relative(siteRoot, file).split(sep).join('/'),
						rendered,
						// Astro imports these against filePath, so render() resolves each image placeholder.
						assetImports: rendered.metadata?.imagePaths,
					});
				}
			}
		},
	};
}
