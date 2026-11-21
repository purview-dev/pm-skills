// A real consumer: the packed package installed from its tarball into a folder
// outside the repository, with nothing else in its package.json. This is where
// dependency resolution and SSR bundling can fail, and in-tree builds cannot see it.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { expectedPages, FIXTURES, htmlPages, PACKAGE, relativeImports, resolvesToFile } from './helpers';

const tmp = mkdtempSync(join(tmpdir(), 'pm-docs-site-install-'));

// Windows can take longer than the default hook timeout to remove a real
// node_modules tree, so give the cleanup room to finish.
afterAll(() => rmSync(tmp, { recursive: true, force: true }), 60_000);

// Paths under `dir`, at any depth, whose name matches `pattern`.
function filesUnder(dir: string, pattern: RegExp): string[] {
	return (readdirSync(dir, { recursive: true }) as string[]).filter((name) => pattern.test(name));
}


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

			// The built entry points ship; the TypeScript entry points do not. The three
			// lib/ files ship because src/ imports them and Vite compiles them.
			const listing = Bun.spawnSync(['tar', '-tzf', tarball!], { cwd: tmp, stdout: 'pipe' }).stdout.toString().split(/\r?\n/);
			for (const file of ['dist/cli.js', 'dist/index.js', 'dist/index.d.ts', 'lib/repo-docs.ts', 'lib/schema-version.ts', 'lib/types.ts']) {
				expect(listing).toContain(`package/${file}`);
			}
			expect(listing).not.toContain('package/lib/index.ts');
			expect(listing).not.toContain('package/lib/cli.ts');

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

			// Every declaration import resolves inside the tarball, at any depth: a
			// `.ts` specifier left in a .d.ts would point at a file that does not ship.
			const pkgDir = join(consumer, 'node_modules', '@purview-dev', 'pm-docs-site');
			const installed = join(pkgDir, 'dist');
			for (const file of filesUnder(installed, /\.d\.ts$/)) {
				for (const specifier of relativeImports(join(installed, file))) {
					expect(specifier, `${file} imports ${specifier}`).toEndWith('.js');
					const target = join(installed, dirname(file), specifier.replace(/\.js$/, '.d.ts'));
					expect(existsSync(target), `${file} imports ${specifier}`).toBe(true);
				}
			}

			// Every relative import in the shipped src/ and lib/ sources resolves
			// inside the tarball, including the type-only imports that Vite erases
			// and only astro check and editors read.
			for (const folder of ['src', 'lib']) {
				const shipped = join(pkgDir, folder);
				for (const file of filesUnder(shipped, /\.(ts|tsx|astro)$/)) {
					for (const specifier of relativeImports(join(shipped, file))) {
						const base = join(shipped, dirname(file), specifier);
						const found = resolvesToFile(base, ['', '.ts', '.tsx', '/index.ts']);
						expect(found, `${folder}/${file} imports ${specifier}`).toBe(true);
					}
				}
			}

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

			// And the built CLI directly under Node.
			rmSync(join(consumer, 'dist'), { recursive: true, force: true });
			run(['node', join(installed, 'cli.js'), 'build', '.'], consumer);
			expect(htmlPages(join(consumer, 'dist'))).toEqual(expectedPages());
		},
		300_000,
	);
});
