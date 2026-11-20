# @purview-dev/pm-docs-site

A local, searchable project site for [pm-skills](https://github.com/purview-dev/pm-skills):
the plan from `planning.json` (written by the `pm-export` skill) and,
optionally, the repository's Markdown, rendered by Astro and Starlight.

**Documentation:** [PM Skills documentation](https://purview.dev/docs/pm-skills/)
on purview.dev (the *Docs-site package* guide page), part of the
[PM Skills](https://purview.dev/projects/pm-skills/) project.

Prerelease: builds are on npm under the `prerelease` dist-tag
(`bun add @purview-dev/pm-docs-site@prerelease`). Until roadmap item R-013
migrates the `pm-docs-site` skill to it, the skill and this repository's
`docs-site/` still render the skill's templates.

## A consumer site

Three files: `package.json`, a lockfile, and `astro.config.ts`. No `src/`
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
  "dependencies": { "@purview-dev/pm-docs-site": "0.1.0-pre.2" }
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

## Options

| Option | Type | Default |
| --- | --- | --- |
| `title` | string | required |
| `description` | string | none |
| `planning` | path from the site root | `../planning/planning.json` |
| `docs` | `{ root, sources }`; `root` from the site root, each source a folder and globs | none: no repository pages |
| `views` | any of `now`, `milestones`, `graph`, `features`, `inbox`, `briefs`, `strategy` | all seven |

Home, Board, Roadmap, Log and Risks are always rendered. A docs source has
`label`, `base`, `include`, and optionally `prefix`, `indexFile`, `order`,
`collapsed`, and `hidden` (see `lib/types.ts`).

## Board

The Board is a React island, hydrated on load: every roadmap item in five
columns (Now, Next, For you, Waiting, Done), filtered and grouped without a
page reload.

| Filter | Values |
| --- | --- |
| Owner | `agent`, `user`, `both` |
| Milestone | each milestone in the plan, or `none` (no milestone) |
| Size | `S`, `M`, `L` |
| RAG | `red`, `amber`, `green`, or `none` (no risk) |

Filters combine with AND. A card's RAG is the worst of the open, mitigating,
or accepted risks that affect it (closed risks and milestone-level risks
never colour a card). Group by `none` (today's board), `milestone`, or
`owner`, which splits the board into one lane per group, each holding all
five columns.

Filter and group state lives in the URL query string, in that order
(`owner`, `milestone`, `size`, `rag`, `group`), so a filtered or grouped
board can be linked and survives a reload:
`/plan/board/?owner=user&milestone=M2&group=milestone`. Unknown or junk
values fall back to All / None. Column collapse still works per column,
across every lane, and without JavaScript the full, ungrouped board renders
with the filter bar hidden.

The integration adds `@astrojs/react` itself, so a consumer site stays the
three files above.

## Roadmap timeline

The Roadmap page opens with a timeline: a React island with one card per
milestone, in strategy order, then a `No milestone` card when it has items
that are not dropped. Each card shows the milestone ID and name (a link to
its milestone page when the Milestones view is on), a `Focus` badge, its
status (with the done date), its target or `No target`, and
`<done> of <total> done` with a progress bar.

The strip runs left to right by default and scrolls sideways inside itself;
a plain vertical wheel scrolls it sideways until it reaches an end, then
the page scrolls. `Top to bottom` lays it out vertically, and the choice is
kept in the URL as `?layout=vertical`, alongside any other parameters, so a
link opens the same layout.

Zoom runs from 50% to 200% in steps of 25%: the `Zoom out`, `Zoom in`, and
`Reset zoom` buttons, Ctrl or Cmd + wheel over the strip, or a trackpad
pinch. Zoom resizes the cards rather than scaling the page, and it is not
kept in the URL: every visit starts at 100%.

## Graph

The Graph page (the `graph` view) is a React island that shows how open
items depend on each other: one node per open item, with its ID (a link to
its feature page), title, milestone, size, section, and owner, and one edge
per `Depends on` and `Revisits` link, drawn from the prerequisite to the item
that waits for it and left to right in the order the work has to happen.
`Revisits` edges are dashed and labelled `revisits`. A done or dropped item
an open item points at is a small chip (`✓ R-008`, or `✗ R-003` struck
through), and an ID that matches no item is a warning chip
(`? R-099 not found`). The active item is highlighted as on the Board; an
explicitly blocked item has a dashed border. Every position is computed at
build time, so no layout code reaches the browser.

Two switches change the view, and each is kept in the URL alongside any
other parameters:

| Switch | Off | URL key |
| --- | --- | --- |
| `Milestone lanes` | one flow, with unlinked items in a `No links` tray below | `lanes=off` |
| `Show done prerequisites` | no done or dropped chips; each node shows `✓ <n> done` instead | `done=off` |

With lanes on, each milestone with open items is a band, in strategy order,
labelled with its ID and name and `Focus` for the focus milestone, then
`No milestone`. Click a node or chip, or press Enter on it, to trace its
chain: everything it waits on and everything that waits on it, transitively,
stays bright and the rest fades. The selection is kept as `focus=<ID>`, so
a link opens with the same chain highlighted. Click the selected node again,
or its ID link, to open its feature page; Escape or a click on the
background clears the selection. Drag to pan, and zoom with the wheel or a
pinch over the graph, or the `Zoom out`, `Zoom in`, and `Fit` buttons.

Below the graph, a `Dependencies` list gives each open item's links as plain
text, for search, screen readers, and browsers without JavaScript.

The page adds `@xyflow/react` and `@dagrejs/dagre` as dependencies; dagre
runs at build time only; it never reaches the browser. The island's
JavaScript and `graph.css` load only on `/plan/graph/`, never on another page.

## CLI

The CLI runs under Node 24 or later.

- `pm-docs-site build [site-dir]` and `pm-docs-site dev [site-dir]` run Astro
  on the site. A site with no `astro.config.*` builds from
  `--title <title>` and `--planning <path>`.
- `pm-docs-site check [site-dir]` builds nothing. It reads the export, checks
  its `schemaVersion`, and checks every docs source folder exists, then exits
  0, or 1 with one line per problem.

## Supported exports

`SUPPORTED_SCHEMA_VERSIONS` in `lib/schema-version.ts`: pm-export
`schemaVersion` 4. Any other version fails the build and `check`, and the
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
not by the repository's skills version, and tagged `pm-docs-site-v<version>`.
The release follows purview-dev/astroc4: bump `version` and merge to `main`.
That is the whole process.

### Version changes

`scripts/check-version.ts` runs on every pull request (and the pre-push
hook) and fails when the package's version:

- is not SemVer (`MAJOR.MINOR.PATCH`, optionally `-<prerelease>`),
- is older than the version on `main`,
- was bumped to a version whose `pm-docs-site-v<version>` tag exists, or
- is a prerelease of an already released version.

A bump is not required: a change that keeps the version merges, and the
publish workflow then skips it (REL002).

### The publish workflow

A change to this `package.json` on `main` runs
`.github/workflows/publish-pm-docs-site.yml`. Its eligibility step applies
the purview-dev release rules:

| Rule | Passes when | Otherwise |
| --- | --- | --- |
| REL001 | the version is SemVer | fails |
| REL002 | `pm-docs-site-v<version>` is not tagged | skips, green: the version is released |
| REL003 | a stable version runs from `main` | fails |

While `package.json` sets `"private": true` it also skips, green. Then it
installs, tests, type-checks, builds `dist/`, and runs `scripts/check-exports.ts`.
The `prepack` script runs the same build and check, so every pack and a local
`npm publish` build first and cannot burn a version on a package with missing
or non-JavaScript entry points. It publishes a prerelease
version (one with a `-pre` part) under the `prerelease` dist-tag and a stable version under
`latest`, skips a version already on the registry, and keeps `latest` on the
newest prerelease until a stable release exists. Only then does it create the
tag and a GitHub release, never marked as the repository's latest release.
Every step is idempotent, so re-run it from the Actions tab
(`workflow_dispatch`).

The tag is written only by the workflow. A hand-pushed
`pm-docs-site-v<version>` tag makes the release of that version skip.

### Authentication: npm trusted publishing

The workflow holds no npm token: `id-token: write` lets npm exchange the
job's OIDC token for a short-lived publish credential, and npm attaches
provenance itself. `scripts/workflows.test.ts` fails a pull request that adds
a token, `registry-url`, or `--provenance`. The job runs in the GitHub `npm`
environment.

A trusted publisher is configured on the package, so the package must exist
on npm first. Once, from an account that can publish to `@purview-dev`:

1. Remove `"private": true`, set a prerelease version, and
   publish it locally: `npm publish --access public --tag prerelease`.
2. Add the trusted publisher, with *Allow npm publish* and *Allow npm
   dist-tag* ticked (the CLI grants only the first):

   ```sh
   npm trust github @purview-dev/pm-docs-site \
     --repo purview-dev/pm-skills \
     --file publish-pm-docs-site.yml \
     --allow-publish
   npm trust list @purview-dev/pm-docs-site
   ```

3. Merge that version bump. Its tag does not exist yet, so the workflow
   finds the version on the registry, skips the publish, and writes the tag
   and the release. Every later version is published by the workflow.

Renaming `publish-pm-docs-site.yml` stops publishing until the trusted
publisher is re-created, because npm validates the workflow filename.
