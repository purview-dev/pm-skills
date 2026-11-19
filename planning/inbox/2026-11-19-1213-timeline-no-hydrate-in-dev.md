# Roadmap timeline fails to hydrate in dev

- Captured: 2026-11-19 12:13
- Source: agent (R-012 execute)
- Kind: bug
- Severity: minor
- Affects: packages/pm-docs-site/src/components/timeline/Timeline.tsx
- Context: R-012 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Found while building R-012 (Task 5): under `pm-docs-site dev` in a packed-install consumer, the Roadmap Timeline island does not hydrate. It imports `src/lib/timeline.ts`, which imports `src/lib/planning.ts`, which imports `node:fs`, so the client bundle fails. `test/browser/dev.browser.ts` only checks the Board, so nothing caught it. R-012 fixed the same problem for the Graph island by moving its client functions into `src/lib/graph-state.ts`; the timeline needs the same split and a dev browser test.

## Reproduction

1. Pack the package and install it into a consumer outside the repository, as `test/browser/dev-server.ts` does.
2. Run `pm-docs-site dev` there and open `/plan/roadmap/`.
3. The timeline toolbar never appears; the browser console shows the `node:fs` import failing in the island bundle. Every time.
