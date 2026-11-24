// The pm-docs-site Astro integration. The consumer's astro.config.ts holds
// only `integrations: [pmDocsSite({ title, ... })]`: this points Astro's srcDir
// at the package's own src/ (pages, components, content config), adds
// Starlight with the plan sidebar, adds React so pages can render `.tsx` islands with
// no consumer config, and serves the resolved options to the pages as
// `virtual:pm-docs-site/config`.

import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import type { AstroIntegration } from 'astro';

import { loadAstroc4 } from './astroc4.ts';
import { containsPath } from './fs-allow.ts';
import { resolveOptions } from './options.ts';
import { buildSidebar } from './sidebar.ts';
import type { PmDocsSiteOptions, ViewName } from './types.ts';

export type * from './types.ts';

/**
 * The pages each optional view owns, in src/routes/ so Astro routes them only
 * when the view is on. Home, Board, Roadmap, Log and Risks are in src/pages/.
 */
const VIEW_ROUTES: Record<ViewName, [pattern: string, file: string][]> = {
	now: [['/plan/now', 'plan/now.astro']],
	milestones: [
		['/plan/milestones', 'plan/milestones/index.astro'],
		['/plan/milestones/[milestone]', 'plan/milestones/[milestone].astro'],
	],
	graph: [['/plan/graph', 'plan/graph.astro']],
	features: [
		['/plan/features', 'plan/features/index.astro'],
		['/plan/features/[id]', 'plan/features/[id].astro'],
	],
	inbox: [['/plan/inbox', 'plan/inbox.astro']],
	briefs: [['/plan/briefs', 'plan/briefs.astro']],
	strategy: [['/plan/strategy', 'plan/strategy.astro']],
	decisions: [
		['/plan/decisions', 'plan/decisions.astro'],
		['/plan/decisions/[id]', 'plan/decisions/[id].astro'],
	],
};

const PACKAGE_NAME = '@purview-dev/pm-docs-site';

/**
 * The package folder, real path, with forward slashes as Vite stores its
 * `server.fs.allow` entries. lib/index.ts (in this repository) and
 * dist/index.js (installed) both sit one level below it.
 */
const PACKAGE_DIR = realpathSync(fileURLToPath(new URL('../', import.meta.url))).replaceAll('\\', '/');
const REACT_INTEGRATION = '@astrojs/react';

const NO_EXTERNAL = ['@astrojs/starlight', PACKAGE_NAME];
const SERVER_ENVIRONMENTS = ['ssr', 'astro', 'prerender'];

/**
 * Whether `name` is installed in a node_modules folder at or above `root`,
 * walked as Vite resolves it: under Bun, `createRequire` also finds Bun's
 * global cache, which Vite never looks in.
 */
function resolvesFrom(name: string, root: string): boolean {
	for (let dir = resolve(root); ; dir = dirname(dir)) {
		if (existsSync(join(dir, 'node_modules', name, 'package.json'))) return true;
		if (dirname(dir) === dir) return false;
	}
}

/** The islands' dependencies Vite's dev optimizer must pre-bundle (optimizedDependencies). */
const BROWSER_DEPENDENCIES = ['react-dom/client', '@xyflow/react'];

/**
 * The `optimizeDeps.include` entries the site lacks. The island's renderer
 * (@astrojs/react-renderer) imports react-dom/client from under node_modules,
 * which Vite's dev optimizer skips, so React's CommonJS reaches the browser
 * raw and the Board never hydrates. An installed package is pre-bundled
 * through itself (`<package> > react-dom/client`); a site that cannot resolve
 * the package by name (this repository's fixtures) names react-dom/client
 * plainly, since naming a package Vite cannot resolve breaks the optimizer.
 * The Graph island's @xyflow/react is imported from this package's own source
 * under node_modules, which the optimizer does not scan either, and its
 * react-compiler-runtime dependency is CommonJS, so it is pre-bundled the same
 * way. Only missing entries: Vite's mergeConfig concatenates arrays.
 */
function optimizedDependencies(include: unknown, root: string): string[] {
	const existing = Array.isArray(include) ? include : [];
	const viaPackage = resolvesFrom(PACKAGE_NAME, root);

	return BROWSER_DEPENDENCIES.map((name) => (viaPackage ? `${PACKAGE_NAME} > ${name}` : name)).filter((entry) => !existing.includes(entry));
}

const VIRTUAL_ID = 'virtual:pm-docs-site/config';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/** The `plugins` Starlight accepts, read off its own options type so this file never imports it directly. */
type StarlightPlugins = Parameters<typeof starlight>[0]['plugins'];

/**
 * Loads the astroc4 Starlight plugin, so a test can inject a stub instead
 * of the real `@purview-dev/astroc4` import. Not part of the public options
 * type: a consumer's astro.config.ts only ever passes one argument.
 */
export interface PmDocsSiteInternals {
	loadAstroc4?: () => Promise<(options: Record<string, unknown>) => unknown>;
}

/** The pm-docs-site integration: the plan pages, Starlight, and the docs collection. */
export default function pmDocsSite(
	options: PmDocsSiteOptions,
	internals: PmDocsSiteInternals = {},
): AstroIntegration & { pmDocsSiteOptions: PmDocsSiteOptions } {
	return {
		name: 'pm-docs-site',
		pmDocsSiteOptions: options,
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, injectRoute }) => {
				const root = fileURLToPath(config.root);
				const resolved = resolveOptions(options, root);
				// A consumer that adds React itself keeps its own: two would register the renderer twice.
				const hasReact = (config.integrations ?? []).some((integration) => integration.name === REACT_INTEGRATION);

				for (const [view, routes] of Object.entries(VIEW_ROUTES)) {
					if (!resolved.views[view as ViewName]) continue;

					for (const [pattern, file] of routes) {
						injectRoute({ pattern, entrypoint: new URL(`../src/routes/${file}`, import.meta.url) });
					}
				}

				const { architecture } = resolved;
				// Loaded only when the option is set, so a site that never asks for
				// architecture diagrams never pulls in LikeC4, Shiki, or astroc4 itself.
				const astroc4 = architecture ? await (internals.loadAstroc4 ?? loadAstroc4)() : null;

				if (architecture?.project) {
					injectRoute({ pattern: '/architecture/[group]', entrypoint: new URL('../src/routes/architecture/[group].astro', import.meta.url) });
				}

				updateConfig({
					srcDir: new URL('../src/', import.meta.url),
					integrations: [
						starlight({
							title: resolved.title,
							...(resolved.description ? { description: resolved.description } : {}),
							sidebar: buildSidebar(resolved),
							// src/pages/404.astro is the not-found page (it says why).
							disable404Route: true,
							// Every page uses the full width (src/styles/width.css).
							customCss: [fileURLToPath(new URL('../src/styles/width.css', import.meta.url))],
							...(astroc4
								? {
										plugins: [
											astroc4({
												...(architecture!.project ? { projects: { architecture: architecture!.project } } : {}),
												fences: true,
												markers: { root: architecture!.markersRoot },
												highlighting: architecture!.highlighting,
											}),
										] as StarlightPlugins,
									}
								: {}),
						}),
						...(hasReact ? [] : [react()]),
					],
					vite: {
						optimizeDeps: { include: optimizedDependencies(config.vite?.optimizeDeps?.include, root) },
						plugins: [
							{
								name: 'pm-docs-site:config',
								resolveId: (id: string) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
								load: (id: string) => (id === RESOLVED_ID ? `export default ${JSON.stringify(resolved)};` : undefined),
							},
							{
								// Bundle Starlight and this package in every server environment, whatever
								// the consumer's package.json lists: externalised, Starlight cannot import
								// astro:middleware. Astro 7 renders static pages in its own `prerender`
								// environment, which top-level `vite.ssr` does not reach.
								name: 'pm-docs-site:no-external',
								configEnvironment: (name: string) =>
									SERVER_ENVIRONMENTS.includes(name) ? { resolve: { noExternal: [...NO_EXTERNAL] } } : undefined,
							},
							{
								// Serve the package's own files in dev. The in-repo fixture and a linked
								// consumer resolve the package outside the site's workspace root, so Vite
								// refuses its node_modules (the React island client) and nothing hydrates.
								// Append only: Vite's defaults and the consumer's entries stay. The entry
								// serves the whole package folder in in-repo and linked dev; Vite's
								// `server.fs.deny` still guards it. On a case-insensitive file system a
								// path that differs only in case appends a second, harmless entry.
								name: 'pm-docs-site:fs-allow',
								configResolved: (resolvedConfig: { server: { fs: { allow: string[] } } }) => {
									const { allow } = resolvedConfig.server.fs;

									if (!allow.some((entry) => containsPath(entry, PACKAGE_DIR))) allow.push(PACKAGE_DIR);
								},
							},
						],
					},
				});
			},
		},
	};
}
