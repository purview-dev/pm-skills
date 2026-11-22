#!/usr/bin/env node
// pm-docs-site <dev | build | check> [site-dir] [--title <t>] [--planning <p>]
//
// dev and build run Astro on the site folder: with its astro.config file when it
// has one, else with the integration built from --title and --planning. check
// builds nothing: it reads the export and the docs sources and reports problems.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { AstroInlineConfig } from 'astro';

import { disableUpdateCheck } from './dev-env.ts';
import { resolveOptions } from './options.ts';
import { parseExport } from './schema-version.ts';
import { loadSiteOptions } from './site-options.ts';
import type { ResolvedOptions } from './types.ts';

interface Flags {
	title?: string;
	planning?: string;
}

const USAGE = 'usage: pm-docs-site <dev | build | check> [site-dir] [--title <title>] [--planning <path>]';

function parse(argv: string[]): { command: string | undefined; siteDir: string; flags: Flags } {
	const flags: Flags = {};
	const positional: string[] = [];

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index] as string;

		if (arg === '--title' || arg === '--planning') {
			const value = argv[++index];
			if (value === undefined) throw new Error(`pm-docs-site: ${arg} needs a value`);
			flags[arg === '--title' ? 'title' : 'planning'] = value;
		} else {
			positional.push(arg);
		}
	}

	return { command: positional[0], siteDir: resolve(positional[1] ?? process.cwd()), flags };
}

/** The problems check finds, one line each. */
function problems(options: ResolvedOptions): string[] {
	const found: string[] = [];

	if (!existsSync(options.planning)) {
		found.push(`No plan export at ${options.planning}. Run the pm-export skill to write planning.json.`);
	} else {
		try {
			parseExport(readFileSync(options.planning, 'utf8'), options.planning);
		} catch (error) {
			found.push((error as Error).message);
		}
	}

	for (const source of options.docs?.sources ?? []) {
		const base = resolve(options.docs?.root ?? '.', source.base);
		if (!existsSync(base)) found.push(`docs source "${source.label}": no folder at ${base}`);
	}

	return found;
}

async function main(): Promise<number | null> {
	const { command, siteDir, flags } = parse(process.argv.slice(2));

	if (command !== 'dev' && command !== 'build' && command !== 'check') {
		console.error(USAGE);
		return 2;
	}

	const { options, configFile } = await loadSiteOptions(siteDir, flags);

	if (command === 'check') {
		const resolved = resolveOptions(options, siteDir);
		const found = problems(resolved);

		for (const line of found) console.error(`pm-docs-site: ${line}`);
		if (found.length) return 1;

		const { schemaVersion } = JSON.parse(readFileSync(resolved.planning, 'utf8'));
		console.log(`pm-docs-site: ok (${resolved.planning}, schemaVersion ${schemaVersion})`);
		return 0;
	}

	const astro = await import('astro');
	const inline: AstroInlineConfig = { root: siteDir };

	if (!configFile) {
		const { default: pmDocsSite } = await import('./index.ts');
		Object.assign(inline, { configFile: false, integrations: [pmDocsSite(options)] });
	}

	if (command === 'build') {
		await astro.build(inline);
		return 0;
	}

	disableUpdateCheck(process.env);
	await astro.dev(inline);
	// The dev server keeps the process alive until it is stopped.
	return null;
}

main().then(
	(code) => {
		if (code !== null) process.exitCode = code;
	},
	(error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	},
);
