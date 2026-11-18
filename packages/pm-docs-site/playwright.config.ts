// Browser tests: the built fixture site in Chromium (project `chromium`), and
// the fixture under `pm-docs-site dev` in a packed-install consumer (project
// `dev`, test/browser/dev.browser.ts). Specs are *.browser.ts so `bun test`
// (which runs *.test.* and *.spec.*) never picks them up.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4399;
const DEV_PORT = 4398;

export default defineConfig({
	testDir: './test/browser',
	testMatch: '**/*.browser.ts',
	fullyParallel: true,
	reporter: 'list',
	projects: [
		{ name: 'chromium', testIgnore: '**/dev.browser.ts', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` } },
		{ name: 'dev', testMatch: '**/dev.browser.ts', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEV_PORT}` } },
	],
	webServer: [
		{
			command: 'node test/browser/serve.mjs',
			url: `http://localhost:${PORT}/`,
			timeout: 180_000,
			reuseExistingServer: false,
			env: { PORT: String(PORT) },
		},
		{
			// Packs, installs into a consumer outside the repository, and runs the dev server.
			command: 'bun test/browser/dev-server.ts',
			url: `http://localhost:${DEV_PORT}/`,
			timeout: 300_000,
			reuseExistingServer: false,
			env: { PORT: String(DEV_PORT) },
		},
	],
});
