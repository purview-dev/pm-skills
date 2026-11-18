# Export the Now card's owner and size

- Captured: 2026-11-18 12:15
- Source: agent (R-010 execute, final review)
- Kind: improvement
- Affects: skills/pm-export/scripts/planning.ts
- Context: R-010 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`pm-export` always writes the Now card as `owner: null, size: null` (`skills/pm-export/scripts/planning.ts:489`), and the docs site's `features()` takes the Now item's owner from that same card, so the active item is "No owner" and has no size on every real board: any owner or size filter on the R-010 Board hides the item being worked on, and Group by Owner puts it in a "No owner" lane. R-010 only makes its label agree with the filter. Carry the active item's owner and size into the export's Now card (and the feature), which changes the export, its schema field docs, the example, and the fixture.

## Links

- packages/pm-docs-site/src/lib/board-data.ts
- skills/pm-export/references/planning.schema.json
