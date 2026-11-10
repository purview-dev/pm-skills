// @ts-check
// The {{SITE_TITLE}} site: the plan from {{PM_ROOT}}planning.json, read where it
// lives. Built from the pm-docs-site templates; change it through that skill.
//
//   just docs        # http://localhost:4321
//   just docs-check  # unit tests, astro check, astro build

import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import { buildSidebar } from './src/sidebar.ts';

export default defineConfig({
	integrations: [
		starlight({
			title: '{{SITE_TITLE}}',
			description: '{{SITE_DESCRIPTION}}',
			sidebar: buildSidebar(),
			plugins: [
				// pm-docs-site modules add their Starlight plugins here.
			],
		}),
	],
});
