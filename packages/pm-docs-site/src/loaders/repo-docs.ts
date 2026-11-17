// Markdown from anywhere in the repository as Starlight's `docs` collection,
// read in place. The matching and parsing live in lib/repo-docs.mjs, shared with
// the sidebar.

import { readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Loader } from 'astro/loaders';

import type { DocsSource } from '../../index';
import { pagesOf, readPage } from '../../lib/repo-docs.mjs';

/** Starlight's `docs` collection over every source; `root` is the docs root, absolute or relative to the site root. */
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
					// The file URL lets Markdown plugins name the page in what they report.
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
