# Docs site as a versioned package

- Status: on roadmap (R-008, R-009, R-010, R-011, R-012, R-013, R-014)
- Origin: user request
- Updated: 2026-11-17

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

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | Existing sites hold rendered templates and a `pm-docs-site.json` manifest; they move to a dependency and a config file | `pm-docs-site upgrade` migrates: maps manifest `values` and `views` to integration options, deletes template-owned files, keeps site-owned ones |
| Security and privacy | Consumers run published code at build time; an npm token becomes a repository secret | Publish with npm provenance from GitHub Actions only; exact-pinned dependencies; the site stays static and local, reading only `planning.json` and the docs paths given |
| Performance | Board filters, timeline, and dependency graph add client JavaScript; graph layout on large roadmaps | Render static HTML first and enhance with small islands; lay out the graph at build time, not in the browser |
| User experience | Consumers lose file-level edits; every ID becomes a link | Options and Starlight component overrides for customisation; a link checker in the package tests |
| Operations and cost | A second release line, tags `pm-docs-site-v<version>`, and a publish workflow; npm public scope is free (GBP 0 constraint holds) | `scripts/check-version.ts` exempts `packages/**`; the publish workflow mirrors `release.yml` |
| Maintenance | Templates, `site.ts`, the placeholder table, and four `SCHEMA_VERSION` checks go; the package has its own tests and CI | `scripts/validate.ts` checks the skill's supported package range against the package's supported schemaVersions instead |
| Dependencies | Drops R-007 (built), R-002 and R-005 (folded in); R-004 keeps the aspire module in the skill; slices depend on slice 1 | Recorded under Size and slicing |
| Reversibility | Until publish (slice 6) everything is in-repo and revertible; once published, npm versions cannot be reused | Publish only from the last slice, starting at `0.x` pre-release until the migration is verified |

The skill change is a rules change: Non-interruption rule 9 and `pm-docs-site` build modes are rewritten, so slice 6 bumps the rules major.

## Done when

- `docs-site/` contains only `package.json`, `astro.config.mjs`, and `bun.lock` (plus `.gitignore`), and `just docs-check` passes.
- Two `bun run build` runs from the same `planning.json` and lockfile produce byte-identical `dist/` HTML.
- A change under `packages/pm-docs-site/` passes `just version-check` without a rules-marker bump.
- The package's link test finds no item, milestone, risk, or brief ID on any built page without a link, and no internal link that 404s.
- `npm view @purview-dev/pm-docs-site version` returns the released version.

## Size and slicing

L, sliced into six M items and one S user task, in dependency order. Nothing is published before slice 6.

1. **Docs-site package: skeleton at parity** (M). `packages/pm-docs-site/` with the integration, the CLI, pinned dependencies, a supported `schemaVersion` range, today's views, and tests on the existing fixtures; `check-version.ts` exempts `packages/**`. Done when: `bun test` passes in the package, and building the planning fixture with the CLI renders every page that `docs-site/` renders today.
2. **Docs-site package: backlinks everywhere** (M, depends on 1). Board cards, roadmap rows, log, risks, inbox, and briefs link every ID; each item, milestone, and risk page lists what links to it. Done when: the link test passes on the fixture build, and a browser test shows the Board's five columns in one row at 1440, 1024, and 700px (from R-002).
3. **Docs-site package: board filters and swimlanes** (M, depends on 1). Done when: filtering the fixture Board by owner, milestone, size, and RAG shows only matching cards, and grouping by milestone and by owner renders one lane per group, in browser tests.
4. **Docs-site package: milestone timeline** (M, depends on 1). Done when: the Roadmap page shows each milestone with its target, status, and progress from `planning.json`, each linking to its milestone page, in a unit-tested derivation.
5. **Docs-site package: dependency graph** (M, depends on 1). Done when: the graph page shows one node per open item and one edge per `Depends on` and `Revisits`, each node linking to its feature page, laid out at build time.
6. **Docs-site package: publish and migrate** (M, both, depends on 2 to 5 and the user task). Publish workflow with provenance; `pm-docs-site` rewritten (scaffold adds the dependency, check compares versions, upgrade migrates a template site); `docs-site/` moved onto the package; Non-interruption rule 9 rewritten and the rules major bumped; `validate.ts` and the `pm-help` row updated. Done when: the brief's `Done when` checks pass, and a scratch export at `schemaVersion` 4 fails the build until the package's range includes it (from R-005).
7. **Create the npm @purview-dev scope and token** (S, user). Done when: the `@purview-dev` scope exists on npm, and an `NPM_TOKEN` secret is set on the repository.

Proposed: Serves V4. Milestone: none (no milestones exist until R-001 Set milestones and focus). Owner: agent, except slices 6 (both) and 7 (user).

## Open questions

- none

## Decision

- 2026-11-17 Add to Next. R-008 Docs-site package: skeleton at parity and R-014 Create the npm @purview-dev scope and token at the bottom of Next; R-009 to R-013 at the bottom of Later in dependency order. R-002, R-005, and R-007 dropped (folded in or already built). Reason: the problems are evidenced in the current templates and scripts, and the user chose the full package with every view in the first release.
