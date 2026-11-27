#!/usr/bin/env node
// pm-docs-site <dev | build | check> [site-dir] [--title <t>] [--planning <p>] [--port <n>] [--host <h>]
// pm-docs-site peers architecture
//
// dev and build run Astro on the site folder: with its astro.config file when it
// has one, else with the integration built from --title and --planning. check
// builds nothing: it reads the export and the docs sources and reports problems.
// --port and --host (or the PORT and HOST environment variables, an Aspire
// AddViteApp resource sets PORT) pass through to Astro's dev and build server
// config, so an Aspire AppHost resource can serve the site on its own port.
// peers architecture prints the astroc4 install command, so the skill never
// has to state its exact version.
//
// Argument parsing (`parse`) lives in cli-args.ts, a side-effect-free module,
// so a test can import it without running main() below, which this file calls
// unconditionally as the process entry point.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { AstroInlineConfig } from 'astro';

import { INSTALL_COMMAND } from './astroc4.ts';
import { parse } from './cli-args.ts';
import { disableUpdateCheck } from './dev-env.ts';
import { resolveOptions } from './options.ts';
import { parseExport } from './schema-version.ts';
import { loadSiteOptions } from './site-options.ts';
import type { ResolvedOptions } from './types.ts';

const USAGE =
	'usage: pm-docs-site <dev | build | check> [site-dir] [--title <title>] [--planning <path>] [--port <n>] [--host <host>] | pm-docs-site peers architecture';

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
	const argv = process.argv.slice(2);

	if (argv[0] === 'peers') {
		if (argv.length === 2 && argv[1] === 'architecture') {
			console.log(INSTALL_COMMAND);
			return 0;
		}

		console.error(USAGE);
		return 2;
	}

	let parsed: ReturnType<typeof parse>;

	// A bad argument (an unknown option such as --help, or a flag with no value)
	// is a usage error: name it, then print the usage, as an unknown command does.
	try {
		parsed = parse(argv, process.env);
	} catch (error) {
		console.error((error as Error).message);
		console.error(USAGE);
		return 2;
	}

	const { command, siteDir, flags, server } = parsed;

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
	const inline: AstroInlineConfig = { root: siteDir, server };

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
