// The sidebar groups for the repository's Markdown: one per source in
// docs-sources.ts that is not hidden, its pages in the source's order.

import { resolve } from 'node:path';

import { docsSources } from './docs-sources';
import { pagesOf } from './loaders/repo-docs';

/** The repository root, relative to the site root. */
const REPO_ROOT = '{{SITE_TO_ROOT}}';

export type SidebarItem =
	| string
	| { label: string; link: string }
	| { label: string; items: SidebarItem[]; collapsed?: boolean };

export function docsSidebar(repoRoot: string = resolve(process.cwd(), REPO_ROOT)): SidebarItem[] {
	return (
		docsSources
			.filter((source) => !source.hidden)
			.map((source) => ({
				label: source.label,
				collapsed: source.collapsed ?? false,
				items: pagesOf(source, repoRoot).map((page) => page.id),
			}))
			// Starlight rejects an empty group.
			.filter((group) => group.items.length > 0)
	);
}
