// @ts-check
// Repository Markdown as pages: which files a docs source matches, their page
// IDs, and each page's title and body. Plain JavaScript because the sidebar is
// built from it while astro.config.mjs loads; the Astro loader in
// src/loaders/repo-docs.ts uses the same functions.
//
// Starlight requires a `title` in every page's frontmatter; repository Markdown
// rarely has one. The title is frontmatter `title`, else the first `# Title`
// heading (dropped from the body, so it is not shown twice), else frontmatter
// `name`, else the file name, so the files stay exactly as their authors write them.

import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';

/** @typedef {import('../index').DocsSource} DocsSource */
/** @typedef {{ id: string; file: string }} DocsPage */

/**
 * A glob as a regular expression over `/`-separated paths.
 * @param {string} glob
 * @returns {RegExp}
 */
export function globToRegExp(glob) {
	const pattern = glob
		.split(/(\*\*\/|\*\*|\*)/)
		.map((part) =>
			part === '**/' ? '(?:.*/)?' : part === '**' ? '.*' : part === '*' ? '[^/]*' : part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'),
		)
		.join('');

	return new RegExp(`^${pattern}$`, 'i');
}

/**
 * The page ID (and URL path) for a file: prefix, path without `.md`, lower case.
 * @param {DocsSource} source
 * @param {string} path
 * @returns {string}
 */
export function pageId(source, path) {
	let page = path.replace(/\.md$/i, '');

	if (source.indexFile && basename(path).toLowerCase() === source.indexFile.toLowerCase()) {
		page = dirname(path) === '.' ? 'index' : dirname(path);
	}

	return `${source.prefix ?? ''}${page}`.toLowerCase();
}

/**
 * Every file a source matches, as page IDs in its sidebar order.
 * @param {DocsSource} source
 * @param {string} repoRoot
 * @returns {DocsPage[]}
 */
export function pagesOf(source, repoRoot) {
	const base = resolve(repoRoot, source.base);

	if (!existsSync(base)) return [];

	const patterns = source.include.map(globToRegExp);
	const pages = /** @type {string[]} */ (readdirSync(base, { recursive: true }))
		.map((file) => file.split(sep).join('/'))
		.filter((file) => !file.split('/').includes('node_modules') && patterns.some((pattern) => pattern.test(file)))
		.map((file) => ({ id: pageId(source, file), file: join(base, file) }))
		.sort((a, b) => a.id.localeCompare(b.id));

	return source.order === 'desc' ? pages.reverse() : pages;
}

/**
 * Simple `key: value` frontmatter (one line per key) and the body after it.
 * @param {string} markdown
 * @returns {{ data: Record<string, string>; body: string }}
 */
export function splitFrontmatter(markdown) {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);

	if (!match) return { data: {}, body: markdown };

	/** @type {Record<string, string>} */
	const data = {};

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
 * @param {string} markdown
 * @param {string} fallback
 * @returns {{ title: string; body: string }}
 */
export function splitTitle(markdown, fallback) {
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

/**
 * Title, description, and body for one page.
 * @param {string} markdown
 * @param {string} file
 * @returns {{ title: string; description?: string; body: string }}
 */
export function readPage(markdown, file) {
	const { data, body } = splitFrontmatter(markdown);
	const fallback = data.name ?? basename(file, '.md');
	const split = data.title ? { title: data.title, body } : splitTitle(body, fallback);

	return { title: split.title, ...(data.description ? { description: data.description } : {}), body: split.body };
}
