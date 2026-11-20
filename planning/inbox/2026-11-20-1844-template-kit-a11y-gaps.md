# Template site keeps R-028 accessibility gaps

- Captured: 2026-11-20 18:44
- Source: agent (R-028 execute, final review)
- Kind: tech-debt
- Affects: skills/pm-docs-site/templates/, docs-site/
- Context: R-028 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-028 fixed the popup trigger, backdrop close, heading levels, card tab stops, collapse toggles, and timeline zoom focus in `packages/pm-docs-site` only. The copies in `skills/pm-docs-site/templates/` and the rendered `docs-site/` keep the old gaps until R-013 Docs-site package: publish and migrate moves the site onto the package. Check R-013 removes them, or port the fixes if R-013 slips.
