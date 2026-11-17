// Browser tests: the built fixture site in Chromium. Specs are *.browser.ts so
// `bun test` (which runs *.test.* and *.spec.*) never picks them up.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4399;

export default defineConfig({
	testDir: './test/browser',
	testMatch: '**/*.browser.ts',
	fullyParallel: true,
	reporter: 'list',
	use: { baseURL: `http://localhost:${PORT}` },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'node test/browser/serve.mjs',
		url: `http://localhost:${PORT}/`,
		timeout: 180_000,
		reuseExistingServer: false,
		env: { PORT: String(PORT) },
	},
});
