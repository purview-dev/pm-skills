// The package build: scripts/build.ts emits lib/ into dist/ as JavaScript and
// declarations, the files Node loads from an installed package.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { PACKAGE } from './helpers';

describe('the package build', () => {
	it('emits JavaScript and declarations for every lib module and nothing stale', () => {
		mkdirSync(join(PACKAGE, 'dist'), { recursive: true });
		writeFileSync(join(PACKAGE, 'dist', 'stale.js'), '');

		const result = Bun.spawnSync(['node', 'scripts/build.ts'], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });

		expect(result.exitCode, result.stdout.toString() + result.stderr.toString()).toBe(0);
		const emitted = readdirSync(join(PACKAGE, 'dist')).sort();
		const modules = readdirSync(join(PACKAGE, 'lib'))
			.filter((file) => file.endsWith('.ts'))
			.map((file) => file.slice(0, -3));
		expect(emitted).toEqual(modules.flatMap((module) => [`${module}.d.ts`, `${module}.js`]).sort());
		expect(readFileSync(join(PACKAGE, 'dist', 'cli.js'), 'utf8')).toStartWith('#!/usr/bin/env node');
		expect(readFileSync(join(PACKAGE, 'dist', 'index.js'), 'utf8')).not.toMatch(/from '\.\/[^']+\.ts'/);
	}, 60_000);

	it('writes declarations that import .js, so they resolve inside the tarball', () => {
		const result = Bun.spawnSync(['node', 'scripts/build.ts'], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });

		expect(result.exitCode).toBe(0);
		for (const file of readdirSync(join(PACKAGE, 'dist')).filter((name) => name.endsWith('.d.ts'))) {
			expect(readFileSync(join(PACKAGE, 'dist', file), 'utf8'), file).not.toMatch(/from '\.\/[^']+\.ts'/);
		}
		expect(readFileSync(join(PACKAGE, 'dist', 'index.d.ts'), 'utf8')).toContain("export type * from './types.js';");
	}, 60_000);

	it('rewrites .ts specifiers in nested declarations', () => {
		const probe = join(PACKAGE, 'lib', '__probe__');
		// A run killed before `finally` leaves the probe behind (lib/__probe__/ is gitignored); start clean.
		rmSync(probe, { recursive: true, force: true });
		mkdirSync(probe, { recursive: true });
		writeFileSync(join(probe, 'b.ts'), 'export type B = string;\n');
		writeFileSync(join(probe, 'a.ts'), "export type { B } from './b.ts';\nexport type { ResolvedOptions } from '../types.ts';\n");

		try {
			const result = Bun.spawnSync(['node', 'scripts/build.ts'], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });

			expect(result.exitCode, result.stdout.toString() + result.stderr.toString()).toBe(0);
			const declaration = readFileSync(join(PACKAGE, 'dist', '__probe__', 'a.d.ts'), 'utf8');
			expect(declaration).toContain("'./b.js'");
			expect(declaration).toContain("'../types.js'");
			expect(declaration).not.toMatch(/\.ts'/);
		} finally {
			rmSync(probe, { recursive: true, force: true });
			// Rebuild without the probe, so dist/ (which prepack ships) never keeps dist/__probe__/.
			const restore = Bun.spawnSync(['node', 'scripts/build.ts'], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });

			expect(restore.exitCode, restore.stdout.toString() + restore.stderr.toString()).toBe(0);
		}
	}, 120_000);
});
