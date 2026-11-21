# Template docs site still logs the 404 warning

- Captured: 2026-11-21 10:35
- Source: agent (R-031 execute)
- Kind: tech-debt
- Affects: skills/pm-docs-site/templates/site/src/content.config.ts
- Context: R-031 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-031 fixes the `[WARN] [content] Entry docs → 404 was not found.` warning in the package (`packages/pm-docs-site`), but `docs-site/` is still rendered from `skills/pm-docs-site/templates/site`, so `just docs-check` still logs it. Fixing the template is a `skills/` change (a rules bump); R-013's migration to the package removes it, or the template takes the package's fix: Starlight's `disable404Route: true` and its own `src/pages/404.astro` (a draft `404` docs entry is not an option: it prints Starlight's draft notice on the live page).
