import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { expectedPages, FIXTURES, htmlPages, runCli, SCRATCH, scratchFixture, siteConfig } from './helpers';

const BUILD = 180_000;
// A check runs the CLI in a Node subprocess and builds nothing, but the start-up
// can pass bun's 5000ms default under load on Windows.
const CHECK = 60_000;
const FIXTURE_SITE = join(FIXTURES, 'site');

afterAll(() => {
	rmSync(SCRATCH, { recursive: true, force: true });
	rmSync(join(FIXTURE_SITE, 'dist'), { recursive: true, force: true });
	rmSync(join(FIXTURE_SITE, '.astro'), { recursive: true, force: true });
});

describe('pm-docs-site build', () => {
	it(
		'renders every page the template site renders',
		() => {
			const result = runCli(['build', FIXTURE_SITE]);

			expect(result.code, result.stderr).toBe(0);
			expect(htmlPages(join(FIXTURE_SITE, 'dist'))).toEqual(expectedPages());
		},
		BUILD,
	);

	it(
		'leaves out the pages of views that are off',
		() => {
			const dir = scratchFixture('views-');
			writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Views', planning: '../planning.json', views: ['now'] }`));

			const result = runCli(['build', join(dir, 'site')]);
			const pages = htmlPages(join(dir, 'site', 'dist'));

			expect(result.code, result.stderr).toBe(0);
			expect(pages).toContain('plan/now/index.html');
			for (const view of ['milestones', 'features', 'inbox', 'briefs', 'strategy']) {
				expect(pages.filter((page) => page.startsWith(`plan/${view}/`))).toEqual([]);
			}
			expect(pages.filter((page) => page.startsWith('docs/'))).toEqual([]);
		},
		BUILD,
	);

	it(
		'still reads a site whose config is astro.config.mjs',
		() => {
			const dir = scratchFixture('cli-mjs-');
			writeFileSync(join(dir, 'site', 'astro.config.mjs'), siteConfig(`{ title: 'Legacy', planning: '../planning.json', views: ['now'] }`));

			const result = runCli(['build', join(dir, 'site')]);

			expect(result.code, result.stderr).toBe(0);
			expect(existsSync(join(dir, 'site', 'dist', 'plan', 'now', 'index.html'))).toBe(true);
		},
		BUILD,
	);

	it(
		'builds a site with no config file from flags',
		() => {
			const dir = scratchFixture('bare-');
			const result = runCli(['build', join(dir, 'site'), '--title', 'Bare', '--planning', join(dir, 'planning.json')]);

			expect(result.code, result.stderr).toBe(0);
			expect(readFileSync(join(dir, 'site', 'dist', 'index.html'), 'utf8')).toContain('Bare');
		},
		BUILD,
	);

	it(
		'fails with the export message when the planning file is missing',
		() => {
			const dir = scratchFixture('missing-');
			writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Missing', planning: './nope.json' }`));

			const result = runCli(['build', join(dir, 'site')]);
			const output = result.stdout + result.stderr;

			expect(result.code).not.toBe(0);
			expect(output).toContain('No plan export at');
			expect(output).toContain('pm-export');
		},
		BUILD,
	);
});

describe('pm-docs-site check', () => {
	it('passes on the fixture', () => {
		const result = runCli(['check', FIXTURE_SITE]);

		expect(result.code, result.stderr).toBe(0);
		expect(result.stdout).toContain('schemaVersion 3');
	}, CHECK);

	it('fails on a schemaVersion it does not read', () => {
		const dir = scratchFixture('v4-');
		const planning = JSON.parse(readFileSync(join(dir, 'planning.json'), 'utf8'));
		writeFileSync(join(dir, 'planning.json'), JSON.stringify({ ...planning, schemaVersion: 4 }));
		writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'V4', planning: '../planning.json' }`));

		const result = runCli(['check', join(dir, 'site')]);

		expect(result.code).toBe(1);
		expect(result.stdout + result.stderr).toContain('has schemaVersion 4; this site reads schemaVersion 3');
		expect(existsSync(join(dir, 'site', 'dist'))).toBe(false);
	}, CHECK);

	it('fails when the config has no pm-docs-site integration', () => {
		const dir = scratchFixture('none-');
		writeFileSync(join(dir, 'site', 'astro.config.ts'), 'export default {};\n');

		const result = runCli(['check', join(dir, 'site')]);

		expect(result.code).toBe(1);
		expect(result.stdout + result.stderr).toContain('no pm-docs-site integration in');
	}, CHECK);

	it('fails when a docs source folder is missing', () => {
		const dir = scratchFixture('docs-');
		writeFileSync(
			join(dir, 'site', 'astro.config.ts'),
			siteConfig(`{ title: 'Docs', planning: '../planning.json', docs: { root: '../docs', sources: [{ label: 'Gone', base: 'gone', include: ['*.md'] }] } }`),
		);

		const result = runCli(['check', join(dir, 'site')]);

		expect(result.code).toBe(1);
		expect(result.stdout + result.stderr).toContain('Gone');
	}, CHECK);
});

describe('pm-docs-site usage', () => {
	it('exits 2 with usage for an unknown command', () => {
		const result = runCli(['publish']);

		expect(result.code).toBe(2);
		expect(result.stderr).toContain('usage: pm-docs-site <dev | build | check> [site-dir]');
	}, CHECK);
});
