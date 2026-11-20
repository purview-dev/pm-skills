// Dev browser tests (project `dev`, test/browser/dev.browser.ts): the fixture
// under `pm-docs-site dev` in a packed-install consumer. Run with
// `bun run test:browser:dev`; the built-site tests are playwright.config.ts,
// so each run starts only its own web server.
import { defineConfig, devices } from '@playwright/test';

const DEV_PORT = 4398;

export default defineConfig({
	testDir: './test/browser',
	testMatch: '**/dev.browser.ts',
	fullyParallel: true,
	reporter: 'list',
	projects: [{ name: 'dev', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEV_PORT}` } }],
	webServer: {
		// Packs, installs into a consumer outside the repository, and runs the dev server.
		command: 'bun test/browser/dev-server.ts',
		url: `http://localhost:${DEV_PORT}/`,
		timeout: 300_000,
		reuseExistingServer: false,
		env: { PORT: String(DEV_PORT) },
	},
});
