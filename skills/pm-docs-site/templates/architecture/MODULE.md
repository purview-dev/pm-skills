# Module: architecture

One page per folder of LikeC4 views, at `/architecture/<group>/`, rendered
by `@purview-dev/astroc4`. Astroc4 also renders ` ```likec4 ` fences in
the `docs/` pages when the repo-docs module is installed. Spec: section 9
of `references/spec.md`.

## Applies when

- The repository has a LikeC4 model: a folder with a LikeC4 config file
  (`likec4.config.json`, `.likec4rc`, `likec4.config.ts`, or another name
  LikeC4 reads) and a `views/` subfolder of `*.c4` files (for example
  `docs/architecture/likec4/`). Without the config file Astroc4 fails the
  build with `no LikeC4 config file`; never create one, report it.

## Values

| Placeholder | Value |
| --- | --- |
| `{{LIKEC4_DIR}}` | The model folder, repository-relative, without a trailing slash (the folder that contains `views/`) |
| `{{LIKEC4_VERSION}}` | The installed `likec4` version, from `<site root>/node_modules/likec4/package.json` after the install below |

## Install

In the site root:

```bash
bun add @purview-dev/astroc4 @astrojs/react react react-dom likec4 @likec4/core
```

Astroc4 declares these as peer dependencies, but they must also be direct
dependencies of the site: with `@astrojs/react` only installed as a peer,
`astro build` fails with `Cannot find package 'astro:react:opts'`. Bun
installs the remaining peers (`shiki`, `@astrojs/markdown-satteri`) with
Astroc4.

## Files

`site.ts` renders these when `modules` lists `architecture`:

| Template | Owner |
| --- | --- |
| `src/lib/architecture.ts` | Template |
| `src/lib/architecture.test.ts` | Template |
| `src/pages/architecture/[group].astro` | Template |
| `astro.config.mjs` | Template (replaces the core file: the core config plus the Astroc4 plugin) |

Put `LIKEC4_DIR` and `LIKEC4_VERSION` in the manifest's `values`, then run
`site.ts write`. No file is edited by hand.

## Check

- `bun run test` includes the `viewsIn` and `viewGroups` tests.
- `bun run build` writes one `architecture/<group>/index.html` per views
  folder, plus `architecture/overview/`.
- In `astro dev`, a diagram renders instead of staying on its loading
  placeholder. If it does not, read the troubleshooting table in the
  Astroc4 README.
