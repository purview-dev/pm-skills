# ADR-002 ADR sections export as Markdown text

- Status: accepted
- Date: 2026-11-22
- Category: data
- Supersedes: none
- Item: R-038
- Source: none

## Context

The docs site must show and search whole ADRs, and it reads only
`planning.json`. `pm-export` is dependency-free.

## Decision

`planning.json` carries each ADR's Context, Decision, Alternatives, and
Consequences as the Markdown under each heading (strings), and
`@purview-dev/pm-docs-site` renders them to HTML at build time with the
site's configured Markdown processor, through a content loader's
`renderMarkdown` (as `src/loaders/repo-docs.ts` does).

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Each section as Markdown text, rendered by the site at build time | The schema checks only that a section is a string; the export grows | Chosen |
| Structured blocks parsed in the export | Schema-checked, but needs a Markdown parser in the exporter and loses what it does not model | Rejected |
| Header and path only, the site reads the file | Breaks the rule that the site reads the export only | Rejected |

## Consequences

- The schema checks only that a section is a string.
- The export grows by the text of every ADR.
- No new dependency: `@astrojs/markdown-remark` is not installed by Astro
  7, so the loader's `renderMarkdown` is used instead.
- IDs inside the rendered HTML are linked by a pass over the HTML, not by
  `LinkedText`.
- Spec: `docs/superpowers/specs/2026-11-22-adr-export-and-decisions-view-design.md`.
