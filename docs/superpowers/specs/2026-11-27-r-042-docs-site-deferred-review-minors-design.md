# R-042 Docs-site package: deferred review minors

- Item: R-042 (Serves V4, milestone M5 Docs-site package 1.0.0)
- Branch: `feat/r-042-docs-site-package-deferred-review-minors`
- ADRs: follows ADR-005 Docs sites consume the pm-docs-site package (every fix is in `packages/pm-docs-site/`) and ADR-006 Mermaid renders at build time with Pele (finding 25 stays inside the build-time render). No new ADR: finding 25 refines how ADR-006's IDs are derived and does not change the decision.

## Intent

Clear the review minors deferred from R-010, R-013, R-025, R-028, R-031, and R-040 before the package's 1.0.0 (M5), so the release does not carry known defects. The finding list is the Note on R-042 in `planning/NOW.md`; numbers below refer to it.

## Goals and non-goals

- Goal: each finding is fixed or has a one-line won't-fix reason in the plan; `just package-test` passes.
- Non-goal: new views, behaviour changes beyond each finding, or a package release (R-053 releases 1.0.0).
- Anti-goal: a fix that makes the browser tests less stable under `just lint-check` load (R-056).

## Approaches

- **One item, one pull request, one commit per finding group (chosen).** The fixes are independent and small; grouping by area (board, tests, CLI, Mermaid, skills) keeps review readable.
- One pull request per finding: 26 reviews for a few lines each; rejected.
- Finding 6 inside R-042 (option B, slim the island props): reworks `Board.tsx`, the card components, and tests, size L. The user chose B as its own item: parked as `planning/inbox/2026-11-27-0809-board-island-props-slimming.md`.

## Decisions per finding

Paths are under `packages/pm-docs-site/` unless they start with `skills/` or `scripts/`.

| # | Decision |
| --- | --- |
| 1 | Keep the 3s reveal. Document in `src/styles/components.css` and the `src/components/board/useBoardUrlState.ts` header that a slow but successful hydration also reveals the unfiltered board until the island applies the URL. |
| 2 | Set `boardPending` only on the Board page (`src/components/PlanInteractions.astro`, gate on the board body or a prop), so the Roadmap gets no stray attribute. |
| 3 | `useBoardUrlState` keeps non-board query parameters and passes `history.state` through `replaceState`. Unit test. |
| 4 | Lane header becomes an `h3` (`src/components/board/Board.tsx`). |
| 5 | Already fixed by R-028 (static toggle has no `aria-expanded`). Won't fix: no change. |
| 6 | Moved out (see Approaches). Won't fix in R-042. |
| 7 | A collapsed column's vertical title no longer sets the header row height: clip it with overflow hidden and an ellipsis; browser assertion that the header row height equals an expanded column's. |
| 8 | Delete the dead `cursor: grab` and `.k-item:focus-visible` rules from `src/styles/kanban.css` and make its header comment list every change. Keep the duplicate styles in the `.astro` cards: Inbox and Now use them; won't fix the duplication, with that reason. |
| 9 | `src/lib/board.ts`: one typed `includes` helper replaces the casts; `lanes()` branches share one tail; `'none'` returns a copy. |
| 10 | `src/lib/board-data.ts`: an owner type guard replaces the casts. `test/board-data.test.ts` covers a null-id Done entry with an inline planning object (not the shared fixture, whose card counts the browser tests pin) and asserts `tagHref`. |
| 11 | Merge the two integration-name tests in `test/integration.test.ts` into the ordered `toEqual`. |
| 12 | `test/install.test.ts`: `rmSync(..., { maxRetries })` with the default timeout replaces the 60s `afterAll` timeout. |
| 13 | The `dev` run already moved to `playwright.dev.config.ts`; its fixed scratch folder is deliberate. Won't fix: Yarn PnP is not a supported consumer setup. |
| 14 | `test/island-imports.test.ts` also scans bundled (non-`is:inline`) `<script>` bodies in `.astro` files and `src/scripts/`, with a test that a planted server-only import fails. |
| 15 | Does not apply: `start()` runs once at module evaluation and the package has no view transitions. Add a test that pins one registration per document (a second import or call does not add listeners), which satisfies the Done when. |
| 16 | `test/browser/board.browser.ts`: ignore console errors whose stack does not name package code, instead of pinning Starlight's counts. |
| 17 | `test/helpers.ts` `relativeImports` uses `Bun.Transpiler().scanImports` (no regex); add the final newline. |
| 18 | `scripts/check-demo.ts`: won't fix; the cut at a nested `plan-empty` is documented as intended and the nested text is checked on its own. |
| 19 | `src/pages/plan/log.astro` keeps the logged title (the log is history). Add a test for the log page with item pages off. |
| 20 | `test/planning.test.ts`: a second reviser (`revisits: 'R-003'`) and an ordered assertion. |
| 21 | `src/lib/references.ts`: reuse `dependents()` and `revisers()`, linking an item once when it both depends on and revisits. |
| 22 | `lib/cli-args.ts` accepts `--flag=value` for its four flags; an unknown flag exits with an error naming it. Tests in `test/cli.test.ts`. |
| 23 | `test/cli.test.ts` dev test picks a free port at run time instead of 4399. |
| 24 | `skills/pm-docs-site/SKILL.md` Guard: Node older than 24 or missing stops before any file is written, naming the installed version. |
| 25 | `lib/mermaid.ts` hashes the source with the page's file URL, or the ADR section key when there is none, so IDs differ across identical sources and stay stable across builds. Test with two identical fences on one page. |
| 27 | Final newline in `test/link-html.test.ts` and `test/links.test.ts` (`test/references.test.ts` is already fixed); indent the column-0 `it(` in `skills/pm-export/scripts/export.test.ts`. |

## Constraints

- Findings 24 and 27 change `skills/`: run `just bump prerelease` (main is the unreleased `21.0.0-pre.N` line, so the rules stay at 21).
- The package version moves forward (prerelease) so the fixes can publish; R-053 releases 1.0.0.
- Verification: `just package-test`, `just test`, and `just lint-check`.

## Left to the builder

The order of the commits, test names, and the exact free-port helper for finding 23.
