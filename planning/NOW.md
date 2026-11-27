# Now

<!--
Edited only by pm-* skills. PM state lives in the main worktree; a completion
record may be written in the worktree that holds the item's branch.
Fields are fixed. When idle, every field except Status is empty.
Status: idle | active
Stage: design | plan | execute | finish
Session: <branch> (worktree <path>, optional)
Brief: optional; the item's brief, if it has one
Milestone: optional; the item's milestone while it is active
-->

- Status: active
- Item: R-042 Docs-site package: deferred review minors
- Session: feat/r-042-docs-site-package-deferred-review-minors
- Stage: execute
- Brief:
- Milestone: M5
- Serves: V4
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Note: From the 2026-11-22 review; review minors in `packages/pm-docs-site` (inbox 2026-11-18-1222, 2026-11-20-1844 x3). R-010 board: (1) the 3s reveal of a pending board also fires on a slow but successful hydration; document it in `components.css` and the `useBoardUrlState.ts` header, or tune it. (2) The pending mark is also set on `/plan/roadmap/?owner=...`; scope it to the Board page. (3) `useBoardUrlState` `replaceState` drops non-board query parameters and `history.state`. (4) The lane header is a plain `div`; use an `h3` or `role="heading"`. (5) Before hydration, `aria-expanded` is `true` on columns the pre-paint script already collapsed. (6) The card list is serialised into the island's `props` beside the rendered HTML, roughly doubling the Board page. (7) A collapsed column's vertical title stretches the shared header row. (8) `kanban.css` duplicates the Astro cards' scoped styles and keeps dead `.k-item:focus-visible` and `cursor: grab`; its header comment lists only some changes. (9) `board.ts`: repeated `(X as string[]).includes` casts; `lanes()` branches repeat their tail; `lanes(..., 'none')` returns the input array. (10) `board-data.ts` casts loose owner strings to `Owner | null`; no fixture Done entry with a null `id`; `tagHref` never asserted. (11) `integration.test.ts` asserts the integration names two ways. (12) `install.test.ts` uses a 60s `afterAll` timeout for slow Windows `rmSync`. (13) The `dev` Playwright project adds about 25s per browser run and leaves one temp folder per machine; the optimizeDeps guard is untested under Yarn PnP. R-028: (14) `test/island-imports.test.ts` scans only `.ts` and `.tsx` under `src/components`, so an `.astro` client `<script>` that value-imports a server-only lib is not caught. (15) `start()` in `src/scripts/plan.ts` adds `pointerdown`, `pointerup`, and `click` listeners on `document` each run, so they stack under view transitions. (16) `test/browser/board.browser.ts` test "a localStorage that throws leaves the Board usable" pins Starlight theme-script error counts per `<starlight-theme-select>`; a Starlight upgrade fails it with no fault in the package; loosen it or report the unguarded `localStorage` read upstream. R-031 (inbox 2026-11-21-1205): (17) `relativeImports` in `test/helpers.ts` over-matches `foo.import('./x')`, `Array.from('./x')`, and imports in comments, and misses template-literal dynamic imports (false failures only). (18) In `scripts/check-demo.ts`, a `plan-empty` element's text is cut off at a nested `plan-empty` element. (19) `src/pages/plan/log.astro` labels a known ID whose page is not built with the logged title, not the export's current title, and no test covers that view-off case. R-025 (2026-11-25 review, inbox 2026-11-22-1821): (20) `revisers()` order is not pinned by a test: every assertion in `test/planning.test.ts` (the revisers case) returns one item; give a second item `revisits: 'R-003'` in the populated case and assert both IDs in `features()` order. (21) `src/lib/references.ts` line 188 still checks `other.dependsOn.includes(feature.id) || other.revisits === feature.id` inline; it could reuse `dependents()` and `revisers()`. R-013 (2026-11-25 review, inbox 2026-11-24-2044): (22) `--port=4399` (the `=` form) is not parsed, so it becomes the site folder, and any unknown flag silently becomes a positional argument (`lib/cli-args.ts`). (23) `test/cli.test.ts` "dev --port 4399 serves on 4399" uses a fixed port, which can collide with another process. (24) `skills/pm-docs-site/SKILL.md` Guard checks `bun --version` but not Node 24, so an older Node fails only at verify, after files are written. (25) Two byte-identical Markdown sources on one page (for example two ADR sections with the same text and fence) get the same Pele IDs (`lib/mermaid.ts`). R-040 (2026-11-25 review, inbox 2026-11-25-1008): (27) `test/link-html.test.ts`, `test/links.test.ts`, and `test/references.test.ts` lack a final newline, and `skills/pm-export/scripts/export.test.ts` has an `it(` at column 0 near line 122. Findings 26, 28, 29, and 30 (ADR pages) moved to R-058 ADR pages: fix and release (2026-11-26). 2026-11-27: Started as is (pm-next): it serves M5, not the focus M2 (whose open item R-015 is on its own branch), and is size M without a brief, because this Note lists every finding with its path; no other Next item was claimable.
- Spec: docs/superpowers/specs/2026-11-27-r-042-docs-site-deferred-review-minors-design.md
- Plan: docs/superpowers/plans/2026-11-27-r-042-docs-site-deferred-review-minors.md
- Started: 2026-11-27

## Done when

- each finding listed in this Note is fixed or has a one-line won't-fix reason in the item's plan, `.astro` client scripts are covered by the island import guard, `start()` in `src/scripts/plan.ts` registers its listeners once per document, and `just package-test` passes.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: execute
- Brief: planning/briefs/R-007-tenant-billing.md
- Milestone: M1
- Spec: docs/superpowers/specs/<file>.md
- Plan: docs/superpowers/plans/<file>.md
- Started: 2026-10-29

## Done when

- <observable check>

## Checkpoint 2026-10-29 14:55

- Stopped at: <last completed step>
- Next action: <one action>
- Start with: <exact command or file path>
- Decisions: <decisions made since the last checkpoint, with reasons | none>
- Context: <facts the next session needs that are not in the spec or plan | none>
- Open question: <only if blocking>
-->
