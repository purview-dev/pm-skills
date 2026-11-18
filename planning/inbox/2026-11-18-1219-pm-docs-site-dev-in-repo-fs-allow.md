# Board does not hydrate in in-repo dev

- Captured: 2026-11-18 12:19
- Source: agent (R-010 execute, final fix wave)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site
- Context: R-010 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Running `pm-docs-site dev` on a site inside this repository (the package's test fixture) never hydrates the Board island: Vite refuses to serve `packages/pm-docs-site/node_modules/@astrojs/react/dist/client.js` because it is outside Vite's `server.fs.allow` list. It already failed this way before R-010's fix wave (at acd2cef). A packed-install consumer is fixed by R-010 and pinned by the `dev` Playwright project; this affects only developing the package against the in-repo fixture. Allowing the package's own folder in `server.fs.allow` from the integration made the plain `react-dom/client` branch hydrate in the fix wave's experiment.

## Reproduction

From `packages/pm-docs-site`, run the fixture site with `node cli.mjs dev test/fixtures/site`, open `/plan/board/?group=owner`: the board stays hidden until the 3s reveal and the island never hydrates; the dev server logs that the file is outside the allow list. Every time.

## Links

- packages/pm-docs-site/index.mjs
- .superpowers/sdd/2026-11-18-docs-site-package-board-filters/final-fix-report.md
