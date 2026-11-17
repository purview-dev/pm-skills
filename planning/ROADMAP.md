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

### R-014 Create the npm @purview-dev scope and token

- Serves: V4
- Milestone: M1
- Owner: user
- Done when: the `@purview-dev` scope exists on npm, and an `NPM_TOKEN` secret is set on the repository.
- Size: S
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-010 Docs-site package: board filters and swimlanes

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: browser tests show that filtering the fixture Board by owner, milestone, size, and RAG leaves only matching cards, and that grouping by milestone and by owner renders one lane per group.
- Size: M
- Depends on: R-008
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md

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

### R-013 Docs-site package: publish and migrate

- Serves: V4
- Milestone: M1
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns the released version; `docs-site/` holds only `package.json`, `astro.config.mjs`, `bun.lock`, and `.gitignore` and `just docs-check` passes; two builds from the same `planning.json` and lockfile give byte-identical HTML; and a scratch export at schemaVersion 4 fails the build until the package's range includes it.
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major.

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
