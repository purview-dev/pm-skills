// A real consumer: the packed package installed from its tarball into a folder
// outside the repository, with nothing else in its package.json. This is where
// dependency resolution and SSR bundling can fail, and in-tree builds cannot see it.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { expectedPages, FIXTURES, htmlPages, PACKAGE } from './helpers';

const tmp = mkdtempSync(join(tmpdir(), 'pm-docs-site-install-'));

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

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
					dependencies: { '@purview-dev/pm-docs-site': `file:${join(tmp, tarball!).replace(/\\/g, '/')}` },
				}),
			);
			run(['bun', 'install'], consumer);

			cpSync(join(FIXTURES, 'planning.json'), join(tmp, 'planning.json'));
			cpSync(join(FIXTURES, 'docs'), join(tmp, 'docs'), { recursive: true });
			const config = readFileSync(join(FIXTURES, 'site', 'astro.config.mjs'), 'utf8').replace(
				"'../../../index.mjs'",
				"'@purview-dev/pm-docs-site'",
			);
			expect(config).toContain("from '@purview-dev/pm-docs-site'");
			writeFileSync(join(consumer, 'astro.config.mjs'), config);

			run(['node', join('node_modules', '@purview-dev', 'pm-docs-site', 'cli.mjs'), 'build', '.'], consumer);

			expect(htmlPages(join(consumer, 'dist'))).toEqual(expectedPages());
		},
		300_000,
	);
});
