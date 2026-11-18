# Docs-site package: TypeScript source with a build step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every hand-written file in `packages/pm-docs-site` is TypeScript, and a `tsc` build emits the Node-loaded entry points into `dist/` for the published tarball.

**Architecture:** `index` and `cli` move into `lib/` beside the other Node modules; `tsc -p tsconfig.build.json` emits `lib/` to `dist/` (JavaScript and `.d.ts`), and `exports`/`bin` point at `dist/`. In-repo tests run the `.ts` source (Bun imports it, Node strips its types); the packed-install test is the one that runs the built tarball.

**Tech Stack:** TypeScript 6.0.3 (`rewriteRelativeImportExtensions`, `erasableSyntaxOnly`), Bun 1.4 (`bun test`, `bun pm pack`), Node 24, Astro 7, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-18-docs-site-package-typescript-design.md`

## Global Constraints

- No `.js`, `.mjs`, or `.cjs` file in `git ls-files packages/pm-docs-site`.
- `engines.node` is `>=24`; docs say "Node 24 or later".
- Package `version` is `0.1.0-pre.2`.
- `bin`: `{ "pm-docs-site": "./dist/cli.js" }`; `exports`: `{ ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`.
- `files`: `dist`, `src`, `lib/repo-docs.ts`, `lib/schema-version.ts`, `README.md`, `LICENSE.md`.
- `prepack` builds then runs `node scripts/check-exports.ts`; `prepublishOnly` is removed.
- Source uses erasable syntax only; relative imports name the `.ts` file.
- Nothing under `skills/` or `docs-site/` changes. Historical specs and plans under `docs/superpowers/` stay as written.
- `scripts/check-exports.ts` runs under plain Node (no Bun APIs).

## Review Focus

- A stale `dist/` file from a renamed or deleted `lib/` module must not ship: the build empties `dist/` first (Task 2, `build` test).
- Emitted `.d.ts` files must not point at `.ts` files missing from the tarball: every relative specifier in `dist/*.d.ts` resolves to a `dist/*.d.ts` (Task 2, install test).
- A consumer that still has `astro.config.mjs` keeps working (Task 1, `cli.test.ts` back-compat case).
- A `.ts` file reaching `exports` or `bin` fails before publish (Task 2, `check-exports` `.js`-target check).
- A site path with a space still builds from the tarball (kept in `install.test.ts`'s `consumer site` folder).

---

### Task 1: Convert the source to TypeScript and move the entry points into `lib/`

**Files:**

- Create (by `git mv` + edit): `lib/index.ts` (from `index.mjs`), `lib/cli.ts` (from `cli.mjs`), `lib/options.ts`, `lib/repo-docs.ts`, `lib/schema-version.ts`, `lib/sidebar.ts`, `lib/site-options.ts`, `test/browser/serve.ts`, `test/fixtures/site/astro.config.ts`
- Delete: `index.d.ts` (its types move into `lib/index.ts`, or a `lib/types.ts` it re-exports)
- Modify: `tsconfig.json`, `src/env.d.ts`, `src/lib/planning.ts:12-14`, `src/loaders/repo-docs.ts:2,11-12`, `test/helpers.ts:7,52-57`, `test/cli.test.ts`, `test/links.test.ts`, `test/integration.test.ts:8`, `test/options.test.ts`, `test/repo-docs.test.ts`, `test/schema-version.test.ts`, `test/setup.ts`, `test/sidebar.test.ts`, `playwright.config.ts:21`

All paths are relative to `packages/pm-docs-site/`.

**Interfaces:**

- Produces: `lib/index.ts` default export `pmDocsSite(options: PmDocsSiteOptions): AstroIntegration & { pmDocsSiteOptions: PmDocsSiteOptions }`, and exported types `ViewName`, `DocsSource`, `PmDocsSiteOptions`, `ResolvedOptions` (same shapes as today's `index.d.ts`). `lib/cli.ts` keeps `#!/usr/bin/env node` and today's commands. Every other `lib/*.ts` keeps its current exported names.
- `test/helpers.ts`: `CLI = join(PACKAGE, 'lib', 'cli.ts')`; `siteConfig()` imports `lib/index.ts` by file URL.

- [x] **Step 1: Point the tests at the TypeScript paths**

Change every test import from `../lib/<name>.mjs` to `../lib/<name>.ts` and `../index.mjs` to `../lib/index.ts`; set `CLI` and `siteConfig` as in Interfaces; scratch sites in `cli.test.ts` and `links.test.ts` write `astro.config.ts`. Keep one `cli.test.ts` case writing `astro.config.mjs`:

```ts
it('still reads a site whose config is astro.config.mjs', () => {
  const dir = scratchFixture('cli-mjs-');
  writeFileSync(join(dir, 'site', 'astro.config.mjs'), siteConfig(`{ title: 'Legacy', planning: '../planning.json', views: ['now'] }`));
  const result = runCli(['build', join(dir, 'site')]);
  expect(result.code).toBe(0);
  expect(existsSync(join(dir, 'site', 'dist', 'plan', 'now', 'index.html'))).toBe(true);
});
```

- [x] **Step 2: Run the tests to see them fail**

Run: `bun test test/options.test.ts test/cli.test.ts`
Expected: FAIL, `Cannot find module '../lib/options.ts'`.

- [x] **Step 3: Rename and convert the ten files**

`git mv` each file to its new path, then turn JSDoc types into TypeScript types and drop `// @ts-check`. Relative imports name `.ts` (`./options.ts`, `import('./index.ts')`). In `lib/index.ts`, every `new URL('./src/…', import.meta.url)` becomes `new URL('../src/…', import.meta.url)`. `test/browser/serve.ts` sets `PACKAGE` from `../../` as today, writes `astro.config.ts`, imports `lib/index.ts`, and runs `lib/cli.ts` with `process.execPath`. The fixture config imports `'../../../lib/index.ts'`. `install.test.ts` and `dev-server.ts` replace the string `'../../../lib/index.ts'` with the package name and write `astro.config.ts`. `playwright.config.ts` runs `node test/browser/serve.ts`. `src/` imports `../../lib/repo-docs.ts` and `../../lib/schema-version.ts`, plus types from `../../lib/index.ts` (`import type`). `src/env.d.ts` uses `import('../lib/index.ts').ResolvedOptions`. Update comments that name the old files.

- [x] **Step 4: Update `tsconfig.json`**

Remove `allowJs` and `checkJs`. Add `erasableSyntaxOnly: true` and `allowImportingTsExtensions: true` (if the Astro strict base does not already set it). Add `dist` to `exclude` (already present).

- [x] **Step 5: Run the source tests and the type-check**

Run: `bun test` then `bun run check`
Expected: every test passes except `test/install.test.ts`, which still packs the old `package.json` entries and is restored in Task 2; `astro-check` reports 0 errors.

- [x] **Step 6: Commit**

```bash
git add -A packages/pm-docs-site
git commit -m "refactor(pm-docs-site): TypeScript source, entry points in lib/ (R-021)"
```

### Task 2: Build `dist/`, repoint the package, and test the tarball

**Files:**

- Create: `tsconfig.build.json`, `scripts/build.ts`, `scripts/check-exports.ts` (`git mv` from `scripts/check-exports.mjs`)
- Modify: `package.json`, `.gitignore`, `test/install.test.ts`, `test/browser/dev-server.ts:63`
- Test: `test/build.test.ts` (new), `test/install.test.ts`

**Interfaces:**

- Consumes: Task 1's `lib/*.ts`.
- Produces: `dist/index.js`, `dist/index.d.ts`, `dist/cli.js`, `dist/<module>.js` and `.d.ts` for each `lib/*.ts`; `scripts/build.ts` (empties `dist/`, then runs `tsc -p tsconfig.build.json`, exits with its code).

- [x] **Step 1: Write the failing build test**

`test/build.test.ts`:

```ts
it('emits JavaScript and declarations for every lib module and nothing stale', () => {
  mkdirSync(join(PACKAGE, 'dist'), { recursive: true });
  writeFileSync(join(PACKAGE, 'dist', 'stale.js'), '');
  const result = Bun.spawnSync(['node', 'scripts/build.ts'], { cwd: PACKAGE, stdout: 'pipe', stderr: 'pipe' });
  expect(result.exitCode).toBe(0);
  const emitted = readdirSync(join(PACKAGE, 'dist')).sort();
  const modules = readdirSync(join(PACKAGE, 'lib')).filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3));
  expect(emitted).toEqual(modules.flatMap((m) => [`${m}.d.ts`, `${m}.js`]).sort());
  expect(readFileSync(join(PACKAGE, 'dist', 'cli.js'), 'utf8')).toStartWith('#!/usr/bin/env node');
  expect(readFileSync(join(PACKAGE, 'dist', 'index.js'), 'utf8')).not.toMatch(/from '\.\/[^']+\.ts'/);
});
```

If `tsc` emits `.d.ts.map` or `.js.map`, turn maps off in `tsconfig.build.json` rather than widening the test.

- [x] **Step 2: Extend the install test**

In `test/install.test.ts`, after `bun pm pack`, list the tarball (`tar -tzf <tarball>`) and assert: it has `package/dist/cli.js`, `package/dist/index.js`, `package/dist/index.d.ts`, `package/lib/repo-docs.ts`, `package/lib/schema-version.ts`; it has no `package/lib/index.ts` and no `package/lib/cli.ts`. After install, for each `dist/*.d.ts` in the installed package, every relative specifier (`from './x.ext'`) resolves to `dist/x.d.ts`. Then run `node node_modules/@purview-dev/pm-docs-site/dist/cli.js build .` in the consumer once, in addition to the existing `bun run build`, and compare pages to `expectedPages()` both times.

- [x] **Step 3: Run them to see them fail**

Run: `bun test test/build.test.ts test/install.test.ts`
Expected: FAIL. `scripts/build.ts` is missing, and the tarball has no `dist/`.

- [x] **Step 4: Add the build**

- `tsconfig.build.json` extends `./tsconfig.json`: `include: ["lib"]`, `compilerOptions`: `rootDir: "lib"`, `outDir: "dist"`, `declaration: true`, `noEmit: false`, `rewriteRelativeImportExtensions: true`, `sourceMap: false`, `declarationMap: false`. Add any `allowImportingTsExtensions` or `noEmit` override that `tsc` needs to emit.
- `scripts/build.ts`: `rmSync(dist, { recursive: true, force: true })`, then `spawnSync(process.execPath, [<package>/node_modules/typescript/bin/tsc, '-p', 'tsconfig.build.json'], { stdio: 'inherit' })`, and exit with its status. Plain Node.
- `scripts/check-exports.ts`: today's logic, typed, plus a check that every `exports` and `bin` string ends in `.js`. A non-`.js` target is listed under `refusing to publish … : exports or bin point at non-JavaScript files`.
- `package.json`: `version` `0.1.0-pre.2`; `engines.node` `>=24`; `bin`, `exports`, and `files` as in Global Constraints; scripts `"build": "node scripts/build.ts"`, `"prepack": "node scripts/build.ts && node scripts/check-exports.ts"`; delete `prepublishOnly`.
- `.gitignore`: add `/dist/`.
- `test/browser/dev-server.ts`: spawn `…/@purview-dev/pm-docs-site/dist/cli.js`.

- [x] **Step 5: Run the tests**

Run: `bun test` then `bun run check`
Expected: all pass, including `build.test.ts` and `install.test.ts`. If the tarball has no `dist/` (`bun pm pack` skipped `prepack`), make the install test run `bun run build` before packing, and record that in a comment.

- [x] **Step 6: Check the exports guard rejects a `.ts` target**

Run: temporarily set `bin` to `./lib/cli.ts`, then `node scripts/check-exports.ts`, then restore it.
Expected: exit 1 and `./lib/cli.ts` listed; after the restore, exit 0.

- [x] **Step 7: Run the browser tests**

Run: `bunx playwright test`
Expected: both projects (`chromium` and `dev`) pass.

- [x] **Step 8: Commit**

```bash
git add -A packages/pm-docs-site
git commit -m "build(pm-docs-site): emit dist/ with tsc and publish it (R-021)"
```

### Task 3: Build before the publish checks, pinned

**Files:**

- Modify: `.github/workflows/publish-pm-docs-site.yml` (the step running `node scripts/check-exports.mjs`, and the comment at line 119)
- Test: `scripts/workflows.test.ts:89-110`

**Interfaces:**

- Consumes: Task 2's `build` and `prepack` scripts.

- [x] **Step 1: Update the pins**

```ts
it('tests, checks, and builds before it checks the exports and publishes', () => {
  const order = ['run: bun test', 'run: bun run check', 'run: bun run build', 'node scripts/check-exports.ts', 'npm publish'].map((step) => publish.indexOf(step));
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});
// …
it('builds and checks the exports on every pack, so a local publish cannot ship a missing build', () => {
  expect(pkg.scripts.prepack).toBe('node scripts/build.ts && node scripts/check-exports.ts');
  expect(pkg.scripts.prepublishOnly).toBeUndefined();
});
```

- [x] **Step 2: Run them to see them fail**

Run (repository root): `bun test scripts/workflows.test.ts`
Expected: FAIL on `run: bun run build` and `node scripts/check-exports.ts` (`indexOf` is -1).

- [x] **Step 3: Edit the workflow**

Add a step `- name: Build` with `run: bun run build` after `Type-check`. Change the exports step to `run: node scripts/check-exports.ts`. Change the line 119 comment to Node 24.

- [x] **Step 4: Run the test**

Run: `bun test scripts/workflows.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add .github/workflows/publish-pm-docs-site.yml scripts/workflows.test.ts
git commit -m "ci(pm-docs-site): build before the publish checks (R-021)"
```

### Task 4: Documentation

**Files:**

- Modify: `packages/pm-docs-site/README.md` (lines 11, 18, 36, 99, 110, 157-160, and the Releasing section), `README.md:74,99`, `docs/wiki/guide/Docs-Site-Package.md:22,40,82`, `docs/wiki/contributing/Repository-Layout.md:51-55`, `docs/wiki/contributing/Development.md:25`, `.config/purview-docs.yml:125,133`, `justfile:70`

- [x] **Step 1: Edit**

- Consumer config: `astro.config.mjs` → `astro.config.ts`.
- Node: "Node 22 or later" → "Node 24 or later".
- File names: `lib/schema-version.mjs` → `lib/schema-version.ts`; `scripts/check-exports.mjs` → `scripts/check-exports.ts`.
- Releasing: `prepublishOnly` → `prepack`, which builds `dist/` and then checks the exports.
- Repository-Layout: `lib/index.ts` (the integration and its types), `lib/cli.ts`, `dist/` (built, gitignored, published).
- Package README line 11: keep the history (`0.1.0-pre.1` is on npm) unless the sentence names the current version; then say `0.1.0-pre.2`.

- [x] **Step 2: Check no stale names remain**

Run (repository root): `git grep -nE "cli\.mjs|index\.mjs|index\.d\.ts|lib/[a-z-]+\.mjs|check-exports\.mjs|serve\.mjs|Node 22" -- . ':!docs/superpowers' ':!planning' ':!skills' ':!**/bun.lock'`
Expected: no output, except `astro.config.mjs` lines that describe the template site under `skills/` (excluded) and the `cli.test.ts` back-compat case.

- [x] **Step 3: Lint**

Run: `just lint-check`
Expected: exit 0 (Markdown, validate, tests, pm-lint, package-test).

- [x] **Step 4: Commit**

```bash
git add -A README.md docs/wiki .config/purview-docs.yml justfile packages/pm-docs-site/README.md
git commit -m "docs(pm-docs-site): TypeScript config, Node 24, and the build step (R-021)"
```

### Task 5: Verify the Done when

- [x] **Step 1: No JavaScript tracked**

Run: `git ls-files packages/pm-docs-site | Select-String -Pattern '\.(js|mjs|cjs)$'`
Expected: no output.

- [x] **Step 2: Package checks**

Run: `just package-test` then `just version-check`
Expected: both exit 0; `version-check` accepts `0.1.0-pre.2` as forward and untagged.

- [x] **Step 3: Fixture config**

Run: `git ls-files packages/pm-docs-site/test/fixtures/site`
Expected: lists `astro.config.ts` and no `astro.config.mjs`.
