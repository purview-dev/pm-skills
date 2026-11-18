# R-010 deferred board polish

- Captured: 2026-11-18 12:22
- Source: agent (R-010 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site
- Context: R-010 execute
- Discuss: no
- Related: R-011, R-012
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Reviewed: never

## Idea

Minor findings from R-010's task and final reviews, triaged "can wait":

- The 3s reveal of a pending board also fires on a slow but successful hydration (brief unfiltered view, then the filtered one); say so in `components.css` and the `useBoardUrlState.ts` header, or tune it.
- The pending mark is also set on `/plan/roadmap/?owner=...` (inert today); scope it to the Board page when R-011 adds Roadmap filters.
- `useBoardUrlState` `replaceState` drops non-board query parameters and `history.state`.
- The lane header is a plain `div`; an `h3` or `role="heading"` would make lanes navigable.
- Before hydration, `aria-expanded` is `true` on columns the pre-paint script already collapsed.
- The card list is serialised into the island's `props` beside the rendered HTML, roughly doubling the Board page; watch it for R-011 and R-012.
- A collapsed column's vertical title stretches the shared header row.
- `kanban.css` duplicates the Astro cards' scoped styles and keeps dead `.k-item:focus-visible` and `cursor: grab` (suggests drag and drop); its header comment lists only some changes.
- `board.ts`: repeated `(X as string[]).includes` casts; `lanes()` branches repeat their tail; `lanes(..., 'none')` returns the input array.
- `board-data.ts` casts loose owner strings to `Owner | null`; no fixture Done entry with a null `id` (key fallback, `href: null`, and the Done-tag rule untested); `tagHref` never asserted.
- `integration.test.ts` asserts the integration names two ways.
- `install.test.ts` uses a 60s `afterAll` timeout for slow Windows `rmSync`.
- The `dev` Playwright project adds about 25s per browser run and leaves one temp folder per machine; the optimizeDeps guard is untested under Yarn PnP.

## Links

- docs/superpowers/specs/2026-11-18-docs-site-package-board-filters-design.md
- docs/superpowers/plans/2026-11-18-docs-site-package-board-filters.md
