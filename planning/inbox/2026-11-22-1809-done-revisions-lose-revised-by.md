# Done revisions lose their Revised by link

- Captured: 2026-11-22 18:09
- Source: agent (R-025 design)
- Kind: improvement
- Affects: skills/pm-export/scripts/planning.ts, packages/pm-docs-site/src/lib/planning.ts
- Context: R-025 design
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

A feature page lists "Revised by" only while the revising item is open. `LOG.md` Done lines and the export's `log.done` entries carry no `Revisits`, so `features()` in `packages/pm-docs-site/src/lib/planning.ts` (line 284) gives done items `revisits: null`, and the link disappears once the revision closes. A fix adds `Revisits` to the Done line, the exporter, the schema (schemaVersion 6, which pairs with R-037 Engineering export and docs-site view), the pm-lint rule, and the site.
