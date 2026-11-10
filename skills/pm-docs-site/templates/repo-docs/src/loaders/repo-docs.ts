// Markdown from anywhere in the repository as Starlight's `docs` collection,
// read in place.
//
// Each source (src/docs-sources.ts) names a folder and the files in it. Starlight
// requires a `title` in every page's frontmatter; repository Markdown rarely has
// one. This loader takes it from frontmatter `title`, else the first `# Title`
// heading (dropped from the body, so it is not shown twice), else frontmatter
// `name`, else the file name, so the files stay exactly as their authors and
// agents write them.

import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Loader } from 'astro/loaders';

export interface DocsSource {
	/** The sidebar group for this source's pages. */
	label: string;
	/** The folder to read, relative to the repository root (`.` for the root). */
	base: string;
	/** Files to read, as globs relative to `base` (`*` within a folder, `**` across folders). */
	include: string[];
	/** Prepended to each page's path to make its URL. Default: none. */
	prefix?: string;
	/** A file name that stands for its folder, such as `SKILL.md` or `README.md`. */
	indexFile?: string;
	/** Sidebar order by page path. Default: `asc`. */
	order?: 'asc' | 'desc';
	collapsed?: boolean;
	/** Load the pages without listing them in the sidebar. */
	hidden?: boolean;
}

export interface DocsPage {
	id: string;
	file: string;
}

/** A glob as a regular expression over `/`-separated paths. */
export function globToRegExp(glob: string): RegExp {
	const pattern = glob
		.split(/(\*\*\/|\*\*|\*)/)
		.map((part) =>
			part === '**/' ? '(?:.*/)?' : part === '**' ? '.*' : part === '*' ? '[^/]*' : part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'),
		)
		.join('');

	return new RegExp(`^${pattern}$`, 'i');
}

/** The page ID (and URL path) for a file: prefix, path without `.md`, lower case. */
export function pageId(source: DocsSource, path: string): string {
	let page = path.replace(/\.md$/i, '');

	if (source.indexFile && basename(path).toLowerCase() === source.indexFile.toLowerCase()) {
		page = dirname(path) === '.' ? 'index' : dirname(path);
	}

	return `${source.prefix ?? ''}${page}`.toLowerCase();
}

/** Every file a source matches, as page IDs in its sidebar order. */
export function pagesOf(source: DocsSource, repoRoot: string): DocsPage[] {
	const base = resolve(repoRoot, source.base);

	if (!existsSync(base)) return [];

	const patterns = source.include.map(globToRegExp);
	const pages = (readdirSync(base, { recursive: true }) as string[])
		.map((file) => file.split(sep).join('/'))
		.filter((file) => !file.split('/').includes('node_modules') && patterns.some((pattern) => pattern.test(file)))
		.map((file) => ({ id: pageId(source, file), file: join(base, file) }))
		.sort((a, b) => a.id.localeCompare(b.id));

	return source.order === 'desc' ? pages.reverse() : pages;
}

/** Simple `key: value` frontmatter (one line per key) and the body after it. */
export function splitFrontmatter(markdown: string): { data: Record<string, string>; body: string } {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);

	if (!match) return { data: {}, body: markdown };

	const data: Record<string, string> = {};

	for (const line of match[1]!.split('\n')) {
		const pair = /^([\w-]+):\s*(.*?)\s*$/.exec(line);

		if (pair && pair[2]) data[pair[1]!] = pair[2].replace(/^(['"])(.*)\1$/, '$2');
	}

	return { data, body: markdown.slice(match[0].length) };
}

/**
 * The page title and the body without it.
 *
 * The title is the first `# ` heading when nothing but blank lines and HTML
 * comments come before it; otherwise the fallback is the title and the body is
 * kept whole.
 */
export function splitTitle(markdown: string, fallback: string): { title: string; body: string } {
	const lines = markdown.split('\n');
	let index = 0;
	let inComment = false;

	for (; index < lines.length; index++) {
		const line = lines[index]!.trim();

		if (inComment) {
			if (line.includes('-->')) inComment = false;
			continue;
		}

		if (line === '') continue;

		if (line.startsWith('<!--')) {
			inComment = !line.includes('-->');
			continue;
		}

		break;
	}

	const heading = /^#\s+(.+?)\s*#*\s*$/.exec(lines[index] ?? '');

	if (!heading) return { title: fallback, body: markdown };

	let start = index + 1;
	while (start < lines.length && lines[start]!.trim() === '') start++;

	return { title: heading[1]!, body: lines.slice(start).join('\n') };
}

/** Title, description, and body for one page. */
export function readPage(markdown: string, file: string): { title: string; description?: string; body: string } {
	const { data, body } = splitFrontmatter(markdown);
	const fallback = data.name ?? basename(file, '.md');
	const split = data.title ? { title: data.title, body } : splitTitle(body, fallback);

	return { title: split.title, ...(data.description ? { description: data.description } : {}), body: split.body };
}

/** Starlight's `docs` collection over every source, with `root` the repository root relative to the site root. */
export function repoDocsLoader(options: { root: string; sources: DocsSource[] }): Loader {
	return {
		name: 'repo-docs',
		async load({ config, store, parseData, renderMarkdown, generateDigest, watcher, logger }) {
			const siteRoot = fileURLToPath(config.root);
			const repoRoot = resolve(siteRoot, options.root);
			const pages = new Map<string, string>();

			// The first source to claim a file wins, so a hidden catch-all can follow the listed sources.
			for (const source of options.sources) {
				for (const page of pagesOf(source, repoRoot)) {
					if (![...pages.values()].includes(page.file) && !pages.has(page.id)) pages.set(page.id, page.file);
				}
			}

			async function sync(id: string, file: string): Promise<void> {
				const content = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
				const { title, description, body } = readPage(content, file);
				const data = await parseData({ id, data: { title, ...(description ? { description } : {}) } });

				store.set({
					id,
					data,
					body,
					filePath: relative(siteRoot, file).split(sep).join('/'),
					digest: generateDigest(content),
					// The file URL lets Markdown plugins (Astroc4's fence check, for one) name the
					// page in what they report.
					rendered: await renderMarkdown(body, { fileURL: pathToFileURL(file) }),
				});
			}

			store.clear();
			await Promise.all([...pages].map(([id, file]) => sync(id, file)));
			logger.info(`loaded ${pages.size} pages from ${options.sources.length} sources`);

			if (!watcher) return;

			// The loaded files only: watching a source folder that is the repository root
			// would watch node_modules too. A new file shows up on the next start.
			const byFile = new Map([...pages].map(([id, file]) => [resolve(file), id]));

			watcher.add([...byFile.keys()]);
			watcher.on('change', (path) => {
				const id = byFile.get(resolve(path));

				if (id) void sync(id, path);
			});
			watcher.on('unlink', (path) => {
				const id = byFile.get(resolve(path));

				if (id) store.delete(id);
			});
		},
	};
}
