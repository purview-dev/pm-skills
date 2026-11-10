// The architecture pages: one per folder under {{LIKEC4_DIR}}/views,
// listing the views declared there. Read from the model at build time, so a
// new view or folder shows up without editing the site.

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Where the model's views live, relative to the site root. */
const VIEWS_PATH = '{{SITE_TO_ROOT}}/{{LIKEC4_DIR}}/views';

export interface ViewRef {
	id: string;
	title: string;
}

export interface ViewGroup {
	slug: string;
	title: string;
	views: ViewRef[];
}

/** Every `view`, `dynamic view` and `deployment view` declared in a `.c4` source, with its title. */
export function viewsIn(source: string): ViewRef[] {
	const declaration = /^\s*(?:dynamic\s+|deployment\s+)?view\s+([\w-]+)[^{\n]*\{/gm;
	const found: Array<{ id: string; index: number }> = [];
	let match;

	while ((match = declaration.exec(source)) !== null) {
		found.push({ id: match[1]!, index: match.index });
	}

	return found.map(({ id, index }, i) => {
		const body = source.slice(index, found[i + 1]?.index ?? source.length);
		const title = /^\s*title\s+(?:"([^"]*)"|'([^']*)')/m.exec(body);

		return { id, title: title?.[1] ?? title?.[2] ?? id };
	});
}

/** One group per views/ folder, Overview first (with the top-level views/*.c4), the rest by name. */
export function viewGroups(viewsDir: string = resolve(process.cwd(), VIEWS_PATH)): ViewGroup[] {
	const entries = readdirSync(viewsDir, { withFileTypes: true });
	const read = (folder: string) =>
		readdirSync(folder)
			.filter((file) => file.endsWith('.c4'))
			.sort()
			.flatMap((file) => viewsIn(readFileSync(join(folder, file), 'utf8')));

	const rootViews = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.c4')).flatMap((entry) =>
		viewsIn(readFileSync(join(viewsDir, entry.name), 'utf8')),
	);

	const groups = entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => ({ slug: entry.name, title: titleCase(entry.name), views: read(join(viewsDir, entry.name)) }))
		.sort((a, b) => (a.slug === 'overview' ? -1 : b.slug === 'overview' ? 1 : a.slug.localeCompare(b.slug)));

	const overview = groups.find((group) => group.slug === 'overview');

	if (overview) overview.views.push(...rootViews);
	else groups.unshift({ slug: 'overview', title: 'Overview', views: rootViews });

	return groups;
}

function titleCase(slug: string): string {
	const words = slug.split('-');

	return [words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1), ...words.slice(1)].join(' ');
}
