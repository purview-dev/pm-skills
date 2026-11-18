// Repository Markdown as pages: which files a docs source matches, their page
// IDs, and each page's title and body. Node-loadable (no Astro or Vite import)
// because the sidebar is built from it while astro.config loads; the Astro
// loader in src/loaders/repo-docs.ts uses the same functions.
//
// Starlight requires a `title` in every page's frontmatter; repository Markdown
// rarely has one. The title is frontmatter `title`, else the first `# Title`
// heading (dropped from the body, so it is not shown twice), else frontmatter
// `name`, else the file name, so the files stay exactly as their authors write them.

import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';

import type { DocsSource } from './types.ts';

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

	for (const line of (match[1] ?? '').split('\n')) {
		const pair = /^([\w-]+):\s*(.*?)\s*$/.exec(line);

		if (pair && pair[1] && pair[2]) data[pair[1]] = pair[2].replace(/^(['"])(.*)\1$/, '$2');
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
		const line = (lines[index] ?? '').trim();

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

	if (!heading || !heading[1]) return { title: fallback, body: markdown };

	let start = index + 1;
	while (start < lines.length && (lines[start] ?? '').trim() === '') start++;

	return { title: heading[1], body: lines.slice(start).join('\n') };
}

/** Title, description, and body for one page. */
export function readPage(markdown: string, file: string): { title: string; description?: string; body: string } {
	const { data, body } = splitFrontmatter(markdown);
	const fallback = data.name ?? basename(file, '.md');
	const split = data.title ? { title: data.title, body } : splitTitle(body, fallback);

	return { title: split.title, ...(data.description ? { description: data.description } : {}), body: split.body };
}
