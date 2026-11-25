# Package tests time out in full lint-check

- Captured: 2026-11-25 07:17
- Source: agent (R-041 execute)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site/test/cli.test.ts, packages/pm-docs-site/test/browser/graph.browser.ts
- Context: R-041 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Two consecutive `just lint-check` runs on a prose-only branch failed in `package-test`, each on a different test that passes alone: `cli.test.ts` "still reads a site whose config is astro.config.mjs" timed out after 180000ms (4.27s alone), and `graph.browser.ts:296` "usable at 320px" found `.plan-graph__toolbar` hidden within 5000ms (482ms alone).

## Reproduction

Run `just lint-check` twice on Windows; one package test fails per run under load, a different one each time. Evidence: `expect(locator).toBeVisible() failed ... Received: hidden ... Timeout: 5000ms`; `this test timed out after 180000ms`.
