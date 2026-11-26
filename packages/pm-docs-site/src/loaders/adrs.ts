// planning.json's ADRs as the `adrs` content collection, as exported. Each
// non-empty section is rendered once, by the site's own Markdown processor
// (ADR-002), as one `adr-sections` entry, so an ADR page shows its tables,
// lists, and code as written, Astro resolves a relative image against the ADR's
// file in the decisions folder beside planning.json (ADR-012), and siteRefs()
// reads the same HTML for Linked from (ADR-015).

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

/** One `adr-sections` entry's data; its id is `<adr id, lower case>/<section key>`. */
export type AdrSectionData = { adr: string; section: AdrSection };

/** The ADR's file: `<PM root>/decisions/<file>`, beside `<PM root>/planning.json`. */
export function adrFile(planningPath: string, adrPath: string): string {
	return join(dirname(planningPath), 'decisions', basename(adrPath));
}

/** The `adr-sections` entry id for one section. */
export const adrSectionId = (adrId: string, section: AdrSection) => `${adrId.toLowerCase()}/${section}`;

/** Whether a section has Markdown to render: present and not blank. */
export const hasContent = (markdown: string | null): markdown is string => markdown !== null && markdown.trim() !== '';

/** Each present, non-empty section's Markdown, with the ADR's file URL that relative images resolve against. */
function sectionsOf(adr: Adr): { key: AdrSection; markdown: string; file: string }[] {
	const file = adrFile(config.planning, adr.path);

	return ADR_SECTIONS.flatMap(({ key }) => {
		const markdown = adr[key];

		return hasContent(markdown) ? [{ key, markdown, file }] : [];
	});
}

export function adrsLoader(): Loader {
	return {
		name: 'adrs',
		async load({ store, parseData }) {
			store.clear();

			for (const adr of loadPlanning().adrs) {
				const id = adr.id.toLowerCase();

				store.set({ id, data: await parseData({ id, data: { ...adr } }) });
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
