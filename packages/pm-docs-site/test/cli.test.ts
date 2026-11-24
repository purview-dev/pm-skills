import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { INSTALL_COMMAND } from '../lib/astroc4.ts';
import { parse } from '../lib/cli-args.ts';
import { CLI, expectedPages, FIXTURES, htmlPages, PACKAGE, runCli, SCRATCH, scratchFixture, siteConfig } from './helpers';

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
			// Starlight's 404 route reads a `404` docs entry; without one Astro warns on every build.
			expect(result.stdout + result.stderr).not.toMatch(/Entry docs → 404 was not found/);
			const notFound = readFileSync(join(FIXTURE_SITE, 'dist', '404.html'), 'utf8');
			expect(notFound).toContain('Page not found');
			expect(notFound).not.toContain('is a draft');
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

			// A consumer build: no repository-only text, and no Starlight docs warnings without the docs option.
			const output = result.stdout + result.stderr;
			const home = readFileSync(join(dir, 'site', 'dist', 'index.html'), 'utf8');

			expect(home).not.toContain('just docs-preview');
			expect(home).toContain('pm-docs-site build');
			expect(output).not.toMatch(/src[\\/]content[\\/]docs/);
			expect(output).not.toMatch(/collection "(docs|i18n)" does not exist or is empty/);
			expect(output).not.toMatch(/Entry docs → 404 was not found/);
			const notFound = readFileSync(join(dir, 'site', 'dist', '404.html'), 'utf8');
			expect(notFound).toContain('Page not found');
			expect(notFound).not.toContain('is a draft');
		},
		BUILD,
	);

	it(
		"takes the Now page's owner and size from now.item, not the board card",
		() => {
			const dir = scratchFixture('now-item-');
			const planningPath = join(dir, 'planning.json');
			const planning = JSON.parse(readFileSync(planningPath, 'utf8'));
			planning.now.item = { ...planning.now.item, owner: 'user', size: 'L' };
			planning.board.columns.now = planning.board.columns.now.map((card: object) => ({ ...card, owner: null, size: null }));
			writeFileSync(planningPath, JSON.stringify(planning));
			writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Now', planning: '../planning.json', views: ['now'] }`));

			const result = runCli(['build', join(dir, 'site')]);
			const html = readFileSync(join(dir, 'site', 'dist', 'plan', 'now', 'index.html'), 'utf8');

			expect(result.code, result.stderr).toBe(0);
			expect(html).toContain('title="Assigned to YOU"');
			expect(html).toContain('class="task-card__tag task-card__tag--high');
			expect(html).not.toContain('class="task-card__tag task-card__tag--low');
		},
		BUILD,
	);

	it(
		'links known IDs in the title of a log entry whose ID has no page',
		() => {
			const dir = scratchFixture('log-');
			const planningPath = join(dir, 'planning.json');
			const planning = JSON.parse(readFileSync(planningPath, 'utf8'));
			planning.board.activity.unshift({
				date: '2026-11-12',
				kind: 'dropped',
				id: 'R-998',
				title: 'Folded into R-012',
				milestone: null,
				owner: null,
				result: 'Reason: duplicate.',
			});
			writeFileSync(planningPath, JSON.stringify(planning));
			writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Log', planning: '../planning.json', views: ['features'] }`));

			const result = runCli(['build', join(dir, 'site')]);
			const html = readFileSync(join(dir, 'site', 'dist', 'plan', 'log', 'index.html'), 'utf8');

			expect(result.code, result.stderr).toBe(0);
			expect(html).toMatch(/R-998 Folded into <a href="\/plan\/features\/r-012\/"[^>]*>R-012<\/a>/);
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
		'has no No milestone card when every unassigned item is dropped',
		() => {
			const dir = scratchFixture('no-milestone-');
			const planningPath = join(dir, 'planning.json');
			const planning = JSON.parse(readFileSync(planningPath, 'utf8'));
			const unassigned = (milestone: string | null) => milestone === null || milestone === 'none';

			planning.now.milestone = 'M1';
			planning.roadmap.next = planning.roadmap.next.map((item: { milestone: string | null }) => (unassigned(item.milestone) ? { ...item, milestone: 'M1' } : item));
			planning.roadmap.later = planning.roadmap.later.map((item: { milestone: string | null }) => (unassigned(item.milestone) ? { ...item, milestone: 'M1' } : item));
			planning.log.done = planning.log.done.map((entry: { milestone: string | null }) => (unassigned(entry.milestone) ? { ...entry, milestone: 'M1' } : entry));
			writeFileSync(planningPath, JSON.stringify(planning));
			writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'M', planning: '../planning.json', views: ['milestones'] }`));

			const result = runCli(['build', join(dir, 'site')]);
			const html = readFileSync(join(dir, 'site', 'dist', 'plan', 'milestones', 'index.html'), 'utf8');

			expect(result.code, result.stderr).toBe(0);
			// Positive control: the page is not simply blank or broken, it renders
			// the M1 card the reassigned items now belong to.
			expect(html).toContain('First release');
			expect(html).not.toContain('No milestone');
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
		expect(result.stdout).toContain('schemaVersion 5');
	}, CHECK);

	it('fails on a schemaVersion it does not read', () => {
		const dir = scratchFixture('v6-');
		const planning = JSON.parse(readFileSync(join(dir, 'planning.json'), 'utf8'));
		writeFileSync(join(dir, 'planning.json'), JSON.stringify({ ...planning, schemaVersion: 6 }));
		writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'V6', planning: '../planning.json' }`));

		const result = runCli(['check', join(dir, 'site')]);

		expect(result.code).toBe(1);
		expect(result.stdout + result.stderr).toContain('has schemaVersion 6; this site reads schemaVersion 5');
		expect(existsSync(join(dir, 'site', 'dist'))).toBe(false);
	}, CHECK);

	it('warns that --title and --planning are ignored when the site has a config file', () => {
		const result = runCli(['check', FIXTURE_SITE, '--title', 'X', '--planning', 'nope.json']);

		expect(result.code, result.stderr).toBe(0);
		expect(result.stderr).toContain('pm-docs-site: --title is ignored:');
		expect(result.stderr).toContain('pm-docs-site: --planning is ignored:');
		expect(result.stderr).toContain('astro.config.ts sets the options.');
	}, CHECK);

	it('fails with the pm-export hint when planning.json holds null', () => {
		const dir = scratchFixture('null-');
		writeFileSync(join(dir, 'planning.json'), 'null');
		writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Null', planning: '../planning.json' }`));

		const result = runCli(['check', join(dir, 'site')]);
		const output = result.stdout + result.stderr;

		expect(result.code).toBe(1);
		expect(output).toContain('does not hold a plan export (found null)');
		expect(output).toContain('pm-export');
		expect(output).not.toContain('TypeError');
	}, CHECK);

	it('names the file and the pm-export hint when planning.json is not valid JSON', () => {
		const dir = scratchFixture('badjson-');
		writeFileSync(join(dir, 'planning.json'), '{ "schemaVersion": 5,');
		writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Bad', planning: '../planning.json' }`));

		const result = runCli(['check', join(dir, 'site')]);
		const output = result.stdout + result.stderr;

		expect(result.code).toBe(1);
		expect(output).toContain('planning.json is not valid JSON (');
		expect(output).toContain('pm-export');
	}, CHECK);

	it('fails when the config has no pm-docs-site integration', () => {
		const dir = scratchFixture('none-');
		writeFileSync(join(dir, 'site', 'astro.config.ts'), 'export default {};\n');

		const result = runCli(['check', join(dir, 'site')]);

		expect(result.code).toBe(1);
		expect(result.stdout + result.stderr).toContain('no pm-docs-site integration in');
	}, CHECK);

	it('names the config and the rule when Node cannot load an astro.config.ts', () => {
		const dir = scratchFixture('unloadable-');
		writeFileSync(join(dir, 'site', 'options.ts'), "export const title = 'Unloadable';\n");
		writeFileSync(join(dir, 'site', 'astro.config.ts'), "import { title } from './options';\nexport default { title };\n");

		const result = runCli(['check', join(dir, 'site')]);
		const output = result.stdout + result.stderr;

		expect(result.code).toBe(1);
		expect(output).toContain('pm-docs-site: could not load');
		expect(output).toContain('astro.config.ts');
		expect(output).toContain('explicit .ts extensions');
	}, CHECK);

	it('declares a Node floor that strips the TypeScript of astro.config.ts', () => {
		const { engines } = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8'));

		// Node 24 loads erasable TypeScript without a flag; the fixture check above loads its astro.config.ts under node.
		expect(engines.node).toBe('>=24');
	});

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

describe('pm-docs-site arguments', () => {
	it('parse(["dev", "--port", "4399"]) gives the port, with siteDir the cwd', () => {
		const result = parse(['dev', '--port', '4399'], {});

		expect(result.server).toEqual({ port: 4399 });
		expect(result.siteDir).toBe(resolve(process.cwd()));
	});

	it('parse(["dev", "site", "--port", "4399", "--host", "0.0.0.0"]) gives siteDir, port, and host', () => {
		const result = parse(['dev', 'site', '--port', '4399', '--host', '0.0.0.0'], {});

		expect(result.siteDir).toBe(resolve(process.cwd(), 'site'));
		expect(result.server).toEqual({ port: 4399, host: '0.0.0.0' });
	});

	it('a --port given before the site folder is still the port, not the folder (Review Focus 4)', () => {
		const result = parse(['dev', '--port', '4399', 'site'], {});

		expect(result.siteDir).toBe(resolve(process.cwd(), 'site'));
		expect(result.server).toEqual({ port: 4399 });
	});

	it('falls back to the PORT and HOST environment variables', () => {
		const result = parse(['dev'], { PORT: '5000', HOST: 'localhost' });

		expect(result.server).toEqual({ port: 5000, host: 'localhost' });
	});

	it('a --port flag wins over the PORT environment variable', () => {
		const result = parse(['dev', '--port', '1'], { PORT: '2' });

		expect(result.server).toEqual({ port: 1 });
	});

	it('--port abc throws a fixed message', () => {
		expect(() => parse(['dev', '--port', 'abc'], {})).toThrow('pm-docs-site: --port needs a port number (1-65535)');
	});

	it('--port 0 throws the same fixed message', () => {
		expect(() => parse(['dev', '--port', '0'], {})).toThrow('pm-docs-site: --port needs a port number (1-65535)');
	});

	it('parse(["dev"], {}) gives an empty server, so Astro\'s default port 4321 applies', () => {
		const result = parse(['dev'], {});

		expect(result.server).toEqual({});
	});

	it(
		'dev --port 4399 serves on 4399',
		async () => {
			const proc = Bun.spawn(['node', CLI, 'dev', FIXTURE_SITE, '--port', '4399'], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });

			try {
				const deadline = Date.now() + 60_000;
				let served = false;

				while (Date.now() < deadline) {
					try {
						const response = await fetch('http://localhost:4399/');
						served = response.status === 200;
						if (served) break;
					} catch {
						// Not listening yet; keep polling until the deadline.
					}

					await Bun.sleep(250);
				}

				expect(served).toBe(true);
			} finally {
				proc.kill();
				await proc.exited;
			}
		},
		65_000,
	);

	it('peers architecture prints the astroc4 install command', () => {
		const result = runCli(['peers', 'architecture']);

		expect(result.code, result.stderr).toBe(0);
		expect(result.stdout).toBe(`${INSTALL_COMMAND}\n`);
	});

	it('any other peers argument prints usage and exits 2', () => {
		const bare = runCli(['peers']);
		const unknown = runCli(['peers', 'nope']);

		expect(bare.code).toBe(2);
		expect(bare.stderr).toContain('usage: pm-docs-site <dev | build | check>');
		expect(unknown.code).toBe(2);
		expect(unknown.stderr).toContain('usage: pm-docs-site <dev | build | check>');
	}, CHECK);
});
