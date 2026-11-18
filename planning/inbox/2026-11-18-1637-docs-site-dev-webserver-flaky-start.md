# Package dev web server start is intermittent

- Captured: 2026-11-18 16:37
- Source: agent (R-011 execute, verification)
- Kind: tech-debt
- Affects: packages/pm-docs-site/playwright.config.ts
- Context: R-011 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`just lint-check` failed twice on 2026-11-18 at `package-test`: the `dev` web server (`test/browser/dev-server.ts`) logged `Listen method has been called more than once without closing` and `transport invoke timed out after 60000ms`, then Playwright timed out after 300000ms. `bun run test:browser --project=dev` alone passed, and a third full run passed, so the start is intermittent when both web servers start together. Playwright starts both servers even with `--project=chromium`. Separately, `bun run test:browser -- --project chromium <file>` fails under Bun (Playwright reads the path as a project name), while `--project=chromium` works.
