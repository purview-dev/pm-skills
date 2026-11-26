// Each ADR section is rendered once per build (ADR-015): the `adrs` loader
// stores the ADR as exported, and only `adr-sections` renders.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it, mock } from 'bun:test';

import { loadPlanning } from '../src/lib/planning';
import { ADR_SECTIONS, adrSectionsLoader, adrsLoader } from '../src/loaders/adrs';
import { FIXTURES } from './helpers';

const context = () => ({
	config: { root: pathToFileURL(join(FIXTURES, 'site', '/')) },
	store: { set: mock(), clear: mock(), delete: mock() },
	parseData: async ({ data }: { data: unknown }) => data,
	renderMarkdown: mock(async () => ({ html: '' })),
	generateDigest: () => 'digest',
	logger: { info: mock() },
});

describe('ADR loaders', () => {
	it('the adrs loader renders nothing; adr-sections renders each non-empty section once', async () => {
		const adrs = context();
		const sections = context();

		await adrsLoader().load(adrs as never);
		await adrSectionsLoader().load(sections as never);

		const nonEmpty = loadPlanning().adrs.flatMap((adr) => ADR_SECTIONS.filter(({ key }) => adr[key] !== null && adr[key]!.trim() !== ''));

		expect(nonEmpty.length).toBeGreaterThan(0);
		expect(adrs.renderMarkdown).not.toHaveBeenCalled();
		expect(sections.renderMarkdown).toHaveBeenCalledTimes(nonEmpty.length);
		expect(adrs.store.set.mock.calls[0]![0].data).not.toHaveProperty('html');
	});
});
