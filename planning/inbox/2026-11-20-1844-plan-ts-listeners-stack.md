# Popup script listeners stack on re-run

- Captured: 2026-11-20 18:44
- Source: agent (R-028 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/src/scripts/plan.ts
- Context: R-028 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-028 final review: `start()` in `src/scripts/plan.ts` adds `pointerdown`, `pointerup`, and `click` listeners on `document` each time it runs. If it ever runs twice on one page (for example under Astro view transitions), the listeners stack. Guard `start()` so it runs once per document.
