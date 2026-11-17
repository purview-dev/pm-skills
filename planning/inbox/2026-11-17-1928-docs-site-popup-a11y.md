# Docs-site popup and board accessibility polish

- Captured: 2026-11-17 19:28
- Source: agent (R-009 execute, final review)
- Kind: improvement
- Affects: packages/pm-docs-site
- Context: R-009 execute
- Discuss: no
- Related: R-010
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Reviewed: never

## Idea

Deferred minors from the R-009 final review: card links do not say they open a popup (aria-haspopup="dialog"); a backdrop click does not close the item dialog; popup section headings share the dialog title's h2 level; Board collapse toggles render without JavaScript and do nothing (render them hidden, let plan.ts reveal them); KanbanItemCard keeps tabindex=0 around a card that now holds links, so each card costs extra tab stops; no browser test for localStorage that throws.

## Links

- packages/pm-docs-site/src/scripts/plan.ts
- packages/pm-docs-site/src/components/lib/KanbanItemCard.astro
