# R-008 Docs-site package: skeleton at parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/pm-docs-site/`, an Astro integration plus CLI that renders every page `docs-site/` renders today from `planning.json` and optional repository Markdown, with no `src/` folder in the consumer.

**Architecture:** The integration's `astro:config:setup` hook points Astro's `srcDir` at the package's own `src/` (pages, components, content config), adds Starlight, and serves the resolved options through the Vite virtual module `virtual:pm-docs-site/config`. Code that runs while `astro.config.mjs` loads is plain `.mjs` with JSDoc; code Vite compiles (`src/`) stays TypeScript and Astro. The CLI runs Astro's programmatic `build()`/`dev()` under Node.

**Tech Stack:** Astro 7.4.8, Starlight 0.42.10, TypeScript 6.0.3, `@astrojs/check` 0.9.12, Bun 1.4 (install, `bun test`, `bun pm pack`), Node >=22 (runs the CLI and every site build).

**Spec:** `docs/superpowers/specs/2026-11-17-docs-site-package-skeleton-design.md`

## Global Constraints

- Package name `@purview-dev/pm-docs-site`, `"version": "0.0.0"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=22" }`.
- Exact pins, no `^` or `~`: `astro` `7.4.8`, `@astrojs/starlight` `0.42.10` (both `dependencies`); `typescript` `6.0.3`, `@astrojs/check` `0.9.12` (`devDependencies`).
- Its own `packages/pm-docs-site/bun.lock`; the root `package.json` is not changed and does not become a workspace.
- Do not change anything under `skills/**`, `docs-site/**`, the root `package.json`, or `scripts/check-version.ts`. Tests copied from `docs-site/` are copies.
- `SUPPORTED_SCHEMA_VERSIONS = [3]`, declared once in `lib/schema-version.mjs`.
- `cli.mjs` starts with `#!/usr/bin/env node`; tests start it with `node`, never with Bun.
- The copied components in `src/components/lib/` keep their Astro Components Kit MIT attribution comment unchanged.
- No `{{PLACEHOLDER}}` remains anywhere in the package.
- Justfile recipes use the default `sh` shell; never set a shell in the justfile.
- Every Markdown file added passes `bunx markdownlint-cli2` (repository config).
- Commit messages follow commitlint conventional commits (`feat(pm-docs-site): ...`, `test(pm-docs-site): ...`, `ci: ...`).

## Review Focus

- A `planning` path that does not exist, or is not JSON: the build fails with the `PlanningExportError` message naming the path and `pm-export`, not a Vite stack trace. Test in Task 3.
- `docs` omitted: the site builds with an empty `docs` collection and no repository groups in the sidebar. Test in Task 4 (fixture `views` build has no `docs`).
- A site directory path containing a space: the CLI and the installed-consumer build resolve it. Task 5 builds in a temp folder whose name contains a space.
- `check` on a site with an `astro.config.mjs` that has no `pm-docs-site` integration: exits 1 with `pm-docs-site: no pm-docs-site integration in <file>`. Test in Task 4.
- Windows path handling for `srcDir` and the virtual module (backslashes, drive letters): options carry absolute paths made with `node:path` `resolve` and `srcDir` uses a `file:` URL. Tests run on the maintainer's Windows machine and on CI's Linux.

---

### Task 1: Package scaffold, options, and schemaVersion check

**Files:**

- Modify: `.gitignore` (after the `**/packages/*` line)
- Create: `packages/pm-docs-site/package.json`, `packages/pm-docs-site/tsconfig.json`, `packages/pm-docs-site/bun.lock` (by `bun install`)
- Create: `packages/pm-docs-site/lib/schema-version.mjs`, `packages/pm-docs-site/lib/options.mjs`, `packages/pm-docs-site/index.d.ts`
- Test: `packages/pm-docs-site/test/schema-version.test.ts`, `packages/pm-docs-site/test/options.test.ts`

**Interfaces:**

- Produces (`lib/schema-version.mjs`):
  - `export const SUPPORTED_SCHEMA_VERSIONS: readonly number[]` = `[3]`
  - `export class PlanningExportError extends Error` — constructor `(message: string)`, sets `message` to ``${message} Run the pm-export skill to write planning.json.`` and `name` to `'PlanningExportError'`.
  - `export function checkSchemaVersion(version: unknown, path: string): void` — throws `PlanningExportError` with ``${path} has schemaVersion ${String(version)}; this site reads schemaVersion ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`` when `version` is not in the list.
- Produces (`lib/options.mjs`, types in `index.d.ts`):
  - `export const VIEW_NAMES` = `['now', 'milestones', 'features', 'inbox', 'briefs', 'strategy']`
  - `PmDocsSiteOptions = { title: string; description?: string; planning?: string; docs?: { root: string; sources: DocsSource[] }; views?: ViewName[] }`
  - `ResolvedOptions = { title: string; description: string | null; planning: string; docs: { root: string; sources: DocsSource[] } | null; views: Record<ViewName, boolean> }` — `planning` and `docs.root` are absolute.
  - `export function resolveOptions(options: PmDocsSiteOptions, root: string): ResolvedOptions` — `planning` defaults to `'../planning/planning.json'`; `views` omitted means all `true`; resolves paths with `node:path` `resolve(root, ...)`.
  - Errors (plain `Error`): `pm-docs-site: title is required`; ``pm-docs-site: unknown view "${name}"; expected one of now, milestones, features, inbox, briefs, strategy``.
  - `DocsSource` type is declared in `index.d.ts` with the fields of `docs-site/src/loaders/repo-docs.ts:18-34`.

- [ ] **Step 1: Let git see the package.** Add `!/packages/pm-docs-site/` on the line after `**/packages/*` in `.gitignore`. Check: `git check-ignore -v packages/pm-docs-site/package.json` prints nothing (exit 1).

- [ ] **Step 2: Write `package.json` and `tsconfig.json`.** `package.json` per Global Constraints plus `"bin": { "pm-docs-site": "./cli.mjs" }`, `"exports": { ".": { "types": "./index.d.ts", "default": "./index.mjs" } }`, `"files": ["index.mjs", "index.d.ts", "cli.mjs", "lib", "src", "README.md"]`, scripts `"test": "bun test"`, `"check": "astro check --root test/fixtures/site"`. `tsconfig.json` extends `astro/tsconfigs/strict`, sets `"allowJs": true, "checkJs": true`, excludes `dist`, `node_modules`, `test/fixtures/**/dist`. Run `bun install` in `packages/pm-docs-site/`; `bun.lock` is created.

- [ ] **Step 3: Write the failing tests.**

```ts
// test/schema-version.test.ts
import { describe, expect, it } from 'bun:test';
import { checkSchemaVersion, PlanningExportError, SUPPORTED_SCHEMA_VERSIONS } from '../lib/schema-version.mjs';

describe('checkSchemaVersion', () => {
  it('supports schemaVersion 3 only', () => expect(SUPPORTED_SCHEMA_VERSIONS).toEqual([3]));
  it('accepts 3', () => expect(() => checkSchemaVersion(3, 'p.json')).not.toThrow());
  it.each([2, 4, '3', undefined])('rejects %p', (v) => {
    expect(() => checkSchemaVersion(v, 'p.json')).toThrow(PlanningExportError);
    expect(() => checkSchemaVersion(v, 'p.json')).toThrow(
      `p.json has schemaVersion ${String(v)}; this site reads schemaVersion 3. Run the pm-export skill to write planning.json.`,
    );
  });
});
```

`test/options.test.ts` asserts: `resolveOptions({ title: 'T' }, '/site')` gives `planning === resolve('/site', '../planning/planning.json')`, `docs === null`, `description === null`, and every `views` value `true`; `views: ['now']` gives `now: true` and the other five `false`; `docs: { root: '..', sources: [] }` gives `docs.root === resolve('/site', '..')`; `{}` throws `pm-docs-site: title is required`; `views: ['board']` throws the unknown-view message with `"board"`.

- [ ] **Step 4: Run them to see them fail.** `bun test` in `packages/pm-docs-site/` — FAIL, modules not found.

- [ ] **Step 5: Implement `lib/schema-version.mjs`, `lib/options.mjs`, and `index.d.ts`** with the interfaces above, JSDoc-typed (`// @ts-check` at the top of each `.mjs`).

- [ ] **Step 6: Run the tests.** `bun test` — PASS.

- [ ] **Step 7: Commit.**

```bash
git add .gitignore packages/pm-docs-site
git commit -m "feat(pm-docs-site): scaffold package with options and schemaVersion check"
```

### Task 2: Repository docs pages and the sidebar

**Files:**

- Create: `packages/pm-docs-site/lib/repo-docs.mjs` (pure functions from `skills/pm-docs-site/templates/repo-docs/src/loaders/repo-docs.ts`)
- Create: `packages/pm-docs-site/src/loaders/repo-docs.ts` (only `repoDocsLoader`, importing the rest from `../../lib/repo-docs.mjs`)
- Create: `packages/pm-docs-site/lib/sidebar.mjs`
- Test: `packages/pm-docs-site/test/repo-docs.test.ts` (copy of `docs-site/src/loaders/repo-docs.test.ts`), `packages/pm-docs-site/test/sidebar.test.ts`

**Interfaces:**

- Consumes: `ResolvedOptions`, `VIEW_NAMES` (Task 1).
- Produces (`lib/repo-docs.mjs`): `globToRegExp`, `pageId`, `pagesOf(source, repoRoot)`, `splitFrontmatter`, `splitTitle`, `readPage` — same signatures and behaviour as the template's TypeScript, with `DocsPage = { id: string; file: string }`.
- Produces (`src/loaders/repo-docs.ts`): `repoDocsLoader(options: { root: string; sources: DocsSource[] }): Loader`, unchanged behaviour.
- Produces (`lib/sidebar.mjs`): `buildSidebar(options: ResolvedOptions): SidebarItem[]` — a `Plan` group in the order of `docs-site/src/sidebar.ts` (Now, Board, Roadmap, Milestones, Features, Log, Risks, Inbox, Briefs, Strategy; the six optional ones only when their view is on), then, when `options.docs` is set, one group per non-hidden source with its `pagesOf` ids (empty groups dropped, `collapsed` from the source). No `Architecture` entry.

- [ ] **Step 1: Copy the loader test** to `test/repo-docs.test.ts`, change the import to `from 'bun:test'` (use `mock` / `spyOn` from `bun:test` where it used `vi`), and import the pure functions from `../lib/repo-docs.mjs` and `repoDocsLoader` from `../src/loaders/repo-docs`.

- [ ] **Step 2: Write `test/sidebar.test.ts`** asserting: with all views on and no docs, the result is exactly `[{ label: 'Plan', items: [ ten links ] }]` with the links `/plan/now/`, `/plan/board/`, `/plan/roadmap/`, `/plan/milestones/`, `/plan/features/`, `/plan/log/`, `/plan/risks/`, `/plan/inbox/`, `/plan/briefs/`, `/plan/strategy/` in that order; with `views: ['now']` the Plan items are Now, Board, Roadmap, Log, Risks; with `docs` pointing at `test/fixtures/docs` (Task 4 creates it; create a minimal two-file version now: `README.md` and `guide/intro.md`) and one source `{ label: 'Guide', base: '.', include: ['README.md', 'guide/*.md'], prefix: 'docs/' }`, a second group `{ label: 'Guide', collapsed: false, items: ['docs/readme', 'docs/guide/intro'] }` follows (use the ids `pageId` actually returns; assert against `pagesOf` output, not hand-written ids, if they differ).

- [ ] **Step 3: Run to see them fail.** `bun test` — FAIL, modules not found.

- [ ] **Step 4: Implement** `lib/repo-docs.mjs` (move the template's pure functions, JSDoc types), `src/loaders/repo-docs.ts`, and `lib/sidebar.mjs`.

- [ ] **Step 5: Run the tests.** `bun test` — PASS, including the copied loader tests unchanged in their assertions.

- [ ] **Step 6: Commit.**

```bash
git add packages/pm-docs-site
git commit -m "feat(pm-docs-site): repository docs loader and sidebar"
```

### Task 3: The integration, the virtual module, and the pages

**Files:**

- Create: `packages/pm-docs-site/index.mjs`, `packages/pm-docs-site/src/env.d.ts`, `packages/pm-docs-site/src/content.config.ts`
- Create (copied from `skills/pm-docs-site/templates/site/src/`): `src/lib/planning.ts`, `src/lib/planning-types.ts`, `src/components/{ExportStamp,FeatureTable,StateBadge}.astro`, `src/components/lib/{KanbanItemCard,StatusTimelineFeed,TaskKanbanCard}.astro`, `src/styles/components.css`, and the 13 page files under `src/pages/` (`index.astro`, `plan/{board,briefs,inbox,log,now,risks,roadmap,strategy}.astro`, `plan/features/{index,[id]}.astro`, `plan/milestones/{index,[milestone]}.astro`)
- Test: `packages/pm-docs-site/test/planning.test.ts` (copy of `docs-site/src/lib/planning.test.ts`), `packages/pm-docs-site/test/integration.test.ts`, `packages/pm-docs-site/test/fixtures/planning.json` (copy of `docs-site/src/lib/__fixtures__/planning.json`)

**Interfaces:**

- Consumes: `resolveOptions`, `ResolvedOptions` (Task 1); `buildSidebar` (Task 2); `checkSchemaVersion`, `PlanningExportError` (Task 1).
- Produces (`index.mjs`): `export default function pmDocsSite(options: PmDocsSiteOptions): AstroIntegration & { pmDocsSiteOptions: PmDocsSiteOptions }` with `name: 'pm-docs-site'`. In `astro:config:setup({ config, updateConfig })` it resolves options against `fileURLToPath(config.root)` and calls `updateConfig` once with `srcDir: new URL('./src/', import.meta.url)`, `integrations: [starlight({ title, description, sidebar: buildSidebar(resolved) })]`, `vite: { ssr: { noExternal: ['@astrojs/starlight', '@purview-dev/pm-docs-site'] }, plugins: [<virtual module plugin>] }`.
- Produces (virtual module): id `virtual:pm-docs-site/config`, resolved id `\0virtual:pm-docs-site/config`, source `export default ${JSON.stringify(resolved)};`. `src/env.d.ts` declares it with `ResolvedOptions` as the default export type.
- Produces (`src/lib/planning.ts`): every export listed today (`loadPlanning`, `sizeToPriority`, `initials`, `roadmapGroups`, `derivedRag`, `riskMatrix`, `docsHref`, `milestoneId`, `planProgress`, `severityToPriority`, `FEATURE_STATES`, `features`, `dependents`, `briefOf`, `milestoneSummaries`, `sourceInitials`, `briefAnchor`, `featureHref`, `milestoneHref`, and their types), except: `SCHEMA_VERSION` is replaced by re-exporting `SUPPORTED_SCHEMA_VERSIONS`; `PlanningExportError` is re-exported from `lib/schema-version.mjs`; `loadPlanning(path: string = config.planning)` reads the default from the virtual module and calls `checkSchemaVersion`.

- [ ] **Step 1: Copy the planning test** to `test/planning.test.ts` with `bun:test` imports and the fixture path `test/fixtures/planning.json`. Replace its `SCHEMA_VERSION` assertions with `checkSchemaVersion` behaviour already covered in Task 1, and keep a test that `loadPlanning` on a missing file throws `No plan export at <path>. Run the pm-export skill to write planning.json.` and on invalid JSON throws `<path> is not valid JSON`. Because `planning.ts` imports the virtual module, call `loadPlanning` with an explicit path and register the virtual module for the test with Bun's `mock.module('virtual:pm-docs-site/config', () => ({ default: <resolved options for the fixture> }))` before importing `planning.ts`.

- [ ] **Step 2: Write `test/integration.test.ts`**: call `pmDocsSite({ title: 'T' })`, run its `astro:config:setup` hook with a stub `config.root` of `pathToFileURL('/site/')` and a recording `updateConfig`; assert one call whose `srcDir.href` ends with `/packages/pm-docs-site/src/`, whose `integrations` has one entry named `@astrojs/starlight`, whose `vite.ssr.noExternal` equals the two names above, and whose virtual plugin `load('\0virtual:pm-docs-site/config')` returns source containing `"title":"T"`. Assert `pmDocsSite({ title: 'T' }).pmDocsSiteOptions` deep-equals `{ title: 'T' }`.

- [ ] **Step 3: Run to see them fail.** `bun test` — FAIL.

- [ ] **Step 4: Implement `index.mjs`, `src/env.d.ts`, `src/content.config.ts`.** The content config always defines `docs`: with `repoDocsLoader({ root: config.docs.root, sources: config.docs.sources })` when `config.docs` is set, else Starlight's `docsLoader()` (which finds no `src/content/docs/` and yields an empty collection).

- [ ] **Step 5: Copy the site files** listed under Files and replace each placeholder: `{{PM_ROOT}}planning.json` in comments and in `ExportStamp.astro`'s text becomes the export path relative to the site root, computed in `ExportStamp.astro` from `config.planning`; `{{SITE_TITLE}}`/`{{SITE_DESCRIPTION}}` in `index.astro` come from `config.title`/`config.description`; `DEFAULT_PATH` is gone (Interfaces). Replace every `import { views } from '...views'` with `import config from 'virtual:pm-docs-site/config'` and `views.x` with `config.views.x`; replace `modules.repoDocs` with `config.docs !== null` and drop `modules.architecture` branches. Check: `git grep -nE "\{\{[A-Z_]+\}\}" -- packages/pm-docs-site` prints nothing (stage the files first, or use the Grep tool).

- [ ] **Step 6: Run the tests.** `bun test` — PASS.

- [ ] **Step 7: Commit.**

```bash
git add packages/pm-docs-site
git commit -m "feat(pm-docs-site): integration, virtual config module, and the plan pages"
```

### Task 4: CLI, fixture site, and the parity snapshot

**Files:**

- Create: `packages/pm-docs-site/cli.mjs`, `packages/pm-docs-site/lib/site-options.mjs`
- Create: `packages/pm-docs-site/test/fixtures/site/package.json` (`{ "name": "pm-docs-site-fixture", "private": true, "type": "module" }`), `packages/pm-docs-site/test/fixtures/site/astro.config.mjs`, `packages/pm-docs-site/test/fixtures/docs/` (extend Task 2's files to 3 to 5 small pages, one in a subfolder), `packages/pm-docs-site/test/fixtures/expected-pages.txt`
- Test: `packages/pm-docs-site/test/cli.test.ts`, `packages/pm-docs-site/test/helpers.ts`

**Interfaces:**

- Consumes: `pmDocsSite` (Task 3), `resolveOptions` (Task 1), `checkSchemaVersion` (Task 1), `pagesOf` (Task 2).
- Produces (`lib/site-options.mjs`): `loadSiteOptions(siteDir: string, flags: { title?: string; planning?: string }): Promise<{ options: PmDocsSiteOptions; configFile: string | null }>` — finds `astro.config.{mjs,js,ts,mts}` in `siteDir`; when found, imports it and returns the `pmDocsSiteOptions` of the integration named `pm-docs-site`, or throws `pm-docs-site: no pm-docs-site integration in <file>`; when absent, returns `{ title: flags.title ?? 'Project plan', planning: flags.planning }` (omitting `planning` when the flag is absent).
- Produces (`cli.mjs`): `pm-docs-site <dev|build|check> [site-dir] [--title <t>] [--planning <p>]`, `site-dir` defaulting to `process.cwd()`. `build`/`dev` call `build`/`dev` from `astro` with `{ root: siteDir }`, adding `configFile: false, integrations: [pmDocsSite(options)]` when `configFile` is `null`. `check` resolves options, reads and parses `planning.json`, runs `checkSchemaVersion`, and checks each docs source's `base` exists; prints one line per problem and exits 1, else prints `pm-docs-site: ok (<planning path>, schemaVersion <n>)` and exits 0. An unknown command prints usage and exits 2. No flag-parsing dependency.
- Produces (`test/helpers.ts`): `runCli(args: string[], cwd?: string): { code: number; stdout: string; stderr: string }` (spawns `node <package>/cli.mjs` with `Bun.spawnSync`) and `htmlPages(distDir: string): string[]` (sorted, `/`-separated paths of every `.html` file relative to `distDir`).
- The fixture `astro.config.mjs`: `pmDocsSite({ title: 'Fixture plan', planning: '../planning.json', docs: { root: '../docs', sources: [<the Guide source from Task 2>] } })`, importing `pmDocsSite` from `../../../index.mjs`.

- [ ] **Step 1: Generate the parity snapshot from the current templates.** In a scratch folder outside the repository (for example `$TMPDIR/pmds-parity/`): create `planning/planning.json` (copy of the fixture), `docs/` (copy of `test/fixtures/docs/`), and `site/pm-docs-site.json` equal to `docs-site/pm-docs-site.json` with `"SITE_ROOT": "site"`; run `bun <repo>/skills/pm-docs-site/scripts/site.ts write <scratch>/site`; edit `site/src/docs-sources.ts` to the single Guide source with `base` relative to the scratch root (`docs`); `bun install` and `bun run build` in `site/`; write the sorted `.html` paths of `site/dist/` to `test/fixtures/expected-pages.txt`, one per line. Record the commands in the Step 7 commit body. Delete the scratch folder.

- [ ] **Step 2: Write the failing tests** in `test/cli.test.ts` (each with a 180 000 ms timeout):
  - `build renders every page the template site renders`: `runCli(['build', 'test/fixtures/site'])` exits 0 and `htmlPages('test/fixtures/site/dist')` equals the lines of `expected-pages.txt`.
  - `views switched off remove their pages`: build a temp copy of the fixture site whose config sets `views: ['now']` and no `docs`; assert no page path starts with `plan/milestones/`, `plan/features/`, `plan/inbox/`, `plan/briefs/`, or `plan/strategy/`, and `plan/now/index.html` exists.
  - `builds with no config file`: a temp folder holding only `package.json`; `runCli(['build', dir, '--title', 'Bare', '--planning', <abs fixture planning.json>])` exits 0 and `index.html` contains `Bare`.
  - `check passes on the fixture`: `runCli(['check', 'test/fixtures/site'])` exits 0 and stdout contains `schemaVersion 3`.
  - `check fails on schemaVersion 4`: a temp site whose planning copy has `"schemaVersion": 4`; exit 1, stdout or stderr contains `has schemaVersion 4; this site reads schemaVersion 3`.
  - `check fails without the integration`: a temp site whose `astro.config.mjs` exports `{}`; exit 1 with `no pm-docs-site integration in`.
  - `a missing planning file fails the build with the export message`: a temp site with `planning: './nope.json'`; `build` exits non-zero and output contains `No plan export at` and `pm-export`.

- [ ] **Step 3: Run to see them fail.** `bun test test/cli.test.ts` — FAIL, `cli.mjs` missing.

- [ ] **Step 4: Implement `lib/site-options.mjs` and `cli.mjs`** (Interfaces). Make `cli.mjs` executable in git: `git update-index --chmod=+x packages/pm-docs-site/cli.mjs` after adding it.

- [ ] **Step 5: Run the tests.** `bun test` — PASS. If the page set differs from the snapshot, fix the package; change the snapshot only for a page the spec removes (the `architecture` route, which the fixture does not produce).

- [ ] **Step 6: Type-check.** `bun run check` in `packages/pm-docs-site/` — `0 errors`.

- [ ] **Step 7: Commit.**

```bash
git add packages/pm-docs-site
git update-index --chmod=+x packages/pm-docs-site/cli.mjs
git commit -m "feat(pm-docs-site): CLI with build, dev and check, and the parity snapshot"
```

### Task 5: An installed consumer builds

**Files:**

- Test: `packages/pm-docs-site/test/install.test.ts`

**Interfaces:**

- Consumes: `htmlPages`, `expected-pages.txt` (Task 4), the fixture `astro.config.mjs` and `planning.json`.

- [ ] **Step 1: Write the failing test** `an installed package builds the fixture` (timeout 300 000 ms): `bun pm pack --destination <tmp>` in the package; create `<tmp>/consumer site/` (the space is deliberate) with `package.json` `{ "name": "consumer", "private": true, "type": "module", "dependencies": { "@purview-dev/pm-docs-site": "file:<tarball>" } }`; run `bun install` there; copy `planning.json` and `docs/` beside it and an `astro.config.mjs` equal to the fixture's but importing `pmDocsSite` from `'@purview-dev/pm-docs-site'`; run `node node_modules/@purview-dev/pm-docs-site/cli.mjs build .` with that folder as `cwd`; assert exit 0 and `htmlPages(dist)` equals `expected-pages.txt`. Delete `<tmp>` in `afterAll`.

- [ ] **Step 2: Run it.** `bun test test/install.test.ts` — it fails if the `files` list, the dependency placement, or `noExternal` is wrong; otherwise it passes at once. Fix the package (not the test) until it passes.

- [ ] **Step 3: Commit.**

```bash
git add packages/pm-docs-site/test/install.test.ts
git commit -m "test(pm-docs-site): build the fixture from a packed, installed package"
```

### Task 6: Repository wiring and the version check

**Files:**

- Create: `packages/pm-docs-site/README.md`
- Modify: `justfile` (new `package-test` recipe; add it to `lint-check`)
- Modify: `.github/workflows/ci.yml` (new `pm-docs-site-package` job)

**Interfaces:**

- Consumes: the package scripts `test` and `check` (Tasks 1 and 4).

- [ ] **Step 1: Write `README.md`**: what the package is, the consumer's three files with a sample `astro.config.mjs`, the options table from the spec, the CLI commands, `SUPPORTED_SCHEMA_VERSIONS`, and that it is unpublished until R-013. Check: `bunx markdownlint-cli2 packages/pm-docs-site/README.md` reports `0 issues`.

- [ ] **Step 2: Add the justfile recipe**, in the `Docs` group, with `[working-directory('packages/pm-docs-site')]`:

```just
# Test and type-check the pm-docs-site package (unpublished until R-013).
[group('Docs')]
[working-directory('packages/pm-docs-site')]
package-test:
    bun install --frozen-lockfile
    bun test
    bun run check
```

and change `lint-check: validate test pm-lint` to `lint-check: validate test pm-lint package-test`. Check: `just package-test` passes.

- [ ] **Step 3: Add the CI job** `pm-docs-site-package` (`name: pm-docs-site package`, `runs-on: ubuntu-latest`, `working-directory: packages/pm-docs-site`): checkout `actions/checkout@v6`; `oven-sh/setup-bun@v2` with `bun-version: latest`; `actions/setup-node@v4` with `node-version: 24`; then `bun install --frozen-lockfile`, `bun test`, `bun run check`, each as a named step like the `docs-site` job.

- [ ] **Step 4: Verify the whole repository.** Run `just lint-check` — passes (validate, tests, pm-lint, package-test, markdownlint). Run `just docs-check` — passes unchanged. Run `just version-check` — passes with no rules-marker bump (`git diff --name-only main...HEAD` shows no `skills/` path). If `origin/main` is behind local `main`, run `bun scripts/check-version.ts main` and record that in the commit body.

- [ ] **Step 5: Commit.**

```bash
git add packages/pm-docs-site/README.md justfile .github/workflows/ci.yml
git commit -m "ci: test the pm-docs-site package locally and in CI"
```
