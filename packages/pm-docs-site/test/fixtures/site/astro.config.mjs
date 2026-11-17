// @ts-check
// The test consumer: everything a site needs is this call.
import { defineConfig } from 'astro/config';

import pmDocsSite from '../../../index.mjs';

export default defineConfig({
	integrations: [
		pmDocsSite({
			title: 'Fixture plan',
			planning: '../planning.json',
			docs: {
				root: '../docs',
				sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }],
			},
		}),
	],
});
