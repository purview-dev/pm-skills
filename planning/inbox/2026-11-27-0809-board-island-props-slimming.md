# Board island sends only card IDs and filters

- Captured: 2026-11-27 08:09
- Source: agent (R-042 design)
- Kind: improvement
- Affects: packages/pm-docs-site/src/pages/plan/board.astro
- Context: R-042 design
- Discuss: no
- Related: R-042
- Brief: none
- Reviewed: never

## Idea

R-042 finding 6, moved out of R-042 at the user's choice (option B, 2026-11-27): the Board island receives the full `BoardCard[]` (with `titleRuns` and `detail` LinkRun arrays) as props beside the rendered HTML. Measured: demo Board page 60.2 KB, island props 9.0 KB (about 15% of the page), island HTML 12.4 KB. Send the island only card IDs and filter fields and reuse the server-rendered card DOM. Touches `src/pages/plan/board.astro` (line 36), `src/components/board/Board.tsx`, the card components, and their tests; likely size M or L, its own item.
