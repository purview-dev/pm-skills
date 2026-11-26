// Brief and inbox sections are rendered once per build, as ADR sections are
// (ADR-015, ADR-017): one entry per non-blank section, its relative images
// resolved against the file beside planning.json.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it, mock } from 'bun:test';

import { briefSectionsLoader, inboxSectionsLoader } from '../src/loaders/records';
import { recordEntries, recordFile, recordSectionId } from '../src/loaders/sections';
import { FIXTURES } from './helpers';

const context = () => ({
	config: { root: pathToFileURL(join(FIXTURES, 'site', '/')) },
	store: { set: mock(), clear: mock(), delete: mock() },
	parseData: async ({ data }: { data: unknown }) => data,
	renderMarkdown: mock(async () => ({ html: '' })),
	generateDigest: () => 'digest',
	logger: { info: mock() },
});

describe('record sections', () => {
	it('recordFile resolves a brief and an inbox file beside planning.json', () => {
		expect(recordFile('/r/planning/planning.json', 'briefs', 'planning/briefs/2026-11-09-invoice-export.md')).toBe(join('/r/planning', 'briefs', '2026-11-09-invoice-export.md'));
		expect(recordFile('/r/planning/planning.json', 'inbox', 'planning/inbox/a.md')).toBe(join('/r/planning', 'inbox', 'a.md'));
	});

	it('recordSectionId is slug/index', () => {
		expect(recordSectionId('2026-11-09-invoice-export', 3)).toBe('2026-11-09-invoice-export/3');
	});

	it('recordEntries skips blank sections and keeps each index', () => {
		const entries = recordEntries([{ key: 'p/a.md', sections: [{ heading: 'A', markdown: ' ' }, { heading: 'B', markdown: 'b' }] }]);

		expect(entries).toEqual([{ id: 'a/1', record: 'p/a.md', index: 1, heading: 'B', markdown: 'b' }]);
	});

	it('recordEntries throws on two records with one slug', () => {
		expect(() => recordEntries([{ key: 'p/a.md', sections: [{ heading: 'A', markdown: 'x' }] }, { key: 'q/A.md', sections: [{ heading: 'A', markdown: 'y' }] }])).toThrow('Duplicate');
	});

	it('the brief and inbox loaders store each non-blank section once, against its file', async () => {
		const briefs = context();
		const inbox = context();

		await briefSectionsLoader().load(briefs as never);
		await inboxSectionsLoader().load(inbox as never);

		const ids = (ctx: ReturnType<typeof context>) => ctx.store.set.mock.calls.map(([entry]) => (entry as { id: string }).id);
		const paths = (ctx: ReturnType<typeof context>) => ctx.store.set.mock.calls.map(([entry]) => (entry as { filePath: string }).filePath);

		// The fixture's invoice-export brief has an empty Open questions (index 2), which is not stored.
		expect(ids(briefs)).toEqual(['2026-11-09-invoice-export/0', '2026-11-09-invoice-export/1', '2026-11-09-invoice-export/3']);
		expect(paths(briefs).every((path) => path.endsWith('briefs/2026-11-09-invoice-export.md'))).toBe(true);
		expect(ids(inbox)).toEqual(['2026-11-08-1010-csv-encoding/0', '2026-11-08-1010-csv-encoding/1', '2026-11-09-0900-yearly-export/0']);
		expect(paths(inbox)[0]).toEndWith('inbox/2026-11-08-1010-csv-encoding.md');
		expect(briefs.renderMarkdown).toHaveBeenCalledTimes(3);
	});
});
