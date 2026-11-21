import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';
import config from 'virtual:pm-docs-site/config';

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
};
