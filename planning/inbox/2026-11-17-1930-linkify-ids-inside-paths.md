# linkify links IDs inside file paths

- Captured: 2026-11-17 19:28
- Source: agent (R-009 execute, final review)
- Kind: bug
- Severity: cosmetic
- Affects: packages/pm-docs-site/src/lib/references.ts
- Context: R-009 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

linkify uses \b boundaries, so an upper-case ID inside a path in prose that is not a known brief path (docs/plans/R-009-x.md) gets a link in the middle of the path. The link test's scanner uses a stricter lookbehind, so the two disagree. Match the scanner's boundaries in linkify.

## Reproduction

Prose naming docs/plans/R-009-x.md with R-009 a known item; the built page links R-009 inside the path.
