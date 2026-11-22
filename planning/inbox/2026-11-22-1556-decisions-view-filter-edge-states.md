# Decisions view filter edge states

- Captured: 2026-11-22 15:56
- Source: agent (R-038 final review)
- Kind: improvement
- Affects: packages/pm-docs-site/src/lib/decisions.ts, src/components/decisions/Decisions.tsx
- Context: R-038 finish
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

In the Decisions view, turning every status chip off writes `?status=`, which reloads as the default; ADRs with no status ignore the status chips; with one category there is no category chip, so a shared `?category=x` filters invisibly until Clear; and without JavaScript the superseded rows cannot be shown. Decide the intended behaviour and pin it with tests.
