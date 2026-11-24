// The reproducible-build check (Done when: two builds from the same
// planning.json and lockfile give byte-identical HTML). htmlDigests and
// firstDifference are pure, so they are tested directly on plain folders; the
// CLI is tested against a scratch site whose own `bun run build` script is a
// small Node script, deterministic or not, so these tests never need a real
// Astro build — Task 4's manual run against examples/demo covers that.
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'bun:test';

import { firstDifference, htmlDigests } from '../scripts/check-reproducible.ts';
import { PACKAGE } from './helpers';

const CLI = join(PACKAGE, 'scripts', 'check-reproducible.ts');
const BUILD = 30_000;
const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A temp folder holding the given files (relative path -> content). */
function folder(files: Record<string, string>): string {
	const dir = mkdtempSync(join(tmpdir(), 'check-reproducible-'));
	dirs.push(dir);
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(join(dir, path, '..'), { recursive: true });
		writeFileSync(join(dir, path), content);
	}
	return dir;
}

/** A scratch site whose `bun run build` script runs buildSource as build.mjs. */
function site(buildSource: string): string {
	const dir = mkdtempSync(join(tmpdir(), 'check-reproducible-site-'));
	dirs.push(dir);
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'check-reproducible-probe', private: true, scripts: { build: 'node build.mjs' } }));
	writeFileSync(join(dir, 'build.mjs'), buildSource);
	return dir;
}

/** Runs the CLI against siteDir, as `node scripts/check-reproducible.ts <site-dir>` does. */
function run(siteDir?: string): { code: number; stdout: string; stderr: string } {
	const args = siteDir ? ['node', CLI, siteDir] : ['node', CLI];
	const result = Bun.spawnSync(args, { stdout: 'pipe', stderr: 'pipe' });

	return { code: result.exitCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() };
}

describe('htmlDigests', () => {
	it('digests every .html file under the folder, keyed by its /-separated relative path', () => {
		const dir = folder({ 'index.html': '<p>Home</p>', 'guide/index.html': '<p>Guide</p>', 'style.css': 'body{}' });

		const digests = htmlDigests(dir);

		expect([...digests.keys()].sort()).toEqual(['guide/index.html', 'index.html']);
		expect(digests.get('index.html')).toMatch(/^[0-9a-f]{64}$/);
	});

	it('gives the same digest for the same content in two different folders', () => {
		const a = folder({ 'index.html': '<p>Same</p>' });
		const b = folder({ 'index.html': '<p>Same</p>' });

		expect(htmlDigests(a).get('index.html')).toBe(htmlDigests(b).get('index.html'));
	});

	it('gives a different digest for different content', () => {
		const a = folder({ 'index.html': '<p>A</p>' });
		const b = folder({ 'index.html': '<p>B</p>' });

		expect(htmlDigests(a).get('index.html')).not.toBe(htmlDigests(b).get('index.html'));
	});
});

describe('firstDifference', () => {
	it('returns null for two maps with the same paths and digests', () => {
		const a = new Map([['index.html', 'abc']]);
		const b = new Map([['index.html', 'abc']]);

		expect(firstDifference(a, b)).toBeNull();
	});

	it('returns the path whose digest changed', () => {
		const a = new Map([
			['index.html', 'abc'],
			['guide/index.html', 'same'],
		]);
		const b = new Map([
			['index.html', 'xyz'],
			['guide/index.html', 'same'],
		]);

		expect(firstDifference(a, b)).toBe('index.html');
	});

	it('returns a path present in only one map', () => {
		const a = new Map([['index.html', 'abc']]);
		const b = new Map([
			['index.html', 'abc'],
			['extra.html', 'def'],
		]);

		expect(firstDifference(a, b)).toBe('extra.html');
		expect(firstDifference(b, a)).toBe('extra.html');
	});

	it('returns the first differing path in sorted order when more than one differs', () => {
		const a = new Map([
			['b.html', '1'],
			['a.html', '1'],
		]);
		const b = new Map([
			['b.html', '2'],
			['a.html', '2'],
		]);

		expect(firstDifference(a, b)).toBe('a.html');
	});
});

describe('check-reproducible CLI', () => {
	it(
		'reports reproducible for a site whose build is deterministic, and removes .reproducible/',
		() => {
			const dir = site(
				"import { mkdirSync, writeFileSync } from 'node:fs';\n" +
					"mkdirSync('dist/guide', { recursive: true });\n" +
					"writeFileSync('dist/index.html', '<p>Home</p>');\n" +
					"writeFileSync('dist/guide/index.html', '<p>Guide</p>');\n",
			);

			const result = run(dir);

			expect(result.code, result.stdout + result.stderr).toBe(0);
			expect(result.stdout).toContain('reproducible: 2 pages');
			expect(existsSync(join(dir, '.reproducible'))).toBe(false);
		},
		BUILD,
	);

	it(
		'reports not reproducible and names the differing path for a site whose build varies',
		() => {
			const dir = site(
				"import { mkdirSync, writeFileSync } from 'node:fs';\n" +
					"mkdirSync('dist', { recursive: true });\n" +
					"writeFileSync('dist/index.html', '<p>' + Date.now() + Math.random() + '</p>');\n" +
					"writeFileSync('dist/stable.html', '<p>Stable</p>');\n",
			);

			const result = run(dir);

			expect(result.code).toBe(1);
			expect(result.stderr).toContain('not reproducible: index.html');
			expect(existsSync(join(dir, '.reproducible'))).toBe(false);
		},
		BUILD,
	);

	it(
		'removes .reproducible/ and exits non-zero when the build itself fails',
		() => {
			const dir = site('process.exit(3);\n');

			const result = run(dir);

			expect(result.code).not.toBe(0);
			expect(result.stdout + result.stderr).toContain('bun run build failed');
			expect(existsSync(join(dir, '.reproducible'))).toBe(false);
		},
		BUILD,
	);

	it('prints usage and exits 2 when no site-dir is given', () => {
		const result = run();

		expect(result.code).toBe(2);
		expect(result.stderr).toContain('usage: node scripts/check-reproducible.ts <site-dir>');
	});
});
