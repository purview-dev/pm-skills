// @ts-check
// The pm-docs-site Astro integration. The consumer's astro.config.mjs holds
// only `integrations: [pmDocsSite({ title, ... })]`: this points Astro's srcDir
// at the package's own src/ (pages, components, content config), adds
// Starlight with the plan sidebar, adds React so pages can render `.tsx` islands with
// no consumer config, and serves the resolved options to the pages as
// `virtual:pm-docs-site/config`.

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

const PACKAGE_NAME = '@purview-dev/pm-docs-site';
const REACT_INTEGRATION = '@astrojs/react';

const NO_EXTERNAL = ['@astrojs/starlight', PACKAGE_NAME];
const SERVER_ENVIRONMENTS = ['ssr', 'astro', 'prerender'];

/**
 * Whether `name` is installed in a node_modules folder at or above `root`,
 * walked as Vite resolves it: under Bun, `createRequire` also finds Bun's
 * global cache, which Vite never looks in.
 * @param {string} name
 * @param {string} root
 */
function resolvesFrom(name, root) {
	for (let dir = resolve(root); ; dir = dirname(dir)) {
		if (existsSync(join(dir, 'node_modules', name, 'package.json'))) return true;
		if (dirname(dir) === dir) return false;
	}
}

/**
 * The `optimizeDeps.include` entries the site lacks. The island's renderer
 * (@astrojs/react-renderer) imports react-dom/client from under node_modules,
 * which Vite's dev optimizer skips, so React's CommonJS reaches the browser
 * raw and the Board never hydrates. An installed package is pre-bundled
 * through itself (`<package> > react-dom/client`); a site that cannot resolve
 * the package by name (this repository's fixtures) names react-dom/client
 * plainly, since naming a package Vite cannot resolve breaks the optimizer.
 * Only missing entries: Vite's mergeConfig concatenates arrays.
 * @param {unknown} include
 * @param {string} root
 * @returns {string[]}
 */
function optimizedDependencies(include, root) {
	const existing = Array.isArray(include) ? include : [];
	const entry = resolvesFrom(PACKAGE_NAME, root) ? `${PACKAGE_NAME} > react-dom/client` : 'react-dom/client';

	return existing.includes(entry) ? [] : [entry];
}

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
				const root = fileURLToPath(config.root);
				const resolved = resolveOptions(options, root);
				// A consumer that adds React itself keeps its own: two would register the renderer twice.
				const hasReact = (config.integrations ?? []).some((integration) => integration.name === REACT_INTEGRATION);

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
						...(hasReact ? [] : [react()]),
					],
					vite: {
						optimizeDeps: { include: optimizedDependencies(config.vite?.optimizeDeps?.include, root) },
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
