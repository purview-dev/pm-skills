import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it, mock } from 'bun:test';

import { loadAstroc4 } from '../lib/astroc4.ts';
import pmDocsSite from '../lib/index.ts';
import { resolveOptions } from '../lib/options.ts';

const fixtureSite = new URL('./fixtures/site/', import.meta.url);
const DEFAULT_ROOT = fileURLToPath(pathToFileURL('/site/'));

type Plugin = {
	name: string;
	resolveId: (id: string) => string | undefined;
	load: (id: string) => string | undefined;
	configEnvironment?: (name: string) => unknown;
	configResolved?: (config: { server: { fs: { allow: string[] } } }) => void;
};
type Update = {
	srcDir: URL;
	integrations: { name: string }[];
	vite: { plugins: Plugin[]; optimizeDeps: { include: string[] } };
};

type Route = { pattern: string; entrypoint: URL };

type Config = { root?: URL; integrations?: { name: string }[]; vite?: { optimizeDeps?: { include?: string[] } } };

async function run(
	options: Parameters<typeof pmDocsSite>[0],
	config: Config = {},
	internals?: Parameters<typeof pmDocsSite>[1],
): Promise<{ updates: Update[]; routes: Route[] }> {
	const updates: Update[] = [];
	const routes: Route[] = [];
	const hook = pmDocsSite(options, internals).hooks['astro:config:setup'];

	if (!hook) throw new Error('no astro:config:setup hook');

	await hook({
		config: { root: pathToFileURL('/site/'), integrations: [], vite: {}, ...config },
		updateConfig: (update: Update) => updates.push(update),
		injectRoute: (route: Route) => routes.push(route),
	} as never);

	return { updates, routes };
}

const setup = async (options: Parameters<typeof pmDocsSite>[0]) => (await run(options)).updates;

describe('pmDocsSite', () => {
	it('is named pm-docs-site and keeps its options', () => {
		const integration = pmDocsSite({ title: 'T' });

		expect(integration.name).toBe('pm-docs-site');
		expect(integration.pmDocsSiteOptions).toEqual({ title: 'T' });
	});

	it('points srcDir at the package src/ and adds Starlight', async () => {
		const updates = await setup({ title: 'T' });

		expect(updates).toHaveLength(1);
		expect(updates[0]!.srcDir.href).toEndWith('/packages/pm-docs-site/src/');
		expect(updates[0]!.integrations.map((integration) => integration.name)).toEqual(['@astrojs/starlight', '@astrojs/react']);
	});

	it('adds React with Starlight, so islands need no consumer config', async () => {
		const updates: Update[] = [];
		const hook = pmDocsSite({ title: 'T' }).hooks['astro:config:setup'];

		if (!hook) throw new Error('no astro:config:setup hook');

		await hook({
			config: { root: fixtureSite },
			updateConfig: (update: Update) => updates.push(update),
			injectRoute: () => {},
		} as never);

		const names = updates[0]!.integrations.map((integration) => integration.name);

		expect(names).toContain('@astrojs/starlight');
		expect(names).toContain('@astrojs/react');
	});

	it('bundles Starlight and the package in every server environment, prerender included', async () => {
		const plugin = (await setup({ title: 'T' }))[0]!.vite.plugins.find((entry) => entry.name === 'pm-docs-site:no-external');
		const noExternal = ['@astrojs/starlight', '@purview-dev/pm-docs-site'];

		for (const name of ['ssr', 'astro', 'prerender']) {
			expect(plugin!.configEnvironment!(name)).toEqual({ resolve: { noExternal } });
		}
		expect(plugin!.configEnvironment!('client')).toBeUndefined();
	});

	it('serves the resolved options as virtual:pm-docs-site/config', async () => {
		const [plugin] = (await setup({ title: 'T', views: ['now'] }))[0]!.vite.plugins;
		const id = plugin!.resolveId('virtual:pm-docs-site/config');

		expect(id).toBe('\0virtual:pm-docs-site/config');
		expect(plugin!.resolveId('other')).toBeUndefined();

		const source = plugin!.load(id!);

		expect(source).toStartWith('export default ');
		const config = JSON.parse(source!.slice('export default '.length).replace(/;\s*$/, ''));
		expect(config.title).toBe('T');
		expect(config.views.now).toBe(true);
		expect(config.views.features).toBe(false);
	});

	it('injects the page of every optional view that is on', async () => {
		const { routes } = await run({ title: 'T' });

		expect(routes.map((route) => route.pattern).sort()).toEqual([
			'/plan/briefs',
			'/plan/decisions',
			'/plan/decisions/[id]',
			'/plan/features',
			'/plan/features/[id]',
			'/plan/graph',
			'/plan/inbox',
			'/plan/milestones',
			'/plan/milestones/[milestone]',
			'/plan/now',
			'/plan/strategy',
		]);

		for (const route of routes) {
			expect(existsSync(fileURLToPath(route.entrypoint))).toBe(true);
		}
	});

	it('injects no page for a view that is off', async () => {
		expect((await run({ title: 'T', views: ['now'] })).routes.map((route) => route.pattern)).toEqual(['/plan/now']);
	});

	it("keeps the consumer's own React integration instead of adding a second", async () => {
		const { updates } = await run({ title: 'T' }, { integrations: [{ name: '@astrojs/react' }] });

		expect(updates[0]!.integrations.map((integration) => integration.name)).toEqual(['@astrojs/starlight']);
	});

	// The island's renderer imports react-dom/client, and the Graph island
	// @xyflow/react, from under node_modules, which Vite's dev optimizer skips:
	// unbundled, their CommonJS dependencies reach the browser and the island
	// never hydrates (test/browser/dev.browser.ts).
	it('pre-bundles react-dom/client and @xyflow/react through the package when the site resolves it', async () => {
		const root = mkdtempSync(join(realpathSync.native(tmpdir()), 'pm-docs-site-optimize-'));

		try {
			const site = join(root, 'site');
			mkdirSync(join(root, 'node_modules', '@purview-dev', 'pm-docs-site'), { recursive: true });
			writeFileSync(join(root, 'node_modules', '@purview-dev', 'pm-docs-site', 'package.json'), '{}');
			mkdirSync(site);

			const { updates } = await run({ title: 'T' }, { root: pathToFileURL(join(site, '/')) });

			expect(updates[0]!.vite.optimizeDeps).toEqual({ include: ['@purview-dev/pm-docs-site > react-dom/client', '@purview-dev/pm-docs-site > @xyflow/react'] });
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('pre-bundles plain react-dom/client and @xyflow/react when the site does not resolve the package by name', async () => {
		expect((await setup({ title: 'T' }))[0]!.vite.optimizeDeps).toEqual({ include: ['react-dom/client', '@xyflow/react'] });
	});

	it('adds nothing the consumer already pre-bundles', async () => {
		const { updates } = await run({ title: 'T' }, { vite: { optimizeDeps: { include: ['react-dom/client', '@xyflow/react'] } } });

		expect(updates[0]!.vite.optimizeDeps).toEqual({ include: [] });
	});

	it('adds only the missing entry when the consumer already pre-bundles react-dom/client', async () => {
		const { updates } = await run({ title: 'T' }, { vite: { optimizeDeps: { include: ['react-dom/client'] } } });

		expect(updates[0]!.vite.optimizeDeps).toEqual({ include: ['@xyflow/react'] });
	});

	it('throws on invalid options before Astro starts', async () => {
		// @ts-expect-error the title is missing on purpose
		await expect(setup({})).rejects.toThrow('pm-docs-site: title is required');
	});
});

describe('architecture option: loading astroc4', () => {
	function architectureProject(): string {
		const project = mkdtempSync(join(tmpdir(), 'architecture-'));
		mkdirSync(join(project, 'views'));
		writeFileSync(join(project, 'views', 'landscape.c4'), 'views {\n  view c1-context {\n  }\n}\n');

		return project;
	}

	it('loads no astroc4 module when architecture is not set', async () => {
		let called = false;
		const stubLoadAstroc4 = async () => {
			called = true;

			return () => ({ name: 'astroc4' });
		};

		await run({ title: 'T' }, {}, { loadAstroc4: stubLoadAstroc4 });

		expect(called).toBe(false);
	});

	it('passes the architecture options to astroc4, with the markers root', async () => {
		const project = architectureProject();
		const calls: Record<string, unknown>[] = [];
		const stubLoadAstroc4 = async () => (pluginOptions: Record<string, unknown>) => {
			calls.push(pluginOptions);

			return { name: 'astroc4' };
		};

		await run({ title: 'T', architecture: { project, highlighting: false } }, {}, { loadAstroc4: stubLoadAstroc4 });

		const expectedRoot = resolveOptions({ title: 'T', architecture: { project, highlighting: false } }, DEFAULT_ROOT).architecture!.markersRoot;

		expect(calls).toEqual([
			{
				projects: { architecture: project },
				fences: true,
				markers: { root: expectedRoot },
				highlighting: false,
			},
		]);
	});

	it('omits projects when architecture.project is not set', async () => {
		const calls: Record<string, unknown>[] = [];
		const stubLoadAstroc4 = async () => (pluginOptions: Record<string, unknown>) => {
			calls.push(pluginOptions);

			return { name: 'astroc4' };
		};

		await run({ title: 'T', architecture: {} }, {}, { loadAstroc4: stubLoadAstroc4 });

		expect(calls[0]).not.toHaveProperty('projects');
		expect(calls[0]).toMatchObject({ fences: true, highlighting: true });
	});

	it('injects /architecture/[group] only when architecture.project is set', async () => {
		const stubLoadAstroc4 = async () => () => ({ name: 'astroc4' });

		const withoutProject = await run({ title: 'T', architecture: {} }, {}, { loadAstroc4: stubLoadAstroc4 });

		expect(withoutProject.routes.some((route) => route.pattern === '/architecture/[group]')).toBe(false);

		const project = architectureProject();
		const withProject = await run({ title: 'T', architecture: { project } }, {}, { loadAstroc4: stubLoadAstroc4 });
		const architectureRoute = withProject.routes.find((route) => route.pattern === '/architecture/[group]');

		expect(architectureRoute).toBeDefined();
		expect(existsSync(fileURLToPath(architectureRoute!.entrypoint))).toBe(true);
	});

	it('names the bun add command when astroc4 is not installed', async () => {
		mock.module('@purview-dev/astroc4', () => {
			throw Object.assign(new Error("Cannot find package '@purview-dev/astroc4'"), { code: 'ERR_MODULE_NOT_FOUND' });
		});

		await expect(loadAstroc4()).rejects.toThrow(
			'pm-docs-site: the architecture option needs @purview-dev/astroc4. Run: bun add --exact @purview-dev/astroc4@1.0.0-prerelease.9 likec4 @likec4/core shiki @astrojs/markdown-satteri',
		);
	});
});

describe('pm-docs-site:fs-allow', () => {
	// The package folder, as the integration computes it from lib/ (one level below it).
	const packageDir = realpathSync(fileURLToPath(new URL('../', import.meta.url))).replaceAll('\\', '/');
	const plugins = async () => (await setup({ title: 'T' }))[0]!.vite.plugins;
	const plugin = async () => (await plugins()).find((candidate) => candidate.name === 'pm-docs-site:fs-allow')!;
	const resolvedWith = (allow: string[]) => ({ server: { fs: { allow: [...allow] } } });

	it('is the last plugin', async () => {
		expect((await plugins()).at(-1)!.name).toBe('pm-docs-site:fs-allow');
	});

	it('appends the package folder after the existing entries', async () => {
		const config = resolvedWith(['/site']);

		(await plugin()).configResolved!(config);

		expect(config.server.fs.allow).toEqual(['/site', packageDir]);
	});

	it('appends it once when the hook runs twice', async () => {
		const config = resolvedWith(['/site']);
		const { configResolved } = await plugin();

		configResolved!(config);
		configResolved!(config);

		expect(config.server.fs.allow).toEqual(['/site', packageDir]);
	});

	it('leaves the list alone when an entry contains the package', async () => {
		const parent = packageDir.slice(0, packageDir.lastIndexOf('/'));
		const config = resolvedWith([parent]);

		(await plugin()).configResolved!(config);

		expect(config.server.fs.allow).toEqual([parent]);
	});

	it.if(process.platform === 'win32')('recognises an entry with backslashes', async () => {
		const entry = packageDir.replaceAll('/', '\\');
		const config = resolvedWith([entry]);

		(await plugin()).configResolved!(config);

		expect(config.server.fs.allow).toEqual([entry]);
	});
});
