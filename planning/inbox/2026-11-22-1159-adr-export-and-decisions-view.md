# ADR export and Decisions view

- Captured: 2026-11-22 11:59
- Source: agent (R-033 design)
- Kind: feature
- Affects: skills/pm-export, packages/pm-docs-site, skills/pm-docs-site/templates
- Context: R-033 design
- Discuss: no
- Related: R-033, R-013, R-037
- Brief: planning/briefs/2026-11-22-where-do-adrs-fit.md
- Reviewed: never

## Idea

Slice 2 of the ADR work, approved by the user on 2026-11-22 (spec docs/superpowers/specs/2026-11-22-adr-record-design.md, Follow-ups). Add as an M item at the top of Next after R-033, M4, serves V5, depends on R-033: `adrs` in `planning.json` at `schemaVersion` 5, read from `<PM root>/decisions/`; the package's Decisions view (React island with text search, category and status chips, superseded hidden by default, group by category or status, URL state; one search-indexed page per ADR; feature pages list their ADRs); demo ADRs; templates move to `schemaVersion` 5 without a view. Then edit R-013 (its `schemaVersion` 4 check becomes 5) and R-037 (`schemaVersion` 6).
