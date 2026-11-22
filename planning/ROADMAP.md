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

### R-025 Docs-site package: feature pages list revisions

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: a feature page for an item that another item's `Revisits` names lists that item under "Revised by", and a unit test in `packages/pm-docs-site` covers it.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-012 design (2026-11-19): `dependents()` in `packages/pm-docs-site/src/lib/planning.ts` looks only at `dependsOn`, so a feature page lists its dependants but not the items whose `Revisits` names it; the R-012 graph already draws Revisits edges.

### R-013 Docs-site package: publish and migrate

- Serves: V4
- Milestone: M1
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns the released version; `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore` and `just docs-check` passes; two builds from the same `planning.json` and lockfile give byte-identical HTML; and a scratch export at schemaVersion 6 fails the build until the package's range includes it.
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014, R-019, R-027, R-028, R-029, R-031
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major. From the 2026-11-22 review: (1) Done when moved to schemaVersion 6, because R-038 moved the export to 5 (inbox 2026-11-22-1501). (2) R-028's accessibility fixes (popup trigger, backdrop close, heading levels, card tab stops, collapse toggles, timeline zoom focus) exist only in `packages/pm-docs-site`; confirm the migrated `docs-site/` no longer carries the gaps of `skills/pm-docs-site/templates/`, or port the fixes if R-013 slips (inbox 2026-11-20-1844). (3) `just docs-check` still logs `[WARN] [content] Entry docs → 404 was not found.` from the template site; confirm it is gone after the migration, or give the template the package's fix (Starlight `disable404Route: true` and its own `src/pages/404.astro`; not a draft `404` entry, which prints a draft notice) (inbox 2026-11-21-1035). (4) The brief's Performance ramification ("Render static HTML first and enhance with small islands") is superseded: R-010 design (2026-11-18) chose rich interactive React islands for every view (React over Preact), and its Ramifications omit the React runtime dependency every consumer now gets (inbox 2026-11-18-0911; spec `docs/superpowers/specs/2026-11-18-docs-site-package-board-filters-design.md`).

### R-034 Engineering file and pm-engineering skill

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `pm-engineering add` writes a linted entry to `planning/ENGINEERING.md` (`## Technology` and `## Principles`, each entry citing its `Source`), and the skill is listed in the README, managed-section, `pm-setup`, and `pm-help` tables with `just validate` and `just test` passing.
- Size: M
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-041 ADR skill follow-ups

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `pm-discover` and `pm-revise` write the `Supersedes` Notes line with its `<YYYY-MM-DD>` prefix; `pm-purview` step 6 excludes `check` mode; `pm-checkpoint` (`done`) finds an item's ADRs written in the main worktree; `pm-shape` and `pm-review` reuse a `## For this discussion` legend for an ADR; `pm-checkpoint` (`done`) commits or names captures written mid-workflow instead of stopping; `just lint-check` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-22 review; R-039 final-review minors (inbox 2026-11-22-1632), a rules bump. (1) `pm-discover` and `pm-revise` write `Supersedes ADR-NNN <title> in design.` under an inbox file's `## Notes` without the `<YYYY-MM-DD>` prefix. (2) `pm-purview` in `check` mode, run inside `pm-shape` or `pm-discover`, is not stopped before step 6, whose ADR write contradicts "This skill never runs `pm-adr`" in those skills. (3) `pm-checkpoint` (`done`) looks for the item's ADRs on its branch; a design stage run in a separate worktree writes them in the main worktree (`pm-adr` Guard), so `done` stops with "has no file". (4) `pm-shape` and `pm-review` print `## For this question` for an ADR even when `## For this discussion` lists it. (5) An ADR or inbox file written mid-workflow is uncommitted at `done`, whose guard stops on uncommitted PM state in the item's worktree (predates R-039; applies to `pm-park` too). Spec: `docs/superpowers/specs/2026-11-22-adrs-across-the-pm-skills-design.md`.

### R-040 ADR link and export edge cases

- Serves: V4, V5
- Milestone: M4
- Owner: agent
- Done when: an ADR whose Context holds `_R-012_`, `[R-012](https://x)`, and `![a > R-012](x.png)` builds with matching links and Linked from entries and an intact alt attribute (`test/links.test.ts` passes); an ADR section keeps a `<!-- x -->` inside a code span through `pm-export write`; a file `ADR-004-x.md` headed `# ADR-003` fails the export or exports as ADR-004; the Decisions view's empty-status, no-status, single-category, and no-JavaScript states have tests that pin the chosen behaviour; `just test` and `just package-test` pass.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-22 review; R-038 final-review findings (inbox 2026-11-22-1554, 1555, 1556). (1) Bug, minor: `references()` linkifies an ADR's raw Markdown while the ADR page links the rendered HTML, so `_R-012_` gives a link with no Linked from entry, and `[R-012](url)` or image alt text gives a Linked from entry with no link. `linkHtml` also splits tags on a `>` inside an attribute value, and links IDs inside raw script and style blocks. Fix: build the ADR page's references from the rendered HTML (or have `linkHtml` return the keys it linked), and use the tag pattern `<(?:"[^"]*"|'[^']*'|[^'">])*>`. Files: `packages/pm-docs-site/src/lib/link-html.ts`, `src/lib/references.ts`. (2) Bug, minor: the exporter strips HTML comments everywhere, so an ADR section showing `<!-- pm-skills:start -->` in code loses it, although ADR-002 promises sections verbatim; `parseAdr` takes the ID from the heading before the file name, so a mismatched heading duplicates an ID and the site overwrites one page. Fix: keep comments inside code in ADR sections, and prefer the file-name ID or fail on a duplicate. File: `skills/pm-export/scripts/planning.ts` (a rules bump). (3) Decisions view: turning every status chip off writes `?status=`, which reloads as the default; ADRs with no status ignore the status chips; with one category there is no category chip, so a shared `?category=x` filters invisibly until Clear; without JavaScript the superseded rows cannot be shown. Files: `packages/pm-docs-site/src/lib/decisions.ts`, `src/components/decisions/Decisions.tsx`.

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

### R-043 Per-session context report and upgrade notes move

- Serves: V2
- Owner: agent
- Done when: `bun skills/pm-help/scripts/context.ts --root .` prints one line per session type (`always`, `resume`, `claim`, `checkpoint`, `review`) with estimated tokens and the three largest files; the managed section holds no `Version N` paragraphs and `skills/pm-setup/references/upgrade-notes.md` holds them; the report's `always` line is at least 1,400 tokens lower than before; a `planning/research/` report records the before and after table; `just lint-check` and `just validate` pass.
- Size: M
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: From pm-shape 2026-11-22 (inbox 2026-11-22-1232). A rules bump. Dependency-free estimate (characters / 4), shipped in `pm-help` diagnose rather than a new skill; the `pm-tidy` archive slice is deferred until the report's PM state line recommends it.
