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

### R-019 Docs-site package: consumer-ready for 1.0.0

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: the package home page has no `just docs-preview`; a build without the `docs` option logs no Starlight missing-folder or empty-collection warning; `docsHref` returns no link for a spec or plan path no docs source maps (and honours a source `prefix`); RefLink prints fallback text (the entry title, "No milestone") for an unknown key; `linkify` uses the link scanner's boundaries, so an ID inside a path is not linked; the CLI warns when `--title` or `--planning` is ignored, a `planning.json` holding `null` prints the pm-export hint, `check` loads an `astro.config.ts` on the `engines` Node floor, and the README names the same-drive requirement on Windows.
- Size: M
- Depends on: R-021
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Folds five inbox files from the R-008 and R-009 final reviews (CLI gaps, consumer text, dead doc links, RefLink fallbacks, IDs linked inside paths). Affects `packages/pm-docs-site/lib/cli.ts`, `lib/site-options.ts`, `README.md`, `src/pages/index.astro`, `src/content.config.ts`, `src/lib/planning.ts`, `src/components/RefLink.astro`, `src/lib/references.ts`. 2026-11-19 re-sliced with pm-shape: the `dev` check left the `Done when` (`test/browser/dev.browser.ts` passes it since R-017); the build-hardening Note moved to R-027 Docs-site package: build hardening, and the accessibility, timeline, and empty-card Notes moved to R-028 Docs-site package: accessible board, popup, and timeline.

### R-026 pm-checkpoint keeps every item field through switch, push, and pop

- Serves: V2
- Owner: agent
- Done when: an item claimed with a `Note` and then moved with `pm-checkpoint` `switch`, or `push` then `pop`, returns to `ROADMAP.md` with every field it had before the claim, including `Note`, and `just test` covers the field list.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-018 design (2026-11-19): R-018's design keeps `Note` out of `NOW.md`, so `pm-checkpoint` `switch` (and `push`/`pop`) restore a roadmap item without the `Note` it had before `pm-next` claimed it. Carry `Note` through `NOW.md` or the stack entry. A skills change, so it bumps the rules major. Spec: `docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md`. 2026-11-19 review, from the R-018 final re-review: `pop` no longer states that the five item fields (`Serves`, `Owner`, `Size`, `Depends on`, `Revisits`) land after `Milestone` and before `Spec`, as `pm-rejoin` and `pm-next` step 7 do; `push` cites `now/fields` as the reason to copy the five as a group into `STACK.md`, but `now/fields` checks `NOW.md` only and `checkStack` does not enforce it. Add the position sentence to `pop` and reword the `push` citation. 2026-11-19 review, from the R-018 final re-review: `pm-setup` Step 5 item 5 backfills the five item fields of an active `NOW.md` on the upgrade to rules 20, but not of entries already in `STACK.md`, so an item pushed before the upgrade pops back without them (its Now card exports `owner`/`size` null and the graph draws no edges for it). `pm-checkpoint switch` on an item never backfilled (the user chose `Continue on v19`) restores a roadmap block without `Serves` and `Size`, which `roadmap/item` requires. Either backfill stack entries in `pm-setup`, or have `pop` and `switch` ask for missing values the way the backfill does. Affects `skills/pm-setup/SKILL.md`.

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-027 Docs-site package: build hardening

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: `@types/node` is in `packages/pm-docs-site` `devDependencies`; `scripts/build.ts` and the install-test guard walk `dist/` recursively; `scripts/check-exports.ts` accepts `.mjs` and `.cjs` entry points and rejects a `.d.ts` outside a `types` condition; every type import in the packed tarball resolves; the `astro.config.ts` examples in `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md` are fenced as `ts`; and no file names `0.1.0-pre.1` as the published version.
- Size: S
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Sliced from R-019 Docs-site package: consumer-ready for 1.0.0 with pm-shape on 2026-11-19. Build and docs from the R-021 final review: `tsconfig.build.json` sets `types: ["node"]` but `@types/node` arrives only through `@types/bun` (add it to `devDependencies` so a lockfile change cannot break `prepack`); `scripts/build.ts` rewrites `.ts` specifiers only in the top level of `dist/`, and the install-test guard reads only the top level (use `readdirSync(..., { recursive: true })`); `scripts/check-exports.ts` rejects valid `.mjs`/`.cjs` entry points and accepts a `.d.ts` outside a `types` condition; shipped `src/` type-imports `../lib/types.ts`, which the tarball omits (ship it or note why not); the `astro.config.ts` examples in `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md` are fenced as `js`; `README.md:69` and `.config/purview-docs.yml:23` say `0.1.0-pre.1` is on npm.

### R-028 Docs-site package: accessible board, popup, and timeline

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: browser tests show the card's popup trigger with `aria-haspopup="dialog"`, a backdrop click closing the item dialog, popup section headings below the dialog title's level, one tab stop per card, Board collapse toggles hidden without JavaScript, the timeline's zoom buttons keeping focus at their limits, line-mode wheel deltas scaled, the zoom anchor holding across two zoom changes before one render, the timeline's `planned` and `other` markers rendered, the Now item de-duplicated when it is also logged done or queued, a `localStorage` that throws leaving the Board usable, and no `No milestone` card on the Milestones page without an open unassigned item.
- Size: M
- Depends on: R-020
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Sliced from R-019 Docs-site package: consumer-ready for 1.0.0 with pm-shape on 2026-11-19; depends on R-020 Docs-site package: rich demo planning fixture for the planned milestone the timeline tests need. From the 2026-11-19 review. Empty card: the Milestones page (`src/routes/plan/milestones/index.astro`) shows a `No milestone` card reading `0 of 0 done` whenever anything was dropped, because `features()` gives dropped items `milestone: null`; R-011 hid it on the timeline and Roadmap page only (bug, cosmetic). Accessibility from the R-009 final review: card links do not say they open a popup (`aria-haspopup="dialog"`); a backdrop click does not close the item dialog; popup section headings share the dialog title's h2 level; Board collapse toggles render without JavaScript and do nothing (render them hidden, let `plan.ts` reveal them); `KanbanItemCard` keeps `tabindex=0` around a card that holds links, so each card costs extra tab stops; no browser test for a `localStorage` that throws. Timeline follow-ups from the R-011 final review (`src/components/timeline/Timeline.tsx`): keyboard focus drops to `<body>` when `Zoom in`, `Zoom out`, or `Reset zoom` becomes disabled at its limit (`aria-disabled` with a no-op guard keeps focus); the plain-wheel path scrolls by `deltaY` without scaling line-mode (`deltaMode` 1) deltas; the zoom-anchor browser test covers a single click, not two zoom changes before one render; the `planned` and `other` card markers are never rendered in a browser test (the fixture has no planned milestone); event de-duplication assumes the Now item is not also logged done or queued under another milestone, untested.

### R-013 Docs-site package: publish and migrate

- Serves: V4
- Milestone: M1
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns the released version; `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore` and `just docs-check` passes; two builds from the same `planning.json` and lockfile give byte-identical HTML; and a scratch export at schemaVersion 4 fails the build until the package's range includes it.
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014, R-019, R-027, R-028
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major.

### R-025 Docs-site package: feature pages list revisions

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: a feature page for an item that another item's `Revisits` names lists that item under "Revised by", and a unit test in `packages/pm-docs-site` covers it.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-012 design (2026-11-19): `dependents()` in `packages/pm-docs-site/src/lib/planning.ts` looks only at `dependsOn`, so a feature page lists its dependants but not the items whose `Revisits` names it; the R-012 graph already draws Revisits edges.

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
