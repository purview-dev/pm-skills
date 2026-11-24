# purview.dev adopts astroc4 markers

- Captured: 2026-11-23 16:00
- Source: agent (R-045 design)
- Kind: tech-debt
- Affects: purview-dev/purview-dev src/src/lib/docs/diagrams.ts
- Context: R-045 design
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Once astroc4 `1.0.0-prerelease.9` ships the `markers` option (R-045, ADR-007), move purview.dev's sync-time marker rewrite (`src/src/lib/docs/diagrams.ts`) onto astroc4's markers, so the `purview:likec4` marker has one implementation.
