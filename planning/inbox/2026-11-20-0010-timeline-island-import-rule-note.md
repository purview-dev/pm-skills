# Timeline island lacks its import-rule note

- Captured: 2026-11-20 00:10
- Source: agent (R-022 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/src/components/timeline/Timeline.tsx
- Context: R-022 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Deferred minor from the R-022 final review: `Graph.tsx:5-7` states in the island itself that it may import only types from `lib/graph`, but `Timeline.tsx` has no matching note that it may import only types from `lib/timeline` (values come from `lib/timeline-state.ts`). Add a one-line header note so the next edit keeps the rule. The reviewer also suggested a `bun test` guard that walks `src/components/**` and fails on a value import of `lib/planning`, `lib/timeline`, `lib/graph`, or `lib/graph-layout` (option 2 in the R-022 design, not chosen then).

## Links

- docs/superpowers/specs/2026-11-19-docs-site-package-timeline-dev-hydration-design.md
