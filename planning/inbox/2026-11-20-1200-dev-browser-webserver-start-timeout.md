# Dev browser test webserver start timed out

- Captured: 2026-11-20 12:00
- Source: agent (R-019 finish)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site/playwright.dev.config.ts
- Context: R-019 finish
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`just lint-check` (via `package-test`) failed once on R-019's branch: `test:browser:dev` timed out after 300000ms waiting for `config.webServer`. The dev server logged `transport was disconnected, cannot call "fetchModule"`, `Listen method has been called more than once without closing`, and `transport invoke timed out after 60000ms`. An immediate re-run of `bun run test:browser:dev` passed 3/3, and R-019 changed nothing on the dev path.

## Reproduction

Run `just lint-check` right after the full `bun test` package suite on Windows; seen once in two runs.

## Links

- packages/pm-docs-site/playwright.dev.config.ts
- packages/pm-docs-site/test/browser/dev-server.ts
