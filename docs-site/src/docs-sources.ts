// The Markdown this site reads in place: each source is one sidebar group.
//
// Site-owned: pm-docs-site writes this file once and never overwrites it, so
// change the sources to suit the repository. Paths are relative to its root.
//
// pm-skills documents itself in docs/wiki/ (the pages purview.dev publishes),
// the README, the agent instructions, and each skill with its references.
import type { DocsSource } from './loaders/repo-docs';

export const docsSources: DocsSource[] = [
	{ label: 'Project', base: '.', include: ['README.md', 'AGENTS.md'], prefix: 'project/' },
	{ label: 'Guide', base: 'docs/wiki', include: ['Home.md', '*/*.md'], prefix: 'docs/' },
	{ label: 'Skills', base: 'skills', include: ['*/SKILL.md'], prefix: 'skills/', indexFile: 'SKILL.md' },
	{
		label: 'References',
		base: 'skills',
		include: ['*/references/*.md', '*/templates/*/MODULE.md'],
		prefix: 'skills/',
		collapsed: true,
	},
];
