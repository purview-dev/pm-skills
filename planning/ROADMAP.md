# Roadmap

<!--
IDs are R-NNN, never reused. A new ID is the highest number in ROADMAP.md,
NOW.md, and LOG.md, plus 1. pm-next takes the first claimable item in Next:
Status ready or paused, Owner agent or both, every Depends on ID done.
Owner user items are done by the user and closed with pm-item done.
Position is the order of the item blocks: Next is the claim order; Later is
grouped by milestone in STRATEGY.md order. Move, add, and insert with
pm-item, pm-board, or pm-roadmap (rules: Roadmap order and edits).
-->

## Next

<!-- Ordered. Maximum is set in config.md. -->

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-035 pm-engineering infer from an existing repository

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: in a scratch repository with `package.json`, `tsconfig.json`, and `AGENTS.md`, `pm-engineering infer` writes an `ENGINEERING.md` citing all three; `pm-init` runs it for an existing repository and `pm-setup` offers it on upgrade.
- Size: M
- Depends on: R-034
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-036 Plan citation and done check

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `pm-next` and `pm-checkpoint` (`stage`) pass the principles and ADRs that apply to the plan handoff; `pm-checkpoint` (`done`) refuses to close on a failing command check and lists failed review checks as a `Note` and an inbox file, shown in a rehearsal report in `planning/research/`; `pm-purview` hands accepted packages to `pm-engineering add`.
- Size: M
- Depends on: R-033, R-034
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-037 Engineering export and docs-site view

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `planning.json` carries the engineering record at `schemaVersion` 6, `pm-export check` passes, and an Engineering view passes `just docs-check`.
- Size: S
- Depends on: R-034, R-013
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-006 Check pm-setup's skill counts in validate

- Serves: V1
- Milestone: M2
- Owner: agent
- Done when: `just validate` fails when the `<n> of 22` counts in `pm-setup` differ from the number of shipped skills.
- Size: S
- Depends on: none
- Status: ready

### R-015 Rehearse a fresh install in a scratch repository

- Serves: V1
- Milestone: M2
- Owner: agent
- Done when: in an empty scratch repository, `npx skills add https://github.com/purview-dev/pm-skills -y` then `pm-setup` reports every pm-* and workflow skill installed, recorded in a report in `planning/research/`.
- Size: S
- Depends on: none
- Status: ready

### R-016 Rehearse the lifecycle guards

- Serves: V2, V3
- Milestone: M3
- Owner: both
- Done when: a report in `planning/research/` shows `pm-resume` naming the active item, stage, and next action after `/clear`, and `pm-shape` parking an idea instead of running during an active workflow.
- Size: M
- Depends on: none
- Status: ready

### R-024 Self-contained aspire module test example

- Serves: V4
- Owner: agent
- Done when: the TUnit example in `skills/pm-docs-site/templates/aspire/MODULE.md` defines `BuildAsync` and `Named`, includes `using Aspire.Hosting;`, and says when to use the literal `"docs"` instead of `Resources.DocsSite`.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-004 execute (2026-11-17): verifying R-004 needed `using Aspire.Hosting;` for `DistributedApplicationExecutionContext` and the literal `"docs"`, because a test project reaches `Resources.DocsSite` only when the constant is visible to it. Spec: `docs/superpowers/specs/2026-11-17-aspire-module-verification.md`.

### R-030 Pre-push runs fast checks only

- Serves: V4
- Owner: agent
- Done when: the lefthook pre-push hook no longer runs `package-test`, finishes offline in under 15 seconds, and CI still runs `just package-test` on every pull request.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review (question, decided: CI-only package-test). R-008 added `package-test` to `just lint-check`, which the lefthook pre-push hook runs. It adds two Astro builds, a pack, and a networked `bun install` to every push: about 40 to 60 seconds, and a push fails offline. Files: `justfile`, `.config/lefthook.yml`.

### R-032 pm-checkpoint and pm-lint Note follow-ups

- Serves: V2
- Owner: agent
- Done when: `pm-checkpoint` `switch` restores `Note` from the claim commit when `NOW.md` lacks one, the `now/fields` rule text says "an optional Note after Revisits", a `lint.test.ts` case fails a `Note` without the five item fields, and `just lint-check` passes.
- Size: M
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review; R-026 final-review minors, a rules bump. (1) `skills/pm-lint/scripts/structure.ts` comment on `NOW_NOTE` says "rules 22"; the change shipped on rules 21 (21.0.0-pre.2). (2) The R-026 spec (design item 6) and plan (Task 3) still describe `just bump major` to rules 22; add a superseded line. (3) The `now/fields` rule text in `rules.md`, `rules.ts`, and the `checkNow` message says "and then an optional Note", readable as after `Started`; say "an optional Note after Revisits". (4) `pm-checkpoint` `switch` recovery runs only when `Serves`/`Size` are missing and never restores `Note`, so an item claimed under 21.0.0-pre.1 switches back without it; also restore `Note` from the claim-commit block. (5) `pm-next` steps 3 and 5 can each hold a `Note:`, but step 7 joins "a held note" in the singular; state the order for two. (6) A blank `- Note:` on an item: say "a non-empty Note" in `pm-next` step 7 and `pm-rejoin` step 3. (7) No test pins that a `Note` without the five item fields fails `now/fields`. From the 2026-11-22 review (inbox 2026-11-22-1425): (8) `expandTargets` in `skills/pm-lint/scripts/lint.ts` (added in `981977a`) expands a folder argument one level only, so `check planning/` misses `inbox/`, `briefs/`, and `decisions/` files; recurse, and test it. (9) No test covers `--staged` with a folder argument. (10) Cosmetic: ADR-001's Alternatives row says ADRs are "exported" (quoted from the spec), and the `pm-init` template row keeps "(new project only)" inside the code span because `scripts/validate.ts` parses it.

### R-042 Docs-site package: deferred review minors

- Serves: V4
- Owner: agent
- Done when: each finding listed in this Note is fixed or has a one-line won't-fix reason in the item's plan, `.astro` client scripts are covered by the island import guard, `start()` in `src/scripts/plan.ts` registers its listeners once per document, and `just package-test` passes.
- Size: M
- Depends on: none
- Status: ready
- Note: From the 2026-11-22 review; review minors in `packages/pm-docs-site` (inbox 2026-11-18-1222, 2026-11-20-1844 x3). R-010 board: (1) the 3s reveal of a pending board also fires on a slow but successful hydration; document it in `components.css` and the `useBoardUrlState.ts` header, or tune it. (2) The pending mark is also set on `/plan/roadmap/?owner=...`; scope it to the Board page. (3) `useBoardUrlState` `replaceState` drops non-board query parameters and `history.state`. (4) The lane header is a plain `div`; use an `h3` or `role="heading"`. (5) Before hydration, `aria-expanded` is `true` on columns the pre-paint script already collapsed. (6) The card list is serialised into the island's `props` beside the rendered HTML, roughly doubling the Board page. (7) A collapsed column's vertical title stretches the shared header row. (8) `kanban.css` duplicates the Astro cards' scoped styles and keeps dead `.k-item:focus-visible` and `cursor: grab`; its header comment lists only some changes. (9) `board.ts`: repeated `(X as string[]).includes` casts; `lanes()` branches repeat their tail; `lanes(..., 'none')` returns the input array. (10) `board-data.ts` casts loose owner strings to `Owner | null`; no fixture Done entry with a null `id`; `tagHref` never asserted. (11) `integration.test.ts` asserts the integration names two ways. (12) `install.test.ts` uses a 60s `afterAll` timeout for slow Windows `rmSync`. (13) The `dev` Playwright project adds about 25s per browser run and leaves one temp folder per machine; the optimizeDeps guard is untested under Yarn PnP. R-028: (14) `test/island-imports.test.ts` scans only `.ts` and `.tsx` under `src/components`, so an `.astro` client `<script>` that value-imports a server-only lib is not caught. (15) `start()` in `src/scripts/plan.ts` adds `pointerdown`, `pointerup`, and `click` listeners on `document` each run, so they stack under view transitions. (16) `test/browser/board.browser.ts` test "a localStorage that throws leaves the Board usable" pins Starlight theme-script error counts per `<starlight-theme-select>`; a Starlight upgrade fails it with no fault in the package; loosen it or report the unguarded `localStorage` read upstream. R-031 (inbox 2026-11-21-1205): (17) `relativeImports` in `test/helpers.ts` over-matches `foo.import('./x')`, `Array.from('./x')`, and imports in comments, and misses template-literal dynamic imports (false failures only). (18) In `scripts/check-demo.ts`, a `plan-empty` element's text is cut off at a nested `plan-empty` element. (19) `src/pages/plan/log.astro` labels a known ID whose page is not built with the logged title, not the export's current title, and no test covers that view-off case.

### R-046 Upgrade, format, and git rules move to references

- Serves: V2
- Owner: agent
- Done when: the managed section holds no `Version N` paragraphs, no file-format blocks, and no Committing PM state, Completion rides the branch, Feature branches, PM sync, Pull latest, or PM base bodies; `skills/pm-setup/references/upgrade.md`, `formats.md`, and `git.md` hold them; every `SKILL.md` that cites one names its file; `just validate` fails when a cited reference file is missing; the R-043 report's `always` line is at least 6,500 tokens lower than its baseline.
- Size: M
- Depends on: R-043
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 2 of 5 from pm-shape 2026-11-24. A rules change; may stay on rules 21 while `main` is the unreleased `21.0.0-pre.N` line.

### R-047 Core rules file and a 15 KB managed section

- Serves: V2
- Owner: agent
- Done when: the managed section is 15,000 characters or less and holds the skill table, the Non-interruption rules, Read before deciding, and a pointer index; `skills/pm-setup/references/rules.md` holds the remaining shared rules and each PM skill reads it once per session; `just validate` fails above 15,000 characters; `pm-help` diagnose reports a missing reference file.
- Size: M
- Depends on: R-046
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 3 of 5 from pm-shape 2026-11-24. A rules change.

### R-048 Repository AGENTS.md top part into dedicated files

- Serves: V2
- Owner: agent
- Done when: this repository's top part of `AGENTS.md` (before the managed section) is 3,000 characters or less and indexes the dedicated files that now hold its content; `just lint-check` and `just validate` pass.
- Size: S
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 4 of 5 from pm-shape 2026-11-24. No `skills/` change, so no rules bump. The target folder is decided in design.

### R-049 Trim the largest SKILL.md files

- Serves: V2
- Owner: agent
- Done when: `pm-export`, `pm-docs-site`, `pm-setup`, `pm-help`, and `pm-checkpoint` `SKILL.md` are each at least 30% smaller, with the moved modes in their `references/`; the R-043 report's `claim` and `checkpoint` lines are lower than after R-047; `just lint-check` passes.
- Size: M
- Depends on: R-047
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 5 of 5 from pm-shape 2026-11-24. A rules change. Conflicts with R-041 and R-032 edits to the same skills.
