import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';
import config from 'virtual:pm-docs-site/config';

import { adrSectionsLoader, adrsLoader } from './loaders/adrs';
import { briefSectionsLoader, inboxSectionsLoader } from './loaders/records';
import { repoDocsLoader } from './loaders/repo-docs';

// Starlight reads a `docs` and an `i18n` collection. Astro registers a
// collection only once it holds an entry, and warns that a collection read
// before then "does not exist or is empty".
//
// With the `docs` option, `docs` is the repository's Markdown, read where it
// lives. Without it, `docs` holds one draft entry: Starlight never routes a
// draft in a production build, so no page is built, and Starlight's own loader
// never looks for a src/content/docs/ folder inside this package. `i18n` holds
// one entry for Starlight's default language with no overrides, so every UI
// string stays Starlight's own.
const NO_DOCS = [{ id: 'pm-docs-site/no-docs', title: 'No repository docs', draft: true }];

export const collections = {
	docs: defineCollection({
		loader: config.docs ? repoDocsLoader({ root: config.docs.root, sources: config.docs.sources }) : () => NO_DOCS,
		schema: docsSchema(),
	}),
	i18n: defineCollection({
		loader: () => [{ id: 'en' }],
		schema: i18nSchema(),
	}),
	// planning.json's ADRs with their sections rendered (src/loaders/adrs.ts). Read
	// only when the export has ADRs, so an empty collection is never looked up.
	adrs: defineCollection({ loader: adrsLoader() }),
	// The same sections as rendered entries, so Astro resolves their relative images (ADR-012).
	'adr-sections': defineCollection({ loader: adrSectionsLoader() }),
	// Each brief's and inbox file's sections, rendered once, with relative images
	// resolved beside the file in briefs/ or inbox/ (src/loaders/records.ts, ADR-017).
	'brief-sections': defineCollection({ loader: briefSectionsLoader() }),
	'inbox-sections': defineCollection({ loader: inboxSectionsLoader() }),
};
