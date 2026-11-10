// The Markdown this site reads in place: each source is one sidebar group.
//
// Site-owned: pm-docs-site writes this file once and never overwrites it, so
// change the sources to suit the repository. Paths are relative to its root.
import type { DocsSource } from './loaders/repo-docs';

export const docsSources: DocsSource[] = [
	{ label: 'Overview', base: 'docs', include: ['*.md'] },
	{ label: 'Design records', base: 'docs', include: ['{{SPECS_DIR}}/*.md'], order: 'desc' },
	{ label: 'Plans', base: 'docs', include: ['{{PLANS_DIR}}/*.md'], order: 'desc', collapsed: true },
	// Every other docs/ page is built, so links to it work, without a sidebar entry.
	{ label: 'More', base: 'docs', include: ['**/*.md'], hidden: true },
];
