# @purview-dev/pm-docs-site

A local, searchable project site for [pm-skills](https://github.com/purview-dev/pm-skills):
the plan from `planning.json` (written by the `pm-export` skill) and,
optionally, the repository's Markdown, rendered by Astro and Starlight.

Unpublished: version `0.0.0` and `private` until roadmap item R-013 publishes
it to npm. Until then the repository's `docs-site/` still renders the
`pm-docs-site` skill's templates.

## A consumer site

Three files: `package.json`, a lockfile, and `astro.config.mjs`. No `src/`
folder: the integration points Astro's `srcDir` at the package.

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
  "dependencies": { "@purview-dev/pm-docs-site": "0.0.0" }
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

## Options

| Option | Type | Default |
| --- | --- | --- |
| `title` | string | required |
| `description` | string | none |
| `planning` | path from the site root | `../planning/planning.json` |
| `docs` | `{ root, sources }`; `root` from the site root, each source a folder and globs | none: no repository pages |
| `views` | any of `now`, `milestones`, `features`, `inbox`, `briefs`, `strategy` | all six |

Home, Board, Roadmap, Log and Risks are always rendered. A docs source has
`label`, `base`, `include`, and optionally `prefix`, `indexFile`, `order`,
`collapsed`, and `hidden` (see `index.d.ts`).

## CLI

The CLI runs under Node 22 or later.

- `pm-docs-site build [site-dir]` and `pm-docs-site dev [site-dir]` run Astro
  on the site. A site with no `astro.config.*` builds from
  `--title <title>` and `--planning <path>`.
- `pm-docs-site check [site-dir]` builds nothing. It reads the export, checks
  its `schemaVersion`, and checks every docs source folder exists, then exits
  0, or 1 with one line per problem.

## Supported exports

`SUPPORTED_SCHEMA_VERSIONS` in `lib/schema-version.mjs`: pm-export
`schemaVersion` 3. Any other version fails the build and `check`, and the
message says to run the `pm-export` skill.

## Development

```bash
just package-test   # bun install --frozen-lockfile, bun test, bun run check
```

`bun test` includes a build of the fixture site whose page list must equal
`test/fixtures/expected-pages.txt`, and a build from the packed tarball
installed into a temporary folder.

## Releasing

The package is versioned on its own, by `version` in this `package.json`,
not by the repository's skills version. A change to this file on `main`
runs `.github/workflows/publish-pm-docs-site.yml`, which:

1. Skips when the `pm-docs-site-v<version>` tag exists, or while
   `package.json` sets `"private": true`.
2. Installs, tests, type-checks, and checks the tarball's entry points.
3. Publishes to npm with provenance: a prerelease (`0.1.0-pre.1`) under the
   `prerelease` dist-tag, a stable version under `latest`. A version already
   on the registry is not published again.
4. Creates the `pm-docs-site-v<version>` tag and a GitHub release, never
   marked as the repository's latest release.

It authenticates with the `NPM_TOKEN` repository secret when it is set,
otherwise through npm trusted publishing, and runs in the `npm` environment.
Re-run it from the Actions tab (`workflow_dispatch`); every step is
idempotent.
