# Docs site as a versioned package

- Status: on roadmap (R-013)
- Origin: user request
- Updated: 2026-11-20

## Problem

- The docs site is chaotic to maintain and builds non-deterministically: each consumer carries its own copy of the templates, resolves its own package versions, and any template change forces a rules-major bump on every consumer.

## Who and evidence

- Who: every consumer that runs `pm-docs-site`, and this repository's maintainer, who keeps the templates, `docs-site/`, and `scripts/validate.ts` in step.
- Copies: `skills/pm-docs-site/templates/` holds about 40 files that `scripts/site.ts` renders into each site; `docs-site/` holds 38 tracked files, kept equal by `site.ts check` and `--keep`.
- Versions: `scaffold` step 5 runs `bun add astro @astrojs/starlight` and `upgrade` step 4 runs `bun update --latest`, so two sites built on different days get different Astro and Starlight versions, plus a hand-kept `typescript@6` pin.
- Values: `SITE_TITLE`, `SITE_DESCRIPTION`, and `SITE_ROOT` are derived by the agent from the README and folders (`pm-docs-site` Placeholders), so they vary between runs.
- Coupling: templates live under `skills/**`, and AGENTS.md requires a rules-marker bump for any `skills/**` change, so a CSS tweak asks every consumer to run `pm-setup`.
- Testability: `{{PLACEHOLDER}}` makes the templates invalid TypeScript in place; modules this site does not use (`architecture`, `aspire`) are verified only by rendering into a scratch repository; `SCHEMA_VERSION` is checked in four places by `scripts/validate.ts`.
- Linking: `features/[id].astro` already links milestone, dependencies, dependants, revisions, brief, and risks; `board.astro`, `roadmap.astro`, and `components/lib/KanbanItemCard.astro` contain no `href`, so board cards and roadmap rows link nowhere.
- Overlap: R-002 Check the docs-site Board at three widths, R-004 Verify the aspire module against a real AppHost, R-005 Rehearse a schemaVersion bump through the docs site, and R-007 Docs-site extension pages all target the current template design. R-007's pages (now, inbox, briefs, strategy) already exist in `templates/site/src/pages/plan/`.
- 2026-11-19 R-019 re-slice: the 2026-11-19 review merged four Notes into R-019 (the empty `No milestone` card on `src/routes/plan/milestones/index.astro`, the R-009 popup and board accessibility, the R-011 timeline follow-ups in `src/components/timeline/Timeline.tsx`, and the R-021 build hardening), none of which its `Done when` checks. Its `dev` check already holds (`packages/pm-docs-site/test/browser/dev.browser.ts`, from R-017); the rest still fails (`src/pages/index.astro:129` names `just docs-preview`, the README has no same-drive note, `package.json` has no `@types/node`).
- Fit: serves V4. VISION `Out of scope` excludes npm- or pnpm-only toolchains; a Bun-built package published to a registry does not conflict. Constraint: GBP 0 per month, about 4 hours per week. No earlier drop in `LOG.md`.

## Original idea

The documentation site is a bit of a mess.

Brainstorm ways to make it less chaotic, and less non-deterministic.

Perhaps turn the document site into a sub-package - independently versioned - that accepts the paths for planning.json / markdown.

Include best-in-class kanban/ roadmap/ components and views - with backlinking. So board items link to their project page etc.

## Proposal

- `packages/pm-docs-site/`: a Bun workspace package `@purview-dev/pm-docs-site`, versioned and tagged on its own, with exact-pinned Astro, Starlight, and TypeScript and its own lockfile.
- An Astro integration, `pmDocsSite({ planning, docs, views, title })`, that injects every page, plus a CLI (`pm-docs-site dev | build | check`) that runs it with no consumer config file.
- Inputs: `planning.json` for all plan data, reading a declared range of `schemaVersion`s; Markdown paths for repository docs only.
- Views: today's pages, with every item, milestone, risk, brief, and inbox reference linked and a backlinks section on each page; board filters (owner, milestone, size, RAG) and swimlanes; a milestone timeline; a dependency graph laid out at build time.
- `pm-docs-site` rewritten around the package; `docs-site/` becomes a three-file consumer; the `aspire` module stays in the skill and runs the CLI.

## Alternatives considered

| Option | Effort | Main benefit | Main cost |
| --- | --- | --- | --- |
| Do nothing | none | No new release line or registry | Drift, version spread, and rules bumps for template changes continue |
| Smallest: tidy templates in place (runtime config instead of placeholders, pinned versions, lockfile, templates out of the rules bump) | M | Fixes the version spread, value variance, and testability | Consumers still carry about 40 copied files; throwaway once a package exists |
| Full idea: `@purview-dev/pm-docs-site`, an Astro integration plus a thin CLI, published to npm, with linked board, roadmap, timeline, and dependency views (recommended) | L | Consumer site is three files; one pinned build; release independent of the rules; components tested once in this repo | Publishing pipeline and npm token; consumers lose file-level edits; one-time migration |
| CLI only, Astro project hidden inside the package | M | Zero consumer files | No extension path short of a fork; Starlight overrides unavailable |

Recommended: the full idea, sliced. Strongest argument against: at about 4 hours per week, an L item with a new release line delays every item in Next by several weeks, and the four overlapping docs-site items (R-002, R-004, R-005, R-007) show the current design has not been finished, let alone outgrown.

## Challenges and answers

- 2026-11-17 Outcome. Answer: all four — the consumer site is at most three files; the same `planning.json` and lockfile build identical HTML; a template change ships as a package release, not a rules bump; every ID on every view links to its page, and each page links back.
- 2026-11-17 Registry. Answer: npm, public `@purview-dev` scope. Reason: free for public packages and installed directly by `bun add`; JSR rejected because Astro integrations from JSR are uncommon.
- 2026-11-17 Start. Answer: straight to the package. Reason: tidying the templates first would rework them twice.
- 2026-11-17 Views. Answer: all four — linked cards everywhere with backlinks, board filters and swimlanes, a roadmap timeline, and a dependency graph. All read-only.
- 2026-11-17 Overlap: R-007's pages already exist in `templates/site/src/pages/plan/`; R-002 and R-005 target the template design this replaces. Answer: drop R-007 as built; fold R-002's three-width Board check and R-005's schemaVersion rehearsal into the slices' `Done when`, and drop both items.
- 2026-11-17 Aspire: `DocsSiteKit.cs` is C# and cannot ship in an npm package. Answer: keep `templates/aspire/` in the skill; its resource runs the package's CLI. R-004 stays.
- 2026-11-17 Inputs: parsing PM Markdown in the site would duplicate `skills/pm-export/scripts/planning.ts`. Answer: plan data only from `planning.json`; Markdown paths only for repository docs (repo-docs). A stale export is reported and fixed with `pm-export`.
- 2026-11-17 Slicing: L at about 4 hours per week. Answer: everything in the first release. The work is still sliced into M items, but nothing is published until the last slice, so the first public version has every view.
- 2026-11-18 Publishing before slice 6. Evidence: the publish workflow was built outside the slices (PRs #25, #26, #27: `.github/workflows/publish-pm-docs-site.yml`, following purview-dev/astroc4); `0.1.0-pre.1` was published by hand on 2026-11-18 under the `prerelease` dist-tag to create the package for npm trusted publishing, and the workflow tagged it `pm-docs-site-v0.1.0-pre.1`. npm's placeholder `0.0.0-stage` is deprecated. The package was validated by building proj-infosec-scp-review's real `planning.json` (173 pages). This overrides the slicing answer above: a prerelease without R-010, R-011, and R-012 is public, and `0.1.0-pre.1` can never be reused. Answer: the user chose to publish it (2026-11-18).
- 2026-11-18 Release cadence for R-010, R-011, R-012: a prerelease per slice would exercise the pipeline and let consumers test each slice. Answer: hold until R-013. Reason: the next public version has every view, as first intended; the slices change the package without bumping its version, and the publish workflow skips the tagged `0.1.0-pre.1` (REL002).
- 2026-11-18 R-014's `Done when` asks for an `NPM_TOKEN` secret, which trusted publishing replaced; the scope, the package, and the trusted publisher (publish, stage publish, manage dist-tags) exist. Answer: close R-014 as done, with its `Done when` restated as: the `@purview-dev` scope exists, `0.1.0-pre.1` is published, and the trusted publisher for `publish-pm-docs-site.yml` is configured.
- 2026-11-18 R-013's publish workflow is already built (PRs #25 to #27). Answer: R-013 releases stable `1.0.0` once the migration is verified. Reason: it marks the integration options as a stable API; a later breaking option change needs `2.0.0`. R-013 narrows to the migration, the rules major bump, and that release.
- 2026-11-19 R-019 Docs-site package: consumer-ready for 1.0.0 outgrew size M: four Notes merged in the 2026-11-19 review are not in its `Done when`. Answer: three slices. R-019 keeps consumer text and CLI; R-027 Docs-site package: build hardening (S) takes the R-021 review fixes; R-028 Docs-site package: accessible board, popup, and timeline (M) takes the accessibility, timeline, and empty-card fixes and depends on R-020 Docs-site package: rich demo planning fixture for the planned-milestone tests. R-019's `dev` check is dropped from its `Done when` because `test/browser/dev.browser.ts` (R-017) already passes it.
- 2026-11-19 Should the accessibility slice block `1.0.0`? Against: about 4 hours per week, so it delays R-013 by about one M item. Answer: yes, R-013 depends on all three slices. Reason: `1.0.0` is the first stable public version.
- 2026-11-19 Placement: Next is full (5/5). Answer: R-019 stays in Next; R-027 and R-028 go to the top of Later under M1, above R-013.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | Existing sites hold rendered templates and a `pm-docs-site.json` manifest; they move to a dependency and a config file | `pm-docs-site upgrade` migrates: maps manifest `values` and `views` to integration options, deletes template-owned files, keeps site-owned ones |
| Security and privacy | Consumers run published code at build time | 2026-11-18: npm trusted publishing (OIDC) from `publish-pm-docs-site.yml` in the `npm` environment, limited to `main`; no npm token exists, and `scripts/workflows.test.ts` fails a PR that adds one; provenance on every CI publish; exact-pinned dependencies; the site stays static and local, reading only `planning.json` and the docs paths given |
| Performance | Board filters, timeline, and dependency graph add client JavaScript; graph layout on large roadmaps | Render static HTML first and enhance with small islands; lay out the graph at build time, not in the browser |
| User experience | Consumers lose file-level edits; every ID becomes a link | Options and Starlight component overrides for customisation; a link checker in the package tests |
| Operations and cost | A second release line, tags `pm-docs-site-v<version>`, and a publish workflow; npm public scope is free (GBP 0 constraint holds) | `scripts/check-version.ts` exempts `packages/**` from the rules bump and, since 2026-11-18, fails a package version that goes back, is not SemVer, or is already tagged; the publish workflow applies REL001 to REL003 and skips a tagged version |
| Maintenance | Templates, `site.ts`, the placeholder table, and four `SCHEMA_VERSION` checks go; the package has its own tests and CI | `scripts/validate.ts` checks the skill's supported package range against the package's supported schemaVersions instead |
| Dependencies | Drops R-007 (built), R-002 and R-005 (folded in); R-004 keeps the aspire module in the skill; slices depend on slice 1 | Recorded under Size and slicing |
| Reversibility | Until publish (slice 6) everything is in-repo and revertible; once published, npm versions cannot be reused | Publish only from the last slice, starting at `0.x` pre-release until the migration is verified. 2026-11-18: `0.1.0-pre.1` is published, so publishing is no longer reversible; no further version is published until R-013, which releases `1.0.0` once the migration is verified |

The skill change is a rules change: Non-interruption rule 9 and `pm-docs-site` build modes are rewritten, so slice 6 bumps the rules major.

## Done when

- `docs-site/` contains only `package.json`, `astro.config.mjs`, and `bun.lock` (plus `.gitignore`), and `just docs-check` passes.
- Two `bun run build` runs from the same `planning.json` and lockfile produce byte-identical `dist/` HTML.
- A change under `packages/pm-docs-site/` passes `just version-check` without a rules-marker bump.
- The package's link test finds no item, milestone, risk, or brief ID on any built page without a link, and no internal link that 404s.
- `npm view @purview-dev/pm-docs-site version` returns the released version (`1.0.0`, from R-013).

## Size and slicing

L, sliced into six M items and one S user task, in dependency order. Nothing is published before slice 6. 2026-11-18: `0.1.0-pre.1` was published early to set up trusted publishing; slices 3 to 5 do not bump the package version, and slice 6 releases `1.0.0`. The publish workflow in slice 6 is done (PRs #25 to #27), and slice 7 is done with the restated `Done when`.

1. **Docs-site package: skeleton at parity** (M). `packages/pm-docs-site/` with the integration, the CLI, pinned dependencies, a supported `schemaVersion` range, today's views, and tests on the existing fixtures; `check-version.ts` exempts `packages/**`. Done when: `bun test` passes in the package, and building the planning fixture with the CLI renders every page that `docs-site/` renders today.
2. **Docs-site package: backlinks everywhere** (M, depends on 1). Board cards, roadmap rows, log, risks, inbox, and briefs link every ID; each item, milestone, and risk page lists what links to it. Done when: the link test passes on the fixture build, and a browser test shows the Board's five columns in one row at 1440, 1024, and 700px (from R-002).
3. **Docs-site package: board filters and swimlanes** (M, depends on 1). Done when: filtering the fixture Board by owner, milestone, size, and RAG shows only matching cards, and grouping by milestone and by owner renders one lane per group, in browser tests.
4. **Docs-site package: milestone timeline** (M, depends on 1). Done when: the Roadmap page shows each milestone with its target, status, and progress from `planning.json`, each linking to its milestone page, in a unit-tested derivation.
5. **Docs-site package: dependency graph** (M, depends on 1). Done when: the graph page shows one node per open item and one edge per `Depends on` and `Revisits`, each node linking to its feature page, laid out at build time.
6. **Docs-site package: publish and migrate** (M, both, depends on 2 to 5 and the user task). Publish workflow with provenance; `pm-docs-site` rewritten (scaffold adds the dependency, check compares versions, upgrade migrates a template site); `docs-site/` moved onto the package; Non-interruption rule 9 rewritten and the rules major bumped; `validate.ts` and the `pm-help` row updated. Done when: the brief's `Done when` checks pass, and a scratch export at `schemaVersion` 4 fails the build until the package's range includes it (from R-005).
7. **Create the npm @purview-dev scope and token** (S, user). Done when: the `@purview-dev` scope exists on npm, and an `NPM_TOKEN` secret is set on the repository.

2026-11-19 re-slice of the consumer-ready work before slice 6, in dependency order:

- **R-019 Docs-site package: consumer-ready for 1.0.0** (M, agent): consumer text and CLI. Done when: its roadmap `Done when`, without the `dev` check.
- **R-027 Docs-site package: build hardening** (S, agent). Done when: `@types/node` is in the package's `devDependencies`, `scripts/build.ts` and the install-test guard walk `dist/` recursively, `scripts/check-exports.ts` accepts `.mjs`/`.cjs` entry points and rejects a `.d.ts` outside a `types` condition, the tarball's type imports resolve, and the README and wiki fence `astro.config.ts` as `ts` with no stale version.
- **R-028 Docs-site package: accessible board, popup, and timeline** (M, agent, depends on R-020). Done when: browser tests show the popup trigger with `aria-haspopup="dialog"`, a backdrop click closing the dialog, one tab stop per card, collapse toggles hidden without JavaScript, zoom buttons keeping focus at their limits, line-mode wheel scrolling scaled, the zoom anchor holding across two zoom changes before one render, the timeline's planned and other markers rendered, the Now item de-duplicated when it is also logged or queued, and no `No milestone` card on the Milestones page without an open unassigned item.

Proposed: Serves V4. Milestone: none (no milestones exist until R-001 Set milestones and focus). Owner: agent, except slices 6 (both) and 7 (user).

## Open questions

- none

## Decision

- 2026-11-17 Add to Next. R-008 Docs-site package: skeleton at parity and R-014 Create the npm @purview-dev scope and token at the bottom of Next; R-009 to R-013 at the bottom of Later in dependency order. R-002, R-005, and R-007 dropped (folded in or already built). Reason: the problems are evidenced in the current templates and scripts, and the user chose the full package with every view in the first release.
- 2026-11-17 R-008 Docs-site package: skeleton at parity done on branch feat/r-008-docs-site-package-skeleton. Scope agreed during it: parity is the same page set, not the same content (page content may change as the package improves); a pack-and-install test proves an installed consumer builds. Design: docs/superpowers/specs/2026-11-17-docs-site-package-skeleton-design.md.
- 2026-11-17 R-009 Docs-site package: backlinks everywhere done on branch feat/r-009-docs-site-package-backlinks. Scope agreed during it: Board and Roadmap cards open a detail popup whose `Open page` link (and ctrl-click) reaches the item page; any Board column collapses and is remembered in localStorage; every page is full width; each open and closed risk has its own page; `Linked from` groups by relation, with index views under `Listed on`. Design: docs/superpowers/specs/2026-11-17-docs-site-package-backlinks-design.md.
- 2026-11-18 Keep the slices on the roadmap as revised. R-010, R-011, and R-012 stay in Later and do not bump the package version; R-013 migrates `docs-site/` and the `pm-docs-site` skill and releases `1.0.0`; R-014 closes with its restated `Done when` (with `pm-item`). Reason: `0.1.0-pre.1` was published early to set up trusted publishing, and the user chose to hold every further release until the views are complete.
- 2026-11-18 R-010 Docs-site package: board filters and swimlanes done on branch feat/r-010-docs-site-package-board-filters-and-swimlanes. Scope agreed during it: every docs-site view is a rich interactive component, so the Board is a server-rendered React island (React, not Preact, so R-011 and R-012 can use React-first libraries), replacing the Performance row's "static HTML first"; new code is TypeScript only; a card's RAG is the worst of the open, mitigating, or accepted risks whose `Affects` names it; filter and group state live in the URL; a filtered link hides the board until the island applies it, with a 3s reveal so it is never blank; the integration pre-bundles `react-dom/client` so `pm-docs-site dev` hydrates on a packed install. Design: docs/superpowers/specs/2026-11-18-docs-site-package-board-filters-design.md.
- 2026-11-18 R-011 Docs-site package: milestone timeline done on branch feat/r-011-docs-site-package-milestone-timeline. Scope agreed during it: the timeline is a sequence strip in strategy order, not a date axis (no milestone has a target); it lays out left to right or top to bottom, kept in the URL as `?layout=vertical`; it scrolls natively and zooms from 50% to 200% by making the cards bigger or smaller (no extra detail), without a new dependency; the Roadmap and Milestones pages count progress the same way (`milestoneSummaries`), and the `No milestone` card and section appear only with an item that is not dropped. Roadmap filters stay parked. Design: docs/superpowers/specs/2026-11-18-docs-site-package-milestone-timeline-design.md.
- 2026-11-19 Re-sliced R-019 Docs-site package: consumer-ready for 1.0.0 into three items: R-019 keeps consumer text and CLI in Next 4; R-027 Docs-site package: build hardening (S) and R-028 Docs-site package: accessible board, popup, and timeline (M, depends on R-020) added at the top of Later under M1; R-013 Docs-site package: publish and migrate now depends on R-019, R-027, and R-028. Reason: four Notes merged in the 2026-11-19 review were not in R-019's `Done when`, and the user chose that `1.0.0` ships accessible.
