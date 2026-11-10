import { defineConfig } from 'vitest/config';

// Unit tests for the site's own code (loaders, planning view models). The pages
// themselves are checked by `astro check` and `astro build` (`just docs-check`).
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
});
