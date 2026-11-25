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

### R-050 ADR relative images render unresolved

- Serves: V4
- Owner: agent
- Done when: an ADR section with `![a](x.png)` builds to an ADR page whose `img` has a resolved `src`, a test in `packages/pm-docs-site/test/` covers it, and `just package-test` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-25 review (bug, minor; inbox 2026-11-25-0931, R-040 execute). An ADR section with a relative image (`![a](x.png)`) renders as `<img __ASTRO_IMAGE_="{...}">` on the ADR page: the loader's renderMarkdown leaves an image placeholder that only Astro's render() resolves, and the page prints the HTML with set:html, so the image never shows. Remote image URLs render as plain img tags. Reproduction: add `![a](x.png)` to an ADR section, build the docs site, and open the ADR page: the img tag has no src, every time (evidence: R-040 links.test.ts build output). Files: `packages/pm-docs-site/src/loaders/adrs.ts`, `packages/pm-docs-site/src/routes/plan/decisions/[id].astro`.

### R-037 Engineering export and docs-site view

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `planning.json` carries the engineering record at `schemaVersion` 6, `pm-export check` passes, and an Engineering view passes `just docs-check`.
- Size: S
- Depends on: R-034, R-013
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- Note: From the 2026-11-25 review (inbox 2026-11-22-1809, R-025 design): done revisions lose their Revised by link. A feature page lists "Revised by" only while the revising item is open. `LOG.md` Done lines and the export's `log.done` entries carry no `Revisits`, so `features()` in `packages/pm-docs-site/src/lib/planning.ts` (line 284) gives done items `revisits: null`, and the link disappears once the revision closes. A fix adds `Revisits` to the Done line, the exporter, the schema (schemaVersion 6, which pairs with this item), the pm-lint rule, and the site.

### R-055 Engineering lint and skill review minors

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: each of the nine findings in this Note is fixed or has a one-line won't-fix reason in the item's plan, the `lint.test.ts` drift test compares rule text as well as IDs, the Challenge protocol's "applies in" list names `pm-engineering`, and `just lint-check` passes.
- Size: S
- Depends on: R-034
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- Note: From the 2026-11-25 review (inbox 2026-11-24-2345, R-034 execute, final review). Item 8 is a managed-section change. (1) `fixStructure` cannot sort Principles while one heading has no EP ID (comparator returns 0, not transitive); `skills/pm-lint/scripts/structure.ts`. (2) `rules.md` lists the 8-word principle title under the error `engineering/principle`, but the code emits the warning `title/length`, whose description names only inbox files and risks (`rules.ts`, `rules.md`). (3) `rules.ts` and `rules.md` wording differs for `engineering/technology`, `engineering/principle`, and `engineering/removed`; the drift test compares IDs only. (4) A Technology heading shaped `### EP-001 Foo` is keyed as `Foo`, giving a false duplicate with `### Foo`. (5) `Decision: None` (capital N) is an error; other files accept `none` in any case. (6) `localeCompare` without a locale makes `engineering/order` depend on the host locale for non-ASCII names. (7) The `writes ENGINEERING.md on a fresh install` test proves only that the template exists, not `pm-init`'s file table row. (8) The Challenge protocol's "applies in" list in the managed section omits `pm-engineering` (add). (9) `pm-engineering` step 1 follows `superseded by` one step only; a superseded successor is recommended unchecked.

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

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

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
- Note: From the 2026-11-22 review; review minors in `packages/pm-docs-site` (inbox 2026-11-18-1222, 2026-11-20-1844 x3). R-010 board: (1) the 3s reveal of a pending board also fires on a slow but successful hydration; document it in `components.css` and the `useBoardUrlState.ts` header, or tune it. (2) The pending mark is also set on `/plan/roadmap/?owner=...`; scope it to the Board page. (3) `useBoardUrlState` `replaceState` drops non-board query parameters and `history.state`. (4) The lane header is a plain `div`; use an `h3` or `role="heading"`. (5) Before hydration, `aria-expanded` is `true` on columns the pre-paint script already collapsed. (6) The card list is serialised into the island's `props` beside the rendered HTML, roughly doubling the Board page. (7) A collapsed column's vertical title stretches the shared header row. (8) `kanban.css` duplicates the Astro cards' scoped styles and keeps dead `.k-item:focus-visible` and `cursor: grab`; its header comment lists only some changes. (9) `board.ts`: repeated `(X as string[]).includes` casts; `lanes()` branches repeat their tail; `lanes(..., 'none')` returns the input array. (10) `board-data.ts` casts loose owner strings to `Owner | null`; no fixture Done entry with a null `id`; `tagHref` never asserted. (11) `integration.test.ts` asserts the integration names two ways. (12) `install.test.ts` uses a 60s `afterAll` timeout for slow Windows `rmSync`. (13) The `dev` Playwright project adds about 25s per browser run and leaves one temp folder per machine; the optimizeDeps guard is untested under Yarn PnP. R-028: (14) `test/island-imports.test.ts` scans only `.ts` and `.tsx` under `src/components`, so an `.astro` client `<script>` that value-imports a server-only lib is not caught. (15) `start()` in `src/scripts/plan.ts` adds `pointerdown`, `pointerup`, and `click` listeners on `document` each run, so they stack under view transitions. (16) `test/browser/board.browser.ts` test "a localStorage that throws leaves the Board usable" pins Starlight theme-script error counts per `<starlight-theme-select>`; a Starlight upgrade fails it with no fault in the package; loosen it or report the unguarded `localStorage` read upstream. R-031 (inbox 2026-11-21-1205): (17) `relativeImports` in `test/helpers.ts` over-matches `foo.import('./x')`, `Array.from('./x')`, and imports in comments, and misses template-literal dynamic imports (false failures only). (18) In `scripts/check-demo.ts`, a `plan-empty` element's text is cut off at a nested `plan-empty` element. (19) `src/pages/plan/log.astro` labels a known ID whose page is not built with the logged title, not the export's current title, and no test covers that view-off case. R-025 (2026-11-25 review, inbox 2026-11-22-1821): (20) `revisers()` order is not pinned by a test: every assertion in `test/planning.test.ts` (the revisers case) returns one item; give a second item `revisits: 'R-003'` in the populated case and assert both IDs in `features()` order. (21) `src/lib/references.ts` line 188 still checks `other.dependsOn.includes(feature.id) || other.revisits === feature.id` inline; it could reuse `dependents()` and `revisers()`. R-013 (2026-11-25 review, inbox 2026-11-24-2044): (22) `--port=4399` (the `=` form) is not parsed, so it becomes the site folder, and any unknown flag silently becomes a positional argument (`lib/cli-args.ts`). (23) `test/cli.test.ts` "dev --port 4399 serves on 4399" uses a fixed port, which can collide with another process. (24) `skills/pm-docs-site/SKILL.md` Guard checks `bun --version` but not Node 24, so an older Node fails only at verify, after files are written. (25) Two byte-identical Markdown sources on one page (for example two ADR sections with the same text and fence) get the same Pele IDs (`lib/mermaid.ts`). R-040 (2026-11-25 review, inbox 2026-11-25-1008): (26) linkHtml: a raw `<` inside a script or style body (`<script>if (a<b) x='R-012'</script>`) is read as a tag, so the script never closes and the rest of the ADR section is not linked; links and Linked from entries still agree. Fix: while script or style is open, scan to the matching close tag (`src/lib/link-html.ts`). (27) `test/link-html.test.ts`, `test/links.test.ts`, and `test/references.test.ts` lack a final newline, and `skills/pm-export/scripts/export.test.ts` has an `it(` at column 0 near line 122. (28) The Decisions noscript test checks a string only.

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

### R-051 PM sync review minors

- Serves: V2
- Owner: agent
- Done when: each of the five findings in this Note is fixed or has a one-line won't-fix reason in the item's plan, `skills/pm-next/scripts/sync.test.ts` covers a detached HEAD, `core.autocrlf=true`, and a remote name containing `/`, and `just test` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-25 review (inbox 2026-11-22-1933, R-044 execute). Deferred minors from the R-044 final review. (1) `release` reports a pure fast-forward of the PM branch as "Moved 0 PM commits". (2) The carry commit does not consult `PM state commit: ask | never`, and a carry onto a PM branch that is not checked out leaves `planning.json` stale (reported in its line). (3) No test for a detached HEAD or `core.autocrlf=true`. (4) Remote names containing `/` are split wrongly in `options()`, and a PM branch that exists only on the remote makes `rev-list` throw (fails safe). (5) Existing behaviour, not R-044: PM commits made on a pending pull request's branch after its last push are never delivered if the pull request merges without another push.

### R-052 Docs-site package: brief and inbox pages

- Serves: V4
- Owner: agent
- Done when: the package builds one page per brief and one per inbox file, each with links and a Linked from list as item, risk, and ADR pages have, a test in `packages/pm-docs-site/test/` covers both, and `just package-test` and `just docs-check` pass.
- Size: S
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: From the 2026-11-25 review (inbox 2026-11-23-1525, user, R-013 design). The package must contain everything before 1.0.0. A page per brief and per inbox file, as items, risks, and ADRs already have, with links and Linked from (S). Sliced out of R-013 by the user's choice on 2026-11-23; 1.0.0 depends on it.

### R-053 Docs-site package: release 1.0.0

- Serves: V4
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns `1.0.0`, the `pm-docs-site-v1.0.0` tag exists, and the package README holds complete user instructions for every view.
- Size: S
- Depends on: R-052
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: From the 2026-11-25 review (inbox 2026-11-23-1525, user, R-013 design). Not stable until it contains everything, with complete instructions (user, 2026-11-23). Release `@purview-dev/pm-docs-site` 1.0.0 once R-013, R-045 Docs-site package: architecture view, and the brief and inbox pages, and research items are done (S, both). This replaces the brief's 2026-11-18 answer that R-013 releases 1.0.0; R-013 publishes 0.1.0-pre.4 instead. The research reports item is being shaped (inbox 2026-11-23-1525-docs-site-package-research.md); add its ID to `Depends on` when pm-shape creates it.

### R-054 Git subprocess tests stable under load

- Serves: V4
- Owner: agent
- Done when: `bun test scripts/` and the `skills/pm-lint` and `skills/pm-next/scripts/sync.test.ts` suites pass three runs in a row while `just package-test` runs at the same time, and `just test` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-25 review (inbox 2026-11-24-2045, R-013 execute). During R-013, `bun test scripts/` gave 198 pass and 5 fail while builds and browser tests ran at the same time, and the same suite gave 244 pass and 0 fail on an idle machine. The failing tests were seen in `skills/pm-lint` and `skills/pm-next/scripts/sync.test.ts`, which spawn git subprocesses; they time out or race under load, so a pre-push `just lint-check` can fail without a code change.
