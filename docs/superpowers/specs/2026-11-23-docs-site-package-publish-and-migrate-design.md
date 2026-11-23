# Docs-site package: publish and migrate (R-013): design

- Date: 2026-11-23
- Item: R-013 Docs-site package: publish and migrate (both, M), branch `feat/r-013-docs-site-package`
- Brief: `planning/briefs/2026-11-17-docs-site-package.md`
- Approved: 2026-11-23 (user). R-013 is paused at `plan` until the architecture item is done.
- ADRs: writes ADR-005 Docs sites consume the pm-docs-site package (proposed, Item R-013), ADR-006 Mermaid renders at build time with Pele (proposed, Item R-013); follows ADR-002 ADR sections export as Markdown text (Mermaid fences in an ADR section render because the section is Markdown)

## Intent

The docs site is chaotic to maintain and builds non-deterministically, because every consumer carries ~40 copied template files and resolves its own Astro and Starlight versions (brief, `## Problem`). `@purview-dev/pm-docs-site` (`packages/pm-docs-site/`, now `0.1.0-pre.3`) already renders every view. R-013 moves the last two template users onto it: this repository's `docs-site/` and the `pm-docs-site` skill. A consumer site becomes four files, and a template change becomes a package release instead of a rules bump.

## Decisions made with the user (2026-11-23)

1. **Not stable.** R-013 publishes `0.1.0-pre.4`, not `1.0.0`. This replaces the brief's 2026-11-18 answer ("R-013 releases stable `1.0.0`"). `1.0.0` waits until the package contains everything, with complete instructions.
2. **Slice "everything".** Four items are parked in the inbox and are **out of scope** here:
   - `2026-11-23-1525-docs-site-package-architecture`: LikeC4 through astroc4 as a package option (M). **The user chose to build it before R-013.** R-013 is paused after this design and depends on it, so no architecture-module site is ever left without a path. This spec assumes the package has an architecture option, as that item defines it.
   - `2026-11-23-1525-docs-site-package-record-pages`: a page per brief and per inbox file (S).
   - `2026-11-23-1525-docs-site-package-research`: research reports in the export (schemaVersion 6) and a view (M).
   - `2026-11-23-1525-docs-site-package-1-0-0`: the `1.0.0` release, which depends on the three above (S).
3. **Aspire.** When the repository has an Aspire AppHost, the skill **asks** whether to add the site as an AppHost resource. Run mode only. It then **asks separately** whether to add the AppHost tests. The package's `dev` command honours the port and host that Aspire assigns.
4. **Mermaid.** The package renders ```` ```mermaid ```` fences with Pele (<https://hideoo.dev/notes/starlight-add-mermaid-diagrams-using-pele>), for diagrams too small to need LikeC4.
5. **Dependency.** `docs-site/` depends on the local package (`"@purview-dev/pm-docs-site": "file:../packages/pm-docs-site"`), as `examples/demo/` does.

## Goals

- `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore`, and `just docs-check` passes.
- Two builds from the same `planning.json` and lockfile give byte-identical HTML.
- A scratch export at `schemaVersion` 6 fails the build until the package's supported range includes 6.
- `npm view @purview-dev/pm-docs-site version` returns `0.1.0-pre.4` after the merge.
- The `pm-docs-site` skill's modes are complete instructions against the package.
- Mermaid diagrams render in repository docs and ADR sections, in light and dark mode.
- `pm-docs-site dev --port <n> --host <h>` serves on that port and host, so an Aspire resource reaches it.

## Non-goals

- Anything in the four parked items (architecture, brief and inbox pages, research, `1.0.0`). The architecture item ships first; R-013 only consumes its option.
- A `views` or `options` change other than what the migration needs.
- Changing the export schema (it stays at `schemaVersion` 5).
- Pinning the published npm version in `docs-site/` (decision 5).

## Anti-goals

- A consumer that is left with neither the templates nor the package. An architecture-module site must be told to wait; it must not be half-migrated.
- An AppHost edit, or AppHost tests, that the user did not agree to.
- Client-side Mermaid rendering, or any build step that needs a browser (it breaks determinism and the "no JavaScript to draw" property).
- A silently broken diagram: a Mermaid fence that does not parse fails the build and names the file.

## Approaches

How `docs-site/` depends on the package (the user chose 1):

| Approach | Trade-off |
| --- | --- |
| 1. Local folder, `file:../packages/pm-docs-site` (chosen) | The site and the package change in one PR, and CI builds them before anything is published. It does not exercise the npm install path; the package's pack-and-install test already does. |
| 2. Pin the published `0.1.0-pre.4` | This is the true consumer path. But `pre.4` exists only after this PR merges, so CI on the branch cannot install it, and every later package change needs a second PR. |
| 3. A Bun workspace at the root | It moves `bun.lock` out of `docs-site/`, which breaks the Done when, and changes the repository layout for one site. |

Rules version (agent's call): **stay on rules 21** and bump `package.json` to `21.0.0-pre.7` (`just bump prerelease`). `main` is `21.0.0-pre.6` and `v21.0.0` is not tagged, so AGENTS.md's unreleased-prerelease exception applies. This overrides the item Note's "bumps the rules major": a major bump would ask every consumer to run `pm-setup` for a line that has not shipped. Rule 9's change gets a paragraph in the Version 21 upgrade notes.

Mermaid renderer (user's choice): **Pele**, a Sätteri mdast plugin that renders at build time to inline SVG, with no browser and no dependencies. A client-side `mermaid` script was rejected because it breaks determinism and adds JavaScript. `rehype-mermaid` was rejected because it needs Playwright at build time.

## Design

### 1. Package changes (`packages/pm-docs-site/`)

- **Mermaid.**
  - Add exact pins for `pele` (`1.13.0`, the latest on 2026-11-23), `@astrojs/markdown-satteri`, and `satteri`, at versions compatible with the pinned Astro `7.4.8`.
  - The integration (`lib/index.ts`) sets `markdown.processor` to `satteri({ mdastPlugins: [mermaid] })` and adds `pele.css` to Starlight's `customCss`.
  - The plugin (`lib/mermaid.ts` or `src/plugins/mermaid.ts`) replaces each `code` node whose `lang` is `mermaid` with `{ type: 'html', value: svg }`, using `render(node.value, { idPrefix: \`pele-${n}\` })`.
  - The `n` counter is **per file**, in document order, so IDs are stable across builds.
  - `pele.css` maps Pele's variables to Starlight's (`--pele-bg: var(--sl-color-bg)`, `--pele-fg: var(--sl-color-text)`, and the rest). Verify the class or element the CSS targets against Pele's real output; the article's CSS targets `.pele`, which its code does not add.
  - On a render error, throw with the file path and the error, so the build fails.
  - It applies wherever the package renders Markdown: `src/loaders/repo-docs.ts` and `src/loaders/adrs.ts` both go through Astro's Markdown rendering. Verify that `renderMarkdown` in content loaders uses the configured processor; if it does not, pass the plugin there too.
  - When a consumer has its own `markdown.processor`, keep it and warn that Mermaid is off. Builder's call: whether to compose the plugins instead.
  - **Fallback (agent's call, from the builder check).** If `@astrojs/markdown-satteri` (`0.4.10` on 2026-11-23) does not work with Astro `7.4.8`, call Pele's `render` from a remark plugin on Astro's default processor instead. It is still Pele, still build-time SVG, and still deterministic, so ADR-006 holds either way: it records "Pele at build time", not "Sätteri".
  - **Coverage.** The wiki's 12 fences use only `sequenceDiagram` (11) and `flowchart LR` (1). If Pele cannot render one of them, the build fails (anti-goal). Rewrite that diagram in a form Pele renders and say so in the PR. Never fall back to a client-side renderer.
- **Port and host.** `lib/cli.ts` `dev` (and `preview`, if the CLI has one) accepts `--port <n>` and `--host <h>`. It falls back to the `PORT` and `HOST` environment variables, then to Astro's defaults. It passes them to Astro's `server` config. Verify which arguments `AddViteApp`/`addViteApp` passes for a Bun app in the Aspire version the skill targets; support that form.
- **Schema range.** `SUPPORTED_SCHEMA_VERSIONS` stays `[5]`. A test writes a scratch export at `schemaVersion` 6 and asserts that `pm-docs-site build` (or `check`) fails with the `PlanningExportError` message naming 6 and the supported list. A second case shows the same export passes when the list includes 6, via a test seam (for example an injectable list); no real 6 is supported.
- **Reproducibility.** `scripts/check-reproducible.ts <site-dir>` builds the site twice into separate output folders and compares the SHA-256 of every `*.html` under `dist/`. It prints the first differing file and exits 1 on a difference. `just package-test` runs it on `examples/demo`.
- **Version.** `package.json` `0.1.0-pre.3` → `0.1.0-pre.4`. Merging to `main` triggers `publish-pm-docs-site.yml`, which publishes under the `prerelease` dist-tag and moves `latest` (no stable version exists).
- **Instructions.** The README drops "Until roadmap item R-013 migrates…" and documents:
  - the four-file consumer, and every option;
  - Mermaid, and the CLI's `--port` and `--host`;
  - running the site under Aspire.
  - `docs/wiki/guide/Docs-Site-Package.md` gets the same changes. `scripts/validate.ts` already checks that the version in both does not drift.

### 2. `docs-site/` migration

- **Delete:** `pm-docs-site.json`, `tsconfig.json`, `vitest.config.ts`, `astro.config.mjs`, and all of `src/`.
- **`astro.config.ts`:**
  - `pmDocsSite({ title, description, docs: { root: '..', sources }, views })`.
  - `sources` are the four in today's `src/docs-sources.ts` (Project, Guide, Skills, References), moved inline.
  - `views` lists today's set (now, milestones, features, inbox, briefs, strategy) **plus `graph` and `decisions`**. They are the package's defaults and this repository has ADRs. Agent's call: the site shows everything the package has.
  - `planning` keeps the default `../planning/planning.json`.
  - `title` and `description` are today's `SITE_TITLE` and `SITE_DESCRIPTION` from the manifest.
- **`package.json`:**
  - Dependencies: `"@purview-dev/pm-docs-site": "file:../packages/pm-docs-site"` only.
  - Scripts: `dev` is `pm-docs-site dev`, `build` is `pm-docs-site build`, `check` is `pm-docs-site check`, and `preview` is `astro preview`.
  - It stays site-owned and `private`, named `pm-skills-docs-site`.
- **`.gitignore`:** unchanged.
- **`bun.lock`:** regenerated.
- **CI (`.github/workflows/ci.yml`):** its docs-site job gets the same changes as `docs-check`: it builds the package first and drops the `site.ts check` step.
- **`justfile`:**
  - `docs`, `docs-preview`, and `docs-check` build the package first (`cd packages/pm-docs-site && node scripts/build.ts`), as `demo` does.
  - `docs-check` drops the `site.ts check .` and `bun run test` lines; it installs, then runs `bun run check` and `bun run build`.
  - Recipe comments change from "against the pm-docs-site templates" to the package.
  - No shell is set in the justfile.
- **Item Note (2) and (3):** the R-028 accessibility gaps and the `Entry docs → 404 was not found` warning were template-only. They go away with the templates. Verify the warning is absent from `just docs-check` output.
- **Item Note (4):** the brief's "static HTML first" Performance row is superseded by R-010's React islands. Record it in the brief's `## Revisions` at the stage checkpoint (PM state, not this spec's files).

### 3. `pm-docs-site` skill rewrite (`skills/pm-docs-site/`)

**Delete:** `templates/site/`, `templates/repo-docs/`, `templates/architecture/`, `scripts/site.ts`, and the Placeholders section. `templates/aspire/` stays (AppHost snippets and `DocsSiteKit.cs`). `references/spec.md` is rewritten to describe the package-based site; the sections about template files go.

**Package version (agent's call, from the builder check):**

- SKILL.md states a **minimum** package version, `0.1.0-pre.4`, the first release with Mermaid and `--port`/`--host`. It does not state the exact current one. An exact version would make every package release a `skills/**` edit, and so a rules bump, which defeats the Intent.
- `scaffold` and `upgrade` run `bun add @purview-dev/pm-docs-site --exact`. That resolves the `latest` dist-tag (the newest prerelease until a stable version exists) and pins it exactly in `package.json` and `bun.lock`, so a consumer's build stays reproducible.
- "This skill reads schemaVersion 5" stays, and is checked against the package's list (section 4). The skill only needs editing when the minimum or the schemaVersion moves, and both of those are rules changes anyway.

**Template inventory for `upgrade` (agent's call, from the builder check):**

- Before `templates/site/` and `templates/repo-docs/` are deleted, generate `references/template-files.md`. It is the frozen list of every path `site.ts` rendered (the core, `repo-docs`, and `architecture`), with a SHA-256 of each rendered file for this repository's last render as a reference point.
- `upgrade` on a template site deletes only listed paths. It deletes the manifest last.
- When it finds anything unlisted, it stops **before deleting anything**, lists those paths, and asks one question: `<n> files in <site> are not template files. How should upgrade continue?` with `Stop so I can move them (recommended)` and `Delete them too`. An unlisted file means a page or component the consumer added, which the package has no place for.
- It shows the site's `astro.config.mjs` when it holds more than the template's `starlight()` call (other integrations, `site`, `base`, or Starlight options), and carries those into `astro.config.ts` beside `pmDocsSite(...)`.
- A hand edit to a listed template file is lost. The output `Note` says so and names `git show HEAD:<path>` to recover it.

**Modes:**

- **`plan`.** It is unchanged in role: a roadmap item whose `Note` names `pm-docs-site`. Its description of what gets built changes to the four files.
- **`check`** (read-only):
  - Reads the site's `package.json` dependency version against the skill's version.
  - Reads the export's `schemaVersion` against the installed package's supported list.
  - Runs `pm-docs-site check`.
  - Reports `current`, `package below minimum (<installed> < <minimum>)`, `schema unsupported`, or `template site (run upgrade)` when it finds `pm-docs-site.json`.
- **`scaffold`:**
  - Writes `package.json`, `astro.config.ts`, and `.gitignore` in the site folder, then runs `bun add @purview-dev/pm-docs-site@<version> --exact`, which writes `bun.lock`.
  - `title` and `description` come from the README, as the old Placeholders did. Put the values in the output so the user can correct them.
  - `docs.sources` come from the repository's Markdown folders.
  - It adds the `Docs` group to the `justfile`.
  - Verifies with `bun run check` and `bun run build`.
  - Then runs the Aspire step.
- **`extend`:**
  - `view` edits the `views` option.
  - `repo-docs` edits `docs.sources`.
  - `aspire` runs the Aspire step.
  - `architecture` sets the package's architecture option (from the architecture item) to the repository's LikeC4 model folder. It installs that option's peer dependencies the way that item documents, and stops with `no LikeC4 config file` when the model has none.
- **`upgrade`:**
  - **A package site:** sets the dependency to the skill's version (`bun add …@<version> --exact`), then verifies.
  - **A template site** (`pm-docs-site.json` present):
    - Maps the manifest's `SITE_TITLE` and `SITE_DESCRIPTION` to options, its `views` to `views`, and `src/docs-sources.ts` to `docs.sources`.
    - Deletes every template-owned file and the manifest.
    - Writes the four files, then verifies.
    - Replaces an existing `aspire` module's AppHost snippet only if its form changed (it should not; the site folder and `dev` script are the same).
  - **A template site whose manifest lists `architecture`:** it maps the manifest's `LIKEC4_DIR` value to the package's architecture option, and installs that option's peer dependencies.
- **Aspire step** (scaffold, `extend aspire`, and upgrade of a site without one):
  - **Detect** an AppHost: a project with `Sdk="Aspire.AppHost.Sdk"`, or a TypeScript AppHost (`apphost.mts` or `apphost.ts` with an Aspire import). None found means skip, with a `Note`.
  - **Ask** `Add the docs site to the Aspire AppHost <path>?` with the options `Add it (recommended)` and `Leave the AppHost alone`. Record the answer in the output `Note` so a later run does not ask again. Builder's call where the answer lives: the AppHost edit itself is the record, and a "no" is not stored.
  - **On yes, C#:** the existing plain or ResourceKit variant from `templates/aspire/MODULE.md`.
  - **On yes, TypeScript:** the equivalent `addViteApp('docs', '<site>')` with Bun, in run mode only. Verify the TS API names against the Aspire docs (`aspire` skills or `https://aspire.dev`).
  - **Then ask** `Add the two AppHost tests?` with `Add them (recommended)` and `Skip the tests`. This is asked only when the repository has AppHost composition tests, and the tests are the two in `MODULE.md`. With no composition tests, skip and say so (as today).
- **Rule 9 text** (managed section) changes from "write the **Docs site**" to the package-based files:
  - the site folder's four files, the `Docs` group in the `justfile`, and the AppHost files the Aspire step edits on the user's yes;
  - `bun add` of the package in the site folder.
  - It still never writes the PM root, stages, commits, pushes, or creates branches.

### 4. Repository checks and rules

- **`scripts/validate.ts`:**
  - **Remove** `checkDocsSite`'s template checks: template `SCHEMA_VERSION`, `planning-types.ts`, the template fixture, placeholders, and the MIT attribution in `components/lib`.
  - **Remove** the manifest and `differences(docs-site)` check.
  - **Add:** the package's `SUPPORTED_SCHEMA_VERSIONS` includes `planning.schema.json`'s `schemaVersion` const.
  - **Add:** the SKILL.md sentence "reads schemaVersion N" names that const.
  - **Add:** the skill's stated minimum package version is at most `packages/pm-docs-site/package.json` `version`, compared in SemVer order with `scripts/semver.ts`.
  - **Add:** `docs-site/` contains only the four files.
  - Keep the package LICENSE and README version checks. Keep the docs-site fixture's schema validation only if a fixture still exists in the package; the package's own tests cover it.
  - The MIT attribution check moves to the package files if the copied Astro Components Kit files live there; otherwise it is deleted.
- **Managed section (`skills/pm-setup/references/AGENTS-section.md`):**
  - Rule 9 as in section 3, and the **Docs site** Shared definition ("builds from its templates" becomes "from the `@purview-dev/pm-docs-site` package").
  - A new Version 21 upgrade paragraph: `pm-docs-site` now installs the package; run `pm-docs-site upgrade` to migrate a template site, including one with the architecture module.
  - Then reinstall the section at the end of `AGENTS.md` (`pm-setup`, or replace between the markers). `skills/pm-init/templates/config.md` stays equal.
- **AGENTS.md (repository part):** rewrite the `pm-docs-site` paragraph. Drop templates, `site.ts`, `site.ts write docs-site`, site-owned files, and scratch-repository rendering for modules. Describe the four-file site, its local package dependency, and the new validate checks.
- **`pm-help`:** update the `pm-docs-site` row (package-based) and any diagnosis that reads `pm-docs-site.json` (it becomes "template site: run upgrade").
- **README** skill table row for `pm-docs-site`: same wording change.
- **Version:** `just bump prerelease` → `21.0.0-pre.7`. The package goes to `0.1.0-pre.4` (section 1).

## Testing

- **Package:** a Mermaid unit test (one fence renders to SVG, no `language-mermaid` code block remains, and IDs are equal across two renders). An invalid-fence test (the build error names the file). A CLI port and host test (`dev --port 4399` serves on 4399). The schemaVersion 6 tests. Existing tests pass. `just package-test` passes, including `check-reproducible.ts` on the demo.
- **Demo:** add one Mermaid fence to `examples/demo/docs/` so `check-demo.ts` sees a rendered SVG. Builder's call how it asserts this.
- **`docs-site/`:** `just docs-check` passes with no `404 was not found` warning. `bun scripts/check-reproducible.ts docs-site` (or the package path) passes. The wiki's 12 Mermaid fences render as SVG.
- **Skill:**
  - `upgrade` on a scratch copy of the pre-migration `docs-site/` (from `git show main:docs-site/…`) produces the same four files as the hand migration, apart from formatting.
  - `scaffold` in a scratch repository builds.
  - The Aspire step in a scratch C# AppHost (`dotnet new aspire-apphost`, when the .NET SDK is present) adds the resource on yes and nothing on no. `dotnet build` passes, and running it serves the site. When the .NET SDK is absent, say so in the PR and the checkpoint.
- **Repository:** `just validate`, `just lint-check`, and `just version-check` pass.

## Left to the builder

- The exact Pele, Sätteri, and `@astrojs/markdown-satteri` versions compatible with Astro `7.4.8`.
- Where the Mermaid plugin file lives, and composing it with a consumer's own processor.
- The test seam for the schemaVersion 6 pass case.
- The wording of SKILL.md steps, as long as every mode above is covered and Communication contract templates are kept.
- Whether `references/spec.md` is rewritten in place or reduced to the parts that still apply.

## Ramifications

- **Consumers:** a template site keeps working until it runs `pm-docs-site upgrade`. Upgrade is a one-time migration that deletes its template files; it is committed by the item workflow, so it is reversible with git.
- **Dependencies:** adds `pele`, `satteri`, and `@astrojs/markdown-satteri` to the package, all exact-pinned.
- **Security:** no new network or browser use at build time.
- **Reversibility:** `0.1.0-pre.4` on npm cannot be reused.
- **Maintenance:** about 40 template files, `site.ts`, and five validate checks go.
- **Order:** R-013 depends on the architecture item and resumes at `plan` once it is done. When R-013 resumes, check that the architecture item's option name and peer-dependency steps match sections 3 and 4.
