import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'bun:test';

import pmDocsSite from '../index.mjs';

type Plugin = { name: string; resolveId: (id: string) => string | undefined; load: (id: string) => string | undefined };
type Update = {
	srcDir: URL;
	integrations: { name: string }[];
	vite: { ssr: { noExternal: string[] }; plugins: Plugin[] };
};

type Route = { pattern: string; entrypoint: URL };

function run(options: Parameters<typeof pmDocsSite>[0]): { updates: Update[]; routes: Route[] } {
	const updates: Update[] = [];
	const routes: Route[] = [];
	const hook = pmDocsSite(options).hooks['astro:config:setup'];

	if (!hook) throw new Error('no astro:config:setup hook');

	void hook({
		config: { root: pathToFileURL('/site/') },
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
		expect(updates[0]!.integrations.map((integration) => integration.name)).toEqual(['@astrojs/starlight']);
		expect(updates[0]!.vite.ssr.noExternal).toEqual(['@astrojs/starlight', '@purview-dev/pm-docs-site']);
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

	it('throws on invalid options before Astro starts', () => {
		// @ts-expect-error the title is missing on purpose
		expect(() => setup({})).toThrow('pm-docs-site: title is required');
	});
});
