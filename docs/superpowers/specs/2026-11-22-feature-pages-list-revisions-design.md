# R-025 Feature pages list revisions: design

- Item: R-025 Docs-site package: feature pages list revisions (Serves V4, Milestone M1, size S)
- Date: 2026-11-22
- ADRs: none written or followed (ADR-001 to ADR-003 cover ADR storage, export, and acceptance; none applies)

## Intent

A feature page should show which items revise it, and a unit test should pin that, so the link survives the R-013 migration and later refactors.

## Current state

- `packages/pm-docs-site/src/components/FeatureSummary.astro` line 25 already computes `revisedBy` inline (`all.filter((candidate) => candidate.revisits === feature.id)`) and renders `Revised by <RefLink>` (line 108). It has done so since R-008/R-009 (2026-11-17).
- The item's Note ("`dependents()` looks only at `dependsOn`") is out of date: `dependents()` in `src/lib/planning.ts` line 339 still handles `Depends on` only, but the page does not depend on it for revisions.
- No test covers "Revised by". Because the logic is inline in an `.astro` file, no unit test can reach it.

## Goals

- A tested library function returns the items whose `Revisits` names an ID.
- `FeatureSummary.astro` uses it, so the feature page and the item popup keep listing "Revised by".

## Non-goals

- Done revisions. `LOG.md` Done lines and the export's `log.done` entries carry no `Revisits`, so a revision drops off the page once it is done. That needs an export format change (schemaVersion 6), so it is parked as `planning/inbox/2026-11-22-1809-done-revisions-lose-revised-by.md` (user decision, 2026-11-22).
- The copied templates in `skills/pm-docs-site/templates/`, which already list "Revised by" and are frozen (`STRATEGY.md` Not doing).

## Approaches

- **A. Extract `revisers(all, id)` beside `dependents()` and unit-test it (chosen).** This is the smallest change that makes the behaviour testable, and it matches how `dependents()` and `adrsOf()` are already factored.
- B. Widen `dependents()` to include revisions. Rejected: the page labels the two differently ("Needed by" against "Revised by"), so callers would have to split the result again.
- C. Test only the built HTML (`build.test.ts`). Rejected: it is slower, and the Done when asks for a unit test.

## Design

- `src/lib/planning.ts`: add `export function revisers(all: Feature[], id: string): Feature[]`, documented as ``The items whose `Revisits` names `id`.``, which returns `all.filter((feature) => feature.revisits === id)` in `features()` order.
- `src/components/FeatureSummary.astro`: import `revisers` and replace the inline filter with `const revisedBy = revisers(all, feature.id);`. The rendering is unchanged.
- `test/planning.test.ts`: test that, with the fixture, `revisers(features(planning), 'R-025')` returns exactly `R-020 README matches the code`; that an ID nobody revises returns `[]`; and that an active `NOW.md` item with `revisits` set is returned for its target.

## Left to the builder

- The test names and where the cases sit in `planning.test.ts`.
- Verification: `just package-test` passes.
