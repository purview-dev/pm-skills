# R-017 Docs-site package: in-repo dev hydrates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `pm-docs-site dev` on the in-repo fixture (and on linked consumers) hydrates the Board island, because the package's own folder is in Vite's `server.fs.allow`.

**Architecture:** A pure containment helper in a new `lib/fs-allow.ts`, and a `pm-docs-site:fs-allow` Vite plugin appended to the integration's `vite.plugins` in `lib/index.ts`, whose `configResolved` hook appends the package's real directory to the resolved `server.fs.allow` when no entry already contains it.

**Tech Stack:** TypeScript, Astro 7 integration API, Vite plugin hooks, `bun test`.

**Spec:** `docs/superpowers/specs/2026-11-18-docs-site-package-in-repo-dev-design.md`

## Global Constraints

- TypeScript only: new code is `.ts` in `lib/` and `test/`; no new `.js` or `.mjs`.
- No new dependency, and no new Playwright project.
- Never narrow the allow list: Vite's default entries and any `server.fs.allow` the consumer set stay, in order; the plugin only appends.
- No change in behaviour for a packed-install consumer (the package folder is already under an allowed entry, so nothing is appended).
- Work on the checked-out branch `feat/r-017-docs-site-package-in-repo-dev-hydrates`; all commands run from `packages/pm-docs-site` unless stated.

## Review Focus

- Windows paths: Vite stores resolved `fs.allow` entries with forward slashes; the appended entry must be forward-slash too, and a `\`-separated entry must still be recognised as containing the package. Pinned in Task 1 (helper cases) and Task 2 (appended value).
- A sibling folder sharing a prefix (`/repo/pm-docs-site-old` against `/repo/pm-docs-site`) must not count as containing it. Pinned in Task 1.
- The hook firing twice on the same config (Astro re-resolves Vite config on restart) must not append a second entry. Pinned in Task 2.
- An entry that is a parent of the package (the repository root, or a consumer's own allow entry) leaves the list unchanged. Pinned in Task 2.
- Existing plugin order: `test/integration.test.ts` takes the first plugin as `pm-docs-site:config`, so the new plugin goes last. Pinned by the existing test staying green.

---

### Task 1: Containment helper

**Files:**
- Create: `lib/fs-allow.ts`
- Test: `test/fs-allow.test.ts`

**Interfaces:**
- Produces: `export function containsPath(entry: string, path: string): boolean` — true when `relative(entry, path)` is `''`, or neither starts with `..` nor is absolute (`node:path`).

- [ ] **Step 1: Write the failing test** `test/fs-allow.test.ts`, `describe('containsPath')`:
  - `containsPath('/repo/pkg', '/repo/pkg')` is `true` (equal)
  - `containsPath('/repo', '/repo/pkg')` is `true` (inside)
  - `containsPath('/repo/pkg', '/repo')` is `false` (parent is not inside)
  - `containsPath('/repo/pkg', '/repo/pkg-old')` is `false` (shared prefix)
  - `containsPath('/other', '/repo/pkg')` is `false` (outside)
  - `it.if(process.platform === 'win32')`: `containsPath('C:/repo', 'D:/repo/pkg')` is `false`, and `containsPath('C:\\repo', 'C:/repo/pkg')` is `true`

- [ ] **Step 2: Run it to see it fail**

Run: `bun test test/fs-allow.test.ts`
Expected: FAIL, cannot resolve `../lib/fs-allow.ts`.

- [ ] **Step 3: Implement `containsPath` in `lib/fs-allow.ts`** with a one-line header comment saying why it exists (Vite's `server.fs.allow` in linked and in-repo sites).

- [ ] **Step 4: Run it to see it pass**

Run: `bun test test/fs-allow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/fs-allow.ts test/fs-allow.test.ts
git commit -m "feat(pm-docs-site): fs.allow containment helper (R-017)"
```

### Task 2: The `pm-docs-site:fs-allow` plugin, and the Done when check

**Files:**
- Modify: `lib/index.ts` (constants near `PACKAGE_NAME`; the `vite.plugins` list in `astro:config:setup`)
- Test: `test/integration.test.ts`

**Interfaces:**
- Consumes: `containsPath(entry, path)` from Task 1.
- Produces: a plugin `{ name: 'pm-docs-site:fs-allow', configResolved(config: { server: { fs: { allow: string[] } } }): void }`, last in `vite.plugins`.

- [ ] **Step 1: Reproduce the bug.** From `packages/pm-docs-site`, run `bun lib/cli.ts dev test/fixtures/site` in the background, open `http://localhost:4321/plan/board/?group=owner` (playwright-cli), and confirm the server log shows a `server.fs.allow` refusal for `node_modules/@astrojs/react/dist/client.js` and the Board does not hydrate. Stop the server. If it does not reproduce, stop and report: the item may already be fixed by R-021.

- [ ] **Step 2: Write the failing tests** in `test/integration.test.ts`, `describe('pm-docs-site:fs-allow')`. Add `configResolved?: (config: { server: { fs: { allow: string[] } } }) => void` to the local `Plugin` type. Expected package dir: `realpathSync(fileURLToPath(new URL('../', import.meta.url))).replaceAll('\\', '/')`.
  - it is the last plugin, named `pm-docs-site:fs-allow`
  - with `allow: ['/site']`, after `configResolved` the list is `['/site', <package dir>]`
  - calling `configResolved` twice on the same config leaves exactly one package entry
  - with `allow: [<parent of package dir>]`, the list is unchanged
  - with `allow: [<package dir with \ separators>]` on Windows (`it.if`), the list is unchanged

- [ ] **Step 3: Run them to see them fail**

Run: `bun test test/integration.test.ts`
Expected: the new tests FAIL (no `pm-docs-site:fs-allow` plugin); existing tests pass.

- [ ] **Step 4: Implement.** In `lib/index.ts` add `const PACKAGE_DIR = realpathSync(fileURLToPath(new URL('../', import.meta.url))).replaceAll('\\', '/');` with a comment that `lib/index.ts` (in the repository) and `dist/index.js` (installed) both sit one level below the package folder, and that Vite stores allow entries with forward slashes. Append the plugin last in `vite.plugins`; its `configResolved` pushes `PACKAGE_DIR` onto `config.server.fs.allow` unless `some(entry => containsPath(entry, PACKAGE_DIR))`. Comment why: the in-repo fixture and linked consumers resolve the package outside the site's workspace root. Do not skip when `server.fs.strict` is `false` (appending is harmless; one code path).

- [ ] **Step 5: Run the package tests and checks**

Run: `bun test`, then `bun run check`, then `bun run build`
Expected: all tests pass, `astro-check` reports 0 errors, the build writes `dist/fs-allow.js` and `dist/index.js`.

- [ ] **Step 6: Verify the Done when.** Run `bun lib/cli.ts dev test/fixtures/site` in the background, open `http://localhost:4321/plan/board/?group=owner` with playwright-cli, and confirm the Board island hydrated (its `astro-island` has no `ssr` attribute and changing the group control re-renders the columns) and the server log has no `server.fs.allow` line. Stop the server.

- [ ] **Step 7: Run the repository checks** from the repository root.

Run: `just lint-check`, then `just docs-check`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add lib/index.ts test/integration.test.ts
git commit -m "fix(pm-docs-site): allow the package folder in dev for in-repo and linked sites (R-017)"
```
