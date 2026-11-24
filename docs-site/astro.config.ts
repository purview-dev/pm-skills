// The pm-skills project site: the plan from planning/planning.json, read where it
// lives. A consumer of the @purview-dev/pm-docs-site package; change it here.
//
//   just docs        # http://localhost:4321
//   just docs-preview  # build with search, then serve the build
//   just docs-check  # install, type-check, and build it

import { defineConfig } from 'astro/config';
import pmDocsSite from '@purview-dev/pm-docs-site';

export default defineConfig({
	integrations: [
		pmDocsSite({
			title: 'pm-skills project',
			description: 'The plan for pm-skills, from planning/planning.json, with every skill and its references.',
			docs: {
				root: '..',
				sources: [
					{ label: 'Project', base: '.', include: ['README.md', 'AGENTS.md'], prefix: 'project/' },
					{ label: 'Guide', base: 'docs/wiki', include: ['Home.md', '*/*.md'], prefix: 'docs/' },
					{ label: 'Skills', base: 'skills', include: ['*/SKILL.md'], prefix: 'skills/', indexFile: 'SKILL.md' },
					{ label: 'References', base: 'skills', include: ['*/references/*.md', '*/templates/*/MODULE.md'], prefix: 'skills/', collapsed: true },
				],
			},
			views: ['now', 'milestones', 'graph', 'features', 'inbox', 'briefs', 'strategy', 'decisions'],
		}),
	],
});
