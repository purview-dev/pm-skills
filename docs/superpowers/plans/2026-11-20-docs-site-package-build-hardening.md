# R-027 Docs-site package: build hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `prepack` and the install test fail on anything that would break an installed `@purview-dev/pm-docs-site`, and stop the consumer docs naming a stale version.

**Architecture:** The two plain-Node package scripts (`scripts/build.ts`, `scripts/check-exports.ts`) walk `dist/` and `exports` fully. The install test checks every relative import in the packed tarball. A small repository script keeps the docs' pinned version equal to the package's.

**Tech Stack:** Node 24 (type stripping) for package scripts, Bun test, TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-11-20-docs-site-package-build-hardening-design.md`

## Global Constraints

- Branch `feat/r-027-docs-site-package-build-hardening`; create no other branch.
- Package scripts stay plain Node (`node:` imports only), so npm runs them without Bun.
- Nothing under `skills/` changes, so the rules version and root `package.json` stay as they are. The package version stays `0.1.0-pre.2` (the publish workflow skips a version already on npm).
- Conventional commits (`commitlint.config.mts`), for example `fix(pm-docs-site): ...`.
- `astro.config.ts` examples are fenced as `ts`.
- No file names `0.1.0-pre.1` as the published version.

## Review Focus

- A declaration in a nested `dist/` folder that imports `../x.ts`: the build must rewrite it and the install test must resolve it (Task 1, Task 3).
- A `.d.ts` under `default` or `import` in `exports`: `check-exports` must reject it (Task 2).
- A `bin` that points at a `.d.ts` or `.ts`: rejected like any other non-JavaScript entry (Task 2).
- An extensionless `src/` import (`'../lib/planning'`): the install test must resolve it as `.ts`/`.tsx`, not flag it (Task 3).
- A package version bump without updating the docs examples: `just validate` must fail and name the file (Task 4).

---

### Task 1: `@types/node` and a recursive build rewrite

**Files:**

- Modify: `packages/pm-docs-site/package.json` (`devDependencies`)
- Modify: `packages/pm-docs-site/scripts/build.ts:21-30`
- Test: `packages/pm-docs-site/test/build.test.ts`

**Interfaces:**

- Produces: `scripts/build.ts` rewrites `.ts` specifiers in every `.d.ts` under `dist/`, at any depth.

- [ ] **Step 1: Write the failing test** `it('rewrites .ts specifiers in nested declarations')` in `test/build.test.ts`. It writes `lib/__probe__/b.ts` (`export type B = string;`) and `lib/__probe__/a.ts` (`export type { B } from './b.ts';\nexport type { ResolvedOptions } from '../types.ts';`), runs `node scripts/build.ts`, and asserts `dist/__probe__/a.d.ts` contains `'./b.js'` and `'../types.js'` and does not match `/\.ts'/`. In a `finally`, remove `lib/__probe__` and rerun the build, so `dist/` holds no probe output.
- [ ] **Step 2: Run it and see it fail**
  Run: `cd packages/pm-docs-site; bun test test/build.test.ts`
  Expected: FAIL, `a.d.ts` still contains `'./b.ts'`.
- [ ] **Step 3: Walk `dist/` recursively in `scripts/build.ts`** with `readdirSync(join(root, 'dist'), { recursive: true }) as string[]`, filtering `.d.ts`; the regex already covers `../`. Update the file comment to say "every declaration under `dist/`".
- [ ] **Step 4: Add `"@types/node": "26.6.6"`** to `devDependencies` (the version already in `bun.lock`), in alphabetical order, then `bun install` in `packages/pm-docs-site`.
- [ ] **Step 5: Run the tests**
  Run: `cd packages/pm-docs-site; bun test test/build.test.ts`
  Expected: PASS, 3 tests. `git status` shows no `lib/__probe__`.
- [ ] **Step 6: Commit** `fix(pm-docs-site): rewrite nested declarations and pin @types/node (R-027)` with `package.json`, `bun.lock`, `scripts/build.ts`, `test/build.test.ts`.

### Task 2: `check-exports` accepts `.mjs`/`.cjs` and places `.d.ts` under `types`

**Files:**

- Modify: `packages/pm-docs-site/scripts/check-exports.ts`
- Create: `packages/pm-docs-site/test/check-exports.test.ts`

**Interfaces:**

- Produces: `node scripts/check-exports.ts [package-root]`. The root defaults to the package folder; exit 0 prints the existing success line, exit 1 prints `refusing to publish ...` with one indented `- <target>` line per problem.

- [ ] **Step 1: Write the failing tests** in `test/check-exports.test.ts`. A helper `check(pkg: object, files: string[]): { code: number; output: string }` writes `package.json` and empty `files` into a `mkdtempSync` folder and spawns `node scripts/check-exports.ts <dir>` from `PACKAGE`. Cases:
  - `exports: { '.': { types: './dist/index.d.ts', import: './dist/index.mjs', require: './dist/index.cjs' } }` with those files: code 0.
  - `exports: { '.': { default: './dist/index.d.ts' } }`: code 1, output contains `./dist/index.d.ts`.
  - `exports: { '.': { types: './dist/index.js' } }`: code 1 (a `types` target must be a declaration).
  - `bin: { x: './dist/cli.d.ts' }`: code 1.
  - `files: ['dist', 'missing.ts']`, with `dist/` present: code 1, output contains `missing.ts`.
- [ ] **Step 2: Run them and see them fail**
  Run: `cd packages/pm-docs-site; bun test test/check-exports.test.ts`
  Expected: FAIL. The script ignores the root argument, and the `.mjs` case is rejected.
- [ ] **Step 3: Implement it in `scripts/check-exports.ts`.** `root` is `resolve(process.argv[2])` when given. Walk `exports` with the condition key: a string reached under the key `types` must end `.d.ts`, `.d.mts`, or `.d.cts`. Every other `exports` string and every `bin` must end `.js`, `.mjs`, or `.cjs`, and must not end `.d.ts`. Update the message to `exports or bin point at the wrong kind of file`, and the comment to match.
- [ ] **Step 4: Run the tests**
  Run: `cd packages/pm-docs-site; bun test test/check-exports.test.ts; node scripts/check-exports.ts`
  Expected: PASS, 5 tests. The real package prints `every export, bin, and files entry exists`.
- [ ] **Step 5: Commit** `fix(pm-docs-site): check-exports reads conditions and .mjs/.cjs (R-027)`.

### Task 3: Ship `lib/types.ts` and resolve every import in the tarball

**Files:**

- Modify: `packages/pm-docs-site/package.json` (`files`)
- Modify: `packages/pm-docs-site/test/install.test.ts:34-66`

**Interfaces:**

- Consumes: Task 1's recursive build.

- [ ] **Step 1: Write the failing assertions** in `test/install.test.ts`:
  - Add `lib/types.ts` to the listing check, and change the comment to "The three lib/ files ship because src/ imports them".
  - Replace the top-level `.d.ts` loop with a recursive walk of the installed `dist/`. Match `/(?:from|import\()\s*'(\.\.?\/[^']+)'/g`. Each specifier ends `.js`, and its `.d.ts` exists beside the importing file (`join(dirname(file), ...)`).
  - Add a recursive walk of the installed `src/` (`.ts`, `.tsx`, `.astro`) with the same regex. Each specifier resolves to an existing file as given, or with `.ts`, `.tsx`, `/index.ts` appended. The failure message is `<file> imports <specifier>`.
- [ ] **Step 2: Run it and see it fail**
  Run: `cd packages/pm-docs-site; bun test test/install.test.ts`
  Expected: FAIL on `lib/types.ts` (missing from the listing and from `src/lib/references.ts`'s import).
- [ ] **Step 3: Add `"lib/types.ts"`** to `files` after `lib/schema-version.ts`.
- [ ] **Step 4: Run it**
  Run: `cd packages/pm-docs-site; bun test test/install.test.ts`
  Expected: PASS. A failure naming another `src/` import is a real gap: ship that file, or exclude the import with a comment that says why.
- [ ] **Step 5: Commit** `fix(pm-docs-site): ship lib/types.ts and resolve every tarball import (R-027)`.

### Task 4: Docs name no stale version, and `just validate` keeps the pin

**Files:**

- Create: `scripts/package-docs.ts`, `scripts/package-docs.test.ts`
- Modify: `scripts/validate.ts:271-277`
- Modify: `packages/pm-docs-site/README.md` (lines 31, 35, 219-220, 241), `docs/wiki/guide/Docs-Site-Package.md` (lines 14, 35, 39), `.config/purview-docs.yml:136`

**Interfaces:**

- Produces: `export function pinnedVersions(markdown: string): string[]` (every version in a `"@purview-dev/pm-docs-site": "<v>"` dependency line) and `export function versionDrift(file: string, markdown: string, version: string): string[]` (one message per pin that differs, `<file>: pins @purview-dev/pm-docs-site <v>, package.json is <version>`, or `<file>: no pinned @purview-dev/pm-docs-site example` when there is none).

- [ ] **Step 1: Write the failing tests** in `scripts/package-docs.test.ts`: `pinnedVersions` returns `['0.1.0-pre.2']` for a README snippet with one pin. `versionDrift('README.md', snippet, '0.1.0-pre.2')` is `[]`; with `'0.1.0-pre.3'` it is one message naming both versions; for text with no pin it is the "no pinned" message.
- [ ] **Step 2: Run them and see them fail**
  Run: `bun test scripts/package-docs.test.ts`
  Expected: FAIL, module not found.
- [ ] **Step 3: Implement both functions** in `scripts/package-docs.ts`. In `scripts/validate.ts`, inside the existing `packages/pm-docs-site/package.json` block, read the package version and `fail` each `versionDrift` message for `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md`.
- [ ] **Step 4: Run validate and see it fail** on both files.
  Run: `bun scripts/validate.ts`
  Expected: two `pins @purview-dev/pm-docs-site 0.1.0-pre.1, package.json is 0.1.0-pre.2` lines.
- [ ] **Step 5: Edit the docs.**
  - Change the two `package.json` examples to `0.1.0-pre.2`.
  - Change the two `astro.config.ts` fences from `js` to `ts`.
  - Wiki Status: `The package is in prerelease on npm under the prerelease dist-tag, so install it with ...`.
  - `.config/purview-docs.yml` outcome: `The package is in prerelease on npm, under the prerelease dist-tag.`
  - README publishing section: `It publishes a prerelease version (one with a -pre part) under the prerelease dist-tag`, and the first-publish step `set a prerelease version`.
- [ ] **Step 6: Verify**
  Run: `bun test scripts/package-docs.test.ts; bun scripts/validate.ts; git grep -n "0.1.0-pre.1" -- . ":!planning" ":!docs/superpowers"`
  Expected: tests PASS, `validate: ... OK`, and grep prints nothing.
- [ ] **Step 7: Commit** `docs(pm-docs-site): pin the example to package.json and fence configs as ts (R-027)`.

### Task 5: Whole-branch verification

- [ ] **Step 1:** Run `just test`, `just validate`, `just package-test`, and `bunx markdownlint-cli2 "**/*.md" "#node_modules"`. Expected: every command exits 0.
- [ ] **Step 2:** Run `cd packages/pm-docs-site; npm pack --dry-run`. Expected: `prepack` passes, and the listing includes `lib/types.ts` and no `lib/__probe__`.
