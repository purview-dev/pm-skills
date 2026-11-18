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

### R-017 Docs-site package: in-repo dev hydrates

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: from `packages/pm-docs-site`, the package CLI's `dev test/fixtures/site` serves `/plan/board/?group=owner` with the Board island hydrated, and the dev server logs no `server.fs.allow` error.
- Size: S
- Depends on: R-021
- Status: paused
- Paused checkpoint: 2026-11-18 17:02. Stopped at: design, approach 1 chosen (a `configResolved` plugin appends the package's real directory to the resolved `server.fs.allow` when no entry contains it), spec `docs/superpowers/specs/2026-11-18-docs-site-package-in-repo-dev-design.md` on branch `feat/r-017-docs-site-package-in-repo-dev-hydrates` (commits 4eaf974, 53c8730). Next action: after R-021 Docs-site package: TypeScript source with a build step merges, update the spec's Language line (the helper is a `.ts` source file in `lib/`, emitted by R-021's build) and its blocked decision, get the user's approval, then run writing-plans. Start with: the spec file. Decisions: TypeScript strongly preferred, JavaScript only where the runtime needs it (user, 2026-11-18, while shaping R-021); R-017 waits for R-021 so its helper is TypeScript. Context: Node refuses `.ts` under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), Bun loads it (checked 2026-11-18). Open question: none.
- Note: Vite refuses `packages/pm-docs-site/node_modules/@astrojs/react/dist/client.js` as outside `server.fs.allow`; allowing the package's own folder from the integration hydrated it in R-010's fix-wave experiment. A packed-install consumer is already fixed by R-010.

### R-011 Docs-site package: milestone timeline

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: the Roadmap page shows each milestone with its target, status, and progress from `planning.json`, each linking to its milestone page, and the derivation has unit tests.
- Size: M
- Depends on: R-008
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md

### R-012 Docs-site package: dependency graph

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: the graph page shows one node per open item and one edge per `Depends on` and `Revisits`, each node links to its feature page, and the layout is computed at build time.
- Size: M
- Depends on: R-008
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md

### R-018 Export the Now card's owner and size

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: `bun skills/pm-export/scripts/export.ts write` gives the active item's Now card its roadmap `owner` and `size` instead of `null`, the schema field docs, `planning.example.json`, and the docs-site fixture agree, and `just test` covers it.
- Size: S
- Depends on: none
- Status: ready
- Note: `skills/pm-export/scripts/planning.ts:489` writes `owner: null, size: null`, so every real board shows the active item as "No owner" and the R-010 owner and size filters hide it.

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-019 Docs-site package: consumer-ready for 1.0.0

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: the package home page has no `just docs-preview`; a build without the `docs` option logs no Starlight missing-folder or empty-collection warning; `docsHref` returns no link for a spec or plan path no docs source maps (and honours a source `prefix`); RefLink prints fallback text (the entry title, "No milestone") for an unknown key; `linkify` uses the link scanner's boundaries, so an ID inside a path is not linked; the CLI warns when `--title` or `--planning` is ignored, a `planning.json` holding `null` prints the pm-export hint, `check` loads an `astro.config.ts` on the `engines` Node floor, `dev` has an automated test, and the README names the same-drive requirement on Windows.
- Size: M
- Depends on: R-021
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Folds five inbox files from the R-008 and R-009 final reviews (CLI gaps, consumer text, dead doc links, RefLink fallbacks, IDs linked inside paths). Affects `packages/pm-docs-site/cli.mjs`, `lib/site-options.mjs`, `README.md`, `src/pages/index.astro`, `src/content.config.ts`, `src/lib/planning.ts`, `src/components/RefLink.astro`, `src/lib/references.ts` (the `.mjs` files become `.ts` source in R-021 Docs-site package: TypeScript source with a build step). Moved from Next 5 to the top of Later on 2026-11-18 when R-021 took the top of Next.

### R-013 Docs-site package: publish and migrate

- Serves: V4
- Milestone: M1
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns the released version; `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore` and `just docs-check` passes; two builds from the same `planning.json` and lockfile give byte-identical HTML; and a scratch export at schemaVersion 4 fails the build until the package's range includes it.
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014, R-019
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major.

### R-020 Docs-site package: rich demo planning fixture

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: a synthetic, schema-valid `planning.json` in the package's fixture site fills every view (at least 3 milestones with targets, `Depends on` and `Revisits` edges, risks in all three RAG states, inbox files, briefs, Done and Dropped log lines, an active Now item), `bun skills/pm-export/scripts/export.ts validate` passes on it, and the fixture site's build and browser tests render every page with content.
- Size: M
- Depends on: none
- Status: ready

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
