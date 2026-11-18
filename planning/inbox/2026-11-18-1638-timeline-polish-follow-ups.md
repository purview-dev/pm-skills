# Milestone timeline polish follow-ups

- Captured: 2026-11-18 16:38
- Source: agent (R-011 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/src/components/timeline/Timeline.tsx
- Context: R-011 execute
- Discuss: no
- Related: none
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Reviewed: never

## Idea

Minor findings from R-011's task and final reviews, triaged "can wait":

- Keyboard focus drops to `<body>` when `Zoom in`, `Zoom out`, or `Reset zoom` becomes disabled at its limit; `aria-disabled` with a no-op guard would keep focus.
- The plain-wheel path scrolls by `deltaY` without scaling line-mode (`deltaMode` 1) deltas.
- The zoom-anchor browser test covers a single click, not two zoom changes before one render.
- The `planned` and `other` card markers are never rendered in a browser test: the fixture has no planned milestone, because adding one adds a milestone page and the spec said no page is added.
- Event de-duplication assumes the Now item is not also logged done or queued under another milestone; untested.

## Links

- docs/superpowers/specs/2026-11-18-docs-site-package-milestone-timeline-design.md
