# Now

<!--
Edited only by pm-* skills. PM state lives in the main worktree; a completion
record may be written in the worktree that holds the item's branch.
Fields are fixed. When idle, every field except Status is empty.
Status: idle | active
Stage: design | plan | execute | finish
Session: <branch> (worktree <path>, optional)
Brief: optional; the item's brief, if it has one
Milestone: optional; the item's milestone while it is active
-->

- Status: active
- Item: R-031 Docs-site package: review follow-ups
- Session: feat/r-031-docs-site-package-review-follow-ups
- Stage: execute
- Brief:
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Note: Collected in the 2026-11-20 review from deferred final-review minors. R-023 (`packages/pm-docs-site/test/browser/graph.browser.ts`, `playwright.config.ts`): (1) `sampleFrames` counts observer records toward the 5-frame post-hydration tail (`stopAtFrame = frames.length + 5`), so as few as 3 real animation frames are sampled after hydration; count rAF samples separately. (2) `record(true)` on a pending-mark removal reads `visible` and `layout` after the removal, recording an impossible `pending: true, visible: true` frame; push `visible: false` or comment it as a marker. (3) `arrowheadFill` reports `marker-end is not url(#id) (marker-end: null)` when the edge path itself is missing; add a `no edge path` reason. (4) `playwright.config.ts` could say `--project=dev` now runs only through `bun run test:browser:dev`. R-020 (`scripts/check-demo.ts`, `examples/demo/planning/planning.json`): (1) `check-demo.ts` scans only `plan/` pages, so the home page's empty states ("Nothing in Next can be started.", "No open risk is red.") are not checked; include `index.html`. (2) The `Nothing links here yet.` allowlist entry is unused in today's demo build; drop it until a feature page needs it. (3) The demo export records this repository's branch and head (`feat/r-020-docs-site-demo-fixture`, `c2220cd`) as its source, now frozen by `export.ts write --frozen`; pin a neutral source. (4) The opening-tag regex in `emptyStates` also matches `data-class=`, and an unclosed `plan-empty` element swallows the rest of the page. 404 warning (`packages/pm-docs-site/src/content.config.ts`): every build logs `[WARN] [content] Entry docs → 404 was not found.` while rendering /404.html, because Starlight's 404 route calls `getEntry('docs', '404')`; add a `404` entry in the docs collection, or use Starlight's `disable404Route` with the package's own 404 page, and check that a `404` entry is not also routed as /404/. R-019 (`src/lib/ref-boundary.ts`, `src/pages/plan/log.astro`): (1) the reference boundary `(?<![\w/-])` means an ID after `/` is never linked, so the second ID in `M1/M2` or `R-011/R-012`, and a brief path written `./planning/briefs/x.md`, stay plain text; allow a leading `/` outside a path, or pin `M1/M2` as intended in `test/references.test.ts`. (2) `log.astro:41` prints `<id> <title>` as plain text when the entry's ID has no target, so known IDs inside that title are not linked; render `{entry.id} <LinkedText text={entry.title} />` in that case. R-027 (`packages/pm-docs-site`): (1) `test/build.test.ts` probe test can leave `lib/__probe__` behind if the run is killed, and `prepack` would then ship `dist/__probe__/`; the restoring rebuild in `finally` ignores its exit code (gitignore `lib/__probe__/` or assert the exit code). (2) `test/install.test.ts` `relativeImports` skips side-effect imports (`import '../styles/x.css'`, `import '../scripts/plan.ts'`). (3) The install test counts a bare directory as a resolved import (the `''` suffix); use `statSync(...).isFile()`. (4) "non-JavaScript" wording remains in `.github/workflows/publish-pm-docs-site.yml:151`, `docs/wiki/contributing/Repository-Layout.md:57`, and `packages/pm-docs-site/README.md:219`; `check-exports` now reports "the wrong kind of file". (5) `docs/wiki/contributing/Development.md:71` uses `0.1.0-pre.1` as a format example; mark it "for example". 2026-11-21: Started without a brief at the user's request; this Note lists every finding and its file.
- Spec: docs/superpowers/specs/2026-11-21-docs-site-review-follow-ups-design.md
- Plan: docs/superpowers/plans/2026-11-21-docs-site-review-follow-ups.md
- Started: 2026-11-21

## Done when

- each finding listed in this item's Note is fixed or pinned by a test, a docs-site build logs no `Entry docs → 404 was not found` warning, and `just lint-check` passes.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: execute
- Brief: planning/briefs/R-007-tenant-billing.md
- Milestone: M1
- Spec: docs/superpowers/specs/<file>.md
- Plan: docs/superpowers/plans/<file>.md
- Started: 2026-10-29

## Done when

- <observable check>

## Checkpoint 2026-10-29 14:55

- Stopped at: <last completed step>
- Next action: <one action>
- Start with: <exact command or file path>
- Decisions: <decisions made since the last checkpoint, with reasons | none>
- Context: <facts the next session needs that are not in the spec or plan | none>
- Open question: <only if blocking>
-->
