# R-020 Docs-site demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A checked-in, consumer-shaped demo site in `examples/demo/` that shows every pm-docs-site view with content, generated from a synthetic Markdown PM root and kept correct by `just demo-check`, plus the five R-018 re-review tidy-ups and the rules 21 bump they need.

**Architecture:** `examples/demo/planning/` is a pm-init-shaped PM root whose `planning.json` is written by `skills/pm-export/scripts/export.ts`. `examples/demo/` depends on `packages/pm-docs-site` through `file:` and builds with the package CLI. `scripts/check-demo.ts` checks the built pages, and `just demo-check` chains export check, validate, pm-lint, build, and that script.

**Tech Stack:** Bun, TypeScript, Astro 7 + Starlight (through `@purview-dev/pm-docs-site`), just (`sh` recipes), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-20-docs-site-demo-design.md`

## Global Constraints

- Work on `feat/r-020-docs-site-demo-fixture`; do not create branches or worktrees.
- TypeScript only for code (`.ts`); no JavaScript files. The `justfile` never sets a shell (`sh` recipes only).
- Package builds and the CLI need Node 24 or later.
- The demo depends on `"@purview-dev/pm-docs-site": "file:../../packages/pm-docs-site"` and imports it by name; `bun install --frozen-lockfile` works there, so `examples/demo/bun.lock` is committed.
- Demo scripts: `"dev": "pm-docs-site dev"`, `"build": "pm-docs-site build"`, `"check": "pm-docs-site check"`, `"preview": "astro preview"`.
- `examples/demo/planning/planning.json` and `planning.schema.json` are written only by `export.ts write`, never by hand.
- The demo's PM files follow the PM file format: `bun skills/pm-lint/scripts/lint.ts check --root examples/demo --pm-root planning/` is clean.
- `schemaVersion` stays 4.
- Commits follow commitlint (`feat(...)`, `test(...)`, `docs(...)`, `build(...)`, `ci(...)`); never `--no-verify`. Do not commit `planning/` by hand except where a task says so (pm-setup's `Rules version`).

## Review Focus

- A `plan/` page that renders an empty state the allowlist does not cover must fail `check-demo.ts`, including a `plan-empty` element with nested markup (for example a link inside the text). Pinned in Task 4.
- A demo `dist/` with a missing or extra page must fail, not only an empty one. Pinned in Task 4.
- `demo-check` run on a stale package `dist/` must still test the current package: the recipe rebuilds `dist/` before the demo build. Pinned in Task 6 (recipe order) and checked by hand in its verification step.
- A rules bump must leave `just demo-check` passing with no manual step. Pinned in Task 7 by running the real `just bump premajor` and then `just demo-check`.
- Removing `$defs/itemRef` must not leave another unreferenced `$defs` entry, or a `$ref` to a removed one. Pinned in Task 1 by a validate.ts check.

---

### Task 1: Remove the unreferenced `$defs/itemRef` and keep `$defs` referenced

**Files:**

- Modify: `skills/pm-export/references/planning.schema.json` (the `itemRef` entry at line 826)
- Modify: `scripts/validate.ts` (the schema block after line 148)
- Regenerate: `planning/planning.schema.json` (by `export.ts write`)

**Interfaces:**

- Produces: `scripts/validate.ts` fails with `planning.schema.json: $defs/<name> is never referenced` for any `$defs` key with no `"$ref": "#/$defs/<name>"`, and `planning.schema.json: $ref #/$defs/<name> has no definition` for a dangling ref.

- [x] **Step 1: Add the check to `scripts/validate.ts`.** Collect every `$ref` string in the parsed schema (walk the object), compare with `Object.keys(schema.$defs)`, and call `fail(...)` with the two messages above.
- [x] **Step 2: Run `bun scripts/validate.ts`.** Expected: FAIL with `planning.schema.json: $defs/itemRef is never referenced`.
- [x] **Step 3: Delete the `itemRef` entry** from `skills/pm-export/references/planning.schema.json`.
- [x] **Step 4: Run `bun scripts/validate.ts` and `just test`.** Expected: both pass (`validate.ts` also validates the example and the docs-site fixtures against the schema).
- [x] **Step 5: Commit** `skills/pm-export/references/planning.schema.json` and `scripts/validate.ts` with `fix(pm-export): drop the unreferenced itemRef definition`. Do not write or commit `planning/planning.schema.json`: the next PM commit's export refresh copies the schema there.

### Task 2: One source for the Now page's owner and size

**Files:**

- Modify: `packages/pm-docs-site/src/routes/plan/now.astro:16-17,124`
- Modify: `skills/pm-board/SKILL.md:52`

**Interfaces:**

- Consumes: `now.item` (`{ id, title, serves, owner, size, dependsOn, revisits } | null`, `packages/pm-docs-site/src/lib/planning-types.ts`).

- [x] **Step 1: In `now.astro`,** remove `const card = planning.board.columns.now[0];` and read `now.item?.size ?? null` for the priority and `now.item?.owner ?? null` for `initials(...)`.
- [x] **Step 2: Verify** `Select-String -Path packages/pm-docs-site/src/routes/plan/now.astro -Pattern 'board\.columns'` prints nothing, then in `packages/pm-docs-site` run `bun test`, `bun run check`, and `bun run test:browser`. Expected: all pass.
- [x] **Step 3: In `skills/pm-board/SKILL.md` line 52,** change the Now line to: `` - `Now`: the active item in `NOW.md`, with its stage and step count; its owner and size are `NOW.md`'s `Owner` and `Size` fields. `` Run `bunx markdownlint-cli2 skills/pm-board/SKILL.md`. Expected: 0 issues.
- [x] **Step 4: Commit** with `fix(pm-docs-site): read the Now card from now.item (R-020)`.

### Task 3: The package fixture draws an edge into the active node; `graph.test.ts` spreads the fixture

**Files:**

- Modify: `packages/pm-docs-site/test/fixtures/planning.json` (R-024's `dependsOn`, and its derived board, counts, and claimable fields)
- Modify: `packages/pm-docs-site/test/graph.test.ts:40-51,70-76,105-116,129-140,147-158`
- Modify, if their assertions name R-024's column or claimability: `packages/pm-docs-site/test/board*.test.ts`, `test/browser/*.browser.ts`, `test/fixtures/expected-pages.txt`

**Interfaces:**

- Produces: `function withPlan(overrides: Partial<Planning>): Planning` in `graph.test.ts`, returning `{ ...planning, ...overrides }`.

- [x] **Step 1: Update the edge test first.** In `builds exactly these seven edges`, rename to `builds exactly these eight edges`, and expect `'R-022>R-024:depends'` followed by `'R-012>R-024:depends'`; add `expect(fromChipOf('R-012')).toBe(false);`. Add a test `draws an edge into the active node` that asserts `data.edges` contains `{ source: 'R-012', target: 'R-024', kind: 'depends' }` and `nodeById.get('R-012')` has `active: true`.
- [x] **Step 2: Run** `bun test test/graph.test.ts` in `packages/pm-docs-site`. Expected: FAIL on the edge list.
- [x] **Step 3: In the fixture,** set R-024's `dependsOn` to `["R-022", "R-012"]`, and make its `claimable`, `board.columns` placement (`waiting` when a dependency is open), and `counts` agree with what `pm-export` would derive. Check with `bun skills/pm-export/scripts/export.ts validate packages/pm-docs-site/test/fixtures/planning.json` (expected: `valid`).
- [x] **Step 4: Replace the four `as unknown as Planning` casts** with `withPlan({ now, roadmap, log, board: { ...planning.board, columns: { ...planning.board.columns, now: [...] } } })`, giving each partial item every field `Planning` types require. `strategy` comes from the spread.
- [x] **Step 5: Run** `bun test`, `bun run check`, and `bun run test:browser` in `packages/pm-docs-site`, and `bun scripts/validate.ts` at the root. Update any assertion that moved with R-024 (board column, claimable count). Expected: all pass, and `Select-String -Path packages/pm-docs-site/test/graph.test.ts -Pattern 'as unknown as'` prints nothing.
- [x] **Step 6: Commit** with `test(pm-docs-site): fixture edge into the active node (R-020)`.

### Task 4: `scripts/check-demo.ts`

**Files:**

- Create: `scripts/check-demo.ts`
- Test: `scripts/check-demo.test.ts`

**Interfaces:**

- Produces: `export function checkDemo(distDir: string, expectedPages: string[]): string[]`, which returns failure lines (empty when clean), and `export const ALLOWED: { page: RegExp; text: string; reason: string }[]`. CLI: `bun scripts/check-demo.ts [<demo dir>]` (default `examples/demo`) reads `<demo dir>/dist/` and `<demo dir>/expected-pages.txt` (one `/`-separated path per line, sorted), prints each failure, and exits 1 on any, else prints `demo: <n> pages, none empty` and exits 0.
- Failure lines: `missing page: <path>`, `unexpected page: <path>`, `<path>: empty state "<text>"`.
- `ALLOWED` entries, each with its reason: `/^plan\/risks\//` with `–` (an empty risk-matrix cell) and with the risk legend text that starts `A cell's colour is the RAG` (risks.astro:67, a legend, not an empty state); `/^plan\/features\/r-\d+\//` with `Nothing links here yet.` (LinkedFrom.astro, true for a feature no item links to).

- [x] **Step 1: Write the failing tests** in `scripts/check-demo.test.ts`, building a temporary `dist/` with `mkdtempSync`:
  - `passes a dist whose pages match and have no empty state`: `checkDemo(dir, ['index.html', 'plan/board/index.html'])` is `[]`.
  - `reports a missing and an unexpected page`: expect `['missing page: plan/log/index.html', 'unexpected page: plan/extra/index.html']`.
  - `reports an empty state under plan/`: a page `plan/inbox/index.html` with `<p class="plan-empty">Nothing here</p>` returns `['plan/inbox/index.html: empty state "Nothing here"']`.
  - `reads the text of an empty state with nested markup`: `<p class="x plan-empty">No briefs. <a href="/">pm-shape</a> writes one</p>` returns a failure whose text is `No briefs. pm-shape writes one`.
  - `ignores an allowed use`: `plan/features/r-001/index.html` holding `<p class="plan-empty">Nothing links here yet.</p>` returns `[]`.
  - `ignores empty states outside plan/`: `index.html` holding `<p class="plan-empty">Nothing is in progress.</p>` returns `[]`.
  - `gives every allowlist entry a reason`: every `ALLOWED` entry has a non-empty `reason`.
- [x] **Step 2: Run** `bun test scripts/check-demo.test.ts`. Expected: FAIL (module not found).
- [x] **Step 3: Implement** with `node:fs` only: walk `distDir` for `.html` (as `htmlPages` in `packages/pm-docs-site/test/helpers.ts`), compare with `expectedPages`, and for pages under `plan/` find each element whose `class` attribute contains the word `plan-empty`, taking its inner text up to the matching closing tag of the same name, with tags stripped and whitespace collapsed.
- [x] **Step 4: Run** `bun test scripts/check-demo.test.ts`, then `just test`. Expected: PASS.
- [x] **Step 5: Commit** with `test(scripts): check-demo finds empty and missing demo pages (R-020)`.

### Task 5: The demo site and its PM root

**Files:**

- Create: `examples/demo/package.json`, `examples/demo/bun.lock`, `examples/demo/astro.config.ts`, `examples/demo/.gitignore` (`dist/`, `.astro/`, `node_modules/`), `examples/demo/README.md`, `examples/demo/expected-pages.txt`
- Create: `examples/demo/docs/README.md`, `examples/demo/docs/guide/getting-started.md`, `examples/demo/docs/guide/architecture.md`
- Create: `examples/demo/planning/` from `skills/pm-init/templates/` (`config.md`, `VISION.md`, `STRATEGY.md`, `ROADMAP.md`, `NOW.md`, `LOG.md`, `RISKS.md`, `STACK.md`, `inbox/README.md` from `inbox-README.md`, `briefs/README.md` from `briefs-README.md`), then inbox files and briefs
- Generate: `examples/demo/planning/planning.json`, `examples/demo/planning/planning.schema.json`

**Interfaces:**

- Consumes: `checkDemo` CLI (Task 4).
- Produces: the `examples/demo/` folder that Task 6's recipes build.

- [x] **Step 1: Write the PM root.** One invented product (your call: neutral, for example a small booking app), dated around one fixed "today" of your choice. `config.md` has `Rules version: 20` (Task 7 moves it), `Max items in Next: 5`, and the template's Commits and Handoffs. It must hold everything the spec's "The demo's plan" section lists: 4 `V` lines; bets, assumptions, `Not doing`, and decisions; 3 or more milestones with dated `Target:` (one `done (<date>)`, one the `Current focus`, one later) plus unassigned items; a full Next and a milestone-grouped Later with every owner, size, and status (`ready`, `paused`, `blocked`); a `Depends on` naming the active item; an open item whose `Revisits` names a Done item; an active `NOW.md` with `Done when`, spec and plan paths, and a checkpoint; `LOG.md` with Done lines in 3 milestones, 2 Dropped lines, and review lines; `RISKS.md` with red, amber, and green open risks, one `RAG override`, one `mitigating` with an `R-NNN` mitigation, one `accepted`, one closed, and one removed; 3 or more inbox files (one `Kind: bug` with `## Reproduction`, one `Discuss: yes`); and 2 briefs (one `on roadmap (<ID>)`, one `parked`).
- [x] **Step 2: Lint** with `bun skills/pm-lint/scripts/lint.ts fix --root examples/demo --pm-root planning/`, then `check` with the same flags. Expected: `pm-lint: clean`.
- [x] **Step 3: Generate** with `bun skills/pm-export/scripts/export.ts write --root examples/demo --pm-root planning/`, then confirm the content with `bun skills/pm-export/scripts/export.ts summary --root examples/demo --pm-root planning/` and `validate examples/demo/planning/planning.json`. Expected: `valid`, an active Now item, and the counts from Step 1.
- [x] **Step 4: Write the site files.** `package.json` (private, `"type": "module"`, the scripts and dependency from Global Constraints; add `astro` or `@astrojs/starlight` at `7.4.8` and `0.42.10` only if the config or `astro preview` cannot resolve them through the package). `astro.config.ts` calls `pmDocsSite({ title: 'Demo plan', planning: 'planning/planning.json', docs: { root: 'docs', sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }] } })`, following `packages/pm-docs-site/test/fixtures/site/astro.config.ts`. `README.md` says what the demo is, that its plan is invented, and `just demo`.
- [x] **Step 5: Build** with `node scripts/build.ts` in `packages/pm-docs-site`, then `bun install` and `bun run build` in `examples/demo`. Expected: the build succeeds with no Starlight warning. Commit the resulting `bun.lock`.
- [x] **Step 6: Write `expected-pages.txt`** from the built page list (`index.html`, `404.html`, the `docs/` pages, and every `plan/` page, including `plan/milestones/<id>/` for every milestone, `plan/milestones/none/`, one `plan/features/<id>/` per open item, and one `plan/risks/<id>/` per risk). Check it against the views in `VIEWS` (`skills/pm-docs-site/scripts/site.ts`) and the package's injected routes, so no view is missing.
- [x] **Step 7: Run** `bun scripts/check-demo.ts`. Expected: `demo: <n> pages, none empty`. When a page shows an empty state, add the content to the Markdown and re-run Steps 2, 3, 5, and 7. Never widen `ALLOWED` to pass.
- [x] **Step 8: Run** `bunx markdownlint-cli2 "examples/**/*.md"`. Expected: 0 issues.
- [x] **Step 9: Commit** `examples/demo/` with `feat(examples): pm-docs-site demo with every view filled (R-020)`.

### Task 6: `just demo`, `just demo-check`, `package-test`, and CI

**Files:**

- Modify: `justfile` (`Docs` group, after `package-test`)
- Modify: `.github/workflows/ci.yml` (the `pm-docs-site-package` job)
- Modify: `AGENTS.md` (`## Build, test, and lint` list, above the managed section)

**Interfaces:**

- Consumes: `scripts/check-demo.ts` (Task 4), `examples/demo/` (Task 5).

- [x] **Step 1: Add the recipes,** each with a one-line comment like its neighbours. Neither sets a shell.
  - `demo`: run `node scripts/build.ts` in `packages/pm-docs-site`, then `bun install --frozen-lockfile`, `bun run build`, and `bun run preview` in `examples/demo`.
  - `demo-check`, in the spec's order: `export.ts check --root examples/demo --pm-root planning/`; `export.ts validate examples/demo/planning/planning.json`; `lint.ts check --root examples/demo --pm-root planning/`; `node scripts/build.ts` in the package; `bun install --frozen-lockfile` and `bun run build` in `examples/demo`; `bun scripts/check-demo.ts`. Use `cd <dir> && ...` lines or per-line paths, because a recipe has one `working-directory`.
  - `package-test` runs `just demo-check` as its last line.
- [x] **Step 2: Verify** `just demo-check`. Expected: it ends with `demo: <n> pages, none empty`. Then delete `packages/pm-docs-site/dist/` and run it again. Expected: it passes, because the recipe rebuilds `dist/`.
- [x] **Step 3: Verify** `just demo` serves at <http://localhost:4321>: open `/plan/board/`, `/plan/roadmap/`, and `/plan/graph/` and see content, then stop it.
- [x] **Step 4: Add CI steps** after `Dev browser tests` in `pm-docs-site-package`, with `working-directory: ${{ github.workspace }}` and the same commands as `demo-check`, as separate named steps (`Demo export is current`, `Demo export is valid`, `Demo PM files lint`, `Build the package`, `Install the demo`, `Build the demo`, `Demo pages have content`). Run `bun test scripts/workflows.test.ts`. Expected: PASS.
- [x] **Step 5: Add one line to `AGENTS.md`**'s build list: `` - Open the demo site (`examples/demo/`, an invented plan that fills every view): `just demo`. Check it: `just demo-check` (part of `just package-test`). Its `planning/planning.json` is derived: `just bump` refreshes it on a major, and `bun skills/pm-export/scripts/export.ts write --root examples/demo --pm-root planning/` after a demo PM edit. `` Run `just validate`. Expected: pass.
- [x] **Step 6: Commit** with `build(examples): just demo and demo-check in package-test and CI (R-020)`.

### Task 7: Rules 21: the bump refreshes the demo, and the upgrade note

**Files:**

- Modify: `scripts/bump-version.ts` (the `if (next.major > current.major)` block)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (upgrade notes, after `Version 20`)
- Modify (by the bump and pm-setup): `package.json`, `skills/pm-init/templates/config.md`, `AGENTS.md` managed section, `planning/config.md` `Rules version`, `examples/demo/planning/config.md`, `examples/demo/planning/planning.json`

**Interfaces:**

- Produces: after a major bump, `examples/demo/planning/config.md` has `- Rules version: <new major>`, and the demo export is rewritten. `bump-version.ts` prints `demo: refreshed examples/demo/planning/planning.json`, or fails with the export's output when the write fails.

- [x] **Step 1: In `bump-version.ts`'s major block,** after the config template, replace `- Rules version: \d+` in `examples/demo/planning/config.md` (skip when the file is missing), then run `bun skills/pm-export/scripts/export.ts write --root examples/demo --pm-root planning/` with `execFileSync` (`cwd: root`), and print the line above.
- [x] **Step 2: Add the upgrade note** to the managed section reference: `Version 21 removes the unused itemRef definition from the export schema, so a consumer's planning.schema.json differs from pm-export's until it re-exports: run pm-export once. pm-board's Now card names NOW.md as the source of its owner and size. The export stays at schemaVersion 4. No setting is added.`
- [x] **Step 3: Bump** with `just bump premajor`. Expected: `v20.0.0 -> v21.0.0-pre.1 (prerelease)`, `rules v20 -> v21`, and `demo: refreshed ...`.
- [x] **Step 4: Commit** `scripts/bump-version.ts`, `skills/pm-setup/references/AGENTS-section.md`, `package.json`, `skills/pm-init/templates/config.md`, and `examples/demo/planning/` with `feat(pm-setup): rules 21; bump refreshes the demo export (R-020)`. Leave `planning/` and `AGENTS.md` for Step 5.
- [x] **Step 5: Install the rules here** by running the `pm-setup` skill. It writes the `AGENTS.md` managed section and `planning/config.md` `Rules version: 21`, and makes its own PM commit (with the export refresh) for `planning/`. Commit the `AGENTS.md` section with `docs(agents): install rules 21`.
- [x] **Step 6: Verify** `just lint-check` and `just version-check`. Expected: both pass, and `just demo-check` inside `package-test` reports `current` for the demo export with no manual re-run.
