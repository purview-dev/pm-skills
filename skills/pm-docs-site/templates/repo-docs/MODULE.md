# Module: repo-docs

The repository's Markdown as Starlight's `docs` collection, read in place
from any folders: `docs/` by default, or the README, skill files, and
references. Each source is one sidebar group, and the Log's `(plan)` links
resolve when `docs/` is a source. Spec: section 9 of `references/spec.md`.

## Applies when

- The repository has Markdown to show beyond the plan: a `docs/` folder,
  or Markdown elsewhere that the user names.

## Values

| Placeholder | Value |
| --- | --- |
| `{{SPECS_DIR}}`, `{{PLANS_DIR}}` | The specs and plans folders from the Handoffs table in `<PM root>/config.md`, relative to `docs/` |

## Files

`site.ts` renders these when `modules` lists `repo-docs`:

| Template | Owner |
| --- | --- |
| `src/loaders/repo-docs.ts` | Template (the loader, frontmatter and titles) |
| `src/loaders/repo-docs.test.ts` | Template |
| `src/content.config.ts` | Template (replaces the core file) |
| `src/docs-sidebar.ts` | Template (replaces the core file) |
| `src/docs-sources.ts` | Site: written once, then edited for the repository |

## Sources

`src/docs-sources.ts` lists the Markdown to read. Each source has a
`label` (its sidebar group), a `base` folder relative to the repository
root, `include` globs relative to `base` (`*` within a folder, `**` across
folders), and optionally a URL `prefix`, an `indexFile` that stands for
its folder (`SKILL.md`, `README.md`), `order: 'desc'` for date-named
files, `collapsed`, and `hidden` (built, not listed). A file matched by two
sources is loaded once, by the first.

- The default lists `docs/*.md`, then the specs and plans newest first,
  then every other `docs/` page as hidden. Remove a records source whose
  folder is outside `docs/`.
- With no `docs/` folder, list what the repository has instead, for
  example `{ label: 'Project', base: '.', include: ['README.md'], prefix:
  'project/' }`. Never move or copy a file to fit a source.
- Page titles come from frontmatter `title`, then the first level-1 heading,
  then frontmatter `name`, then the file name; frontmatter `description`
  becomes the page description. `node_modules/` is never read.

## Before rendering

- If a source would give a page the ID `index` (for example `docs/index.md`
  with no prefix), it would take the Home route (`/`) and the build fails.
  Give that source a `prefix`; never rename or move the file.

## Install

Nothing beyond the core packages.

## Check

- `bun run test` includes the loader, `pagesOf`, `pageId`, frontmatter,
  and title tests.
- `bun run build` logs `loaded <n> pages from <n> sources`.
- The sidebar shows one group per listed source, in `docs-sources.ts`
  order.
