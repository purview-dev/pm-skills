// planning.json's briefs and inbox files as the `brief-sections` and
// `inbox-sections` content collections: each non-blank section rendered once,
// as `adr-sections` is (ADR-015), with relative images resolved against the
// file in briefs/ or inbox/ beside planning.json (ADR-017). A brief or inbox
// page renders these entries, and siteRefs() reads the same HTML for Linked from.

import type { Loader } from 'astro/loaders';
import config from 'virtual:pm-docs-site/config';

import { loadPlanning } from '../lib/planning';
import { recordEntries, recordFile, renderSection, type RecordFolder } from './sections';

/** One `brief-sections` or `inbox-sections` entry's data. */
export type RecordSectionData = { record: string; index: number; heading: string };

function sectionsLoader(name: string, folder: RecordFolder, on: () => boolean, records: () => { key: string; sections: { heading: string; markdown: string }[] }[]): Loader {
	return {
		name,
		async load(context) {
			const { store, parseData } = context;

			store.clear();
			// No view, no pages: import no image, so a missing one cannot fail the build.
			if (!on()) return;

			for (const entry of recordEntries(records())) {
				const data: RecordSectionData = { record: entry.record, index: entry.index, heading: entry.heading };

				store.set({
					id: entry.id,
					data: await parseData({ id: entry.id, data }),
					...(await renderSection(context, entry.markdown, recordFile(config.planning, folder, entry.record))),
				});
			}
		},
	};
}

export const briefSectionsLoader = (): Loader =>
	sectionsLoader('brief-sections', 'briefs', () => config.views.briefs, () => loadPlanning().briefs.map((brief) => ({ key: brief.path, sections: brief.sections })));

export const inboxSectionsLoader = (): Loader =>
	sectionsLoader('inbox-sections', 'inbox', () => config.views.inbox, () => loadPlanning().inbox.map((entry) => ({ key: entry.file, sections: entry.sections })));
