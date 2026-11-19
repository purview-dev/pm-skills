# Read the Now item's facts from one place

- Captured: 2026-11-19 21:56
- Source: agent (R-018 finish review)
- Kind: tech-debt
- Affects: packages/pm-docs-site, skills/pm-export, skills/pm-board/SKILL.md
- Context: R-018 execute
- Discuss: no
- Related: R-020
- Brief: none
- Reviewed: never

## Idea

R-018 left small inconsistencies in how the active item's owner and size are read. `packages/pm-docs-site/src/routes/plan/now.astro` reads them from `board.columns.now[0]`, and `features()` from `now.item` (equal by construction, but two sources). `pm-board`'s Now card step does not say they come from `NOW.md`. The export schema's `$defs/itemRef` is now unreferenced. `graph.test.ts` builds a partial `Planning` with `as unknown as Planning` instead of spreading the fixture, and the shared package fixture draws no edge into the active node (R-020's rich fixture could). Tidy these in one pass.

## Links

- docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md
