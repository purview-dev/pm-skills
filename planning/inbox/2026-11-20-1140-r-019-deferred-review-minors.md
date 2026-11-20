# R-019 deferred reference review minors

- Captured: 2026-11-20 11:40
- Source: agent (R-019 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/src/lib/ref-boundary.ts, packages/pm-docs-site/src/pages/plan/log.astro
- Context: R-019 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Two minor findings from the R-019 final review, deferred: (1) the shared reference boundary `(?<![\w/-])` in `src/lib/ref-boundary.ts` means an ID after `/` is never linked, so the second ID in `M1/M2` or `R-011/R-012`, and a brief path written `./planning/briefs/x.md`, stay plain text; the link test shares the boundary, so it cannot flag it. Either give IDs a boundary that allows a leading `/` outside a path, or pin `M1/M2` as intended in `test/references.test.ts`. (2) `src/pages/plan/log.astro:41` prints `<id> <title>` as plain text when the entry's ID has no target, so known IDs inside that title are not linked; render `{entry.id} <LinkedText text={entry.title} />` in that case.
