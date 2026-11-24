# Docs-site package: architecture view (R-045) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** astroc4 renders `purview:likec4` markers as LikeC4 views (Mermaid fallback), and `@purview-dev/pm-docs-site` gains an `architecture` option that loads astroc4 only when set.

**Architecture:** Part A adds a `markers` step inside astroc4's existing `likec4Fences` Sätteri plugin and ships `1.0.0-prerelease.9`. Part B adds an `architecture` option to pm-docs-site that dynamically imports astroc4 as a Starlight plugin, ports the template's view-folder pages, and proves it in `examples/demo/`.

**Tech Stack:** TypeScript (`.ts` specifiers), Astro 7.4.8, Starlight 0.42.10, Sätteri mdast plugins, vitest (astroc4), `bun test` (pm-docs-site), LikeC4.

**Spec:** `docs/superpowers/specs/2026-11-23-docs-site-package-architecture-view-design.md`

## Global Constraints

- **Marker syntax:** exactly purview.dev's (`P:\GitHub\purview-dev\purview-dev\skills\purview-site-docs\references\diagrams.md`).
  - Opening: `<!-- purview:likec4 … -->` alone on its line. Closing: `<!-- /purview:likec4 -->` alone on its line.
  - Attributes: `file` (required), `view`, `title`, `description`, `height` (default `420`), `collapsible`, and `defaultOpen`.
- **Marker `file` resolution:** relative to the page, or `/`-rooted at `markers.root`, the repository root. It must stay inside `markers.root`. The default `markers.root` is the nearest ancestor of the Astro root that holds `.git`, else the Astro root.
- **Plain fences unchanged:** ```` ```likec4 file= ```` fences keep site-root containment.
- **Markers never fail the build, whatever `validation` says.** On any failure, remove the two marker nodes, keep what is between them, and warn with page, line, and reason.
- **`.md` only:** markers are ignored in `.mdx` pages.
- **astroc4 version:** `1.0.0-prerelease.9`, with a CHANGELOG entry in Keep a Changelog form.
- **astroc4 conventions:**
  - Conventional commits with a lower-case subject and no full stop.
  - Log through Astro's logger, never `console`. Comments only for a non-obvious why.
  - Keep the wiki in step with the code.
- **pm-docs-site option:** `architecture?: { project?: string; highlighting?: boolean }`. `highlighting` defaults to `true`.
- **pm-docs-site version:** stays `0.1.0-pre.3`; R-013 publishes `pre.4`.
- **Peer dependencies:** `@purview-dev/astroc4` is an optional peer, with its peers `likec4`, `@likec4/core`, `shiki`, and `@astrojs/markdown-satteri`. Every version is exact-pinned where it is installed.
- **Branches:** Part A is on astroc4 branch `feat/likec4-markers`. Part B is on pm-skills branch `feat/r-013-docs-site-package`, already checked out; create no other branch.
- **Shell:** no shell is set in any justfile.

## Review Focus

1. **Marker text inside a code fence** (the marker spec's own docs page shows markers this way). It is a `code` node and must stay untouched. Tested in Task A2.
2. **Unclosed, nested, or out-of-order markers** (an opening marker with no closing marker before the parent ends). Expected: warn, and leave the nodes as they are. Tested in Task A2.
3. **A page with markers but no ```` ```likec4 ```` fence.** The plugin's early return (`fences.ts:239`) must not skip it. Tested in Task A2.
4. **`/`-rooted and `..` paths on Windows** (backslashes, drive letters). They resolve inside `markers.root` and are refused outside it. Tested in Task A1.
5. **Two markers naming the same model on one page.** Both render, each with its own placeholder and view. Tested in Task A2.

---

## Part A: astroc4 (`P:\GitHub\purview-dev\astroc4`)

### Task A1: Marker parsing and path resolution

**Files:**

- Create: `src/markers.ts`
- Test: `src/__tests__/markers.test.ts`

**Interfaces:**

- Produces:
  - `MARKER_OPEN: RegExp`: `/^ {0,3}<!--\s*purview:likec4\b(.*?)-->\s*$/`
  - `MARKER_CLOSE: RegExp`: `/^ {0,3}<!--\s*\/purview:likec4\s*-->\s*$/`
  - `parseMarkerOptions(attributes: string): Record<string, string>`: `key="value"` pairs.
  - `resolveMarkerFile(file: string, pageURL: URL, root: string): string`: the absolute path. It throws `Error` when the path is outside `root`.
  - `findRepositoryRoot(start: string): string`: the nearest ancestor (inclusive) holding `.git`, else `start`.

- [x] **Step 1: Branch.** `git -C P:\GitHub\purview-dev\astroc4 switch -c feat/likec4-markers main`. Expected: `Switched to a new branch`.
- [x] **Step 2: Port the reference tests.** Port the cases for `parseDiagramOptions` and `resolveDiagramPath` from `P:\GitHub\purview-dev\purview-dev\src\tests\unit\docs-diagrams.test.ts` into `markers.test.ts`, as vitest. Add these:
  - `resolveMarkerFile('../diagrams/a.c4', pathToFileURL('<root>/docs/guide/x.md'), '<root>')` equals `join('<root>','docs','diagrams','a.c4')`.
  - `resolveMarkerFile('/docs/a.c4', …)` equals `join('<root>','docs','a.c4')`.
  - `resolveMarkerFile('../../../etc/x.c4', …)` throws `/outside the repository/`.
  - `findRepositoryRoot` run in a temporary folder with `.git` two levels up returns that folder, and without one returns `start`.
- [x] **Step 3: Run and fail.** `bun run test src/__tests__/markers.test.ts`. Expected: FAIL (module not found).
- [x] **Step 4: Implement `src/markers.ts`.** Use `node:path` `resolve` and `relative`, with the same containment test as `readFenceFile` (`fences.ts:511-516`), against `root`.
- [x] **Step 5: Run and pass.** Same command. Expected: PASS.
- [x] **Step 6: Commit.** `git add src/markers.ts src/__tests__/markers.test.ts` then `git commit -m "feat: parse purview:likec4 markers"`.

### Task A2: Markers in the fence plugin

**Files:**

- Modify: `src/fences.ts`, at `FenceOptions` (`:210-233`), the early return (`:239`), and a new `html` visitor in the returned plugin.
- Test: `src/__tests__/fences-markers.test.ts`

**Interfaces:**

- Consumes (Task A1): `MARKER_OPEN`, `MARKER_CLOSE`, `parseMarkerOptions`, `resolveMarkerFile`.
- Produces: `FenceOptions.markers?: false | { root: string }`, and `FenceOptions.onMarkerFallback?: (message: string) => void`.

**Behaviour:**

- The early return becomes `if (!source.includes('```likec4') && !(markers && MARKER_OPEN_TEXT.test(source))) return null`, where `MARKER_OPEN_TEXT` is `/<!--\s*purview:likec4\b/`.
- In `.md` only (`markdown === true`), an `html` visitor whose `node.value` matches `MARKER_OPEN` takes three steps:
  1. **Find the block.** Find the matching close among the following siblings (`ctx.parent(node)`, `ctx.indexOf`).
  2. **Read the view.** Read the model with `resolveMarkerFile` and `readFile`. Resolve the view (`view`, else `defaultView`) and `layoutSource` it.
  3. **Replace the block.** Replace the opening node with `{ type: 'html', value: fencePlaceholder({ viewId, model, ...placeholderOptions(meta) }) }`, and remove every sibling up to and including the closing node.
- Mark the page as using the inline component exactly as an inline `file=` fence does, so the page script mounts it.
- **Fallback** (no `fileURL`, unreadable file, undeclared view, a layout error, or a missing close): remove only the opening and closing nodes, and call `onMarkerFallback(\`${describe(fileURL)}:${line}: purview:likec4 marker kept its fallback — ${reason}\`)`. A missing close removes nothing.

- [x] **Step 1: Write the failing tests.** Use the mock-ctx style of `src/__tests__/fences.test.ts` with a temporary model file holding `view index { include * }`. Tests:
  - `valid marker becomes one placeholder`: one `html` node containing `data-astroc4-fence` and `data-view-id="index"`, with no `code` node of lang `mermaid` left.
  - `undeclared view keeps mermaid`: the `code` mermaid node remains, both marker nodes are removed, and `onMarkerFallback` is called once, with `/undeclared|not declared/`.
  - `unclosed marker is left as is`: the node count is unchanged and the fallback is called once.
  - `marker text in a code fence is untouched`.
  - `page with only markers is not skipped`: the factory returns non-null for a source with a marker and no ```` ```likec4 ````.
  - `two markers, one model, two placeholders`.
  - `strict validation does not throw on a bad marker`.
  - `markers: false leaves comments`.
  - `mdx page ignores markers`.
- [x] **Step 2: Run and fail.** `bun run test src/__tests__/fences-markers.test.ts`. Expected: FAIL.
- [x] **Step 3: Implement** in `src/fences.ts` as described above.
- [x] **Step 4: Run and pass.** Run `bun run test`. Expected: all tests PASS, including the existing `fences.test.ts`.
- [x] **Step 5: Commit.** `git commit -am "feat: render purview:likec4 markers as diagrams"` (add the test file first).

### Task A3: The `markers` integration option

**Files:**

- Modify: `src/integration.ts`, at `LikeC4IntegrationOptions` (`:21-43`), `likec4Integration` (`:98-103`), and `registerFences` (`:221-240`).
- Modify: `src/index.ts`, at `StarlightLikeC4Options` and the forwarding at `:56-61`.
- Test: `src/__tests__/integration-fences.test.ts`

**Interfaces:**

- Consumes: `findRepositoryRoot` (A1), and `FenceOptions.markers` and `onMarkerFallback` (A2).
- Produces: `LikeC4IntegrationOptions.markers?: boolean | { root?: string }`, defaulting to `true`, and the same field on `StarlightLikeC4Options`.

**Behaviour:**

- `true`, or an object without `root`, resolves to `{ root: findRepositoryRoot(astroRoot) }`. An object with `root` resolves to `{ root: resolve(astroRoot, root) }`. `false` resolves to `false`.
- `onMarkerFallback` is `logger.warn`.
- With `fences: false`, markers are off too. Document this.

- [x] **Step 1: Write the failing tests.** In `integration-fences.test.ts`, assert that the registered fence plugin receives:
  - `markers.root` equal to the temporary repository root, when `.git` sits above the Astro root;
  - `markers: false` when the option is `false`;
  - a resolved `root` for `{ root: '..' }`;
  - the forwarded option through the Starlight plugin (as `plugin.test.ts` checks other options).
- [x] **Step 2: Run and fail.** `bun run test src/__tests__/integration-fences.test.ts`. Expected: FAIL.
- [x] **Step 3: Implement** as described above.
- [x] **Step 4: Run and pass.** `bun run test && bun run check`. Expected: PASS, 0 errors.
- [x] **Step 5: Commit.** `git commit -am "feat: markers option with a repository root"`.

### Task A4: Playground, smoke, docs, and release prep

**Files:**

- Create: `playground/src/content/docs/markers.md`, which holds:
  - one valid marker pair, whose model lives **outside the playground's Astro root** (for example `docs/wiki/diagrams/markers.c4` at the repository root);
  - one pair with an undeclared view;
  - one pair shown inside a ```` ```markdown ```` fence.
- Modify: `scripts/smoke.ts` (or `scripts/test-site.ts`, whichever checks built pages).
  - The valid block's page has `data-astroc4-fence` and `data-view-id="<its view>"`.
  - The undeclared block's page still has a `language-mermaid` code block.
  - The fenced example is literal text.
- Modify the docs (the spec's list):
  - `README.md` option table (`:145-149`);
  - `docs/wiki/guide/Configuration-Reference.md` (add `markers`, and the missing `validation` row);
  - `docs/wiki/guide/Fences.md` (a Markers section, linking the marker spec, with the `.md`-only and fallback rules);
  - `docs/wiki/contributing/Architecture.md`;
  - `skills/purview-astroc4-plugin/SKILL.md`.
- Modify: `package.json` `version` → `1.0.0-prerelease.9`, and `CHANGELOG.md` gains `## [1.0.0-prerelease.9] - <date>` with `### Added` and a bold lead sentence.

- [x] **Step 1:** Write the playground page and the smoke assertions.
- [x] **Step 2:** Run `bun run test && bun run check && bun run build`, then the smoke test against preview (AGENTS.md verify loop). Expected: all pass, and the build logs one marker fallback warning, for the undeclared view.
- [x] **Step 3:** Update the docs, the version, and the CHANGELOG.
- [x] **Step 4:** Run the verify loop again. Expected: pass.
- [x] **Step 5: Commit.** `git commit -am "feat: markers playground, docs and 1.0.0-prerelease.9"`.
- [x] **Step 6: Ask the user before pushing.** It is outward-facing. On yes, run `git push -u origin feat/likec4-markers` and `gh pr create --fill --base main` in the astroc4 repository. Report the PR URL.

### STOP: astroc4 release

- [x] **The user merges the astroc4 PR.** Then verify: `npm view @purview-dev/astroc4@1.0.0-prerelease.9 version`. Expected: `1.0.0-prerelease.9`.
  - Until it passes, Part B may proceed through Task B4 against a local link (`bun link` in astroc4, then `bun link @purview-dev/astroc4` in the consumer). **Never commit a `link:` or out-of-repo `file:` dependency.**
  - If the release is still missing at Task B6, run `pm-checkpoint pause` with the open question `Merge the astroc4 PR so 1.0.0-prerelease.9 publishes.` Do not close R-045.

---

## Part B: pm-docs-site (`P:\GitHub\purview-dev\pm-skills\packages\pm-docs-site`)

### Task B1: The `architecture` option

**Files:**

- Modify: `lib/types.ts` (`PmDocsSiteOptions`, `ResolvedOptions`) and `lib/options.ts` (`resolveOptions`).
- Test: `test/options.test.ts`

**Interfaces:**

- Produces:
  - `PmDocsSiteOptions.architecture?: { project?: string; highlighting?: boolean }`
  - `ResolvedOptions.architecture: { project: string | null; highlighting: boolean; markersRoot: string } | null`
- `project` is resolved absolute from the site root. `markersRoot` is the resolved `docs.root` when `docs` is set, else the site root.

- [x] **Step 1: Write the failing tests.**
  - `architecture absent → null`.
  - `{} → { project: null, highlighting: true, markersRoot: <site root> }`.
  - `{ project: 'arch' } with docs.root '..'`: `project` is `resolve(root,'arch')` and `markersRoot` is `resolve(root,'..')`.
  - `architecture: 'x'` throws `pm-docs-site: architecture must be an object`.
- [x] **Step 2:** Run `bun test test/options.test.ts`. Expected: FAIL.
- [x] **Step 3:** Implement, with a `checkArchitecture` beside `checkDocs`.
- [x] **Step 4:** Run the same command. Expected: PASS.
- [x] **Step 5: Commit.** `git commit -m "feat(pm-docs-site): architecture option" -- packages/pm-docs-site/lib packages/pm-docs-site/test/options.test.ts`

### Task B2: View-folder pages

**Files:**

- Create: `lib/architecture.ts`, ported from `skills/pm-docs-site/templates/architecture/src/lib/architecture.ts` with the placeholder path removed.
- Create: `src/routes/architecture/[group].astro`, ported from the template page. It reads `virtual:pm-docs-site/config` `architecture.project` and imports `@purview-dev/astroc4/components/LikeC4View.astro` by package name.
- Modify: `lib/sidebar.ts`. When `architecture.project` is set, add an `Architecture` link group (one entry per group) after the plan group.
- Test: `test/architecture.test.ts` (port `templates/architecture/src/lib/architecture.test.ts`), `test/sidebar.test.ts`.

**Interfaces:**

- Produces:
  - `viewsIn(source: string): ViewRef[]`
  - `viewGroups(viewsDir: string): ViewGroup[]`
  - `ViewRef { id: string; title: string }`
  - `ViewGroup { slug: string; title: string; views: ViewRef[] }`
- Consumes (B1): `ResolvedOptions.architecture`.

- [x] **Step 1:** Port the template's tests to `bun test`, with `viewGroups` taking an explicit `viewsDir`. Add the sidebar test: `Architecture` appears only when `architecture.project` is set.
- [x] **Step 2:** Run `bun test test/architecture.test.ts test/sidebar.test.ts`. Expected: FAIL.
- [x] **Step 3:** Implement `lib/architecture.ts`, the route, and the sidebar change. `viewGroups` reads `<project>/views`.
- [x] **Step 4:** Run the same command. Expected: PASS.
- [x] **Step 5: Commit.** `git commit -m "feat(pm-docs-site): architecture view-folder pages" -- packages/pm-docs-site`

### Task B3: Load astroc4 only when asked

**Files:**

- Modify: `lib/index.ts`.
  - The `astro:config:setup` hook becomes `async`.
  - When `resolved.architecture` is set, it runs `await loadAstroc4()` and adds the result to `starlight({ plugins: [...] })` with:
    - `projects: { architecture: project }` (only when `project` is set);
    - `fences: true`;
    - `markers: { root: markersRoot }`;
    - `highlighting`.
  - It injects `/architecture/[group]` → `src/routes/architecture/[group].astro` only when `project` is set.
- Create: `lib/astroc4.ts`, with `loadAstroc4(): Promise<(options: Record<string, unknown>) => unknown>`.
  - It does a dynamic `import('@purview-dev/astroc4')`.
  - On `ERR_MODULE_NOT_FOUND` it throws: `pm-docs-site: the architecture option needs @purview-dev/astroc4. Run: bun add --exact @purview-dev/astroc4@1.0.0-prerelease.9 likec4 @likec4/core shiki @astrojs/markdown-satteri`.
- Modify `package.json`:
  - `peerDependencies` and `peerDependenciesMeta` (`optional: true`) for `@purview-dev/astroc4` `1.0.0-prerelease.9`, `likec4`, `@likec4/core`, `shiki`, and `@astrojs/markdown-satteri`;
  - the same packages exact in `devDependencies`, for `astro check` and the tests;
  - `files`, if `lib/astroc4.ts` and `lib/architecture.ts` must ship (follow `scripts/build.ts`).
- Test: `test/integration.test.ts`.

- [x] **Step 1: Write the failing tests.**
  - `no architecture → no astroc4 import`: `loadAstroc4` is not called, which is observable through an injectable loader or a spy.
  - `architecture set → starlight plugins include astroc4 with markers.root`.
  - `missing astroc4 → error names the bun add command`: simulate with a loader that throws `ERR_MODULE_NOT_FOUND`.
  - `/architecture/[group] injected only with project`.
- [x] **Step 2:** Run `bun test test/integration.test.ts`. Expected: FAIL.
- [x] **Step 3:** Implement. Before the release, install astroc4 through the local link from the STOP section.
- [x] **Step 4:** Run `bun test && bun run check`. Expected: PASS, 0 errors.
- [x] **Step 5: Commit.** `git commit -m "feat(pm-docs-site): load astroc4 for the architecture option" -- packages/pm-docs-site`

### Task B4: Demo and the no-architecture build

**Files:**

- Create: `examples/demo/architecture/likec4/likec4.config.json` (`{ "name": "architecture" }`), and `views/` with two folders (`overview/`, `services/`), each holding one `.c4` file with one view.
  - The model is small; content is the builder's choice.
- Create: `examples/demo/docs/guide/diagrams.md`, with one `purview:likec4` marker pair whose `file` points at a self-contained `.c4` file and whose Mermaid fallback matches it.
  - Add it to the demo's docs `include` list, if the glob does not already match.
- Modify: `examples/demo/astro.config.ts`, adding `architecture: { project: 'architecture/likec4' }`.
- Modify: `examples/demo/package.json`, adding the dependencies from B3's error message, exact. Use the local link until the STOP passes.
- Modify: `examples/demo/expected-pages.txt`, adding `/architecture/overview/` and `/architecture/services/`.
- Modify: `scripts/check-demo.ts`. `docs/guide/diagrams/index.html` has `data-astroc4-fence`, and no `language-mermaid`.
- Modify: `packages/pm-docs-site/test/install.test.ts`. Assert that the packed-install site has no `node_modules/@purview-dev/astroc4` and that its build passes.

- [x] **Step 1:** Add the assertions to `check-demo.ts` and `install.test.ts`.
- [x] **Step 2:** Run `just demo-check`. Expected: FAIL (no architecture pages yet).
- [x] **Step 3:** Add the model, the page, the config, and the dependencies.
- [x] **Step 4:** Run `just package-test`. Expected: PASS, including `demo-check` and `install.test.ts`.
- [x] **Step 5:** Regenerate the demo export only if the demo PM files changed: `bun skills/pm-export/scripts/export.ts write --frozen --root examples/demo --pm-root planning/`.
- [x] **Step 6: Commit.** `git commit -m "feat(pm-docs-site): demo architecture and markers" -- examples/demo scripts/check-demo.ts packages/pm-docs-site/test/install.test.ts`

### Task B5: Docs

**Files:**

- Modify: `packages/pm-docs-site/README.md` and `docs/wiki/guide/Docs-Site-Package.md`. Add an Architecture section covering:
  - the option and its fields;
  - the install command (the B3 message);
  - the marker, with a link to the purview.dev marker spec and astroc4's `Fences.md`;
  - `.md` only, the Mermaid fallback, and that ADR sections fall back to Mermaid.

- [x] **Step 1:** Write both sections.
- [x] **Step 2:** Run `bunx markdownlint-cli2 packages/pm-docs-site/README.md docs/wiki/guide/Docs-Site-Package.md && just validate`. Expected: 0 issues, and validate passes (version-drift checks).
- [x] **Step 3: Commit.** `git commit -m "docs(pm-docs-site): architecture option" -- packages/pm-docs-site/README.md docs/wiki/guide/Docs-Site-Package.md`

### Task B6: Pin the release and verify (after STOP)

- [x] **Step 1:** Confirm `npm view @purview-dev/astroc4@1.0.0-prerelease.9 version` prints `1.0.0-prerelease.9`. Otherwise follow the STOP section's pause.
- [x] **Step 2:** Remove the local links. Pin `1.0.0-prerelease.9` exactly in `packages/pm-docs-site/package.json` (devDependencies and peer) and `examples/demo/package.json`. Run `bun install` in both, and commit the updated `bun.lock` files.
- [x] **Step 3:** Run `just package-test && just lint-check && just validate && just version-check`. Expected: all pass.
- [x] **Step 4: Commit.** `git commit -m "build(pm-docs-site): pin astroc4 1.0.0-prerelease.9" -- packages/pm-docs-site examples/demo`
- [x] **Step 5:** Check R-045's `Done when` against the evidence from Step 3, then hand off to `pm-checkpoint done`.
