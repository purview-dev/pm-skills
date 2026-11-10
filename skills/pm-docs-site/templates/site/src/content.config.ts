import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';

// Starlight needs a `docs` collection. Every plan page is in src/pages/, so this
// one stays empty until the repo-docs module replaces it with docs/, read in place.
export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
