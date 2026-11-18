# Milestones page shows empty No milestone card

- Captured: 2026-11-18 14:55
- Source: agent (R-011 design)
- Kind: bug
- Severity: cosmetic
- Affects: packages/pm-docs-site/src/routes/plan/milestones/index.astro
- Context: R-011 design
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`features()` gives dropped items `milestone: null`, so `milestoneSummaries` keeps the `No milestone` group whenever anything was dropped, and the Milestones page shows a `No milestone` card reading `0 of 0 done`. R-011 hides that card on the timeline and the Roadmap page only; the Milestones page keeps it.

## Reproduction

Build the package against `test/fixtures/planning.json` (dropped R-009, no live unassigned items) and open `/plan/milestones/`.

## Links

- docs/superpowers/specs/2026-11-18-docs-site-package-milestone-timeline-design.md
