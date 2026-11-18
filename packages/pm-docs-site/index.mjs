// @ts-check
// The pm-docs-site Astro integration. The consumer's astro.config.mjs holds
// only `integrations: [pmDocsSite({ title, ... })]`: this points Astro's srcDir
// at the package's own src/ (pages, components, content config), adds
// Starlight with the plan sidebar, adds React so pages can render `.tsx` islands with
// no consumer config, and serves the resolved options to the pages as
// `virtual:pm-docs-site/config`.

import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import starlight from '@astrojs/starlight';

import { resolveOptions } from './lib/options.mjs';
import { buildSidebar } from './lib/sidebar.mjs';

/**
 * The pages each optional view owns, in src/routes/ so Astro routes them only
 * when the view is on. Home, Board, Roadmap, Log and Risks are in src/pages/.
 * @type {Record<import('./index').ViewName, [pattern: string, file: string][]>}
 */
const VIEW_ROUTES = {
	now: [['/plan/now', 'plan/now.astro']],
	milestones: [
		['/plan/milestones', 'plan/milestones/index.astro'],
		['/plan/milestones/[milestone]', 'plan/milestones/[milestone].astro'],
	],
	features: [
		['/plan/features', 'plan/features/index.astro'],
		['/plan/features/[id]', 'plan/features/[id].astro'],
	],
	inbox: [['/plan/inbox', 'plan/inbox.astro']],
	briefs: [['/plan/briefs', 'plan/briefs.astro']],
	strategy: [['/plan/strategy', 'plan/strategy.astro']],
};

const NO_EXTERNAL = ['@astrojs/starlight', '@purview-dev/pm-docs-site'];
const SERVER_ENVIRONMENTS = ['ssr', 'astro', 'prerender'];

const VIRTUAL_ID = 'virtual:pm-docs-site/config';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * @param {import('./index').PmDocsSiteOptions} options
 * @returns {import('astro').AstroIntegration & { pmDocsSiteOptions: import('./index').PmDocsSiteOptions }}
 */
export default function pmDocsSite(options) {
	return {
		name: 'pm-docs-site',
		pmDocsSiteOptions: options,
		hooks: {
			'astro:config:setup': ({ config, updateConfig, injectRoute }) => {
				const resolved = resolveOptions(options, fileURLToPath(config.root));

				for (const [view, routes] of Object.entries(VIEW_ROUTES)) {
					if (!resolved.views[/** @type {import('./index').ViewName} */ (view)]) continue;

					for (const [pattern, file] of routes) {
						injectRoute({ pattern, entrypoint: new URL(`./src/routes/${file}`, import.meta.url) });
					}
				}

				updateConfig({
					srcDir: new URL('./src/', import.meta.url),
					integrations: [
						starlight({
							title: resolved.title,
							...(resolved.description ? { description: resolved.description } : {}),
							sidebar: buildSidebar(resolved),
							// Every page uses the full width (src/styles/width.css).
							customCss: [fileURLToPath(new URL('./src/styles/width.css', import.meta.url))],
						}),
						react(),
					],
					vite: {
						plugins: [
							{
								name: 'pm-docs-site:config',
								/** @param {string} id */
								resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
								/** @param {string} id */
								load: (id) => (id === RESOLVED_ID ? `export default ${JSON.stringify(resolved)};` : undefined),
							},
							{
								// Bundle Starlight and this package in every server environment, whatever
								// the consumer's package.json lists: externalised, Starlight cannot import
								// astro:middleware. Astro 7 renders static pages in its own `prerender`
								// environment, which top-level `vite.ssr` does not reach.
								name: 'pm-docs-site:no-external',
								/** @param {string} name */
								configEnvironment: (name) =>
									SERVER_ENVIRONMENTS.includes(name) ? { resolve: { noExternal: [...NO_EXTERNAL] } } : undefined,
							},
						],
					},
				});
			},
		},
	};
}
