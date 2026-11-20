# Board storage test pins Starlight error counts

- Captured: 2026-11-20 18:44
- Source: agent (R-028 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/test/browser/board.browser.ts
- Context: R-028 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-028: the test `a localStorage that throws leaves the Board usable` excludes Starlight theme-script errors by name, message, and an exact count per `<starlight-theme-select>`. A Starlight upgrade that changes those scripts will fail it with no fault in the package; update the expected counts then, or report the unguarded `localStorage` read upstream to Starlight.
