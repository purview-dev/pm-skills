// A real consumer: the packed package installed from its tarball into a folder
// outside the repository, with nothing else in its package.json. This is where
// dependency resolution and SSR bundling can fail, and in-tree builds cannot see it.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { expectedPages, FIXTURES, htmlPages, PACKAGE } from './helpers';

const tmp = mkdtempSync(join(tmpdir(), 'pm-docs-site-install-'));

// Windows can take longer than the default hook timeout to remove a real
// node_modules tree, so give the cleanup room to finish.
afterAll(() => rmSync(tmp, { recursive: true, force: true }), 60_000);

function run(cmd: string[], cwd: string): void {
	const result = Bun.spawnSync(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' });

	if (result.exitCode !== 0) {
		throw new Error(`${cmd.join(' ')} exited ${result.exitCode}\n${result.stdout.toString()}\n${result.stderr.toString()}`);
	}
}

describe('an installed package', () => {
	it(
		'builds the fixture from its tarball',
		() => {
			run(['bun', 'pm', 'pack', '--destination', tmp, '--quiet'], PACKAGE);
			const tarball = readdirSync(tmp).find((file) => file.endsWith('.tgz'));
			expect(tarball).toBeDefined();

			// The space is deliberate: site paths must survive it.
			const consumer = join(tmp, 'consumer site');
			mkdirSync(consumer);
			writeFileSync(
				join(consumer, 'package.json'),
				JSON.stringify({
					name: 'consumer',
					private: true,
					type: 'module',
					scripts: { build: 'pm-docs-site build' },
					dependencies: { '@purview-dev/pm-docs-site': `file:${join(tmp, tarball!).replace(/\\/g, '/')}` },
				}),
			);
			run(['bun', 'install'], consumer);

			cpSync(join(FIXTURES, 'planning.json'), join(tmp, 'planning.json'));
			cpSync(join(FIXTURES, 'docs'), join(tmp, 'docs'), { recursive: true });
			const config = readFileSync(join(FIXTURES, 'site', 'astro.config.ts'), 'utf8').replace(
				"'../../../lib/index.ts'",
				"'@purview-dev/pm-docs-site'",
			);
			expect(config).toContain("from '@purview-dev/pm-docs-site'");
			writeFileSync(join(consumer, 'astro.config.ts'), config);

			// Through the package's bin, as a consumer's own build script runs it.
			run(['bun', 'run', 'build'], consumer);

			expect(htmlPages(join(consumer, 'dist'))).toEqual(expectedPages());
		},
		300_000,
	);
});
