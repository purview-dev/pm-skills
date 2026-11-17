# Docs-site RefLink fallbacks for unknown keys

- Captured: 2026-11-17 19:28
- Source: agent (R-009 execute, final review)
- Kind: bug
- Severity: cosmetic
- Affects: packages/pm-docs-site/src/components/RefLink.astro
- Context: R-009 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

RefLink prints the bare key when it has no target: a Log row for an activity ID with no matching item shows the ID without its title, and the Roadmap's no-milestone heading reads "none" when that group exists only from log lines with no ID. Give RefLink fallback text (the entry title, "No milestone").

## Reproduction

An export whose only unassigned roadmap events are ID-less Done lines; build the site and open /plan/roadmap/. Found in review, not seen in the fixture.

## Links

- packages/pm-docs-site/src/pages/plan/roadmap.astro
- packages/pm-docs-site/src/pages/plan/log.astro
