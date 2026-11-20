# Island import guard skips Astro files

- Captured: 2026-11-20 18:44
- Source: agent (R-028 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/test/island-imports.test.ts
- Context: R-028 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-028 final review: `test/island-imports.test.ts` scans only `.ts` and `.tsx` under `src/components`. An `.astro` component script that value-imports a server-only lib inside a client `<script>` would not be caught. Decide whether `.astro` client scripts need the same guard.
