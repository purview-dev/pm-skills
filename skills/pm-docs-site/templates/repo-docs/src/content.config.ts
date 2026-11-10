import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';

import { docsSources } from './docs-sources';
import { repoDocsLoader } from './loaders/repo-docs';

// The repository's Markdown is read where it lives (docs-sources.ts): nothing is
// copied into the site, so a page can never drift from its source.
export const collections = {
	docs: defineCollection({ loader: repoDocsLoader({ root: '{{SITE_TO_ROOT}}', sources: docsSources }), schema: docsSchema() }),
};
