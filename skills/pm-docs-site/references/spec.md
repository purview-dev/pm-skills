# PM docs site: specification

The specification for the project documentation site that `pm-docs-site`
builds, extends, checks, and upgrades in a repository managed with the
`pm-*` skills. The site renders the project plan from
`<PM root>/planning.json` with the `@purview-dev/pm-docs-site` package
(Astro and Starlight), and, when the repository has an Aspire AppHost and
the user agrees, runs as a Vite app resource in it.

The package implements every page, component, and derivation. A site is
four files that configure it, so a page change is a package release, not a
change to the site. Paths below use the defaults: PM root `planning/` and
site root `docs-site`.

## 1. Rules (mandatory)

1. **`planning.json` is the only source of plan data.** Every plan fact on
   every page comes from `<PM root>/planning.json`, written by the `pm-export`
   skill. The site never parses `NOW.md`, `ROADMAP.md`, `LOG.md`,
   `STRATEGY.md`, `VISION.md`, the inbox, or the briefs, and never holds a
   plan value typed by hand.
2. **The site never writes PM state.** It never writes `planning.json`, its
   schema, or any file in the PM root. A stale export is fixed by running
   `pm-export`, not by the site.
3. **Values are shown, not judged.** Show what the export holds: IDs, titles,
   dates, counts, `Done when`, results. No invented priorities, scores,
   percentages of anything the export does not count, or prose summaries.
   The package's derivations are fixed mappings, each unit-tested there.
4. **Staleness is visible.** Every plan page shows when the export was
   generated and from which branch and commit.
5. **Fail loudly on a bad export.** A missing file, invalid JSON, or a
   `schemaVersion` the package does not read fails `check` and the build
   with a message that names the file and says to run `pm-export`.
6. **Read in place.** Content outside the site folder (the PM root, `docs/`)
   is read where it lives, relative to the site root. Nothing is copied into
   the site, so a page can never drift from its source.
7. **Local only.** The site is a local reading aid. It is not deployed, has
   no authentication, and is not part of CI unless the repository's CI has
   Bun.
8. **Reproducible.** The package is pinned exactly in `package.json` and
   `bun.lock`, and every install after the first uses `--frozen-lockfile`,
   so two builds from the same export give the same HTML.

## 2. Stack

| Part | Choice |
| --- | --- |
| Site | `@purview-dev/pm-docs-site`, at least the `Minimum package version` in `SKILL.md`; it pins Astro, Starlight, and React itself |
| Package manager and runtime | Bun; the package's CLI runs under Node 24 or later |
| Architecture module | The `architecture` option's peers, installed with the command `pm-docs-site peers architecture` prints |
| Aspire hosting (only with an AppHost) | `Aspire.Hosting.JavaScript` `AddViteApp` (C#) or `addViteApp` (TypeScript) |
| Resource composition (only with ResourceKit) | `Purview.Aspire.ResourceKit`, as the AppHost pins |

## 3. The four files

The site lives in its own folder beside the application source (default
`docs-site`, or `src/docs-site` when `src/` exists):

```text
<site root>/
  package.json      private, "type": "module"; the package as its only dependency, pinned exactly
  astro.config.ts   defineConfig({ integrations: [pmDocsSite({ ... })] })
  bun.lock          written by bun add; committed
  .gitignore        node_modules/, dist/, .astro/
```

There is no `src/` folder: the integration points Astro's `srcDir` at the
package. `package.json` has the scripts `dev` (`pm-docs-site dev`),
`build` (`pm-docs-site build`), `check` (`pm-docs-site check`), and
`preview` (`astro preview`). A repository that develops the package itself
may depend on it with a `file:` path instead of a version.

`astro.config.ts` passes the `pmDocsSite()` options: `title`,
`description`, `planning` (default `../planning/planning.json`), `docs`,
`views`, and `architecture`. The modules map onto them:

- **`repo-docs`:** `docs: { root, sources }`, the repository's Markdown read
  in place, one sidebar group per source. With `docs/` as a source, a done
  item's plan links resolve.
- **`architecture`:** `architecture: { project }`, a LikeC4 project folder
  (a LikeC4 config file and a `views/` folder): one page per folder under
  `views/`, and ` ```likec4 ` fences in the repository docs.
- **`aspire`:** no option; the AppHost runs the site (section 6).

Views (`now`, `milestones`, `graph`, `features`, `inbox`, `briefs`,
`strategy`, `decisions`) are all on unless `views` lists a subset. Other
integrations and top-level Astro options (`site`, `base`) go beside
`pmDocsSite(...)`; the package configures Starlight.

## 4. Data contract

The package's README (`packages/pm-docs-site/README.md`, and the copy in
`node_modules/@purview-dev/pm-docs-site/` in a site) documents every page,
option, and the CLI. The fields the pages read are the export's, as
`<PM root>/planning.schema.json` defines them.

- `SUPPORTED_SCHEMA_VERSIONS` in the package's `lib/schema-version.ts` lists
  the export versions it reads. `pm-docs-site check` and the build fail on
  any other, naming the file, the version, and the supported list.
- `SKILL.md` states `This skill reads schemaVersion <n>.`, and
  `scripts/validate.ts` in the pm-skills repository fails when the
  package's list lacks the export schema's `schemaVersion`, so a schema
  change ships with a package release.
- ` ```mermaid ` fences in repository docs and ADR sections render to
  inline SVG at build time; a fence that does not parse fails the build
  and names the file.

## 5. Commands

When the repository has a `justfile`, add a `Docs` group. `[working-directory]`
and one command per line keep the recipes free of `cd` and `&&`, so they
run under whatever shell the `justfile` uses. Never add or change a
`set shell` or `set windows-shell` setting: the system default keeps the
`justfile` cross-platform.

```just
# Serve the project site at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs:
    bun install --frozen-lockfile
    bun run dev

# Build the project site with its search index, then serve the build at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs-preview:
    bun install --frozen-lockfile
    bun run build
    bun run preview

# Check the export and build the project site (local only). Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs-check:
    bun install --frozen-lockfile
    bun run check
    bun run build
```

`just docs` serves <http://localhost:4321> with live reload; `pm-docs-site
dev` takes `--port <n>` and `--host <host>`, else the `PORT` and `HOST`
environment variables. `just docs-preview` serves the built site, where
search works. `just docs-check` is the site's build check: `pm-docs-site
check` (the export and the docs sources), then a full build, which also
writes the search index.

### 5.1 Search

Search is Starlight's built-in Pagefind search; there is nothing to
install or configure. The build indexes every page into `dist/pagefind/`,
so search works on the built site (`just docs-preview`), not under
`astro dev`. Nothing leaves the machine: the index is static files in
`dist/`.

## 6. Aspire resource (only when an AppHost exists)

Skip this section when the repository has no Aspire AppHost. Add the
resource only when the user answers yes, and the tests only on a second
yes. The AppHost snippets and tests are in `templates/aspire/MODULE.md`.

### 6.1 With Purview.Aspire.ResourceKit

When the AppHost composes resources with `[HostKit]` and
`[ResourceDefinition<T>]` kits, add one kit:

- Package: `Aspire.Hosting.JavaScript` in the AppHost project.
- Resource name constant: `public const string DocsSite = "docs";` in the
  host's resource-name class, with an XML doc comment.
- Kit, in the folder with the other resource kits:
  `templates/aspire/DocsSiteKit.cs`, a `[ResourceDefinition<ViteAppResource>]`
  whose `BuildResource` returns
  `builder.AddViteApp(Name, "<site root from the AppHost>").WithBun(installArgs: ["--frozen-lockfile"])`
  and whose `IsResourceEnabled` is `builder.ExecutionContext.IsRunMode`.

The generated `AddAspireResourceKit()` registers the kit; no `Program.cs`
change is needed. The resource has no references, waits, or environment
variables: it reads only files.

### 6.2 Without ResourceKit

In the AppHost's program, guarded by run mode:

```csharp
if (builder.ExecutionContext.IsRunMode)
{
    builder.AddViteApp("docs", "../../docs-site").WithBun(installArgs: ["--frozen-lockfile"]);
}
```

### 6.3 TypeScript AppHost

In `apphost.mts` (or `apphost.ts`), guarded by run mode, with the API
names confirmed against the AppHost's Aspire version (`SKILL.md`, Aspire
step):

```ts
const executionContext = await builder.executionContext.get();
if (await executionContext.isRunMode.get()) {
    await builder.addViteApp('docs', '../docs-site').withBun(true, ['--frozen-lockfile']);
}
```

`AddViteApp` and `addViteApp` set `PORT`, which `pm-docs-site dev` reads,
so the site serves on the port Aspire assigns.

### 6.4 Tests

Only when the repository has AppHost composition tests, add two:

- `AppHost_InRunMode_HasTheDocsSiteWithAnHttpEndpoint`: the `docs`
  resource exists and has an `http` `EndpointAnnotation`.
- `AppHost_InPublishMode_HasNoDocsSite`: no resource named `docs`.

Leave any artefacts the AppHost regenerates on build (for example an
`.aspirec4/` folder) changed, for the workflow to commit.

## 7. Tests and acceptance

The pages, derivations, and their unit tests are the package's. The site
is done when:

1. `just docs-check` passes: `pm-docs-site check` exits 0 and the build
   completes.
2. The site folder holds only `package.json`, `astro.config.ts`,
   `bun.lock`, and `.gitignore` (besides `node_modules/`, `dist/`, and
   `.astro/`), and `package.json` pins `@purview-dev/pm-docs-site` at or
   above the minimum.
3. `just docs` serves Home, Board, Roadmap, Log, Risks, and every view that
   is on (one item page and one milestone page at least) with HTTP 200,
   each showing the export stamp.
4. Deleting `planning.json` fails the build with `No plan export at <path>.`
5. After `just docs-check`, `dist/pagefind/pagefind-entry.json` exists, and
   on `just docs-preview` searching an item's ID lists its item page first.
6. With `architecture`: one `architecture/<folder>/` page per folder under
   the model's `views/`.
7. With an AppHost and the user's yes: the `docs` resource is running with
   a working endpoint, and, when the tests were added, both pass.

## 8. Not doing

- No pages, components, or `src/` files in a site: a new page is a change
  to the `@purview-dev/pm-docs-site` package.
- No editing of the plan from the site (no forms, no drag and drop):
  changes go through the `pm-*` skills.
- No deployment, hosting, search engine indexing, or authentication. Site
  search is the local Pagefind index only (section 5.1).
- No second data source for plan facts (no Markdown parsing, issue
  trackers, or git history).
- No runtime API: every page is built from the export at build or dev time.
- No client-side diagram rendering: Mermaid renders at build time.
