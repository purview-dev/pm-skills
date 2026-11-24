#!/usr/bin/env node
// Checks that two builds from the same planning.json and lockfile give
// byte-identical HTML: build, copy dist/ aside, build again, then compare.
//
//   node scripts/check-reproducible.ts <site-dir>
//
// Runs `bun run build` in <site-dir> — the same command the site's own
// package.json build script runs (`pm-docs-site build`, through its
// `file:../packages/pm-docs-site` dependency) — rather than adding an
// --outDir flag to the CLI: the first build's dist/ is copied aside before
// the second build overwrites dist/ in place, so this works unchanged for
// examples/demo and for docs-site, whatever either site's own build script
// does. Prints `reproducible: <n> pages` and exits 0, or `not reproducible:
// <path>` and exits 1. Removes <site-dir>/.reproducible/ afterwards, on
// success or failure. Plain Node, so it needs no install of its own.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const USAGE = 'usage: node scripts/check-reproducible.ts <site-dir>';

/** SHA-256 hex digest of every `*.html` file under distDir, keyed by its `/`-separated path relative to distDir. */
export function htmlDigests(distDir: string): Map<string, string> {
	const files = (readdirSync(distDir, { recursive: true }) as string[]).filter((file) => file.endsWith('.html'));

	const digests = new Map<string, string>();
	for (const file of files) {
		const path = relative(distDir, join(distDir, file)).split(sep).join('/');
		const digest = createHash('sha256').update(readFileSync(join(distDir, file))).digest('hex');

		digests.set(path, digest);
	}
	return digests;
}

/**
 * The first path, in sorted order, that is missing from one map or whose
 * digest differs between them. `null` when every path in either map has the
 * same digest in both.
 */
export function firstDifference(a: Map<string, string>, b: Map<string, string>): string | null {
	const paths = [...new Set([...a.keys(), ...b.keys()])].sort();

	for (const path of paths) {
		if (a.get(path) !== b.get(path)) return path;
	}
	return null;
}

/** Runs `bun run build` in siteDir, as the site's own package.json build script does. Throws on a non-zero exit. */
function build(siteDir: string): void {
	const result = spawnSync('bun', ['run', 'build'], { cwd: siteDir, stdio: 'inherit', shell: process.platform === 'win32' });

	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`pm-docs-site: bun run build failed in ${siteDir} (exit ${result.status ?? 'unknown'})`);
}

/** Builds siteDir twice, compares the HTML, and returns the process exit code. */
function check(siteDir: string): number {
	const distDir = join(siteDir, 'dist');
	const workDir = join(siteDir, '.reproducible');
	const firstDir = join(workDir, 'a');

	rmSync(workDir, { recursive: true, force: true });

	try {
		build(siteDir);
		if (!existsSync(distDir)) throw new Error(`pm-docs-site: no dist/ at ${distDir} after the first build`);
		cpSync(distDir, firstDir, { recursive: true });

		build(siteDir);
		if (!existsSync(distDir)) throw new Error(`pm-docs-site: no dist/ at ${distDir} after the second build`);

		const first = htmlDigests(firstDir);
		const second = htmlDigests(distDir);
		const diff = firstDifference(first, second);

		if (diff) {
			console.error(`not reproducible: ${diff}`);
			return 1;
		}

		console.log(`reproducible: ${second.size} pages`);
		return 0;
	} finally {
		rmSync(workDir, { recursive: true, force: true });
	}
}

if (import.meta.main) {
	const arg = process.argv[2];

	if (!arg) {
		console.error(USAGE);
		process.exitCode = 2;
	} else {
		try {
			process.exitCode = check(resolve(arg));
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		}
	}
}
