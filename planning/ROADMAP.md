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

### R-028 Docs-site package: accessible board, popup, and timeline

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: browser tests show the card's popup trigger with `aria-haspopup="dialog"`, a backdrop click closing the item dialog, popup section headings below the dialog title's level, one tab stop per card, Board collapse toggles hidden without JavaScript, the timeline's zoom buttons keeping focus at their limits, line-mode wheel deltas scaled, the zoom anchor holding across two zoom changes before one render, the timeline's `planned` and `other` markers rendered, the Now item de-duplicated when it is also logged done or queued, a `localStorage` that throws leaving the Board usable, and no `No milestone` card on the Milestones page without an open unassigned item.
- Size: M
- Depends on: R-020
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Sliced from R-019 Docs-site package: consumer-ready for 1.0.0 with pm-shape on 2026-11-19; depends on R-020 Docs-site package: rich demo planning fixture for the planned milestone the timeline tests need. From the 2026-11-19 review. Empty card: the Milestones page (`src/routes/plan/milestones/index.astro`) shows a `No milestone` card reading `0 of 0 done` whenever anything was dropped, because `features()` gives dropped items `milestone: null`; R-011 hid it on the timeline and Roadmap page only (bug, cosmetic). Accessibility from the R-009 final review: card links do not say they open a popup (`aria-haspopup="dialog"`); a backdrop click does not close the item dialog; popup section headings share the dialog title's h2 level; Board collapse toggles render without JavaScript and do nothing (render them hidden, let `plan.ts` reveal them); `KanbanItemCard` keeps `tabindex=0` around a card that holds links, so each card costs extra tab stops; no browser test for a `localStorage` that throws. Timeline follow-ups from the R-011 final review (`src/components/timeline/Timeline.tsx`): keyboard focus drops to `<body>` when `Zoom in`, `Zoom out`, or `Reset zoom` becomes disabled at its limit (`aria-disabled` with a no-op guard keeps focus); the plain-wheel path scrolls by `deltaY` without scaling line-mode (`deltaMode` 1) deltas; the zoom-anchor browser test covers a single click, not two zoom changes before one render; the `planned` and `other` card markers are never rendered in a browser test (the fixture has no planned milestone); event de-duplication assumes the Now item is not also logged done or queued under another milestone, untested. From the 2026-11-20 review: `Graph.tsx:5-7` states in the island itself that it may import only types from `lib/graph`, but `Timeline.tsx` has no matching note that it may import only types from `lib/timeline` (values come from `lib/timeline-state.ts`); add a one-line header note. Optional: a `bun test` guard that walks `src/components/**` and fails on a value import of `lib/planning`, `lib/timeline`, `lib/graph`, or `lib/graph-layout`.

### R-031 Docs-site package: review follow-ups

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: each finding listed in this item's Note is fixed or pinned by a test, a docs-site build logs no `Entry docs → 404 was not found` warning, and `just lint-check` passes.
- Size: M
- Depends on: none
- Status: ready
- Note: Collected in the 2026-11-20 review from deferred final-review minors. R-023 (`packages/pm-docs-site/test/browser/graph.browser.ts`, `playwright.config.ts`): (1) `sampleFrames` counts observer records toward the 5-frame post-hydration tail (`stopAtFrame = frames.length + 5`), so as few as 3 real animation frames are sampled after hydration; count rAF samples separately. (2) `record(true)` on a pending-mark removal reads `visible` and `layout` after the removal, recording an impossible `pending: true, visible: true` frame; push `visible: false` or comment it as a marker. (3) `arrowheadFill` reports `marker-end is not url(#id) (marker-end: null)` when the edge path itself is missing; add a `no edge path` reason. (4) `playwright.config.ts` could say `--project=dev` now runs only through `bun run test:browser:dev`. R-020 (`scripts/check-demo.ts`, `examples/demo/planning/planning.json`): (1) `check-demo.ts` scans only `plan/` pages, so the home page's empty states ("Nothing in Next can be started.", "No open risk is red.") are not checked; include `index.html`. (2) The `Nothing links here yet.` allowlist entry is unused in today's demo build; drop it until a feature page needs it. (3) The demo export records this repository's branch and head (`feat/r-020-docs-site-demo-fixture`, `c2220cd`) as its source, now frozen by `export.ts write --frozen`; pin a neutral source. (4) The opening-tag regex in `emptyStates` also matches `data-class=`, and an unclosed `plan-empty` element swallows the rest of the page. 404 warning (`packages/pm-docs-site/src/content.config.ts`): every build logs `[WARN] [content] Entry docs → 404 was not found.` while rendering /404.html, because Starlight's 404 route calls `getEntry('docs', '404')`; add a `404` entry in the docs collection, or use Starlight's `disable404Route` with the package's own 404 page, and check that a `404` entry is not also routed as /404/. R-019 (`src/lib/ref-boundary.ts`, `src/pages/plan/log.astro`): (1) the reference boundary `(?<![\w/-])` means an ID after `/` is never linked, so the second ID in `M1/M2` or `R-011/R-012`, and a brief path written `./planning/briefs/x.md`, stay plain text; allow a leading `/` outside a path, or pin `M1/M2` as intended in `test/references.test.ts`. (2) `log.astro:41` prints `<id> <title>` as plain text when the entry's ID has no target, so known IDs inside that title are not linked; render `{entry.id} <LinkedText text={entry.title} />` in that case. R-027 (`packages/pm-docs-site`): (1) `test/build.test.ts` probe test can leave `lib/__probe__` behind if the run is killed, and `prepack` would then ship `dist/__probe__/`; the restoring rebuild in `finally` ignores its exit code (gitignore `lib/__probe__/` or assert the exit code). (2) `test/install.test.ts` `relativeImports` skips side-effect imports (`import '../styles/x.css'`, `import '../scripts/plan.ts'`). (3) The install test counts a bare directory as a resolved import (the `''` suffix); use `statSync(...).isFile()`. (4) "non-JavaScript" wording remains in `.github/workflows/publish-pm-docs-site.yml:151`, `docs/wiki/contributing/Repository-Layout.md:57`, and `packages/pm-docs-site/README.md:219`; `check-exports` now reports "the wrong kind of file". (5) `docs/wiki/contributing/Development.md:71` uses `0.1.0-pre.1` as a format example; mark it "for example".

### R-029 Docs-site package: dev browser webserver starts reliably

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: the cause of the `test:browser:dev` webserver timeout is named in the plan, and 5 consecutive `just lint-check` runs on Windows pass `test:browser:dev`.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review (bug, minor). Dev browser test webserver start timed out: `just lint-check` (via `package-test`) failed once on R-019's branch: `test:browser:dev` timed out after 300000ms waiting for `config.webServer`. The dev server logged `transport was disconnected, cannot call "fetchModule"`, `Listen method has been called more than once without closing`, and `transport invoke timed out after 60000ms`. An immediate re-run of `bun run test:browser:dev` passed 3/3, and R-019 changed nothing on the dev path. Reproduction: run `just lint-check` right after the full `bun test` package suite on Windows; seen once in two runs. Files: `packages/pm-docs-site/playwright.dev.config.ts`, `packages/pm-docs-site/test/browser/dev-server.ts`.

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
- Done when: `npm view @purview-dev/pm-docs-site version` returns the released version; `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore` and `just docs-check` passes; two builds from the same `planning.json` and lockfile give byte-identical HTML; and a scratch export at schemaVersion 4 fails the build until the package's range includes it.
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014, R-019, R-027, R-028, R-029, R-031
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major.

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
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review; R-026 final-review minors, a rules bump. (1) `skills/pm-lint/scripts/structure.ts` comment on `NOW_NOTE` says "rules 22"; the change shipped on rules 21 (21.0.0-pre.2). (2) The R-026 spec (design item 6) and plan (Task 3) still describe `just bump major` to rules 22; add a superseded line. (3) The `now/fields` rule text in `rules.md`, `rules.ts`, and the `checkNow` message says "and then an optional Note", readable as after `Started`; say "an optional Note after Revisits". (4) `pm-checkpoint` `switch` recovery runs only when `Serves`/`Size` are missing and never restores `Note`, so an item claimed under 21.0.0-pre.1 switches back without it; also restore `Note` from the claim-commit block. (5) `pm-next` steps 3 and 5 can each hold a `Note:`, but step 7 joins "a held note" in the singular; state the order for two. (6) A blank `- Note:` on an item: say "a non-empty Note" in `pm-next` step 7 and `pm-rejoin` step 3. (7) No test pins that a `Note` without the five item fields fails `now/fields`.
