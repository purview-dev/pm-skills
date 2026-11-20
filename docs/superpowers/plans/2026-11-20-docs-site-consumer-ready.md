# R-019 Docs-site package: consumer-ready for 1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove what a consumer of `@purview-dev/pm-docs-site` sees that belongs to this repository, and close the CLI, link, and fallback gaps in R-019's `Done when`.

**Architecture:** Targeted fixes where each finding lives, one test each. Two small shared pieces: `checkExport` in `lib/schema-version.ts` (used by the CLI and `loadPlanning`) and the reference boundary pattern in `src/lib/ref-boundary.ts` (used by `linkify` and the link test's scanner).

**Tech Stack:** TypeScript, Bun test (`bun test`, preload `test/setup.ts` mocks `virtual:pm-docs-site/config`), Astro 7 + Starlight, Node 24 for the CLI.

**Spec:** `docs/superpowers/specs/2026-11-20-docs-site-consumer-ready-design.md`

## Global Constraints

- All work is in `packages/pm-docs-site/` on branch `feat/r-019-docs-site-package-consumer-ready-for-1-0-0`; no new branch or worktree.
- Run commands from `packages/pm-docs-site/` unless stated.
- TypeScript only (`.ts`, `.astro`); no new dependencies.
- No export schema or `schemaVersion` change; `SUPPORTED_SCHEMA_VERSIONS` stays `[4]`.
- Error text keeps the pm-export hint by going through `PlanningExportError` (it appends `Run the pm-export skill to write planning.json.`).
- Commits use conventional commits, scope `pm-docs-site`, ending `(R-019)`.
- Out of scope: R-027 (build hardening), R-028 (accessibility, timeline, empty card), R-013 (publish).

## Review Focus

1. A `planning.json` holding `[]`, a number, or a string must fail like `null` (pm-export hint, exit 1), never a TypeError — Task 1 tests `null` and `[]`.
2. Astro may still warn that the `docs` collection is empty even with an inline loader returning `[]`; the build test must assert the absence of both warnings, and the fix must not just hide one — Task 3.
3. A brief path or ID at the very start of a string, or after `(`, must still link after the boundary change — Task 4 keeps the existing `(RK-002)` assertion and adds start-of-string.
4. A flag given together with a config file during `build` (not only `check`) must warn — the warning lives in `loadSiteOptions`, which both paths call; Task 2 tests `check`, which is enough because the code path is shared.
5. A Log line whose ID has no target must still show the ID beside its title, not the title alone — Task 5 pins `R-404 Lost item`.

---

### Task 1: A non-object export fails with the pm-export hint

**Files:**

- Modify: `lib/schema-version.ts`
- Modify: `lib/cli.ts:51-56` (the `problems` export check)
- Modify: `src/lib/planning.ts:29-39` (`loadPlanning`)
- Test: `test/schema-version.test.ts`, `test/cli.test.ts`

**Interfaces:**

- Produces: `export function checkExport(value: unknown, path: string): asserts value is { schemaVersion: number }` in `lib/schema-version.ts`. Throws `PlanningExportError(`${path} does not hold a plan export (found ${kind}).`)` where `kind` is `null`, `an array`, or `typeof value`, when `value` is not a non-array object; otherwise calls `checkSchemaVersion(value.schemaVersion, path)`.

- [x] **Step 1: Write the failing tests**

In `test/schema-version.test.ts`:

```ts
describe('checkExport', () => {
  it('rejects null and arrays with the pm-export hint', () => {
    expect(() => checkExport(null, 'p.json')).toThrow('p.json does not hold a plan export (found null). Run the pm-export skill');
    expect(() => checkExport([], 'p.json')).toThrow('(found an array)');
  });

  it('checks the schemaVersion of an object', () => {
    expect(() => checkExport({ schemaVersion: 4 }, 'p.json')).not.toThrow();
    expect(() => checkExport({ schemaVersion: 5 }, 'p.json')).toThrow('has schemaVersion 5');
  });
});
```

In `test/cli.test.ts`, `describe('pm-docs-site check')`:

```ts
it('fails with the pm-export hint when planning.json holds null', () => {
  const dir = scratchFixture('null-');
  writeFileSync(join(dir, 'planning.json'), 'null');
  writeFileSync(join(dir, 'site', 'astro.config.ts'), siteConfig(`{ title: 'Null', planning: '../planning.json' }`));

  const result = runCli(['check', join(dir, 'site')]);
  const output = result.stdout + result.stderr;

  expect(result.code).toBe(1);
  expect(output).toContain('does not hold a plan export (found null)');
  expect(output).toContain('pm-export');
  expect(output).not.toContain('TypeError');
}, CHECK);
```

- [x] **Step 2: Run to verify they fail**

Run: `bun test test/schema-version.test.ts test/cli.test.ts -t "checkExport|holds null"`
Expected: FAIL (`checkExport` is not exported; the CLI prints a TypeError).

- [x] **Step 3: Implement `checkExport` and use it**

Add `checkExport` to `lib/schema-version.ts`. In `lib/cli.ts` `problems`, replace `checkSchemaVersion(planning.schemaVersion, ...)` with `checkExport(planning, options.planning)`. In `loadPlanning`, type the parsed value as `unknown` and call `checkExport(planning, path)` instead of `checkSchemaVersion`. Re-export nothing new from `planning.ts`.

- [x] **Step 4: Run to verify they pass**

Run: `bun test test/schema-version.test.ts test/cli.test.ts test/planning.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/schema-version.ts lib/cli.ts src/lib/planning.ts test/schema-version.test.ts test/cli.test.ts
git commit -m "fix(pm-docs-site): a non-object export fails with the pm-export hint (R-019)"
```

### Task 2: The CLI warns when a flag is ignored

**Files:**

- Modify: `lib/site-options.ts:26` (after a config file is found)
- Modify: `packages/pm-docs-site/README.md` `## CLI` section
- Test: `test/cli.test.ts`

**Interfaces:**

- Consumes: `loadSiteOptions(siteDir, flags)` (unchanged signature).
- Produces: one `console.warn` line per flag given while a config file exists, exactly `pm-docs-site: --<flag> is ignored: <configFile> sets the options.` (`<flag>` is `title` or `planning`), before the config is loaded.

- [x] **Step 1: Write the failing test**

```ts
it('warns that --title and --planning are ignored when the site has a config file', () => {
  const result = runCli(['check', FIXTURE_SITE, '--title', 'X', '--planning', 'nope.json']);

  expect(result.code, result.stderr).toBe(0);
  expect(result.stderr).toContain('pm-docs-site: --title is ignored:');
  expect(result.stderr).toContain('pm-docs-site: --planning is ignored:');
  expect(result.stderr).toContain('astro.config.ts sets the options.');
}, CHECK);
```

- [x] **Step 2: Run to verify it fails**

Run: `bun test test/cli.test.ts -t "are ignored"`
Expected: FAIL (no warning on stderr).

- [x] **Step 3: Implement the warning in `loadSiteOptions`; add one README line under `## CLI` saying the flags apply only to a site without an `astro.config.*` and are otherwise ignored with a warning.**

- [x] **Step 4: Run to verify it passes**

Run: `bun test test/cli.test.ts -t "check|usage"`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/site-options.ts README.md test/cli.test.ts
git commit -m "feat(pm-docs-site): warn when a CLI flag is ignored (R-019)"
```

### Task 3: A consumer build shows no repository text and no docs warnings

**Files:**

- Modify: `src/pages/index.astro:129`
- Modify: `src/content.config.ts`
- Test: `test/cli.test.ts` (`'leaves out the pages of views that are off'`, a build without the `docs` option)

**Interfaces:**

- Produces: nothing other tasks use.

- [x] **Step 1: Extend the failing test**

Add to `'leaves out the pages of views that are off'`, after the existing assertions:

```ts
const output = result.stdout + result.stderr;
const home = readFileSync(join(dir, 'site', 'dist', 'index.html'), 'utf8');

expect(home).not.toContain('just docs-preview');
expect(home).toContain('pm-docs-site build');
expect(output).not.toContain('src/content/docs');
expect(output).not.toMatch(/collection "docs" (does not exist|is empty)/);
```

- [x] **Step 2: Run to verify it fails**

Run: `bun test test/cli.test.ts -t "views that are off"`
Expected: FAIL on `just docs-preview` and the Starlight base-directory warning.

- [x] **Step 3: Implement**

`index.astro`: the Search line reads `Search — every page above is in the site search once the site is built (<code>pm-docs-site build</code>)`. `content.config.ts`: when `config.docs` is null use `loader: () => []` instead of `docsLoader()`, drop the `docsLoader` import, and update the header comment. If Astro still logs an empty-collection warning, find its source in `node_modules/astro` and remove the cause (for example a `getCollection('docs')` call that Starlight makes only when entries exist); do not filter the log.

- [x] **Step 4: Run to verify it passes**

Run: `bun test test/cli.test.ts -t "build"` then `bun run check`
Expected: PASS; `astro-check` reports 0 errors.

- [x] **Step 5: Commit**

```bash
git add src/pages/index.astro src/content.config.ts test/cli.test.ts
git commit -m "fix(pm-docs-site): no repository text or docs warnings in a consumer build (R-019)"
```

### Task 4: linkify uses the link scanner's boundaries

**Files:**

- Create: `src/lib/ref-boundary.ts`
- Modify: `src/lib/references.ts:71-77` (`ID`, `linkify`)
- Modify: `test/scan.ts:25`
- Test: `test/references.test.ts`

**Interfaces:**

- Produces, in `src/lib/ref-boundary.ts` (no imports, so the test helper can load it):
  - `export const REF_BEFORE = String.raw`(?<![\w/-])``
  - `export const REF_AFTER = String.raw`(?![\w-])``
  - `export function refPattern(alternatives: string[]): RegExp` — `new RegExp(`${REF_BEFORE}(?:${alternatives.join('|')})${REF_AFTER}`, 'g')`; callers pass escaped alternatives, longest first.

- [x] **Step 1: Write the failing test**

```ts
it('never links an ID inside a path or a longer token', () => {
  const text = 'R-012 starts; see docs/plans/R-012-x.md and R-012-draft.';
  const linked = linkify(text, known).filter((run) => run.target).map((run) => run.text);

  expect(linked).toEqual(['R-012']);
});
```

- [x] **Step 2: Run to verify it fails**

Run: `bun test test/references.test.ts -t "inside a path"`
Expected: FAIL (three `R-012` links).

- [x] **Step 3: Implement**

`linkify` builds its pattern with `refPattern([...briefPaths, 'RK-\\d{3,}', 'R-\\d{3,}', 'M\\d+'])`, brief paths escaped and sorted longest first; remove the `\b`-bounded `ID` constant. `test/scan.ts` builds its pattern with `refPattern(keys)` and its own `escape` stays.

- [x] **Step 4: Run to verify it passes**

Run: `bun test test/references.test.ts test/links.test.ts`
Expected: PASS, including the existing `(RK-002)` and brief-path assertions and the whole-site link test.

- [x] **Step 5: Commit**

```bash
git add src/lib/ref-boundary.ts src/lib/references.ts test/scan.ts test/references.test.ts
git commit -m "fix(pm-docs-site): linkify uses the link scanner's boundaries (R-019)"
```

### Task 5: RefLink prints fallback text for an unknown key

**Files:**

- Modify: `src/lib/references.ts` (add `refText`)
- Modify: `src/components/RefLink.astro`
- Modify: `src/pages/plan/log.astro:41`, `src/pages/plan/roadmap.astro:52`, `src/components/FeatureSummary.astro:49`, `src/components/FeatureTable.astro:53`
- Test: `test/references.test.ts`

**Interfaces:**

- Produces: `export function refText(target: Target | undefined, ref: string | null | undefined, label: 'full' | 'id', fallback?: string): string` — with a target: `target.label` for `full`, `ref` for `id`; without one: `fallback ?? ref ?? ''`.
- RefLink gains `fallback?: string` and renders `refText(...)`.

- [x] **Step 1: Write the failing test**

```ts
describe('refText', () => {
  const target = known.get('R-012');

  it('names a known target, or its key for label id', () => {
    expect(refText(target, 'R-012', 'full')).toBe(target!.label);
    expect(refText(target, 'R-012', 'id', 'unused')).toBe('R-012');
  });

  it('prints the fallback for an unknown key, else the key', () => {
    expect(refText(undefined, 'R-404', 'full', 'R-404 Lost item')).toBe('R-404 Lost item');
    expect(refText(undefined, 'none', 'full', 'No milestone')).toBe('No milestone');
    expect(refText(undefined, 'R-404', 'full')).toBe('R-404');
    expect(refText(undefined, null, 'full')).toBe('');
  });
});
```

- [x] **Step 2: Run to verify it fails**

Run: `bun test test/references.test.ts -t refText`
Expected: FAIL (`refText` is not exported).

- [x] **Step 3: Implement `refText`, use it in RefLink, and pass fallbacks**

`log.astro`: `<RefLink ref={entry.id} fallback={`${entry.id} ${entry.title}`} />`. The three milestone call sites pass `fallback="No milestone"` (on `roadmap.astro` only when the ref is `'none'`; the others are `feature.milestone ?? 'none'`, so pass `fallback={feature.milestone ?? 'No milestone'}`).

- [x] **Step 4: Run to verify it passes**

Run: `bun test test/references.test.ts test/links.test.ts` then `bun run check`
Expected: PASS; 0 errors.

- [x] **Step 5: Commit**

```bash
git add src/lib/references.ts src/components/RefLink.astro src/pages/plan/log.astro src/pages/plan/roadmap.astro src/components/FeatureSummary.astro src/components/FeatureTable.astro test/references.test.ts
git commit -m "fix(pm-docs-site): RefLink prints fallback text for an unknown key (R-019)"
```

### Task 6: Pin docsHref prefixes and the Node floor; Windows drive note

**Files:**

- Modify: `packages/pm-docs-site/README.md` (`## A consumer site`)
- Test: `test/planning.test.ts` (`describe('docsHref')`), `test/cli.test.ts`

**Interfaces:**

- Consumes: `docsPages(docs)`, `docsHref(path, pages)` (unchanged).

- [x] **Step 1: Write the tests**

`test/planning.test.ts`:

```ts
it('links through a source prefix and not a path no source maps', () => {
  const root = fileURLToPath(new URL('./fixtures/docs/', import.meta.url));
  const pages = docsPages({ root, sources: [{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }] });

  expect(docsHref('guide/intro.md', pages)).toBe('/docs/guide/intro/');
  expect(docsHref('docs/superpowers/plans/2026-10-27-tenant-model.md', pages)).toBeNull();
});
```

`test/cli.test.ts`, `describe('pm-docs-site check')`:

```ts
it('declares a Node floor that strips the TypeScript of astro.config.ts', () => {
  const { engines } = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8'));

  // Node 24 loads erasable TypeScript without a flag; the check test above loads astro.config.ts under node.
  expect(engines.node).toBe('>=24');
});
```

(`PACKAGE` is exported by `test/helpers.ts`; add it to the import.)

- [x] **Step 2: Run them**

Run: `bun test test/planning.test.ts test/cli.test.ts -t "source prefix|Node floor"`
Expected: PASS (behaviour already in place; these tests pin it). If either fails, fix the code before continuing.

- [x] **Step 3: Add the README line**

Under `## A consumer site`: on Windows, keep the site and the installed package on the same drive; a package linked from another drive fails the build.

- [x] **Step 4: Lint**

Run (repo root): `bunx markdownlint-cli2 packages/pm-docs-site/README.md`
Expected: 0 errors.

- [x] **Step 5: Commit**

```bash
git add test/planning.test.ts test/cli.test.ts README.md
git commit -m "test(pm-docs-site): pin docs prefixes and the Node floor; Windows drive note (R-019)"
```

### Task 7: Verify the branch

- [x] **Step 1:** Run `bun test` and `bun run check` in `packages/pm-docs-site/`. Expected: all pass, 0 errors.
- [x] **Step 2:** Run `just package-test` and `just lint-check` from the repo root. Expected: both exit 0.
- [x] **Step 3:** Walk R-019's nine `Done when` checks in `planning/NOW.md` and name the test that proves each.
