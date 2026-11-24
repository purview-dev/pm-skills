// The demo site: a consumer of @purview-dev/pm-docs-site, built from the
// invented plan in planning/ (see README.md).
import { defineConfig } from 'astro/config';
import pmDocsSite from '@purview-dev/pm-docs-site';

export default defineConfig({
	integrations: [
		pmDocsSite({
			title: 'Slotwise demo plan',
			planning: 'planning/planning.json',
			docs: {
				root: 'docs',
				sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }],
			},
			architecture: { project: 'architecture/likec4' },
		}),
	],
});
