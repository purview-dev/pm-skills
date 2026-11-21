# R-031 Docs-site package: review follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix or pin every deferred review finding in R-031's Note and stop the `Entry docs → 404 was not found` build warning.

**Architecture:** Small, independent fixes in `packages/pm-docs-site` (loaders, log page, tests), `scripts/check-demo.ts`, the demo export, and four text files. Each task is its own test cycle and commit.

**Tech Stack:** Bun (`bun test`), Astro 7 + Starlight 0.42.10, Playwright, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-21-docs-site-review-follow-ups-design.md`. The finding list is the `Note` in `planning/NOW.md`.

## Global Constraints

- Nothing under `skills/` changes (no rules bump; `just version-check` must pass).
- Branch `feat/r-031-docs-site-package-review-follow-ups`, already checked out; no new branch or worktree.
- Conventional commits (`commitlint.config.mts`); TypeScript only.
- Done when: each finding is fixed or pinned by a test; a docs-site build logs no `Entry docs → 404 was not found`; `just lint-check` passes.

## Review Focus

- A repository whose docs sources already produce a page ID `404`: its entry must be kept, not overwritten by the draft (Task 1, step 3 test).
- The production build must not gain a `404/index.html` page from the draft entry (Task 1: `expected-pages.txt` equality in the fixture build).
- `404.html` must still render Starlight's not-found text after the warning is gone (Task 1, step 1).
- The home page check must not flag the home page's non-empty-state text, only `plan-empty` elements (Task 3 tests).
- An unclosed `plan-empty` element must not swallow later `plan-empty` elements on the page (Task 3, step 1).

---

### Task 1: Silence the Starlight 404 warning

**Files:**
- Create: `packages/pm-docs-site/src/loaders/not-found.ts`
- Modify: `packages/pm-docs-site/src/content.config.ts`
- Modify: `packages/pm-docs-site/src/loaders/repo-docs.ts`
- Test: `packages/pm-docs-site/test/cli.test.ts`, `packages/pm-docs-site/test/not-found.test.ts` (create)

**Interfaces:**
- Produces: `NOT_FOUND_ID = '404'`; `NOT_FOUND_DATA` (`{ title: '404', template: 'splash', draft: true, editUrl: false, pagefind: false, hero: { tagline: 'Page not found. Check the URL or try using the search.' } }`, Starlight's English fallback). The repo-docs loader checks `pages.has(NOT_FOUND_ID)` inline.

- [ ] **Step 1: Write the failing assertions in `test/cli.test.ts`**

In `renders every page the template site renders` (repo-docs loader) and `leaves out the pages of views that are off` (no-docs loader), add:

```ts
const output = result.stdout + result.stderr;
expect(output).not.toMatch(/Entry docs → 404 was not found/);
expect(readFileSync(join(<site>, 'dist', '404.html'), 'utf8')).toContain('Page not found');
```

The fixture test's existing `expectedPages()` equality already fails if `404/index.html` is built.

- [ ] **Step 2: Run to verify they fail**

Run: `cd packages/pm-docs-site && bun test test/cli.test.ts -t "renders every page|views that are off"`
Expected: FAIL on the `Entry docs → 404` match.

- [ ] **Step 3: Write `test/not-found.test.ts`**

Test `NOT_FOUND_DATA` is a draft splash entry (`draft: true`, `template: 'splash'`), and that `repoDocsLoader` keeps a repository page with ID `404`: call its `load` with a fake context (`store` as a `Map`-backed `set/clear/delete`, `parseData: async ({ data }) => data`, `renderMarkdown: async () => ({ html: '' })`, `generateDigest: () => 'd'`, `logger: { info() {} }`, `config.root` a temp dir URL) over a temp docs folder holding `404.md` with source `{ base: '.', include: ['*.md'] }`, and assert the stored `404` entry's `filePath` ends `404.md` and its data has no `draft: true`. A second case without `404.md` asserts the stored `404` entry equals `NOT_FOUND_DATA` data.

- [ ] **Step 4: Implement**

`not-found.ts` exports `NOT_FOUND_ID` and `NOT_FOUND_DATA` with a comment: Starlight's 404 route calls `getEntry('docs', '404')`, Astro warns on a miss, and Starlight routes no draft in a production build, so no `/404/` page is built (dev serves it). `content.config.ts`: `NO_DOCS` gains `{ id: NOT_FOUND_ID, ...NOT_FOUND_DATA }`. `repoDocsLoader`: after the `sync` calls, when `!pages.has(NOT_FOUND_ID)`, `store.set({ id: NOT_FOUND_ID, data: await parseData({ id: NOT_FOUND_ID, data: NOT_FOUND_DATA }) })`; the unlink handler leaves it alone.

- [ ] **Step 5: Run to verify they pass**

Run: `cd packages/pm-docs-site && bun test test/not-found.test.ts test/cli.test.ts`
Expected: PASS. Then `just docs-check` and confirm its build log has no `Entry docs → 404` line.

- [ ] **Step 6: Commit**

```bash
git add packages/pm-docs-site/src/loaders packages/pm-docs-site/src/content.config.ts packages/pm-docs-site/test
git commit -m "fix(pm-docs-site): give Starlight a draft 404 entry (R-031)"
```

### Task 2: Reference links (R-019 findings)

**Files:**
- Modify: `packages/pm-docs-site/src/lib/ref-boundary.ts` (comment only)
- Modify: `packages/pm-docs-site/src/pages/plan/log.astro:41`
- Test: `packages/pm-docs-site/test/references.test.ts`, `packages/pm-docs-site/test/cli.test.ts`

**Interfaces:**
- Consumes: `siteRefs().known` (`src/lib/references`), `RefLink`, `LinkedText`.

- [ ] **Step 1: Pin the slash boundary in `references.test.ts`**

In `describe('linkify')`, add `it('does not link an ID after a slash or a brief path after ./', ...)`: text `'M1/M2 and R-012/R-011; ./planning/briefs/2026-11-07-referrals.md'` (substitute IDs that are targets in `known` if one is not), asserting the linked runs are only the first ID of each pair, and the joined runs equal the text. This passes today; it pins the behaviour.

- [ ] **Step 2: Add the boundary comment**

In `ref-boundary.ts`, above `REF_BEFORE`: an ID after `/` is deliberately not linked (`M1/M2` links only `M1`), because a `/` also starts a path segment (`src/M1`); `test/references.test.ts` pins it.

- [ ] **Step 3: Write the failing log test in `cli.test.ts`**

`it('links known IDs in the title of a log entry whose ID has no page', ...)`: `scratchFixture('log-')`, push onto `planning.board.activity` `{ date: '2026-11-12', kind: 'dropped', id: 'R-998', title: 'Folded into R-012', milestone: null, owner: null, result: 'Reason: duplicate.' }`, build with `views: ['now']`, and assert `plan/log/index.html` contains `R-998 ` followed by an `<a href=` whose text is R-012's label.

- [ ] **Step 4: Run to verify it fails**

Run: `cd packages/pm-docs-site && bun test test/cli.test.ts -t "log entry"`
Expected: FAIL (title printed as plain text).

- [ ] **Step 5: Implement in `log.astro`**

When `entry.id` is set and `siteRefs().known.get(entry.id)` has no `href`, render `{entry.id} <LinkedText text={entry.title} />`; otherwise keep `<RefLink ref={entry.id} ... />`.

- [ ] **Step 6: Run and commit**

Run: `cd packages/pm-docs-site && bun test test/references.test.ts test/cli.test.ts -t "log entry|linkify"` — PASS.

```bash
git add packages/pm-docs-site/src packages/pm-docs-site/test
git commit -m "fix(pm-docs-site): link IDs in unlinked log titles, pin the slash boundary (R-031)"
```

### Task 3: Demo check (R-020 findings)

**Files:**
- Modify: `scripts/check-demo.ts`
- Modify: `examples/demo/planning/planning.json` (`source` only)
- Test: `scripts/check-demo.test.ts`

- [ ] **Step 1: Write the failing tests**

- `reports an empty state on the home page`: `index.html` with `<p class="plan-empty">Nothing in Next can be started.</p>` → `['index.html: empty state "Nothing in Next can be started."']`.
- Replace `ignores empty states outside plan/` with `ignores empty states outside plan/ and the home page` using `docs/guide/index.html`.
- `does not take data-class as a class`: `<p data-class="plan-empty">x</p>` under `plan/` → `[]`.
- `an unclosed plan-empty element does not hide a later one`: `<div class="plan-empty">A<div class="plan-empty">B</div>` → failures include `empty state "B"`.
- Replace `ignores an allowed use` with a `risks` entry (`plan/risks/index.html`, `<td class="plan-empty">–</td>` → `[]`), since the `Nothing links here yet.` entry is removed.

- [ ] **Step 2: Run to verify they fail**

Run: `bun test scripts/check-demo.test.ts` — the home page, `data-class`, and unclosed cases FAIL.

- [ ] **Step 3: Implement**

Check `index.html` and every `plan/` page (empty states and placeholders). In `emptyStates`, require the attribute to be `class` itself: `\sclass="`. Bound each element's end at the next `plan-empty` opening tag when its closing tag is not found before it. Drop the `Nothing links here yet.` `ALLOWED` entry and update the header comment (home page and `plan/`).

- [ ] **Step 4: Pin the demo's neutral source**

Set `"source": { "branch": "main", "head": null }` in `examples/demo/planning/planning.json`. `export.ts write --frozen` keeps it from then on.

- [ ] **Step 5: Verify and commit**

Run: `bun test scripts/check-demo.test.ts` — PASS; `just demo-check` — exit 0 (the export validates and the home page has no empty state; if it has one, that is a real demo gap to report, not to allowlist).

```bash
git add scripts/check-demo.ts scripts/check-demo.test.ts examples/demo/planning/planning.json
git commit -m "test(demo): check the home page, tighten empty-state parsing, neutral source (R-031)"
```

### Task 4: Graph browser test helpers (R-023 findings)

**Files:**
- Modify: `packages/pm-docs-site/test/browser/graph.browser.ts:47-109,379-405`
- Modify: `packages/pm-docs-site/playwright.config.ts:1-7`

- [ ] **Step 1: Count animation frames separately**

In `sampleFrames`, add `let rafSamples = 0` and replace `stopAtFrame` with `stopAtSample`: each `sample()` increments `rafSamples`; on the first frame the toolbar is shown set `stopAtSample = rafSamples + 5`; stop when `rafSamples >= stopAtSample`. Observer records no longer count toward the tail. Update the doc comment.

- [ ] **Step 2: Record the ended state as hidden**

The observer's removal record pushes `{ pending: true, visible: false, layout: <current data-layout> }`, with a comment: it marks the state the removal ended, when the pending CSS rule still hid the graph, so it is never read after the removal.

- [ ] **Step 3: Name a missing edge path**

In `arrowheadFill`'s evaluate: `if (!path) return { fill: null, markerEnd: null, reason: 'no edge path' };` before the `marker-end` check.

- [ ] **Step 4: Playwright comment**

Add to the header: there is no `dev` project in this config; the dev run is only `bun run test:browser:dev`.

- [ ] **Step 5: Verify and commit**

Run: `cd packages/pm-docs-site && bun run test:browser -- --project=chromium test/browser/graph.browser.ts` — PASS.

```bash
git add packages/pm-docs-site/test/browser/graph.browser.ts packages/pm-docs-site/playwright.config.ts
git commit -m "test(pm-docs-site): sample real frames after hydration, name a missing edge path (R-031)"
```

### Task 5: Build and install test hygiene (R-027 findings 1 to 3)

**Files:**
- Modify: `packages/pm-docs-site/.gitignore`, `packages/pm-docs-site/test/build.test.ts:37-55`
- Modify: `packages/pm-docs-site/test/helpers.ts`, `packages/pm-docs-site/test/install.test.ts:23-28,85-94`
- Test: `packages/pm-docs-site/test/imports.test.ts` (create)

**Interfaces:**
- Produces (in `test/helpers.ts`): `relativeImports(file: string): string[]` (moved from `install.test.ts`) and `resolvesToFile(base: string, suffixes: string[]): boolean`.

- [ ] **Step 1: Write `test/imports.test.ts`**

In a temp dir: a file with `import '../styles/x.css';`, `import "./a.ts";`, `export { b } from './b.ts';`, `await import('./c.ts')` → `relativeImports` returns all four specifiers. `resolvesToFile(join(dir, 'sub'), ['', '.ts'])` is `false` when `sub/` is a directory only, and `true` once `sub.ts` exists.

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/pm-docs-site && bun test test/imports.test.ts` — FAIL (exports missing).

- [ ] **Step 3: Implement**

Move `relativeImports` to `helpers.ts`, matching side-effect imports too: `/(?:from|import\s*\(|import)\s*(['"])(\.\.?\/[^'"]+)\1/g`. `resolvesToFile` returns whether any `base + suffix` exists and `statSync(...).isFile()`. `install.test.ts` imports both and uses `resolvesToFile(base, ['', '.ts', '.tsx', '/index.ts'])`.

- [ ] **Step 4: Probe hygiene**

Add `lib/__probe__/` to `packages/pm-docs-site/.gitignore`. In `build.test.ts`, remove `probe` before creating it, and in `finally` assert the restoring rebuild's `exitCode` is `0` (with its output as the message).

- [ ] **Step 5: Verify and commit**

Run: `cd packages/pm-docs-site && bun test test/imports.test.ts test/build.test.ts test/install.test.ts` — PASS.

```bash
git add packages/pm-docs-site/.gitignore packages/pm-docs-site/test
git commit -m "test(pm-docs-site): side-effect imports, file-only resolution, probe cleanup (R-031)"
```

### Task 6: Wording (R-027 findings 4 and 5)

**Files:**
- Modify: `.github/workflows/publish-pm-docs-site.yml:151`, `docs/wiki/contributing/Repository-Layout.md:57`, `packages/pm-docs-site/README.md:225`, `docs/wiki/contributing/Development.md:71`

- [ ] **Step 1: Edit**

Replace "non-JavaScript" with check-exports' wording: missing entry points or entry points of the wrong kind of file. In `Development.md`: ``Prereleases use the `pre` id (for example `0.1.0-pre.1`).``

- [ ] **Step 2: Verify and commit**

Run: `rg -n "non-JavaScript" .github docs packages/pm-docs-site/README.md` — no output.

```bash
git add .github/workflows/publish-pm-docs-site.yml docs/wiki packages/pm-docs-site/README.md
git commit -m "docs: match check-exports wording, mark the prerelease example (R-031)"
```

### Task 7: Final verification

- [ ] **Step 1:** `just lint-check` — exit 0.
- [ ] **Step 2:** `just package-test` — exit 0 (includes `demo-check`).
- [ ] **Step 3:** `just docs-check` — exit 0, and its build output has no `Entry docs → 404` line.
- [ ] **Step 4:** `just version-check` — exit 0 (no `skills/` change).
