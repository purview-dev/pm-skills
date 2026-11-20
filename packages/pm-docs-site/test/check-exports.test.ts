// scripts/check-exports.ts refuses a publish whose package.json points at the
// wrong kind of file, or at a file the package does not carry. Each case runs
// it on a throwaway package root.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { PACKAGE } from './helpers';

const roots: string[] = [];
afterAll(() => {
	for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function check(pkg: object, files: string[]): { code: number; output: string } {
	const root = mkdtempSync(join(tmpdir(), 'pm-docs-site-exports-'));
	roots.push(root);
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'probe', version: '0.0.0', ...pkg }));
	for (const file of files) {
		mkdirSync(dirname(join(root, file)), { recursive: true });
		writeFileSync(join(root, file), '');
	}
	const result = Bun.spawnSync(['node', 'scripts/check-exports.ts', root], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });

	return { code: result.exitCode, output: result.stdout.toString() + result.stderr.toString() };
}

describe('check-exports', () => {
	it('accepts .mjs and .cjs entry points beside a types declaration', () => {
		const files = ['dist/index.d.ts', 'dist/index.mjs', 'dist/index.cjs'];
		const result = check({ exports: { '.': { types: './dist/index.d.ts', import: './dist/index.mjs', require: './dist/index.cjs' } } }, files);

		expect(result.code, result.output).toBe(0);
	});

	it('rejects a declaration outside a types condition', () => {
		const result = check({ exports: { '.': { default: './dist/index.d.ts' } } }, ['dist/index.d.ts']);

		expect(result.code).toBe(1);
		expect(result.output).toContain('./dist/index.d.ts');
	});

	it('rejects a types condition that is not a declaration', () => {
		const result = check({ exports: { '.': { types: './dist/index.js' } } }, ['dist/index.js']);

		expect(result.code).toBe(1);
		expect(result.output).toContain('./dist/index.js');
	});

	it('rejects a bin that points at a declaration', () => {
		const result = check({ bin: { probe: './dist/cli.d.ts' } }, ['dist/cli.d.ts']);

		expect(result.code).toBe(1);
		expect(result.output).toContain('./dist/cli.d.ts');
	});

	it('rejects a files entry the package does not carry', () => {
		const result = check({ files: ['dist', 'missing.ts'] }, ['dist/index.js']);

		expect(result.code).toBe(1);
		expect(result.output).toContain('missing.ts');
	});
});
