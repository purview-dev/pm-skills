# The docs-site package

`@purview-dev/pm-docs-site` renders the project site from `planning.json` as an npm package, so a
site is three files instead of a copy of the templates.

The `pm-docs-site` skill builds a local, searchable Astro and Starlight site from the plan. Today it
copies about 40 template files into each repository, and every template change reaches a consumer
only through a rules upgrade. The package moves the pages, the components, and the pinned Astro and
Starlight versions into one versioned dependency, so two sites built from the same `planning.json`
and lockfile render the same pages.

## Status

The package is in prerelease: `0.1.0-pre.1` is on npm under the `prerelease` dist-tag, so install it
with `bun add @purview-dev/pm-docs-site@prerelease`. Board filters, the milestone timeline, and the
dependency graph are still being built. Until roadmap item R-013 (publish and migrate) moves the
`pm-docs-site` skill onto the package, the skill still renders the templates, and this repository's
own `docs-site/` is rendered from them.

## A site in three files

A consumer site holds `package.json`, a lockfile, and `astro.config.mjs`. It has no `src/` folder:
the integration points Astro at the package's pages.

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
  "dependencies": { "@purview-dev/pm-docs-site": "0.1.0-pre.1" }
}
```

```js
// astro.config.mjs
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

Write `planning.json` with `pm-export` first; the site reads the export only, never the Markdown
planning files.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `title` | required | The site title |
| `description` | none | The site description |
| `planning` | `../planning/planning.json` | The export, relative to the site folder |
| `docs` | none | `{ root, sources }`: repository Markdown, each source one sidebar group |
| `views` | all six | Any of `now`, `milestones`, `features`, `inbox`, `briefs`, `strategy` |

Home, Board, Roadmap, Log, and Risks are always rendered. A docs source has `label`, `base`, and
`include` globs, and optionally `prefix`, `indexFile`, `order`, `collapsed`, and `hidden`.

## Commands

The CLI runs under Node 22 or later.

| Command | Does |
| --- | --- |
| `pm-docs-site dev [site-dir]` | Serves the site with Astro's dev server |
| `pm-docs-site build [site-dir]` | Builds the static site and its search index into `dist/` |
| `pm-docs-site check [site-dir]` | Builds nothing: checks the export's `schemaVersion` and that every docs source folder exists |

A site folder without `astro.config.*` builds from `--title <title>` and `--planning <path>`.

## Supported exports

The package reads `pm-export` `schemaVersion` 3. An export in any other format fails `build` and
`check` with a message that says to run `pm-export`, so a site never renders a plan it cannot read.

## Versions

The package is versioned on its own, by `version` in `packages/pm-docs-site/package.json`, and is
not tied to the rules version. A prerelease is published under the `prerelease` dist-tag and a
stable version under `latest`. How a version is checked, published, and tagged is in
[Development](../contributing/Development.md#the-docs-site-package).
