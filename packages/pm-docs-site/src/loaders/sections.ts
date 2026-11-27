// What the ADR, brief, and inbox section collections share: where a record's
// file sits beside planning.json, and one render of a section's Markdown by the
// site's processor, with the importer its relative images resolve against
// (ADR-012, ADR-017). A record itself is only ever read from planning.json.

import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { LoaderContext } from 'astro/loaders';

import { briefAnchor } from '../lib/planning';

/** The PM root folders whose files a section may reference images beside. */
export type RecordFolder = 'decisions' | 'briefs' | 'inbox';

/** A record's file: `<PM root>/<folder>/<file>`, beside `<PM root>/planning.json`. */
export function recordFile(planningPath: string, folder: RecordFolder, recordPath: string): string {
	return join(dirname(planningPath), folder, basename(recordPath));
}

/** The section entry id for a brief or inbox section: `<slug>/<index>`. */
export const recordSectionId = (slug: string, index: number) => `${slug}/${index}`;

/** One stored section of a brief or inbox file. */
export interface RecordEntry {
	id: string;
	/** The brief's `path` or the inbox entry's `file`. */
	record: string;
	/** The section's position in the file's `sections`. */
	index: number;
	heading: string;
	markdown: string;
}

/**
 * Each non-blank section of each record as one entry. Two records with one
 * slug would build one page over the other, so that throws.
 */
export function recordEntries(records: { key: string; sections: { heading: string; markdown: string }[] }[]): RecordEntry[] {
	const seen = new Map<string, string>();

	return records.flatMap(({ key, sections }) => {
		const slug = briefAnchor(key);
		const other = seen.get(slug);

		if (other !== undefined) throw new Error(`Duplicate section entry ${slug}: ${other} and ${key}`);
		seen.set(slug, key);

		return sections.flatMap(({ heading, markdown }, index) => (markdown.trim() === '' ? [] : [{ id: recordSectionId(slug, index), record: key, index, heading, markdown }]));
	});
}

/**
 * Render one section against its file and return the store fields Astro needs
 * to resolve its images. `key` (the section's store ID) is the file URL's
 * fragment, so two identical sections of one record get distinct Mermaid IDs
 * (lib/mermaid.ts); images resolve against `filePath`, which has no fragment.
 */
export async function renderSection(context: Pick<LoaderContext, 'config' | 'renderMarkdown'>, markdown: string, file: string, key: string) {
	const siteRoot = fileURLToPath(context.config.root);
	const rendered = await context.renderMarkdown(markdown, { fileURL: new URL(`#${key}`, pathToFileURL(file)) });

	return {
		// The record's expected file, which need not exist: it is only the importer relative images resolve against.
		filePath: relative(siteRoot, file).split(sep).join('/'),
		rendered,
		// Astro imports these against filePath, so render() resolves each image placeholder.
		assetImports: rendered.metadata?.imagePaths,
	};
}
