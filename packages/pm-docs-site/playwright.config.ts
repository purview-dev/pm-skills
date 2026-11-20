// Browser tests: the built fixture site in Chromium (project `chromium`). The
// fixture under `pm-docs-site dev` in a packed-install consumer is a separate
// run (playwright.dev.config.ts, `bun run test:browser:dev`), so each run
// starts only its own web server. Specs are *.browser.ts so `bun test` (which
// runs *.test.* and *.spec.*) never picks them up. Pass `--project=chromium`
// with `=`: `--project` takes several names, so `--project chromium <file>`
// reads the file as a second project.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4399;

export default defineConfig({
	testDir: './test/browser',
	testMatch: '**/*.browser.ts',
	fullyParallel: true,
	reporter: 'list',
	projects: [{ name: 'chromium', testIgnore: '**/dev.browser.ts', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` } }],
	webServer: {
		command: 'node test/browser/serve.ts',
		url: `http://localhost:${PORT}/`,
		timeout: 180_000,
		reuseExistingServer: false,
		env: { PORT: String(PORT) },
	},
});
