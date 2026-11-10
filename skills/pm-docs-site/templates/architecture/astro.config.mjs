// @ts-check
// The {{SITE_TITLE}} site: the plan from {{PM_ROOT}}planning.json, read where it
// lives. Built from the pm-docs-site templates; change it through that skill.
//
//   just docs        # http://localhost:4321
//   just docs-check  # unit tests, astro check, astro build

import starlight from '@astrojs/starlight';
import astroc4 from '@purview-dev/astroc4';
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
				astroc4({
					// The model stays where it is; its `@` image alias works as it is.
					projects: { architecture: '{{SITE_TO_ROOT}}/{{LIKEC4_DIR}}' },
					// Pinned to the LikeC4 the site builds with, so highlighting never
					// changes under a build; `warn` keeps an offline build working.
					highlighting: { ref: 'v{{LIKEC4_VERSION}}', onError: 'warn' },
				}),
			],
		}),
	],
});
