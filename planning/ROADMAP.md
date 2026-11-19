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

### R-022 Docs-site package: timeline hydrates in dev

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: under `pm-docs-site dev` in a packed-install consumer, `/plan/roadmap/` shows the timeline toolbar with no `node:fs` error in the browser console, and `test/browser/dev.browser.ts` asserts it.
- Size: S
- Depends on: none
- Status: ready
- Note: Bug (minor) from R-012 execute (2026-11-19): the Roadmap Timeline island imports `src/lib/timeline.ts`, which imports `src/lib/planning.ts`, which imports `node:fs`, so the client bundle fails in dev. R-012 fixed the same problem for the Graph island by moving its client functions into `src/lib/graph-state.ts`; the timeline needs the same split. Reproduce: pack and install into a consumer outside the repository (as `test/browser/dev-server.ts` does), run `pm-docs-site dev`, open `/plan/roadmap/`; every time.

### R-023 Docs-site package: stable browser tests

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: `npx playwright test test/browser/graph.browser.ts --project chromium --repeat-each=10` in `packages/pm-docs-site` passes 10 of 10 runs.
- Size: S
- Depends on: none
- Status: ready
- Note: Bug (minor) from R-012 execute (2026-11-19): the both-switches-off no-flash test fails about 1 run in 10 on "at least one pending frame", because `sampleFrames` records its first frame after a fast hydration can set and clear `data-graph-pending`. Fix: push one frame synchronously when the init script runs, and record every `data-graph-pending` change with a MutationObserver on `document.documentElement`. Same re-review: the chip dedup assertion at `test/graph-layout.test.ts:498-500` cannot fail; `arrowheadFill` in `graph.browser.ts:392-407` depends on React Flow's `url('#<id>')` marker format. 2026-11-19 review, from R-011 verification (2026-11-18): `just lint-check` failed twice at `package-test` when both Playwright web servers started together; the `dev` server (`test/browser/dev-server.ts`) logged `Listen method has been called more than once without closing` and `transport invoke timed out after 60000ms`, then Playwright timed out after 300000ms. Playwright starts both servers even with `--project=chromium`. Separately, `bun run test:browser -- --project chromium <file>` fails under Bun (the path is read as a project name), while `--project=chromium` works. Affects `packages/pm-docs-site/playwright.config.ts`. 2026-11-19 review, from the R-017 final review: the `pm-docs-site:fs-allow` tests in `test/integration.test.ts` find the plugin by position (`.at(-1)`) instead of by name, so a later plugin breaks them; the appended entry in `lib/index.ts` serves the whole package folder in in-repo and linked dev, which `fs.deny` still guards, and the comment could say so; on case-insensitive macOS a case-only difference appends a harmless duplicate entry.

### R-020 Docs-site package: rich demo planning fixture

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: a synthetic, schema-valid `planning.json` in the package's fixture site fills every view (at least 3 milestones with targets, `Depends on` and `Revisits` edges, risks in all three RAG states, inbox files, briefs, Done and Dropped log lines, an active Now item), `bun skills/pm-export/scripts/export.ts validate` passes on it, and the fixture site's build and browser tests render every page with content.
- Size: M
- Depends on: none
- Status: ready
- Note: 2026-11-19 review, from the user (2026-11-18): "This needs a demo site in repo, that shows all of the various features off". 2026-11-19 review, from the R-018 final re-review: `packages/pm-docs-site/src/routes/plan/now.astro` reads the active item's owner and size from `board.columns.now[0]` while `features()` reads `now.item` (equal by construction, two sources); `pm-board`'s Now card step does not say they come from `NOW.md`; the export schema's `$defs/itemRef` is unreferenced; `graph.test.ts` builds a partial `Planning` with `as unknown as Planning` instead of spreading the fixture; the shared package fixture draws no edge into the active node. Tidy these in one pass.

### R-019 Docs-site package: consumer-ready for 1.0.0

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: the package home page has no `just docs-preview`; a build without the `docs` option logs no Starlight missing-folder or empty-collection warning; `docsHref` returns no link for a spec or plan path no docs source maps (and honours a source `prefix`); RefLink prints fallback text (the entry title, "No milestone") for an unknown key; `linkify` uses the link scanner's boundaries, so an ID inside a path is not linked; the CLI warns when `--title` or `--planning` is ignored, a `planning.json` holding `null` prints the pm-export hint, `check` loads an `astro.config.ts` on the `engines` Node floor, `dev` has an automated test, and the README names the same-drive requirement on Windows.
- Size: M
- Depends on: R-021
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Folds five inbox files from the R-008 and R-009 final reviews (CLI gaps, consumer text, dead doc links, RefLink fallbacks, IDs linked inside paths). Affects `packages/pm-docs-site/cli.mjs`, `lib/site-options.mjs`, `README.md`, `src/pages/index.astro`, `src/content.config.ts`, `src/lib/planning.ts`, `src/components/RefLink.astro`, `src/lib/references.ts` (the `.mjs` files become `.ts` source in R-021 Docs-site package: TypeScript source with a build step). Moved from Next 5 to the top of Later on 2026-11-18 when R-021 took the top of Next. 2026-11-19 review: the Milestones page (`src/routes/plan/milestones/index.astro`) shows a `No milestone` card reading `0 of 0 done` whenever anything was dropped, because `features()` gives dropped items `milestone: null`; R-011 hid it on the timeline and Roadmap page only (bug, cosmetic). 2026-11-19 review, accessibility from the R-009 final review: card links do not say they open a popup (`aria-haspopup="dialog"`); a backdrop click does not close the item dialog; popup section headings share the dialog title's h2 level; Board collapse toggles render without JavaScript and do nothing (render them hidden, let `plan.ts` reveal them); `KanbanItemCard` keeps `tabindex=0` around a card that holds links, so each card costs extra tab stops; no browser test for a `localStorage` that throws. 2026-11-19 review, timeline follow-ups from the R-011 final review (`src/components/timeline/Timeline.tsx`): keyboard focus drops to `<body>` when `Zoom in`, `Zoom out`, or `Reset zoom` becomes disabled at its limit (`aria-disabled` with a no-op guard keeps focus); the plain-wheel path scrolls by `deltaY` without scaling line-mode (`deltaMode` 1) deltas; the zoom-anchor browser test covers a single click, not two zoom changes before one render; the `planned` and `other` card markers are never rendered in a browser test (the fixture has no planned milestone); event de-duplication assumes the Now item is not also logged done or queued under another milestone, untested. 2026-11-19 review, build and docs from the R-021 final review: `tsconfig.build.json` sets `types: ["node"]` but `@types/node` arrives only through `@types/bun` (add it to `devDependencies` so a lockfile change cannot break `prepack`); `scripts/build.ts` rewrites `.ts` specifiers only in the top level of `dist/`, and the install-test guard reads only the top level (use `readdirSync(..., { recursive: true })`); `scripts/check-exports.ts` rejects valid `.mjs`/`.cjs` entry points and accepts a `.d.ts` outside a `types` condition; shipped `src/` type-imports `../lib/types.ts`, which the tarball omits (ship it or note why not); the `astro.config.ts` examples in `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md` are fenced as `js`; `README.md:69` and `.config/purview-docs.yml:23` say `0.1.0-pre.1` is on npm. 2026-11-19 review: promoted from Later 1 to Next 4. Its `Done when` does not cover the four Notes merged today, and it has outgrown size M; re-slice it with `pm-shape` before it is claimed, and make R-013 depend on the slices.

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
