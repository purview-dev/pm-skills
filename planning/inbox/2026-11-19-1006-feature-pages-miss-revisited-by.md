# Feature pages do not list revisions

- Captured: 2026-11-19 10:06
- Source: agent (R-012 design)
- Kind: improvement
- Affects: packages/pm-docs-site/src/lib/planning.ts
- Context: R-012 design
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The R-012 builder check found that `dependents()` in `packages/pm-docs-site/src/lib/planning.ts` looks only at `dependsOn`, so a feature page lists its dependants but not the items whose `Revisits` names it. The R-012 graph draws Revisits edges; the feature pages should list "Revised by" too. Out of R-012's scope (its spec, Non-goals).
