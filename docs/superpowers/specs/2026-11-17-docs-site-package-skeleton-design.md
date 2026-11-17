# R-008 Docs-site package: skeleton at parity — design

- Item: R-008 Docs-site package: skeleton at parity (Serves V4, Milestone M1)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md` (problem, alternatives, challenges, ramifications)
- Branch: `feat/r-008-docs-site-package-skeleton`
- Date: 2026-11-17

## Intent

The project site is today a set of about 40 template files that
`skills/pm-docs-site/scripts/site.ts` renders into every consumer, with
agent-derived placeholder values and unpinned Astro and Starlight versions.
R-008 is the first of six slices that replace that with one versioned
package, `@purview-dev/pm-docs-site`. This slice builds the package and proves
it renders the same pages the current site renders. Nothing is published,
and nothing outside `packages/` changes behaviour.

## Done when

- `bun test` passes in `packages/pm-docs-site/`.
- Building the planning fixture with the package CLI renders every page that
  `docs-site/` renders today (the parity test below).
- `just version-check` passes on this branch, which changes `packages/**`
  without a rules-marker bump.

## Goals

- A consumer site needs no `src/` folder: `package.json`, `astro.config.mjs`
  calling `pmDocsSite({ ... })`, and a lockfile are enough.
- Every value a template takes from a `{{PLACEHOLDER}}` or from
  `pm-docs-site.json` becomes an integration option.
- Astro, Starlight, and TypeScript are pinned to exact versions.
- The supported `schemaVersion` range is declared in one place.

## Non-goals (later slices)

- Backlinks and new links (R-009), board filters (R-010), timeline (R-011),
  dependency graph (R-012).
- Publishing, the publish workflow, the package's own version tags, moving
  `docs-site/` onto the package, rewriting the `pm-docs-site` skill, and
  removing the templates (R-013).
- The `architecture` module (LikeC4 via Astroc4). `docs-site/` does not use
  it, so parity does not need it. A consumer can still add Astroc4 to its own
  `astro.config.mjs`; R-013 decides whether the package wraps it.
- The `aspire` module stays in the skill (brief: Aspire challenge).

## Anti-goals

- Any change to `skills/**`: that would force a rules-major bump in this
  slice.
- Any change in what `docs-site/` renders, or to `just docs-check`.
- Parsing PM Markdown in the package: plan data comes only from
  `planning.json` (brief: Inputs challenge).

## Constraints

- Starlight reads its `docs` collection only from
  `<srcDir>/content.config.ts`
  (`@astrojs/starlight/dist/integrations/vite-virtual-modules.js:36`), and
  Astro gives integrations no hook to add a content collection.
- Node will not strip TypeScript types from files under `node_modules`, so
  code that runs while `astro.config.mjs` loads (the integration and
  anything it imports) must be JavaScript when installed.
- `.gitignore` contains `**/packages/*` (a NuGet rule). The package needs an
  exception or git ignores it.
- `scripts/check-version.ts:56` raises the rules-bump requirement only for
  paths starting `skills/`, so `packages/**` is already exempt; this slice
  proves it rather than changing the script.
- Tooling on the maintainer's machine: Bun 1.4.4, Node 26. Installed site
  versions: Astro 7.4.8, Starlight 0.42.10.

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Integration points Astro's `srcDir` at the package's `src/` | Consumer stays at three files and can add other integrations; relies on `updateConfig({ srcDir })` | **Chosen** by the user |
| Consumer keeps a one-line `src/content.config.ts` re-export | Standard Astro, no reliance on `srcDir`; four consumer files, missing the brief's outcome | Rejected |
| CLI owns a hidden Astro project | No `srcDir` change; consumers cannot add their own integrations | Rejected (brief alternative) |
| Root Bun workspace instead of a standalone package | One root lockfile; changes the root `package.json` that drives releases | Rejected: standalone with its own `bun.lock` |

A throwaway spike on 2026-11-17 confirmed the chosen approach: a consumer
whose `astro.config.mjs` held only the integration built `/`, `/plan/board/`
and `/404` from a package's `src/content.config.ts`, `src/content/docs/` and
`src/pages/`. Two conditions surfaced: the package's dependencies must
resolve from the package location (true once installed), and Vite must not
externalise Starlight in SSR (the spike failed with `astro:middleware` until
Astro and Starlight were consumer dependencies).

## Design

### Layout

```text
packages/pm-docs-site/
  package.json         @purview-dev/pm-docs-site, private: true, version 0.0.0
  bun.lock
  tsconfig.json
  README.md            options, CLI, supported schemaVersions
  index.mjs            the integration (JS + JSDoc), default export pmDocsSite
  index.d.ts           its option types
  cli.mjs              bin: pm-docs-site
  lib/                 config-time JS shared by integration, CLI and pages
    options.mjs        option defaults and validation
    schema-version.mjs SUPPORTED_SCHEMA_VERSIONS = [3], checkSchemaVersion()
    repo-docs.mjs      DocsSource, pagesOf, globToRegExp, pageId (from the loader)
    sidebar.mjs        buildSidebar(options, root)
  src/                 Astro srcDir, compiled by Vite (TypeScript allowed)
    content.config.ts  docs collection with the repo-docs loader
    env.d.ts           declares virtual:pm-docs-site/config
    pages/             the 14 pages from templates/site/src/pages
    components/        the 6 components, with their MIT attribution
    lib/               planning.ts, planning-types.ts
    loaders/           repo-docs.ts (Astro loader; imports ../../lib/repo-docs.mjs)
    styles/            components.css
  test/
    fixtures/planning.json        copy of docs-site/src/lib/__fixtures__/planning.json
    fixtures/docs/                a few Markdown files for the repo-docs pages
    fixtures/site/                consumer: package.json, astro.config.mjs only
    fixtures/expected-pages.txt   the parity snapshot
    *.test.ts
```

### Integration

`pmDocsSite(options)` returns one integration. In `astro:config:setup` it:

1. Validates options (`lib/options.mjs`) and throws on an unknown view or a
   missing `title`.
2. Calls `updateConfig` with `srcDir: new URL('./src/', import.meta.url)`,
   `integrations: [starlight({ title, description, sidebar })]`, and
   `vite.ssr.noExternal: ['@astrojs/starlight', '@purview-dev/pm-docs-site']`,
   so Starlight is bundled whatever the consumer declares.
3. Adds a Vite plugin serving `virtual:pm-docs-site/config`: the resolved
   options with `planning` and `docs.root` as absolute paths from Astro's
   `root`.

The sidebar is computed at config time from the options (`lib/sidebar.mjs`),
the same groups and order as `docs-site/src/sidebar.ts` today.

### Options

| Option | Type | Default | Replaces |
| --- | --- | --- | --- |
| `title` | string | required | `SITE_TITLE` |
| `description` | string | none | `SITE_DESCRIPTION` |
| `planning` | path, from the site root | `../planning/planning.json` | `DEFAULT_PATH` in `planning.ts`, `PM_ROOT` |
| `docs` | `{ root: string, sources: DocsSource[] }` or omitted | omitted (no repo-docs pages) | the `repo-docs` module, `docs-sources.ts`, `SITE_TO_ROOT` |
| `views` | subset of `now, milestones, features, inbox, briefs, strategy` | all six | `views` in `pm-docs-site.json`, `views.ts` |

`modules.ts`, `views.ts` and `docs-sources.ts` disappear: pages and the
content config read `virtual:pm-docs-site/config`. `SPECS_DIR` and
`PLANS_DIR` are carried over only if a page still uses them; the builder
checks and either adds an option or drops them.

### Content collection

`src/content.config.ts` defines `docs` with the repo-docs loader when
`docs` is set. Without it, the collection still exists (Starlight requires
it) and holds no repository pages; the home page is `src/pages/index.astro`
as today.

### Planning data

`src/lib/planning.ts` keeps `loadPlanning(path)` and the view helpers, reads
the path from the virtual module, and replaces the `SCHEMA_VERSION` equality
check with `checkSchemaVersion()` from `lib/schema-version.mjs`. The error
names the supported list and the export's version, and still tells the user
to run `pm-export`.

### CLI

`pm-docs-site <dev | build | check> [site-dir]`, `site-dir` defaulting to
the working directory.

- `dev` and `build` call Astro's programmatic `dev()` and `build()` with
  `root: site-dir`. When the site has no `astro.config.*`, they pass an
  inline config, `integrations: [pmDocsSite({ title, planning })]`, from
  `--title` and `--planning` flags, so a site can build with no config file
  (brief: CLI).
- `check` builds nothing: it loads the options, reads `planning.json`, runs
  `checkSchemaVersion()`, and resolves each docs source. It exits 1 with one
  line per problem.

### Versions

`package.json` pins `astro`, `@astrojs/starlight`, and `typescript` exactly
(`7.4.8`, `0.42.10`, and the `typescript@6` version `docs-site/` resolves),
with no `^` or `~`. `astro` and `@astrojs/starlight` are regular
dependencies, not peers (see Calls made in design). The builder pins any other runtime dependency the pages import the
same way.

### Tests (`bun test`, from `packages/pm-docs-site/`)

- **Unit:** `docs-site/src/lib/planning.test.ts` and
  `docs-site/src/loaders/repo-docs.test.ts`, moved to `bun:test` and pointed
  at the package code; plus tests for `options.mjs`, `schema-version.mjs`
  (3 accepted, 2 and 4 rejected with the message), and `sidebar.mjs` (views
  off remove their entries).
- **Parity:** runs `cli.mjs build test/fixtures/site`, lists every `.html`
  path in its `dist/`, and compares it with `expected-pages.txt`. Parity
  means the same set of pages, not the same content: the user decided
  (2026-11-17) that page content may change as the package improves, so
  no title or HTML comparison is made. The
  snapshot is made once, during this item, by rendering the current
  templates with `site.ts` into a scratch folder outside the repo, pointing
  it at the same fixture `planning.json` and fixture docs, building it, and
  listing its HTML. The commit that adds the snapshot records the command
  used.
- **Views:** a second fixture build with `views: ['now']` has no
  `/plan/milestones/`, `/plan/features/`, `/plan/inbox/`, `/plan/briefs/` or
  `/plan/strategy/` pages.
- **Installed consumer:** `bun pm pack` the package, install the tarball
  into a temporary folder outside the repository whose `package.json` lists
  only `@purview-dev/pm-docs-site`, copy in the fixture `astro.config.mjs`
  and `planning.json`, and build with `node node_modules/.bin/pm-docs-site
  build` (or the platform's equivalent). It passes when the page set equals
  `expected-pages.txt`. This proves the two conditions the spike found
  (dependency resolution from the install location, Starlight bundled in
  SSR) where they can actually fail. The user chose it on 2026-11-17.
- **No config:** `cli.mjs build` on a folder holding only `package.json`
  builds with `--title` and `--planning`.
- **Check:** `cli.mjs check` exits 0 on the fixture and 1 on a copy with
  `schemaVersion: 4`.

Type-checking: `bun run check` runs `astro check` with the fixture site as
root, which checks the package's `src/` through `srcDir`.

### Repository wiring

- `.gitignore`: add `!/packages/pm-docs-site/` after the `**/packages/*`
  rule; `dist`, `.astro` and `node_modules` are already ignored.
- `justfile`: a `package-test` recipe (`bun install --frozen-lockfile`,
  `bun test`, `bun run check` in `packages/pm-docs-site`), added to
  `lint-check`. Sh recipes only; no shell setting in the justfile.
- `.github/workflows/ci.yml`: one job running the same commands.
- `docs-site/`, `skills/**`, the root `package.json`, and
  `scripts/check-version.ts` are not changed.

## Decided by the user

- The integration moves `srcDir` into the package (2026-11-17).
- Standalone package with its own lockfile, templates untouched until R-013
  (2026-11-17).
- A pack-and-install test proves a real installed consumer builds
  (2026-11-17).
- Parity is the page set only; page content may change as the package
  improves (2026-11-17).
- From the brief: npm `@purview-dev` scope, plan data from `planning.json`
  only, nothing published before R-013.

## Calls made in design (correct any)

- Config-time code is plain `.mjs` with JSDoc and a `.d.ts`, so there is no
  build step and the files in git are the files published.
- `private: true` and version `0.0.0` until R-013 publishes.
- `architecture` module left out of this slice.
- `check` is a data check, not `astro check`.
- The parity snapshot is a committed text file, regenerated by hand only
  when a page is deliberately added or removed.
- Runtime: the CLI and every test that builds a site run under Node
  (`#!/usr/bin/env node` on `cli.mjs`; tests spawn `node cli.mjs`
  explicitly, never Bun), because Node is where the
  no-TypeScript-in-`node_modules` rule bites. `engines.node` is `>=22`; the
  new CI job adds `actions/setup-node` pinned to Node 24.
- Dependencies: `astro` and `@astrojs/starlight` are exact-pinned regular
  dependencies of the package, not peers, so a consumer's `package.json`
  lists only `@purview-dev/pm-docs-site`. `vite.ssr.noExternal` covers the
  SSR bundling the spike needed consumer dependencies for.
- `check` options: the integration object carries its resolved options
  (a `pmDocsSiteOptions` property). `check` imports the site's
  `astro.config.*`, finds the integration named `pm-docs-site`, and reads
  them; without a config file it uses `--title` and `--planning`.
- Moved tests are copied, not moved: `docs-site/` stays unchanged until
  R-013.

## Left to the builder

- The exact shape of the virtual module and its type declaration.
- Whether the moved tests keep their names and structure.
- How the CLI parses flags (no new dependency for it).
- Which fixture Markdown files cover the repo-docs pages, as long as the
  same set feeds both sides of the parity snapshot.
