# The docs-site package

`@purview-dev/pm-docs-site` renders the project site from `planning.json` as an npm package, so a
site is four files instead of a copy of the templates.

The `pm-docs-site` skill builds a local, searchable Astro and Starlight site from the plan. Today it
copies about 40 template files into each repository, and every template change reaches a consumer
only through a rules upgrade. The package moves the pages, the components, and the pinned Astro and
Starlight versions into one versioned dependency, so two sites built from the same `planning.json`
and lockfile render the same pages.

## Status

The package is in prerelease on npm under the `prerelease` dist-tag, so install it
with `bun add @purview-dev/pm-docs-site@prerelease`.

## A site in four files

A consumer site holds `package.json`, `astro.config.ts`, `.gitignore`, and the `bun.lock` that
`bun add @purview-dev/pm-docs-site --exact` writes. It has no `src/` folder: the integration points
Astro at the package's pages.

```json
{
  "name": "my-project-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pm-docs-site dev",
    "build": "pm-docs-site build",
    "check": "pm-docs-site check"
  },
  "dependencies": { "@purview-dev/pm-docs-site": "0.1.0-pre.7" }
}
```

```ts
// astro.config.ts
import pmDocsSite from '@purview-dev/pm-docs-site';

export default {
  integrations: [
    pmDocsSite({
      title: 'My project',
      planning: '../planning/planning.json',
      docs: {
        root: '..',
        sources: [{ label: 'Project', base: '.', include: ['README.md'], prefix: 'project/' }],
      },
    }),
  ],
};
```

```text
node_modules/
dist/
.astro/
```

`bun.lock` is never hand-written: `bun add @purview-dev/pm-docs-site --exact` writes it alongside
the three files above it.

Write `planning.json` with `pm-export` first; the site reads the export only, never the Markdown
planning files.

## The board

The Board is a React island: filter it by owner, milestone, size, and RAG, and group it into lanes
by milestone or by owner. Filter and group state live in the URL
(`/plan/board/?owner=user&milestone=M2&group=milestone`), so a filtered or grouped board can be
linked. The integration adds `@astrojs/react` itself, so a site is still four files.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `title` | required | The site title |
| `description` | none | The site description |
| `planning` | `../planning/planning.json` | The export, relative to the site folder |
| `docs` | none | `{ root, sources }`: repository Markdown, each source one sidebar group |
| `views` | all eight | Any of `now`, `milestones`, `graph`, `features`, `inbox`, `briefs`, `strategy`, `decisions` |
| `architecture` | none | `{ project?, highlighting? }`: LikeC4 diagrams, below |

Home, Board, Roadmap, Log, and Risks are always rendered. A docs source has `label`, `base`, and
`include` globs, and optionally `prefix`, `indexFile`, `order`, `collapsed`, and `hidden`.

## Mermaid

` ```mermaid ` fences in repository docs pages and in ADR sections render to inline SVG with
[Pele](https://pele.run) at build time: there is no client-side renderer and no browser in the
build. Pele supports every diagram type built into Mermaid 12.1.0. A fence that does not parse
fails the build and names the file: `pm-docs-site: <file>: mermaid fence is not valid (<message>)`.
A consumer that sets its own `markdown.processor` option to something other than Sätteri keeps it
unchanged; Mermaid fences are then off, with a build warning naming the reason, never a crash.

## Architecture diagrams

The `architecture` option turns on LikeC4 diagrams through `@purview-dev/astroc4`. It is optional: a
site without it never loads astroc4 or LikeC4. A site with it installs them next to the package:

```bash
bun add --exact @purview-dev/astroc4@1.0.0-prerelease.9 likec4 @likec4/core shiki @astrojs/markdown-satteri
```

- **Diagram markers.** A `<!-- purview:likec4 file="…" view="…" -->` comment, then a Mermaid fence,
  then `<!-- /purview:likec4 -->`, renders as the LikeC4 view on the site, while GitHub shows the
  Mermaid. `file` is relative to the page, or `/`-rooted at the docs root. A model that cannot be
  read, or a view it does not declare, keeps the Mermaid and logs a warning; a marker never fails
  the build. Markers work in `.md` pages only, and ADR sections always show the Mermaid.
- **` ```likec4 ` fences** render as diagrams.
- **`project`** names a LikeC4 project folder (a config file and a `views/` folder). The site then
  has one page per views folder at `/architecture/<folder>/` and an `Architecture` sidebar group.

## Commands

The CLI runs under Node 24 or later.

| Command | Does |
| --- | --- |
| `pm-docs-site dev [site-dir]` | Serves the site with Astro's dev server |
| `pm-docs-site build [site-dir]` | Builds the static site and its search index into `dist/` |
| `pm-docs-site check [site-dir]` | Builds nothing: checks the export's `schemaVersion` and that every docs source folder exists |
| `pm-docs-site peers architecture` | Prints the `architecture` option's install command (see [Architecture diagrams](#architecture-diagrams)) |

A site folder without `astro.config.*` builds from `--title <title>` and `--planning <path>`.
`--port <n>` and `--host <host>` set `dev` and `build`'s Astro server config, and may appear before
or after the site-dir positional in either order. For `dev` only, they otherwise fall back to the
`PORT` and `HOST` environment variables (an Aspire `AddViteApp` resource sets `PORT`); a flag always
wins, `build` and `check` never read them, and a `dev` environment `PORT` that is not a port number
is ignored with a warning on stderr instead of failing the command.

## Running under Aspire

The `pm-docs-site` skill's `aspire` module wires the site into the repository's Aspire AppHost as a
Vite app resource, in run mode only. The plain variant adds this to the AppHost's `Program.cs` (or
`AppHost.cs`), after the other resources and before `Build()`:

```csharp
// The project site: a local reading aid, so it runs only when the AppHost runs.
if (builder.ExecutionContext.IsRunMode)
{
    builder.AddViteApp("docs", "../../docs-site").WithBun(installArgs: ["--frozen-lockfile"]);
}
```

Replace `"../../docs-site"` with the site folder's path relative to the AppHost project folder.
`AddViteApp` sets the `PORT` environment variable, which the CLI's `--port` fallback reads, so the
site serves on the port Aspire assigns it.

## Supported exports

The package reads `pm-export` `schemaVersion` 5. An export in any other format fails `build` and
`check` with a message that says to run `pm-export`, so a site never renders a plan it cannot read.

## Versions

The package is versioned on its own, by `version` in `packages/pm-docs-site/package.json`, and is
not tied to the rules version. A prerelease is published under the `prerelease` dist-tag and a
stable version under `latest`. How a version is checked, published, and tagged is in
[Development](../contributing/Development.md#the-docs-site-package).
