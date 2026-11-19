# Widen R-018 to export Now item's links

- Captured: 2026-11-19 10:01
- Source: agent (R-012 design)
- Kind: improvement
- Affects: R-018
- Context: R-012 design
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The user chose (R-012 design, 2026-11-19) to widen R-018 Export the Now card's owner and size so the export also carries the active item's own `Depends on` and `Revisits`. Today `now.item` is an `ItemRef` (ID and title) and `features()` in `packages/pm-docs-site/src/lib/planning.ts` gives the Now feature empty links, so the R-012 dependency graph cannot draw them (for example R-008 -> R-012). Add to R-018's Done when: the export gives the active item its `dependsOn` and `revisits`, the schema docs, example, and fixtures agree, the graph draws those edges, and the graph's `Own links not exported yet` notice is removed. Apply with `pm-item` after R-012's design.

## Links

- docs/superpowers/specs/2026-11-19-docs-site-package-dependency-graph-design.md
