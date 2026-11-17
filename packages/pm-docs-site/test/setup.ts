// Preloaded by bun test (bunfig.toml): stands in for the Vite virtual module the
// integration serves, so src/ code that imports it can run outside Astro.
import { fileURLToPath } from 'node:url';

import { mock } from 'bun:test';

import { resolveOptions } from '../lib/options.mjs';

const site = fileURLToPath(new URL('./fixtures/site/', import.meta.url));

mock.module('virtual:pm-docs-site/config', () => ({
	default: resolveOptions({ title: 'Fixture plan', planning: '../planning.json' }, site),
}));
