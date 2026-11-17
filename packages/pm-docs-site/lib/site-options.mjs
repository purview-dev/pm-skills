// @ts-check
// The options a site gives the integration, read the way the CLI needs them:
// from its astro.config file when it has one, else from command-line flags.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** @typedef {import('../index').PmDocsSiteOptions} PmDocsSiteOptions */

const CONFIG_FILES = ['astro.config.mjs', 'astro.config.js', 'astro.config.ts', 'astro.config.mts'];

/**
 * @param {string} siteDir absolute
 * @param {{ title?: string; planning?: string }} flags
 * @returns {Promise<{ options: PmDocsSiteOptions; configFile: string | null }>}
 */
export async function loadSiteOptions(siteDir, flags) {
	const configFile = CONFIG_FILES.map((name) => join(siteDir, name)).find((file) => existsSync(file)) ?? null;

	if (!configFile) {
		return {
			options: { title: flags.title ?? 'Project plan', ...(flags.planning ? { planning: flags.planning } : {}) },
			configFile: null,
		};
	}

	const config = (await import(pathToFileURL(configFile).href)).default ?? {};
	/** @type {unknown[]} */
	const integrations = (Array.isArray(config.integrations) ? config.integrations : []).flat(Infinity);
	const ours = /** @type {{ pmDocsSiteOptions?: PmDocsSiteOptions } | undefined} */ (
		integrations.find((entry) => /** @type {{ name?: string } | null} */ (entry)?.name === 'pm-docs-site')
	);

	if (!ours?.pmDocsSiteOptions) throw new Error(`pm-docs-site: no pm-docs-site integration in ${configFile}`);

	return { options: ours.pmDocsSiteOptions, configFile };
}
