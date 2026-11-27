# R-042 Docs-site package: deferred review minors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix or record a won't-fix reason for each R-042 review minor in `@purview-dev/pm-docs-site` before 1.0.0.

**Architecture:** Independent small fixes, one commit per area, all inside `packages/pm-docs-site/` (ADR-005 Docs sites consume the pm-docs-site package) except two `skills/` edits and the version bumps.

**Tech Stack:** TypeScript, Bun test, Astro, Starlight, React islands, Playwright, Sätteri and Pele.

**Spec:** `docs/superpowers/specs/2026-11-27-r-042-docs-site-deferred-review-minors-design.md`

## Global Constraints

- Paths are under `packages/pm-docs-site/` unless they start with `skills/`, `scripts/`, or `docs/`.
- No new view, no behaviour change beyond each finding, no release (R-053 releases 1.0.0).
- Nothing may make the browser tests less stable under `just lint-check` load (R-056).
- Findings 24 and 27 change `skills/`: `just bump prerelease` (main is the unreleased `21.0.0-pre.N` line; rules stay 21).
- Package version `0.1.0-pre.7` → `0.1.0-pre.8`; `skills/pm-docs-site/SKILL.md` `Minimum package version` stays `0.1.0-pre.7`.
- Commit subjects are lower case after the type (commitlint `subject-case`), for example `fix(pm-docs-site): keep other query keys (R-042)`.

## Won't fix (Done when: one-line reason each)

- **(5)** Already fixed by R-028: before hydration the column toggle is a static `<span>` with no `aria-expanded` (`src/components/board/Board.tsx:214-222`).
- **(6)** Moved out of R-042 at the user's choice: `planning/inbox/2026-11-27-0809-board-island-props-slimming.md` (props are 9.0 KB of a 60.2 KB page).
- **(8, duplication only)** The `.astro` cards' `<style>` blocks stay: `src/routes/plan/inbox.astro` and `now.astro` render them without `kanban.css`.
- **(12)** Keeps the 60s `afterAll` timeout (`maxRetries` added): without it the full suite failed, because removing the installed `node_modules` takes over Bun's 5s hook default on Windows.
- **(13)** The `dev` run already moved to `playwright.dev.config.ts` and its fixed scratch folder is deliberate; Yarn PnP is not a supported consumer setup.
- **(18)** `scripts/check-demo.ts` cuts an outer `plan-empty` text at a nested one by design (documented at `:147-151`), and the nested element's text is checked on its own.

## Spec correction

- **(17)** The spec chose `Bun.Transpiler().scanImports`. It cannot work: `relativeImports` also runs on shipped `.d.ts` files (type imports only, which `scanImports` drops) and `.astro` files (which it cannot parse) in `test/install.test.ts:73,86`, so the install check would pass vacuously. Task 5 tightens the regex instead.

## Review Focus

1. A board link with an unrelated query key (`?owner=agent&utm=x`) or a hash keeps both after filtering — Task 1 test.
2. `pm-docs-site dev --port=0`, `--port=`, and `--title=` with an empty value fail with the same messages as the spaced form — Task 7 tests.
3. Two identical Mermaid sections on one ADR page get distinct IDs, the same IDs on a rebuild, and a relative image in a section still resolves — Task 8 tests plus `just package-test` (fixture ADR images).
4. An `.astro` file whose `<script>` is `is:inline` is not scanned (inline scripts are not bundled and cannot import) — Task 4 test.
5. Comment stripping in `relativeImports` must not eat `//` inside a string such as `'https://x'` before a real import — Task 5 test.

---

### Task 1: Board URL state and pending mark (findings 1, 2, 3)

**Files:**

- Modify: `src/components/board/useBoardUrlState.ts`, `src/lib/board.ts`, `src/components/PlanInteractions.astro`, `src/pages/plan/board.astro`, `src/pages/plan/roadmap.astro`, `src/styles/components.css:75-80`
- Test: `test/board.test.ts`, `test/browser/board.browser.ts`

**Interfaces:**

- Produces: `boardUrl(state: BoardState, location: { pathname: string; search: string; hash: string }): string` in `src/lib/board.ts` — the pathname, then the non-board query keys in their original order followed by `boardQuery(state)`'s keys in its fixed order, then the hash.
- Produces: `PlanInteractions.astro` prop `board?: boolean` (default `false`).

- [x] **Step 1: Write the failing tests** in `test/board.test.ts`:
  - `boardUrl` keeps other keys: state `{ filters: { owner: 'agent', milestone: null, size: null, rag: null }, group: 'none' }`, location `{ pathname: '/plan/board/', search: '?utm=x&owner=user', hash: '#top' }` → `'/plan/board/?utm=x&owner=agent#top'`.
  - `boardUrl(DEFAULT_STATE, { pathname: '/plan/board/', search: '?utm=x', hash: '' })` → `'/plan/board/?utm=x'`; with search `'?owner=agent'` → `'/plan/board/'`.
- [x] **Step 2: Run** `bun test test/board.test.ts` in `packages/pm-docs-site`. Expected: FAIL, `boardUrl` is not exported.
- [x] **Step 3: Implement `boardUrl`**, and in `useBoardUrlState` call `history.replaceState(history.state, '', boardUrl(state, location))` when it differs from the current URL.
- [x] **Step 4: Scope the pending mark (2).** `PlanInteractions.astro` emits the `boardPending` block only when `board` is true; `src/pages/plan/board.astro` passes `board`, `roadmap.astro` does not. Update the component's header comment.
- [x] **Step 5: Document the 3s reveal (1).** In `components.css:75-80` and the `useBoardUrlState.ts` header add: a slow but successful hydration (over 3s) also shows the unfiltered board until the island applies the URL; accepted, so the board is never blank.
- [x] **Step 6: Browser test** in `test/browser/board.browser.ts`: `/plan/roadmap/?owner=agent` leaves `<html>` without `data-board-pending`; `/plan/board/?owner=agent&utm=x`, after changing the owner filter to `user`, has `location.search` `?utm=x&owner=user`.
- [x] **Step 7: Run** `bun test test/board.test.ts` and `bunx playwright test test/browser/board.browser.ts`. Expected: PASS.
- [x] **Step 8: Commit** `fix(pm-docs-site): board url keeps other keys and scopes its pending mark (R-042)`.

### Task 2: Board markup and CSS (findings 4, 7, 8)

**Files:**

- Modify: `src/components/board/Board.tsx:231-233`, `src/styles/components.css:228-237`, `src/styles/kanban.css:1-41`, and the CSS selector for `.plan-lane__header` if it styles a `div`
- Test: `test/browser/board.browser.ts`

- [x] **Step 1: Write the failing browser tests:**
  - grouped by owner, every `.plan-lane__header` is an `h3` (`page.locator('h3.plan-lane__header')` count equals the lane count).
  - with `localStorage['pm-docs-site:board:collapsed'] = '["done"]'` set before load, the bounding-box height of the collapsed `[data-column="done"]` header equals that of `[data-column="now"]` (within 1px).
- [x] **Step 2: Run** `bunx playwright test test/browser/board.browser.ts -g "lane header|collapsed header"`. Expected: FAIL.
- [x] **Step 3: Implement.** Lane header `<h3 className="plan-lane__header">`, with the margin reset so it looks the same. A collapsed column's toggle gets `max-block-size` equal to the expanded header's height (or the row's track sized from the expanded columns), `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`.
- [x] **Step 4: kanban.css (8).** Delete `cursor: grab` and both `.k-item:focus-visible` selectors (`.k-item:hover` stays); rewrite the header comment to list every change from the kit source: theme variables, RAG dot, and no drag cursor or focus ring (cards are not focusable; `test/browser/cards.browser.ts:10`).
- [x] **Step 5: Run** `bunx playwright test test/browser/board.browser.ts test/browser/cards.browser.ts`. Expected: PASS.
- [x] **Step 6: Commit** `fix(pm-docs-site): lane headings and collapsed column height (R-042)`.

### Task 3: board.ts and board-data.ts (findings 9, 10)

**Files:**

- Modify: `src/lib/board.ts:97-102,186-209`, `src/lib/board-data.ts:38,62`
- Test: `test/board.test.ts`, `test/board-data.test.ts`

**Interfaces:**

- Produces: `oneOf<T extends string>(values: readonly T[], value: string | null): value is T` in `src/lib/board.ts`; `isOwner(value: unknown): value is Owner` in `src/lib/board-data.ts` (or `board.ts` if `Owner` lives there).

- [x] **Step 1: Write the failing tests:**
  - `test/board.test.ts`: `lanes(cards, 'none', [])[0].cards` is not the same array as `cards` (`not.toBe`) and `toEqual(cards)`.
  - `test/board-data.test.ts`: an inline planning object (spread of the fixture with `board.columns.done` = `[{ id: null, title: 'Tidy README', milestone: null, owner: null, date: '2026-11-01' }]`, fields matching the fixture's done entry shape) gives a done card with `id: null` and `key: 'done:0'`; a done entry with `owner: 'robot'` gives `owner: null`; a card with a milestone has `tagHref` equal to that milestone's page href from the fixture.
- [x] **Step 2: Run** `bun test test/board.test.ts test/board-data.test.ts`. Expected: FAIL (same array; `'robot'` passes through).
- [x] **Step 3: Implement.** `oneOf` replaces the four casts in `parseBoardQuery`; `lanes()` builds `order` per group and shares one `order.filter(...).map(...)` tail; `'none'` returns `[...cards]`. `isOwner` replaces both `as Owner | null` casts (`value` not an owner → `null`).
- [x] **Step 4: Run** `bun test`. Expected: PASS.
- [x] **Step 5: Commit** `refactor(pm-docs-site): board helpers without casts (R-042)`.

### Task 4: Island import guard and plan.ts listeners (findings 14, 15)

**Files:**

- Modify: `test/island-imports.test.ts:127-139`, `src/scripts/plan.ts:38-72`
- Test: `test/island-imports.test.ts`, Create: `test/plan-script.test.ts`

**Interfaces:**

- Produces: `bundledScripts(astroSource: string): string[]` in `test/island-imports.test.ts` — the bodies of `<script>` elements without `is:inline`.
- Produces: `export function start(doc: Document = document): void` in `src/scripts/plan.ts`, a no-op for a document it already started (module-level `WeakSet<Document>`); the module calls `start()` only when `typeof document !== 'undefined'`.

- [x] **Step 1: Write the failing tests:**
  - `bundledScripts('<script is:inline>a</script><script>import x from "../lib/planning";</script>')` → `['import x from "../lib/planning";']`.
  - A planted source: `valueImportsOfGuardedLibs(bundledScripts('<script>import { features } from "../../lib/planning";</script>').join('\n'))` → `['../../lib/planning']`.
  - New case: every `.astro` file under `src/` (recursive) and every `.ts` file under `src/scripts/` has no value import of a guarded lib (scan `bundledScripts` for `.astro`, the whole file for `.ts`); `expect(files.length).toBeGreaterThan(0)`.
  - `test/plan-script.test.ts`: a stub `{ addEventListener: mock() }` cast `as unknown as Document`; `start(stub)` twice → `addEventListener` called 3 times (`pointerdown`, `pointerup`, `click`).
- [x] **Step 2: Run** `bun test test/island-imports.test.ts test/plan-script.test.ts`. Expected: FAIL (`bundledScripts` and `start` not defined/exported).
- [x] **Step 3: Implement** as in Interfaces. Today's files pass (agent check: `PlanInteractions.astro` imports only `../scripts/plan.ts`, which imports nothing).
- [x] **Step 4: Run** `bun test`. Expected: PASS.
- [x] **Step 5: Commit** `test(pm-docs-site): guard astro client scripts and start once per document (R-042)`.

### Task 5: Test hygiene (findings 11, 12, 16, 17, 20, 23, 27 package part)

**Files:**

- Modify: `test/integration.test.ts:71-87`, `test/install.test.ts:14-16`, `test/browser/board.browser.ts:198-226`, `test/helpers.ts:59-64`, `test/planning.test.ts:377-386`, `test/cli.test.ts:376-392`, `test/link-html.test.ts`, `test/links.test.ts`
- Test: `test/imports.test.ts`

**Interfaces:**

- Produces: `freePort(): Promise<number>` in `test/helpers.ts` (listen on port 0 with `node:net`, read the port, close).

- [x] **Step 1: relativeImports (17), failing test** in `test/imports.test.ts`: a file with `foo.import('./no.ts');`, `// import './comment.ts';`, `/* from './block.ts' */`, ``const t = await import(`./tpl.ts`);``, ``import(`./${x}.ts`)``, `const u = 'https://x'; import './after.ts';` → `['./tpl.ts', './after.ts']`. The existing case at `:29` still passes.
- [x] **Step 2: Run** `bun test test/imports.test.ts`. Expected: FAIL.
- [x] **Step 3: Implement.** Strip block and line comments outside string literals first (a small scanner over `'`, `"`, and `` ` `` quotes), then match with `(?<![.\w$])` before `from`/`import` and accept a backtick-quoted specifier with no `${`. Add the final newline to `test/helpers.ts`.
- [x] **Step 4: The rest.**
  - (11) Delete the "adds React with Starlight" test; the ordered `toEqual` at `:68` covers it.
  - (12) `afterAll(() => rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))`, comment updated; the 60s timeout goes.
  - (16) Replace the counted Starlight filters with `const ours = errors.filter((error) => /_astro\/Board|PlanInteractions|scripts\/plan/i.test(error.stack ?? ''))`, `expect(ours).toEqual([])`; shorten the comment to say vendor errors (Starlight's unguarded `localStorage` read) are ignored because they never name package code.
  - (20) In the populated case add a second Later/Next item with `revisits: 'R-003'` and assert both IDs in `features()` order.
  - (23) `const port = await freePort();` replaces `4399` in the dev test (name `dev --port <free port> serves on it`).
  - (27) Final newline in `test/link-html.test.ts` and `test/links.test.ts`.
- [x] **Step 5: Run** `bun test` and `bunx playwright test test/browser/board.browser.ts`. Expected: PASS.
- [x] **Step 6: Commit** `test(pm-docs-site): test hygiene from the deferred review (R-042)`.

### Task 6: References and the log page (findings 19, 21)

**Files:**

- Modify: `src/lib/references.ts:200-202`, `src/pages/plan/log.astro:15` (comment)
- Test: `test/references.test.ts`, the test that builds the fixture with views off (find it with `grep -rn "features: false" test`)

- [x] **Step 1: Failing test** in `test/references.test.ts`: with a fixture item that both depends on and revisits another, the target's page lists that item once as `related`.
- [x] **Step 2: Run** `bun test test/references.test.ts`. Expected: FAIL only if today's loop double-links; otherwise PASS and it pins the behaviour before the refactor.
- [x] **Step 3: Implement (21).** `new Set([...dependents(all, feature.id), ...revisers(all, feature.id)])` in `features()` order, one `page.link(other.id, 'related')` each.
- [x] **Step 4: Log page (19).** Keep the logged title; the comment at `:15` says the log is history, so it shows the title as logged. Add a test: with item pages off, `/plan/log/` shows `R-NNN <logged title>` as text, not a link (use the existing views-off build).
- [x] **Step 5: Run** `bun test`. Expected: PASS.
- [x] **Step 6: Commit** `refactor(pm-docs-site): related links reuse dependents and revisers (R-042)`.

### Task 7: CLI flags (finding 22)

**Files:**

- Modify: `lib/cli-args.ts:44-68`
- Test: `test/cli.test.ts`

- [x] **Step 1: Failing tests** (`parse` from `lib/cli-args.ts`):
  - `parse(['dev', 'site', '--port=4399'], {}).server` → `{ port: 4399 }`; `siteDir` ends with `site`.
  - `parse(['build', '--title=My plan', 'site'], {}).flags.title` → `'My plan'`; `--planning=docs/plan` and `--host=0.0.0.0` likewise.
  - `--port=` throws `pm-docs-site: --port needs a value`; `--port=0` throws `pm-docs-site: --port needs a port number (1-65535)`.
  - `parse(['build', '--verbose'], {})` throws `pm-docs-site: unknown option --verbose`.
- [x] **Step 2: Run** `bun test test/cli.test.ts -t parse`. Expected: FAIL.
- [x] **Step 3: Implement.** Split `--name=value` on the first `=` into name and value; the four flags take the value from there or the next argument; any other argument starting with `--` throws `pm-docs-site: unknown option <arg>`. Document in the `parse` doc comment.
- [x] **Step 4: Run** `bun test test/cli.test.ts`. Expected: PASS.
- [x] **Step 5: Commit** `fix(pm-docs-site): cli accepts --flag=value and rejects unknown options (R-042)`.

### Task 8: Distinct Mermaid IDs per section (finding 25, ADR-006)

**Files:**

- Modify: `lib/mermaid.ts:45-80`, `src/loaders/sections.ts:54-56`, its callers `src/loaders/adrs.ts:81` and `src/loaders/records.ts:32`
- Test: `test/mermaid.test.ts`

**Interfaces:**

- Produces: `renderSection(context, markdown: string, file: string, key: string)` — passes `fileURL: new URL('#' + key, pathToFileURL(file))`; `key` is the entry's `recordSectionId` (the `id` the caller already has). `filePath` is unchanged, so images still resolve.
- Produces: `mermaidFences()` computes the prefix on the first fence from `ctx.fileURL?.hash ?? ''` plus `factory.source` (hash, never the full path, so IDs are the same on every machine and docs pages without a hash keep today's IDs).

- [x] **Step 1: Failing test** in `test/mermaid.test.ts`: compile one identical mermaid source twice with `fileURL` `file:///x/ADR-001.md#adr-001-0` and `#adr-001-1`; the two `pele-<hash>-0` prefixes differ; compiling the first again gives the same prefix; without a fileURL the prefix equals today's (`sha256(source)` first 8 hex).
- [x] **Step 2: Run** `bun test test/mermaid.test.ts`. Expected: FAIL.
- [x] **Step 3: Implement** as in Interfaces; update the doc comment at `:45-53` and `describe()` (it already ignores the hash; check `fileURLToPath` drops it).
- [x] **Step 4: Run** `bun test` then `just package-test` from the repository root. Expected: PASS, including the ADR relative-image checks.
- [x] **Step 5: Commit** `fix(pm-docs-site): mermaid ids differ per section (R-042)`.

### Task 9: Skills, versions, and docs (findings 24, 27 skills part)

**Files:**

- Modify: `skills/pm-docs-site/SKILL.md:92,125`, `skills/pm-export/scripts/export.test.ts:122`, `packages/pm-docs-site/package.json`, `packages/pm-docs-site/README.md:34`, `docs/wiki/guide/Docs-Site-Package.md:33`, `package.json` (via the bump)

- [x] **Step 1: Node guard (24).** Add a Guard row after the Bun row: `node --version` is v24 or later | `Node 24 or later is required (found <version or none>). Install it, then run pm-docs-site <mode> again.`; at `:125` add `and whether node --version is v24 or later`. It runs with the other Guard checks, before any file is written.
- [x] **Step 2: Indent (27).** Indent the `it(` at `skills/pm-export/scripts/export.test.ts:122` and its body to the describe block's level.
- [x] **Step 3: Versions.** Package `version` `0.1.0-pre.8`; README and wiki pins `0.1.0-pre.8`. Run `just bump prerelease`.
- [x] **Step 4: Run** `just validate`, `just test`, and `just version-check`. Expected: PASS.
- [x] **Step 5: Commit** `fix(pm-docs-site): node 24 guard and release 0.1.0-pre.8 (R-042)`.

### Task 10: Final verification

- [ ] **Step 1: Run** `just package-test`. Expected: PASS.
- [ ] **Step 2: Run** `just lint-check` twice (R-056 anti-goal). Expected: PASS both times.
- [ ] **Step 3: Run** `just docs-check`. Expected: PASS.
- [ ] **Step 4:** Confirm every finding 1 to 25 and 27 maps to a task or a Won't fix line above.
