# Brief still says docs-site views are static first

- Captured: 2026-11-18 09:11
- Source: agent (R-010 design)
- Kind: tech-debt
- Affects: planning/briefs/2026-11-17-docs-site-package.md
- Context: R-010 design
- Discuss: no
- Related: R-010, R-011, R-012
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Reviewed: never

## Idea

In R-010 design (2026-11-18) the user chose rich interactive components for every docs-site view, with React islands (React over Preact, so R-011 and R-012 can use React-first libraries such as React Flow). The brief's Performance ramification still says "Render static HTML first and enhance with small islands", and its Ramifications do not mention the React runtime dependency every consumer now gets. Update the brief (pm-shape) so R-011 and R-012 design from the new direction.

## Links

- docs/superpowers/specs/2026-11-18-docs-site-package-board-filters-design.md
