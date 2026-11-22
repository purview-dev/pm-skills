# ADR export edge cases

- Captured: 2026-11-22 15:55
- Source: agent (R-038 final review)
- Kind: bug
- Severity: minor
- Affects: skills/pm-export/scripts/planning.ts
- Context: R-038 finish
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The exporter strips HTML comments everywhere, so an ADR section that shows `<!-- pm-skills:start -->` in a code span or fence loses it, although ADR-002 promises sections verbatim. parseAdr takes the ID from the heading before the file name, so an unlinted `ADR-004-x.md` headed `# ADR-003` duplicates ADR-003 and the site silently overwrites one page. Fix: keep comments inside code in ADR sections, and prefer the file-name ID or fail the export on a duplicate ID.

## Reproduction

Write `planning/decisions/ADR-004-x.md` with heading `# ADR-003 X` and a Context containing `` `<!-- x -->` ``; run `bun skills/pm-export/scripts/export.ts write --root . --pm-root planning/`; `adrs` holds two `ADR-003` entries and the comment is gone.
