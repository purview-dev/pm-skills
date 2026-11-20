# Docs-site package: rich demo planning fixture

- Status: on roadmap (R-020)
- Origin: R-020
- Updated: 2026-11-20

## Problem

- Nobody can see every docs-site feature in one place. The repository's own site shows only the states its plan is in, and the test fixture is reached only through the tests.
- 2026-11-20 answer (form): a separate demo site folder, checked in, with its own `planning.json`, kept apart from the tests. The user chose it over a browsable test fixture and over a fixture-only change.
- 2026-11-20 answer (scope): all five R-018 re-review tidy-ups stay in R-020, as its `Note` says, in one pass. The user chose this over moving four of them to their own S item.

## Who and evidence

- The user, 2026-11-18 (R-020 `Note`): "This needs a demo site in repo, that shows all of the various features off".
- `docs-site/` renders this repository's own `planning/planning.json`, so it shows only the states this plan happens to be in today. Its views change with the plan, so it cannot be relied on to show every feature.
- `packages/pm-docs-site/test/fixtures/planning.json` (116 lines) is a synthetic export already used by the build and browser tests. It has 2 milestones, neither with a target, 9 risks covering red, amber, and green, 2 inbox files, 2 briefs, 2 Dropped lines, and an active Now item (R-012). `test/fixtures/expected-pages.txt` lists 41 pages built from it.
- So the gaps against R-020's `Done when` are smaller than its wording suggests: a third milestone, milestone targets (the timeline has no dated bars), and an edge into the active node (the R-018 re-review finding). It is not known whether there are `Revisits` edges or a full spread of item states.
- Not covered by any fixture: a way to browse a demo without running the tests (`packages/pm-docs-site/package.json` has `test`, `test:browser`, `build`, and no `demo` script).
- Overlap: the R-020 `Note` also bundles five R-018 re-review tidy-ups (`now.astro` reading two sources, the `pm-board` Now card step, the unused `$defs/itemRef`, the `as unknown as Planning` cast in `graph.test.ts`, the missing edge into the active node). Only the last one is about the fixture. Inbox `2026-11-20-0838-r-023-deferred-review-minors.md` touches the same browser tests.
- Not dropped before (`LOG.md` `## Dropped` has no demo or fixture entry). Not in `Out of scope` or `Not doing`.

## Original idea

Docs-site package: rich demo planning fixture. Done when: a synthetic, schema-valid `planning.json` in the package's fixture site fills every view (at least 3 milestones with targets, `Depends on` and `Revisits` edges, risks in all three RAG states, inbox files, briefs, Done and Dropped log lines, an active Now item), `bun skills/pm-export/scripts/export.ts validate` passes on it, and the fixture site's build and browser tests render every page with content.

## Proposal

- `examples/demo/`: a consumer-shaped site (`package.json`, `astro.config.ts`, `bun.lock`, `.gitignore`, `planning.json`) that uses the local `packages/pm-docs-site`, the way a consumer will once it is published.
- Its `planning.json` is synthetic, passes the schema, and fills every view: at least 3 milestones with targets, `Depends on` and `Revisits` edges (including one into the active node), risks in all three RAG states with closed and removed ones, inbox files, briefs, Done and Dropped log lines, and an active Now item.
- `just demo` (justfile `Docs` group) installs, builds, and serves it. `just package-test` also validates the demo's `planning.json` and builds the demo, failing on any page with no content.
- The package's own test fixture stays small for unit tests, and gains the edge into the active node.
- The other four R-018 re-review tidy-ups, in the same pass: `now.astro` reads owner and size from `now.item` only; `pm-board`'s Now card step says they come from `NOW.md`; the unused `$defs/itemRef` is removed from the export schema (with its example and `schemaVersion` rules); `graph.test.ts` spreads the fixture instead of `as unknown as Planning`.

## Alternatives considered

| Option | Effort | Benefit | Cost |
| --- | --- | --- | --- |
| Do nothing | none | No work. | No place shows every feature; the user's request stays open. |
| Richer test fixture only | S | Closes the fixture gaps (3rd milestone, targets, active-node edge). | Cannot be browsed without running the tests. |
| Fixture plus a serve script | M | One file, browsable. | Every demo edit changes test expectations. |
| **Separate `examples/demo/` checked by `package-test` (recommended, chosen)** | M | A consumer-shaped demo that proves the package works as a consumer will use it, and stays correct because the tests build it. | Two synthetic `planning.json` files to keep on the schema. |

Strongest argument against the chosen option: two synthetic files must both move with every `schemaVersion` change, and `package-test` gets slower by one more site build.

## Challenges and answers

- 2026-11-20. Claim: a separate demo that no test builds breaks unnoticed after a schema or view change, because `scripts/validate.ts` checks only the package fixture. Answer: `just package-test` also validates and builds the demo and fails on an empty page. Reason: the user chose this over making the demo the only fixture and over leaving the demo unchecked.
- 2026-11-20. Claim: a demo inside the package must be left out of its published `files`, and one at the root sits beside `docs-site/` with no clear role. Answer: `examples/demo/`, opened with `just demo`. Reason: the user chose the consumer-shaped location.
- 2026-11-20. Claim: the five R-018 tidy-ups mix package, schema, and skill changes, and the `pm-board` change is a skills change after `v20.0.0` is tagged, so it raises the rules major. Answer: keep all five in R-020. Reason: the user's choice; recorded in `## Problem`.
- Fit: serves V4 and milestone M1 Reproducible docs site, the current focus. No conflict with `Out of scope` or `Not doing`; no earlier drop.
- Cost: delays R-019 Docs-site package: consumer-ready for 1.0.0 (which also waits on R-021) and R-026 pm-checkpoint keeps every item field through switch, push, and pop.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | Two synthetic exports follow `schemaVersion` 4; removing `$defs/itemRef` changes the schema file but not the document format. | `scripts/validate.ts` checks the package fixture; `package-test` validates the demo. Keep `schemaVersion` unless the document shape changes. |
| Security and privacy | none found. The demo data is invented. | |
| Performance | `just package-test` (and its pre-push run) builds one more site; inbox `2026-11-17-1741-pre-push-package-test-cost.md` already notes its cost. | Keep the demo near the items each view needs; one build, no extra browser suite. |
| User experience | `just demo` shows every view with content, for the user and for anyone evaluating the package. | |
| Operations and cost | CI runs the demo build inside `package-test`. A new `examples/` folder needs a markdownlint and `.gitignore` entry for its build output. | Add them in the same change. |
| Maintenance | Fixture changes alter `test/fixtures/expected-pages.txt` and tests naming fixture IDs; the demo needs its own `bun.lock`. | Change them in the same commit. |
| Dependencies | The `pm-board` change raises rules to 21 (`just bump premajor`, then `pm-setup`). R-026 pm-checkpoint keeps every item field also changes skills and will share the rules 21 prerelease line. R-013 (publish) can later point the demo at the published package. | Bump once in this item; R-026 then stays on the 21 prerelease. |
| Reversibility | Demo folder and test data are easy to revert; the rules bump is not reversed once released. | Release 21 only after the line is complete. |

## Done when

- `examples/demo/planning.json` passes `bun skills/pm-export/scripts/export.ts validate examples/demo/planning.json` and holds at least 3 milestones with targets, `Depends on` and `Revisits` edges including one into the active node, risks in red, amber, and green, inbox files, briefs, Done and Dropped log lines, and an active Now item.
- `just demo` builds `examples/demo/` against the local `packages/pm-docs-site` and serves it at <http://localhost:4321>.
- `just package-test` validates and builds `examples/demo/` and fails when any built page under `plan/` has no item, milestone, risk, or log content.
- `packages/pm-docs-site/src/routes/plan/now.astro` reads the active item's owner and size from `now.item` only; `skills/pm-board/SKILL.md`'s Now card step says they come from `NOW.md`; `$defs/itemRef` is gone from the export schema; `graph.test.ts` has no `as unknown as Planning`; the package fixture has an edge into the active node.
- `just lint-check` passes.

## Size and slicing

- Size M, one item. Not sliced: the tidy-ups are each a few lines, and the user chose one pass.

## Open questions

- none

## Decision

- 2026-11-20 Build it now. R-020 keeps its ID and place at Next 1, with this brief and the Done when above. Why: it serves the M1 focus, and the user chose to build it now over adding it to Next or Later.
