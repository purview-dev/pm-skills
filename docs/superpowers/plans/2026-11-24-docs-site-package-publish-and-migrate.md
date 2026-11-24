# Docs-site package: publish and migrate (R-013) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@purview-dev/pm-docs-site` `0.1.0-pre.4` with Mermaid and `--port`/`--host`, migrate `docs-site/` to a four-file consumer of it, and rewrite the `pm-docs-site` skill against the package instead of its templates.

**Architecture:** The package gains a Sätteri mdast plugin that renders ```` ```mermaid ```` fences to inline SVG with Pele at build time, a CLI that passes the port and host to Astro, and a reproducibility check. A new skill script, `skills/pm-docs-site/scripts/consumer.ts`, writes a package site's files and migrates a template site, using a frozen list of template paths. Once that list exists, the templates, `site.ts`, and their `validate.ts` checks are deleted.

**Tech Stack:** Bun, TypeScript, Astro `7.4.8`, Starlight `0.42.10`, `@astrojs/markdown-satteri` `0.4.10`, `satteri` `0.11.7`, `pele` `1.13.0`, `bun test`.

**Spec:** `docs/superpowers/specs/2026-11-23-docs-site-package-publish-and-migrate-design.md`

## Global Constraints

- The package version goes from `0.1.0-pre.3` to `0.1.0-pre.4`. It is not `1.0.0`.
- The rules stay on 21. **Correction to spec section 4:** `main` is `21.0.0-pre.7` and `v21.0.0-pre.7` is already tagged, so `just bump prerelease` gives `21.0.0-pre.8`.
- New package dependencies are exact pins: `pele` `1.13.0`, `satteri` `0.11.7`, and `@astrojs/markdown-satteri` `0.4.10`. `@astrojs/markdown-satteri` moves from `peerDependencies` (and `peerDependenciesMeta`) to `dependencies`, and stays in its `devDependencies` only if `bun install` needs it there.
- `SUPPORTED_SCHEMA_VERSIONS` stays `[5]`, and the export schema does not change.
- Mermaid renders at build time only. There is no client-side renderer and no browser in the build (anti-goal). A fence that does not parse fails the build and names the file.
- `docs-site/` ends with exactly `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore`. Its dependency is `"@purview-dev/pm-docs-site": "file:../packages/pm-docs-site"`.
- The skill states a **minimum** package version of `0.1.0-pre.4`, never the exact current one.
- The skill keeps the sentence `This skill reads schemaVersion 5.`
- The justfile sets no shell (memory: sh recipes only). All code is TypeScript run by Bun or Node 24.
- The architecture option is the one R-045 shipped: `architecture: { project?: string; highlighting?: boolean }`. Its peers install with `bun add --exact @purview-dev/astroc4@1.0.0-prerelease.9 likec4 @likec4/core shiki @astrojs/markdown-satteri` (`lib/astroc4.ts` `INSTALL_COMMAND`). I checked this against spec sections 3 and 4 on 2026-11-24, and they match.
- Commits follow conventional commits (`commitlint.config.mts`). Never use `--no-verify`.

## Review Focus

1. **Two Mermaid fences on one ADR page.** Each ADR section is a separate `renderMarkdown` call, so a counter that restarts for each source would give both diagrams the same `pele-0` IDs on one page. Expect distinct IDs that are still stable from build to build. Task 1's ID test covers this.
2. **A site with architecture and Mermaid together.** astroc4 appends its fences to an existing Sätteri processor (`registerFences`), so both kinds of fence must render. Expect an SVG and a LikeC4 placeholder on the same page. The demo assertion in Task 4 covers this.
3. **A consumer with its own non-Sätteri `markdown.processor`.** Expect a warning that Mermaid is off, no crash, and the consumer's processor unchanged. Task 1 covers this.
4. **`dev --port` given with a site folder, or in either order.** `pm-docs-site dev docs-site --port 4399` and `pm-docs-site dev --port 4399 docs-site` must both treat `4399` as the port, never as the site folder. Also, `npm run dev -- --port N` (Aspire) must reach the CLI. Task 2 covers this.
5. **Migrating a template site that has a file the consumer added.** `consumer.ts migrate` must delete nothing, list the unlisted path, and exit non-zero, unless it is given `--include-unlisted`. Task 6 covers this.

---

### Task 1: Mermaid fences rendered by Pele

**Files:**

- Create: `packages/pm-docs-site/lib/mermaid.ts`
- Create: `packages/pm-docs-site/src/styles/pele.css`
- Modify: `packages/pm-docs-site/lib/index.ts` (the `updateConfig` call: `markdown.processor`, and `customCss`)
- Modify: `packages/pm-docs-site/package.json` (dependencies, and `files` gains `lib/mermaid.ts` only if `src/` imports it; otherwise `scripts/build.ts` bundles it)
- Test: `packages/pm-docs-site/test/mermaid.test.ts`
- Test: `packages/pm-docs-site/test/integration.test.ts` (add cases)

**Interfaces:**

- Produces: `export function mermaidFences(): SatteriMdastPluginFactory` from `lib/mermaid.ts`. Use the factory type `@astrojs/markdown-satteri` exports, the same shape astroc4's `likec4Fences` returns: `(factory) => { name, code(node, ctx) } | null`.
- Produces: `export function markdownProcessor(existing: unknown, warn: (message: string) => void): unknown | undefined` in `lib/mermaid.ts`. It returns the processor to set, or `undefined` to leave the consumer's processor alone.

- [ ] **Step 1: Write the failing tests** in `test/mermaid.test.ts`, rendering through `satteri({ mdastPlugins: [mermaidFences()] })` on a Markdown string:
  - `renders a sequenceDiagram fence to inline svg`: the output contains `<svg`, and contains neither `language-mermaid` nor `<pre`.
  - `renders a flowchart LR fence`: same assertions.
  - `ids are equal across two renders of the same source`: the two HTML strings are `===`.
  - `two sources with one fence each get distinct ids`: no `id="…"` value from the first render appears in the second (Review Focus 1).
  - `a fence that does not parse throws naming the file`: with `fileURL` `file:///x/docs/bad.md` and body `sequenceDiagram\n  A->>`, the render rejects with a message containing `bad.md` and `mermaid`.
  - `without a fileURL the error names the source as markdown`: the message contains `(markdown)`. This is the ADR case, since `loaders/adrs.ts` passes no `fileURL`.
  - `markdownProcessor` cases: `undefined` returns a Sätteri processor (`isSatteriProcessor` is true). An existing Sätteri processor with plugin `p` returns one whose `options.mdastPlugins` is `[p, <mermaid>]`. A non-Sätteri object returns `undefined` and calls `warn` once with text containing `Mermaid` (Review Focus 3).
- [ ] **Step 2: Run** `cd packages/pm-docs-site && bun test test/mermaid.test.ts`. Expected: FAIL, because `lib/mermaid.ts` does not exist.
- [ ] **Step 3: Add the dependencies:** `bun add --exact pele@1.13.0 satteri@0.11.7 @astrojs/markdown-satteri@0.4.10` in `packages/pm-docs-site`, then remove `@astrojs/markdown-satteri` from `peerDependencies` and `peerDependenciesMeta`.
- [ ] **Step 4: Implement `mermaidFences()` and `markdownProcessor()`.**
  - The factory returns `null` when `factory.source` has no ```` ```mermaid ````.
  - `code(node, ctx)` acts only when `node.lang === 'mermaid'`. It calls Pele's `render(node.value, { idPrefix })` and then `ctx.replaceNode(node, { type: 'html', value: svg })`.
  - `idPrefix` is `` `pele-${sha256(factory.source).slice(0, 8)}-${n}` ``, with `n` counting per factory call in document order. The hash keeps the prefix stable across builds and distinct across sources.
  - On an error, throw `` `pm-docs-site: ${where}: mermaid fence is not valid (${message})` ``, where `where` is the `fileURL` path or `(markdown)`.
  - Check the Pele `render` signature against its `dist/index.d.ts` before calling it.
  - If `@astrojs/markdown-satteri` fails under Astro `7.4.8`, use the spec's fallback: a remark plugin on Astro's default processor that calls the same `render`. Record the switch in the task's commit body.
- [ ] **Step 5: Run** `bun test test/mermaid.test.ts`. Expected: PASS.
- [ ] **Step 6: Wire `lib/index.ts`.**
  - In `astro:config:setup`, pass `config.markdown?.processor` and `logger.warn` to `markdownProcessor`. When it returns a processor, add `markdown: { processor }` to the `updateConfig` call.
  - Add `fileURLToPath(new URL('../src/styles/pele.css', import.meta.url))` to `customCss` after `width.css`.
  - Write `pele.css` from the variables in Pele's README, mapping them to Starlight's (`--pele-bg: var(--sl-color-bg)`, `--pele-fg: var(--sl-color-text)`, and the rest). Write the selector against the element or class that Step 1's actual SVG output carries, not against the article's `.pele`.
- [ ] **Step 7: Add integration cases** to `test/integration.test.ts`, building the existing fixture site through the helpers (`siteConfig`, `runCli`):
  - `a repo-docs page with a mermaid fence builds to svg`: add a fenced page to a scratch copy of `test/fixtures/docs`, build, and assert that its HTML has `<svg` and no `language-mermaid`.
  - `an ADR section with a mermaid fence builds to svg`: add the fence to one ADR section of a scratch `planning.json`, build, and assert the same on `/plan/decisions/<id>/`.
  - `an invalid fence fails the build naming the file`: `runCli('build', …)` exits non-zero, and stderr contains the page's file name.
- [ ] **Step 8: Run** `bun test && bun run check` in `packages/pm-docs-site`. Expected: all pass, with no new `astro-check` errors.
- [ ] **Step 9: Commit**

```bash
git add packages/pm-docs-site
git commit -m "feat(pm-docs-site): render mermaid fences with Pele at build time"
```

### Task 2: CLI `--port`/`--host`, and `peers`

**Files:**

- Modify: `packages/pm-docs-site/lib/cli.ts`
- Modify: `packages/pm-docs-site/lib/astroc4.ts` (export `INSTALL_COMMAND`)
- Test: `packages/pm-docs-site/test/cli.test.ts`

**Interfaces:**

- Produces: `export function parse(argv: string[], env: NodeJS.ProcessEnv): { command: string | undefined; siteDir: string; flags: Flags; server: { port?: number; host?: string } }`. The function is exported for tests, and `main` passes `process.env`.
- Produces: the CLI command `pm-docs-site peers architecture`, which prints `INSTALL_COMMAND` on stdout and exits 0. Any other `peers` argument prints the usage and exits 2. Task 7 uses it so the skill never states the astroc4 version.
- Produces: `USAGE` becomes `usage: pm-docs-site <dev | build | check> [site-dir] [--title <title>] [--planning <path>] [--port <n>] [--host <host>] | pm-docs-site peers architecture`.

- [ ] **Step 1: Write the failing tests** (`describe('pm-docs-site arguments')`):
  - `parse(['dev', '--port', '4399'], {})` gives `server.port === 4399`, and `siteDir` is the cwd.
  - `parse(['dev', 'site', '--port', '4399', '--host', '0.0.0.0'], {})` gives siteDir `…/site`, port 4399, and host `0.0.0.0`.
  - `parse(['dev', '--port', '4399', 'site'], {})` gives siteDir `…/site` (Review Focus 4).
  - `parse(['dev'], { PORT: '5000', HOST: 'localhost' })` gives port 5000 and host `localhost`.
  - A flag wins over the environment: `parse(['dev', '--port', '1'], { PORT: '2' })` gives port 1.
  - `--port abc` and `--port 0` throw `pm-docs-site: --port needs a port number (1-65535)`.
  - `parse(['dev'], {})` gives `server` `{}`, so Astro's default 4321 applies.
  - `dev --port 4399 serves on 4399`: spawn `runCli('dev', fixtureSite, '--port', '4399')`, poll `http://localhost:4399/` until it returns 200 or 60 s pass, then kill the process.
  - `peers architecture prints the astroc4 install command`: stdout equals `INSTALL_COMMAND` plus a newline.
- [ ] **Step 2: Run** `bun test test/cli.test.ts`. Expected: the new cases FAIL.
- [ ] **Step 3: Implement.**
  - `parse` reads `--port` and `--host` as it reads `--title`, with `PORT` and `HOST` as the fallbacks.
  - `main` sets `inline.server = server` for `dev` and `build`. It handles `peers` before `loadSiteOptions`.
  - Check the arguments that `AddViteApp` passes in the Aspire version `templates/aspire/MODULE.md` targets (`aspire` skill, or <https://aspire.dev>). If it passes a form other than `--port <n>` or `PORT`, support that form too, and add a test for it.
- [ ] **Step 4: Run** `bun test test/cli.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(pm-docs-site): dev and build take --port and --host`.

### Task 3: The schemaVersion 6 test seam

**Files:**

- Modify: `packages/pm-docs-site/lib/schema-version.ts`
- Test: `packages/pm-docs-site/test/schema-version.test.ts`, `packages/pm-docs-site/test/cli.test.ts`

**Interfaces:**

- Produces: `checkSchemaVersion(version: unknown, path: string, supported: readonly number[] = SUPPORTED_SCHEMA_VERSIONS): void`. `checkExport` and `parseExport` gain the same optional last parameter and pass it through. Production callers do not change.

- [ ] **Step 1: Write the failing tests.**
  - `schema-version.test.ts`: `parseExport('{"schemaVersion":6}', 'p.json')` throws a `PlanningExportError` whose message contains `schemaVersion 6` and `reads schemaVersion 5`. `parseExport('{"schemaVersion":6}', 'p.json', [5, 6])` returns `{ schemaVersion: 6 }`.
  - `cli.test.ts`: `a scratch export at schemaVersion 6 fails check and build`. Copy the fixture with `scratchFixture`, set `schemaVersion: 6` in its `planning.json`, then assert that `runCli('check', dir)` and `runCli('build', dir)` both exit non-zero, with stderr containing `schemaVersion 6`.
- [ ] **Step 2: Run** both files. Expected: the seam case FAILS (wrong arity). The CLI case may already pass, so confirm it fails for the right reason before keeping it.
- [ ] **Step 3: Implement** the parameter.
- [ ] **Step 4: Run** `bun test`. Expected: PASS.
- [ ] **Step 5: Commit** `test(pm-docs-site): pin the unsupported schemaVersion failure`.

### Task 4: The reproducible-build check, and Mermaid in the demo

**Files:**

- Create: `packages/pm-docs-site/scripts/check-reproducible.ts`
- Test: `packages/pm-docs-site/test/check-reproducible.test.ts`
- Modify: `justfile` (`package-test`, or `demo-check`: run it on `examples/demo`)
- Modify: `.github/workflows/ci.yml` (the `pm-docs-site-package` job: the same step after "Build the demo")
- Modify: `examples/demo/docs/guide/<an existing page>.md` (add one `sequenceDiagram` fence)
- Modify: `scripts/check-demo.ts`, `scripts/check-demo.test.ts`

**Interfaces:**

- Produces: `export function htmlDigests(distDir: string): Map<string, string>`, which maps relative `/`-separated paths to SHA-256 hex values for every `*.html`.
- Produces: `export function firstDifference(a: Map<string, string>, b: Map<string, string>): string | null`, which returns a path that is missing from one map or differs between them, in sorted order.
- Produces: the CLI `node scripts/check-reproducible.ts <site-dir>`. It runs `pm-docs-site build` twice with `--outDir` (or `ASTRO_OUT_DIR`: use whichever `astro.build` honours, and pass it through `inline.outDir` if needed) into `<site-dir>/.reproducible/a` and `/b`. It prints `reproducible: <n> pages` and exits 0, or `not reproducible: <path>` and exits 1. It removes `.reproducible/` afterwards.

- [ ] **Step 1: Write failing tests** for `htmlDigests` and `firstDifference`, using two temp folders: equal folders give `null`, one changed byte gives that path, and an extra file gives its path.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the script and wire it into `just package-test` (after `demo-check`) and into CI.
- [ ] **Step 4: Run** `node scripts/check-reproducible.ts ../../examples/demo` from `packages/pm-docs-site`. Expected: `reproducible: …`. If it fails, find the source of the differing bytes (asset hash, ordering, or time), make it deterministic in the package, and add a test that pins the fix.
- [ ] **Step 5: Demo Mermaid.**
  - Add the fence to the demo page.
  - Add an assertion to `checkDemo`: the page has at least one `<svg` with an `id` starting `pele-`, and no `language-mermaid`. The demo also has architecture, so the same build checks Review Focus 2.
  - Add a matching case to `check-demo.test.ts`.
  - Re-export the demo only if its `planning/` changed (`AGENTS.md`: the demo export command).
- [ ] **Step 6: Run** `just package-test`. Expected: PASS.
- [ ] **Step 7: Commit** `feat(pm-docs-site): check two builds give identical HTML`.

### Task 5: Package `0.1.0-pre.4` and its instructions

**Files:**

- Modify: `packages/pm-docs-site/package.json` (`version`)
- Modify: `packages/pm-docs-site/README.md`
- Modify: `docs/wiki/guide/Docs-Site-Package.md`

- [ ] **Step 1:** Set `version` to `0.1.0-pre.4`.
- [ ] **Step 2: Update the README.**
  - Delete the "Until roadmap item R-013 migrates…" sentence.
  - Document the four-file consumer: the `package.json`, `astro.config.ts`, and `.gitignore` contents, and `bun.lock` from `bun add @purview-dev/pm-docs-site --exact`.
  - Document every option, with the table kept, plus a `## Mermaid` section (supported fences, build-time SVG, a parse error fails the build, a custom processor turns it off), and the CLI's `--port`/`--host`/`PORT`/`HOST` and `peers architecture`.
  - Add a `## Running under Aspire` section with the plain C# snippet from `skills/pm-docs-site/templates/aspire/MODULE.md`, run mode only.
- [ ] **Step 3:** Make the same changes in `docs/wiki/guide/Docs-Site-Package.md`, with every version mention at `0.1.0-pre.4`.
- [ ] **Step 4: Run** `just validate` (the `versionDrift` check) and `bunx markdownlint-cli2 packages/pm-docs-site/README.md docs/wiki/guide/Docs-Site-Package.md`. Expected: both clean.
- [ ] **Step 5: Commit** `docs(pm-docs-site): document the 0.1.0-pre.4 consumer`.

### Task 6: The template inventory and `consumer.ts`

**Files:**

- Create: `skills/pm-docs-site/references/template-files.md`
- Create: `skills/pm-docs-site/scripts/consumer.ts`
- Test: `skills/pm-docs-site/scripts/consumer.test.ts`
- Modify: `justfile` `test` and `.github/workflows/ci.yml` "Test scripts" (add `skills/pm-docs-site/`)

**Interfaces:**

- Produces: `export interface ConsumerOptions { title: string; description?: string; planning?: string; docs?: { root: string; sources: DocsSource[] }; views?: string[]; architecture?: { project: string } }`. `DocsSource` is copied as a type from `packages/pm-docs-site/lib/types.ts`. The skill is installed without the package, so it must not import from it.
- Produces: `export function renderAstroConfig(options: ConsumerOptions, extra?: string): string`. It returns an `astro.config.ts` that imports `defineConfig` and `pmDocsSite` and passes the options as a literal. `extra` is placed verbatim beside `pmDocsSite(...)` inside `integrations`, for the carried integrations in spec section 3.
- Produces: `export function templateFiles(skillDir: string): string[]`, which reads the paths from `references/template-files.md`.
- Produces: `export function inspect(siteDir: string, skillDir: string): { listed: string[]; unlisted: string[]; options: ConsumerOptions; extraConfig: string | null; architectureDir: string | null }`. It maps the manifest's `SITE_TITLE`, `SITE_DESCRIPTION`, `views`, and `LIKEC4_DIR`, and `src/docs-sources.ts`'s array (parsed as a TS literal: use Bun's transpiler plus a dynamic import of a temp copy with its type import removed), to options.
- Produces: CLI commands for `bun <skill>/scripts/consumer.ts`:
  - `inspect <site>` prints the `inspect` JSON.
  - `migrate <site> [--include-unlisted]` stops with exit 1 and lists `unlisted` when it is non-empty and the flag is absent, before deleting anything. Otherwise it deletes the listed paths, then the manifest, writes `astro.config.ts`, and rewrites `package.json` (the dependency the caller adds next; scripts `dev`/`build`/`check` = `pm-docs-site <cmd>`, `preview` = `astro preview`; name, `private`, `type`, and `description` kept). It prints the hand-edit `Note` naming `git show HEAD:<path>`.
  - `write <site> --options <json>` writes `astro.config.ts`, `package.json` (as `migrate` does), and `.gitignore` (`node_modules/`, `dist/`, `.astro/`) when it is missing.

- [ ] **Step 1: Generate the inventory, before any template is deleted.** Run a one-off `bun -e` that imports `render` from `skills/pm-docs-site/scripts/site.ts` and renders a manifest with every module (`repo-docs`, `architecture`) and every view. The architecture module's placeholder values come from `templates/architecture/MODULE.md`. Collect the paths, adding `SITE_OWNED` and `pm-docs-site.json`.
  - Write `references/template-files.md`: a short heading, one sentence on its purpose (frozen on 2026-11-24, read by `consumer.ts migrate`), and one bullet per path, `` - `<path>` `<sha256 of docs-site/<path> or none>` ``.
  - The SHA-256 is that of this repository's current `docs-site/` file, or `none` when this site does not have it.
  - Do not commit the one-off command.
- [ ] **Step 2: Write failing tests.** Use a scratch template site made with `site.ts write` into a temp folder (still present at this point), plus `git show main:docs-site/<path>` for the real one:
  - `inspect` on the real site gives title `pm-skills project`, its description, the four sources in order, no `views` (the manifest has none), and `unlisted: []`.
  - `migrate` on a scratch copy leaves exactly `package.json`, `astro.config.ts`, `.gitignore`, and `bun.lock`.
  - `migrate` with an added `src/pages/extra.astro` exits 1, lists `src/pages/extra.astro`, and leaves every file in place (Review Focus 5). With `--include-unlisted`, it deletes the file.
  - `renderAstroConfig` output for the real site's options equals a checked-in expected string. Write that string once by hand from spec section 2.
  - A manifest with `LIKEC4_DIR` gives `architectureDir` and `options.architecture.project`.
- [ ] **Step 3: Run** `bun test skills/pm-docs-site/`. Expected: FAIL.
- [ ] **Step 4: Implement** `consumer.ts`. It deletes only listed paths and removes folders it empties.
- [ ] **Step 5: Run** the tests. Expected: PASS.
- [ ] **Step 6: Commit** `feat(pm-docs-site): consumer script and frozen template inventory`.

### Task 7: Migrate `docs-site/`

**Files:**

- Delete (through `consumer.ts migrate`): `docs-site/pm-docs-site.json`, `tsconfig.json`, `vitest.config.ts`, `astro.config.mjs`, and `src/`
- Create: `docs-site/astro.config.ts`
- Modify: `docs-site/package.json`, `docs-site/bun.lock`
- Modify: `justfile` (`docs`, `docs-preview`, `docs-check`), `.github/workflows/ci.yml` (the `docs-site` job)

- [ ] **Step 1: Run** `bun skills/pm-docs-site/scripts/consumer.ts migrate docs-site`. Expected: exit 0, with exactly the four files and `node_modules/` left.
- [ ] **Step 2: Edit `astro.config.ts`.** Set `views` to `['now', 'milestones', 'graph', 'features', 'inbox', 'briefs', 'strategy', 'decisions']` and `docs.root` to `'..'`, keep the four sources, and write a header comment naming the `just` recipes. In `package.json`, set the only dependency to `"@purview-dev/pm-docs-site": "file:../packages/pm-docs-site"`. Run `bun install` in `docs-site/` to regenerate `bun.lock`.
- [ ] **Step 3: Update `justfile`.**
  - `docs`, `docs-preview`, and `docs-check` first run `cd packages/pm-docs-site && node scripts/build.ts` (as `demo` does: drop the `working-directory` attribute and use `cd docs-site && …` lines).
  - `docs-check` runs install, `bun run check`, and `bun run build`, with no `site.ts check` and no `bun run test`.
  - The comments say "the pm-docs-site package".
- [ ] **Step 4: Update CI.** In the `docs-site` job, add Node 24 setup, the package install, and `node scripts/build.ts` before "Install". Delete "Match the pm-docs-site templates" and "Test".
- [ ] **Step 5: Run** `just docs-check 2>&1 | Tee-Object docs-check.log`.
  - Expected: pass, and `Select-String docs-check.log -Pattern '404 was not found'` prints nothing (item Note 3).
  - Check the 12 wiki fences rendered: grep `docs-site/dist/docs/` for `language-mermaid` (expected 0), and count pages with `<svg id="pele-` (expected 4 files, from 12 fences).
  - If Pele rejects a fence, rewrite that diagram in a form Pele renders, and record it for the PR body.
  - Delete `docs-check.log`.
- [ ] **Step 6: Run** `node packages/pm-docs-site/scripts/check-reproducible.ts docs-site`. Expected: `reproducible: …`.
- [ ] **Step 7: Commit** `refactor(docs-site): consume the pm-docs-site package`.

### Task 8: Rewrite the `pm-docs-site` skill, and remove the templates

**Files:**

- Delete: `skills/pm-docs-site/templates/site/`, `templates/repo-docs/`, `templates/architecture/`, `scripts/site.ts`
- Modify: `skills/pm-docs-site/SKILL.md`, `skills/pm-docs-site/references/spec.md`, `skills/pm-docs-site/templates/aspire/MODULE.md`
- Modify: `scripts/validate.ts` (delete `checkDocsSite`'s template checks, the placeholder loop, the manifest/`differences` block, and the `site.ts` import; add the checks below)
- Modify: `skills/pm-docs-site/scripts/consumer.test.ts` (generate its scratch template site from `references/template-files.md` plus fixed contents, now that `site.ts` is gone)

**Interfaces:**

- Consumes: `consumer.ts` (Task 6), and `pm-docs-site peers architecture` (Task 2).

- [ ] **Step 1: Write the failing `validate.ts` checks.**
  - Each check is a `fail(...)` with the message shown.
  - Run `just validate` before the SKILL.md rewrite. Expected: it fails on the minimum-version and four-file messages only where they are not yet true; record which.
  - The checks:
    - `SUPPORTED_SCHEMA_VERSIONS` in `packages/pm-docs-site/lib/schema-version.ts` (regex `Object.freeze\(\[([\d, ]+)\]\)`) includes `planning.schema.json`'s const. Message: `pm-docs-site package: SUPPORTED_SCHEMA_VERSIONS lacks schemaVersion <n>`.
    - SKILL.md contains `This skill reads schemaVersion <n>.` (kept).
    - The version in SKILL.md's ``Minimum package version: `<v>` `` line is `compare(v, packageVersion) <= 0` with `scripts/semver.ts`. Message: `skills/pm-docs-site/SKILL.md: minimum package version <v> is above the package's <version>`.
    - `readdirSync('docs-site')`, minus `node_modules`, `dist`, and `.astro`, equals the four names. Message: `docs-site: unexpected <name> (a package site holds package.json, astro.config.ts, bun.lock, .gitignore)`.
    - The MIT check moves to `packages/pm-docs-site/src/components/lib/*.astro`, which carry it today.
    - The fixture check moves to `packages/pm-docs-site/test/fixtures/planning.json`: same schemaVersion, required keys, and `validateSchema` as the template fixture had.
- [ ] **Step 2: Rewrite SKILL.md** to spec section 3, keeping the Guard, the Output templates, and Communication-contract headings.
  - Replace "Manifest and render script" and "Placeholders" with a `## Package` section: the line ``Minimum package version: `0.1.0-pre.4` ``, the `consumer.ts` commands, `This skill reads schemaVersion 5.`, and `bun add @purview-dev/pm-docs-site --exact`.
  - `check` reports `current`, `package below minimum (<installed> < <minimum>)`, `schema unsupported`, or `template site (run upgrade)`.
  - `scaffold`: `consumer.ts write`, then `bun add`, then the `Docs` justfile group, then `bun run check` and `bun run build`, then the Aspire step. Title and description come from the README and are printed in the Note.
  - `extend`: `view` and `repo-docs` edit `astro.config.ts`. `architecture` sets `architecture.project`, runs the command `pm-docs-site peers architecture` prints, and stops with `no LikeC4 config file` when the folder has none.
  - `upgrade`: a package site runs `bun add …@latest --exact` and verifies. A template site runs `consumer.ts inspect`, then asks the unlisted-files question (`<n> files in <site> are not template files. How should upgrade continue?`, with `Stop so I can move them (recommended)` and `Delete them too`). It then shows `extraConfig`, runs `migrate` (with `--include-unlisted` on the second answer), runs `bun add`, and runs the architecture peers when `architectureDir` is set. Finally it verifies.
  - The Aspire step: detect an AppHost (`Sdk="Aspire.AppHost.Sdk"`, or `apphost.mts`/`apphost.ts` importing Aspire). Ask `Add the docs site to the Aspire AppHost <path>?` (`Add it (recommended)`, `Leave the AppHost alone`). On yes, use the C# variants, or TypeScript `addViteApp('docs', '<site>')` with Bun in run mode, verifying the TS names against the Aspire docs. Then ask `Add the two AppHost tests?` (`Add them (recommended)`, `Skip the tests`) only when composition tests exist. Record each answer in the Note.
  - In `MODULE.md`, drop its placeholder table's dependency on `SKILL.md` Placeholders, keeping `{{APPHOST_TO_SITE}}` and the rest as values the step fills.
- [ ] **Step 3: Rewrite `references/spec.md`** to the package site: rules, the four files, the data contract by reference to the package README, Aspire (section 10 kept), tests and acceptance, and Not doing. Delete the template-file, component, and page-file sections.
- [ ] **Step 4: Delete** the three template folders and `scripts/site.ts`. Switch `consumer.test.ts` to its own scratch generator.
- [ ] **Step 5: Run** `just validate && just test && bunx markdownlint-cli2 "skills/pm-docs-site/**/*.md"`. Expected: all pass.
- [ ] **Step 6: Commit** `feat(pm-docs-site)!: build sites on the pm-docs-site package`. The commit body states that the rules stay on 21 (prerelease line).

### Task 9: Rules, agent instructions, help, and version

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md` (rule 9, the **Docs site** definition, and a new Version 21 paragraph), then the installed section in `AGENTS.md`. `skills/pm-init/templates/config.md` is unchanged unless validate says otherwise.
- Modify: `AGENTS.md` (the repository part's `pm-docs-site` paragraph, and the `docs-check` and `Validate only` bullets)
- Modify: `skills/pm-help/SKILL.md` (the `pm-docs-site` row, and diagnosis check 20)
- Modify: `README.md` (the `pm-docs-site` row), `docs/wiki/contributing/Repository-Layout.md`
- Modify: `package.json` (via `just bump prerelease`)

- [ ] **Step 1: Edit the managed section.**
  - Rule 9: the build modes write "the site folder's four files, the `Docs` group in the `justfile`, and the AppHost files the Aspire step edits on the user's yes, and run `bun add` of the package in the site folder". The rest of the rule stays.
  - **Docs site** definition: "that `pm-docs-site` builds from the `@purview-dev/pm-docs-site` package".
  - Version 21 paragraph: `pm-docs-site` now installs `@purview-dev/pm-docs-site` (at least `0.1.0-pre.4`), and `pm-docs-site upgrade` migrates a template site, including one with the architecture module. Mermaid fences render.
  - Do not change the marker version (it stays 21).
- [ ] **Step 2: Reinstall the section** in `AGENTS.md` (replace between the markers with the reference minus `version=`).
  - Rewrite the repository `pm-docs-site` paragraph: the four-file `docs-site/` on `file:../packages/pm-docs-site`, `consumer.ts` and `references/template-files.md`, the new validate checks, `just docs-check` building the package first, and no `site.ts`.
  - Update the `Validate only` bullet's list to match.
- [ ] **Step 3: Update `pm-help`.** In the row, write "builds a local site on the `@purview-dev/pm-docs-site` package". In check 20, a `pm-docs-site.json` means `template site: run pm-docs-site upgrade`, and a package site compares its dependency with the minimum and the export's `schemaVersion` with the supported list. Update the README row and `Repository-Layout.md` the same way.
- [ ] **Step 4: Run** `just bump prerelease`. Expected: `package.json` is `21.0.0-pre.8`.
- [ ] **Step 5: Run** `just lint-check && just version-check`. Expected: both pass.
- [ ] **Step 6: Commit** `feat(pm-skills): docs-site rules name the package; 21.0.0-pre.8`.

### Task 10: Scratch verification of the skill

No repository files change unless a run finds a defect. A defect is fixed in the task that owns it, with a test.

- [ ] **Step 1: Upgrade.** In a temp folder, recreate the pre-migration site with `git archive main docs-site | tar -x -C <tmp>`. Run `consumer.ts migrate <tmp>/docs-site`. Expected: `astro.config.ts` and `package.json` equal this branch's `docs-site/` apart from the Task 7 Step 2 edits (`views`), and only those edits.
- [ ] **Step 2: Scaffold.** In a scratch repository with a `README.md`, `docs/`, and a `planning/planning.json` copied from this repository, follow SKILL.md `scaffold`, using `file:` to this branch's built package because `pre.4` is not yet on npm. Expected: `bun run check` and `bun run build` pass.
- [ ] **Step 3: Aspire.** When `dotnet --version` succeeds, run `dotnet new aspire-apphost` in a scratch folder and follow the Aspire step.
  - On yes: `dotnet build` passes, and running the AppHost serves the Home page on the `docs` endpoint (this exercises `--port`).
  - On no: `git diff` of the AppHost is empty.
  - Without the .NET SDK, write `Aspire step not run: no .NET SDK` for the PR body and the checkpoint.
- [ ] **Step 4:** Record the three results in the PR body draft. The `Done when` check `npm view @purview-dev/pm-docs-site version` = `0.1.0-pre.4` runs only after the merge, through `publish-pm-docs-site.yml`.
