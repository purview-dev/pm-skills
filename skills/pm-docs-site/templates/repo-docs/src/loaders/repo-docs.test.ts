import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import { globToRegExp, pageId, pagesOf, readPage, repoDocsLoader, splitFrontmatter, splitTitle } from './repo-docs';

async function repository() {
	const root = await mkdtemp(join(tmpdir(), 'repo-docs-'));
	await mkdir(join(root, 'docs', 'plans'), { recursive: true });
	await mkdir(join(root, 'skills', 'pm-board', 'references'), { recursive: true });
	await mkdir(join(root, 'site', 'node_modules', 'x'), { recursive: true });
	await writeFile(join(root, 'docs', 'flow.md'), '# Flow\n\nBody\n');
	await writeFile(join(root, 'docs', 'plans', '2026-01-01-a.md'), '# A\n');
	await writeFile(join(root, 'docs', 'plans', '2026-02-01-b.md'), '# B\n');
	await writeFile(join(root, 'skills', 'pm-board', 'SKILL.md'), '---\nname: pm-board\ndescription: The board.\n---\n\n# pm-board\n\nText\n');
	await writeFile(join(root, 'site', 'node_modules', 'x', 'README.md'), '# Not docs\n');
	await writeFile(join(root, 'README.md'), '# Project\n');
	return root;
}

describe('repoDocsLoader', () => {
	it('renders each page with its file URL, so Markdown plugins can name the page they warn about', async () => {
		const root = await repository();
		const renderMarkdown = vi.fn(async () => ({ html: '' }));
		const set = vi.fn();

		await repoDocsLoader({ root: '..', sources: [{ label: 'Docs', base: 'docs', include: ['*.md'] }] }).load({
			config: { root: pathToFileURL(join(root, 'site', '/')) },
			store: { set, clear: vi.fn(), delete: vi.fn() },
			parseData: async ({ data }: { data: unknown }) => data,
			renderMarkdown,
			generateDigest: () => 'digest',
			logger: { info: vi.fn() },
		} as never);

		expect(renderMarkdown).toHaveBeenCalledWith('Body\n', { fileURL: pathToFileURL(join(root, 'docs', 'flow.md')) });
		expect(set).toHaveBeenCalledWith(expect.objectContaining({ id: 'flow', data: { title: 'Flow' } }));
	});

	it('loads a file once when two sources match it, the first source winning', async () => {
		const root = await repository();
		const set = vi.fn();

		await repoDocsLoader({
			root: '..',
			sources: [
				{ label: 'Plans', base: 'docs', include: ['plans/*.md'] },
				{ label: 'All', base: 'docs', include: ['**/*.md'], hidden: true },
			],
		}).load({
			config: { root: pathToFileURL(join(root, 'site', '/')) },
			store: { set, clear: vi.fn(), delete: vi.fn() },
			parseData: async ({ data }: { data: unknown }) => data,
			renderMarkdown: async () => ({ html: '' }),
			generateDigest: () => 'digest',
			logger: { info: vi.fn() },
		} as never);

		expect(set.mock.calls.map(([entry]) => entry.id).sort()).toEqual(['flow', 'plans/2026-01-01-a', 'plans/2026-02-01-b']);
	});
});

describe('pagesOf', () => {
	it('matches globs under the base, newest first when asked, and never node_modules', async () => {
		const root = await repository();

		expect(pagesOf({ label: 'Plans', base: 'docs', include: ['plans/*.md'], order: 'desc' }, root).map((page) => page.id)).toEqual([
			'plans/2026-02-01-b',
			'plans/2026-01-01-a',
		]);
		expect(pagesOf({ label: 'Root', base: '.', include: ['**/README.md'] }, root).map((page) => page.id)).toEqual(['readme']);
		expect(pagesOf({ label: 'None', base: 'missing', include: ['*.md'] }, root)).toEqual([]);
	});
});

describe('pageId', () => {
	it('adds the prefix, drops .md, lowers the case, and lets an index file stand for its folder', () => {
		expect(pageId({ label: 'P', base: '.', include: [], prefix: 'project/' }, 'README.md')).toBe('project/readme');
		expect(pageId({ label: 'S', base: 'skills', include: [], prefix: 'skills/', indexFile: 'SKILL.md' }, 'pm-board/SKILL.md')).toBe(
			'skills/pm-board',
		);
		expect(pageId({ label: 'S', base: 'skills', include: [], prefix: 'skills/', indexFile: 'SKILL.md' }, 'pm-board/references/spec.md')).toBe(
			'skills/pm-board/references/spec',
		);
	});
});

describe('globToRegExp', () => {
	it('treats * as one path segment and ** as any depth', () => {
		expect(globToRegExp('*/SKILL.md').test('pm-board/SKILL.md')).toBe(true);
		expect(globToRegExp('*/SKILL.md').test('pm-board/x/SKILL.md')).toBe(false);
		expect(globToRegExp('**/*.md').test('a.md')).toBe(true);
		expect(globToRegExp('**/*.md').test('a/b/c.md')).toBe(true);
		expect(globToRegExp('README.md').test('READMExmd')).toBe(false);
	});
});

describe('splitFrontmatter', () => {
	it('reads one-line keys, unquotes values, and returns the body after it', () => {
		expect(splitFrontmatter('---\nname: pm-board\ndescription: "The board."\n---\n\n# pm-board\n')).toEqual({
			data: { name: 'pm-board', description: 'The board.' },
			body: '\n# pm-board\n',
		});
		expect(splitFrontmatter('# No frontmatter\n')).toEqual({ data: {}, body: '# No frontmatter\n' });
	});
});

describe('readPage', () => {
	it('prefers a frontmatter title, then the heading, then the name, then the file name', () => {
		expect(readPage('---\ntitle: Set\n---\n# Heading\n', 'x.md').title).toBe('Set');
		expect(readPage('---\nname: pm-board\ndescription: The board.\n---\n\n# pm-board\n\nText\n', 'SKILL.md')).toEqual({
			title: 'pm-board',
			description: 'The board.',
			body: 'Text\n',
		});
		expect(readPage('---\nname: pm-board\n---\nText\n', 'SKILL.md').title).toBe('pm-board');
		expect(readPage('Text\n', 'notes.md').title).toBe('notes');
	});
});

describe('splitTitle', () => {
	it('takes the first # heading as the title and removes it from the body', () => {
		const { title, body } = splitTitle('# Running locally\n\nStart the app.\n\n## Prerequisites\n', 'running-locally');

		expect(title).toBe('Running locally');
		expect(body).toBe('Start the app.\n\n## Prerequisites\n');
	});

	it('falls back when there is no # heading, keeping the body whole', () => {
		const markdown = 'Intro text.\n\n## Section\n';

		expect(splitTitle(markdown, '2026-11-09-docs-site')).toEqual({ title: '2026-11-09-docs-site', body: markdown });
	});

	it('falls back when text comes before the first heading', () => {
		const markdown = 'Lead paragraph.\n\n# Not the title\n';

		expect(splitTitle(markdown, 'notes')).toEqual({ title: 'notes', body: markdown });
	});

	it('ignores a # inside a code fence', () => {
		expect(splitTitle('```bash\n# comment\n```\n\n# Real title\n', 'x').title).toBe('x');
	});

	it('allows leading blank lines and an HTML comment before the heading', () => {
		expect(splitTitle('\n<!-- note -->\n# Title\nBody\n', 'x')).toEqual({ title: 'Title', body: 'Body\n' });
	});
});
