import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'bun:test';

import pmDocsSite from '../lib/index.ts';

const fixtureSite = new URL('./fixtures/site/', import.meta.url);

type Plugin = {
	name: string;
	resolveId: (id: string) => string | undefined;
	load: (id: string) => string | undefined;
	configEnvironment?: (name: string) => unknown;
};
type Update = {
	srcDir: URL;
	integrations: { name: string }[];
	vite: { plugins: Plugin[]; optimizeDeps: { include: string[] } };
};

type Route = { pattern: string; entrypoint: URL };

type Config = { root?: URL; integrations?: { name: string }[]; vite?: { optimizeDeps?: { include?: string[] } } };

function run(options: Parameters<typeof pmDocsSite>[0], config: Config = {}): { updates: Update[]; routes: Route[] } {
	const updates: Update[] = [];
	const routes: Route[] = [];
	const hook = pmDocsSite(options).hooks['astro:config:setup'];

	if (!hook) throw new Error('no astro:config:setup hook');

	void hook({
		config: { root: pathToFileURL('/site/'), integrations: [], vite: {}, ...config },
		updateConfig: (update: Update) => updates.push(update),
		injectRoute: (route: Route) => routes.push(route),
	} as never);

	return { updates, routes };
}

const setup = (options: Parameters<typeof pmDocsSite>[0]) => run(options).updates;

describe('pmDocsSite', () => {
	it('is named pm-docs-site and keeps its options', () => {
		const integration = pmDocsSite({ title: 'T' });

		expect(integration.name).toBe('pm-docs-site');
		expect(integration.pmDocsSiteOptions).toEqual({ title: 'T' });
	});

	it('points srcDir at the package src/ and adds Starlight', () => {
		const updates = setup({ title: 'T' });

		expect(updates).toHaveLength(1);
		expect(updates[0]!.srcDir.href).toEndWith('/packages/pm-docs-site/src/');
		expect(updates[0]!.integrations.map((integration) => integration.name)).toEqual(['@astrojs/starlight', '@astrojs/react']);
	});

	it('adds React with Starlight, so islands need no consumer config', () => {
		const updates: Update[] = [];
		const hook = pmDocsSite({ title: 'T' }).hooks['astro:config:setup'];

		if (!hook) throw new Error('no astro:config:setup hook');

		void hook({
			config: { root: fixtureSite },
			updateConfig: (update: Update) => updates.push(update),
			injectRoute: () => {},
		} as never);

		const names = updates[0]!.integrations.map((integration) => integration.name);

		expect(names).toContain('@astrojs/starlight');
		expect(names).toContain('@astrojs/react');
	});

	it('bundles Starlight and the package in every server environment, prerender included', () => {
		const plugin = setup({ title: 'T' })[0]!.vite.plugins.find((entry) => entry.name === 'pm-docs-site:no-external');
		const noExternal = ['@astrojs/starlight', '@purview-dev/pm-docs-site'];

		for (const name of ['ssr', 'astro', 'prerender']) {
			expect(plugin!.configEnvironment!(name)).toEqual({ resolve: { noExternal } });
		}
		expect(plugin!.configEnvironment!('client')).toBeUndefined();
	});

	it('serves the resolved options as virtual:pm-docs-site/config', () => {
		const [plugin] = setup({ title: 'T', views: ['now'] })[0]!.vite.plugins;
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

	it('injects the page of every optional view that is on', () => {
		const { routes } = run({ title: 'T' });

		expect(routes.map((route) => route.pattern).sort()).toEqual([
			'/plan/briefs',
			'/plan/features',
			'/plan/features/[id]',
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

	it('injects no page for a view that is off', () => {
		expect(run({ title: 'T', views: ['now'] }).routes.map((route) => route.pattern)).toEqual(['/plan/now']);
	});

	it("keeps the consumer's own React integration instead of adding a second", () => {
		const { updates } = run({ title: 'T' }, { integrations: [{ name: '@astrojs/react' }] });

		expect(updates[0]!.integrations.map((integration) => integration.name)).toEqual(['@astrojs/starlight']);
	});

	// The island's renderer imports react-dom/client from under node_modules,
	// which Vite's dev optimizer skips: unbundled, React's CommonJS reaches the
	// browser and the island never hydrates (test/browser/dev.browser.ts).
	it('pre-bundles react-dom/client through the package when the site resolves it', () => {
		const root = mkdtempSync(join(realpathSync.native(tmpdir()), 'pm-docs-site-optimize-'));

		try {
			const site = join(root, 'site');
			mkdirSync(join(root, 'node_modules', '@purview-dev', 'pm-docs-site'), { recursive: true });
			writeFileSync(join(root, 'node_modules', '@purview-dev', 'pm-docs-site', 'package.json'), '{}');
			mkdirSync(site);

			const { updates } = run({ title: 'T' }, { root: pathToFileURL(join(site, '/')) });

			expect(updates[0]!.vite.optimizeDeps).toEqual({ include: ['@purview-dev/pm-docs-site > react-dom/client'] });
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('pre-bundles plain react-dom/client when the site does not resolve the package by name', () => {
		expect(setup({ title: 'T' })[0]!.vite.optimizeDeps).toEqual({ include: ['react-dom/client'] });
	});

	it('adds nothing the consumer already pre-bundles', () => {
		const { updates } = run({ title: 'T' }, { vite: { optimizeDeps: { include: ['react-dom/client'] } } });

		expect(updates[0]!.vite.optimizeDeps).toEqual({ include: [] });
	});

	it('throws on invalid options before Astro starts', () => {
		// @ts-expect-error the title is missing on purpose
		expect(() => setup({})).toThrow('pm-docs-site: title is required');
	});
});
