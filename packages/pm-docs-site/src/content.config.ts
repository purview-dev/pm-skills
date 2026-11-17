import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';
import config from 'virtual:pm-docs-site/config';

import { repoDocsLoader } from './loaders/repo-docs';

// Starlight requires a `docs` collection. With the `docs` option it is the
// repository's Markdown, read where it lives; without it, Starlight's own loader
// finds no src/content/docs/ and the collection is empty.
export const collections = {
	docs: defineCollection({
		loader: config.docs ? repoDocsLoader({ root: config.docs.root, sources: config.docs.sources }) : docsLoader(),
		schema: docsSchema(),
	}),
};
