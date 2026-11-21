import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'bun:test';

import { NOT_FOUND_DATA, NOT_FOUND_ID } from '../src/loaders/not-found';
import { repoDocsLoader } from '../src/loaders/repo-docs';

const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Runs the repo-docs loader over a folder holding `files` and returns what it stored. */
async function load(files: Record<string, string>): Promise<Map<string, { data: Record<string, unknown>; filePath?: string }>> {
	const dir = mkdtempSync(join(tmpdir(), 'not-found-'));
	dirs.push(dir);
	for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);

	const stored = new Map<string, { data: Record<string, unknown>; filePath?: string }>();
	const context = {
		config: { root: pathToFileURL(`${dir}/`) },
		store: {
			set: (entry: { id: string; data: Record<string, unknown>; filePath?: string }) => stored.set(entry.id, entry),
			clear: () => stored.clear(),
			delete: (id: string) => stored.delete(id),
		},
		parseData: async ({ data }: { data: Record<string, unknown> }) => data,
		renderMarkdown: async () => ({ html: '' }),
		generateDigest: () => 'digest',
		logger: { info() {} },
	};

	await repoDocsLoader({ root: '.', sources: [{ label: 'Docs', base: '.', include: ['*.md'] }] }).load(context as never);

	return stored;
}

describe('the 404 docs entry', () => {
	it('is a draft splash page, so no production build routes it', () => {
		expect(NOT_FOUND_ID).toBe('404');
		expect(NOT_FOUND_DATA).toMatchObject({ title: '404', template: 'splash', draft: true });
	});

	it('is added when the repository docs have no 404 page', async () => {
		const stored = await load({ 'guide.md': '# Guide\n' });

		expect(stored.get(NOT_FOUND_ID)?.data).toEqual(NOT_FOUND_DATA);
		expect(stored.has('guide')).toBe(true);
	});

	it("keeps the repository's own 404 page", async () => {
		const stored = await load({ '404.md': '# Lost\n\nTry the home page.\n' });
		const entry = stored.get(NOT_FOUND_ID);

		expect(entry?.filePath).toEndWith('404.md');
		expect(entry?.data.draft).toBeUndefined();
	});
});
