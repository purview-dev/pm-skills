// The options a site gives the integration, read the way the CLI needs them:
// from its astro.config file when it has one, else from command-line flags.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { PmDocsSiteOptions } from './types.ts';

const CONFIG_FILES = ['astro.config.mjs', 'astro.config.js', 'astro.config.ts', 'astro.config.mts'];

/** @param siteDir absolute */
export async function loadSiteOptions(
	siteDir: string,
	flags: { title?: string; planning?: string },
): Promise<{ options: PmDocsSiteOptions; configFile: string | null }> {
	const configFile = CONFIG_FILES.map((name) => join(siteDir, name)).find((file) => existsSync(file)) ?? null;

	if (!configFile) {
		return {
			options: { title: flags.title ?? 'Project plan', ...(flags.planning ? { planning: flags.planning } : {}) },
			configFile: null,
		};
	}

	// The config file holds the options; a flag given beside it would be lost silently.
	for (const flag of ['title', 'planning'] as const) {
		if (flags[flag] !== undefined) console.warn(`pm-docs-site: --${flag} is ignored: ${configFile} sets the options.`);
	}

	// Plain Node loads the config, so a TypeScript config may only use what Node
	// strips: erasable syntax and relative imports that name their file.
	let config;
	try {
		config = (await import(pathToFileURL(configFile).href)).default ?? {};
	} catch (error) {
		throw new Error(
			`pm-docs-site: could not load ${configFile} under Node (${(error as Error).message.trim()}). ` +
				'Keep astro.config.ts to erasable TypeScript, with explicit .ts extensions on relative imports.',
		);
	}
	const integrations: unknown[] = (Array.isArray(config.integrations) ? config.integrations : []).flat(Infinity);
	const ours = integrations.find((entry) => (entry as { name?: string } | null)?.name === 'pm-docs-site') as
		| { pmDocsSiteOptions?: PmDocsSiteOptions }
		| undefined;

	if (!ours?.pmDocsSiteOptions) throw new Error(`pm-docs-site: no pm-docs-site integration in ${configFile}`);

	return { options: ours.pmDocsSiteOptions, configFile };
}
