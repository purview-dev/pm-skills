# Now

<!--
Edited only by pm-* skills. PM state lives in the main worktree; a completion
record may be written in the worktree that holds the item's branch.
Fields are fixed. When idle, every field except Status is empty.
Status: idle | active
Stage: design | plan | execute | finish
Session: <branch> (worktree <path>, optional)
Brief: optional; the item's brief, if it has one
Milestone: optional; the item's milestone while it is active
-->

- Status: active
- Item: R-028 Docs-site package: accessible board, popup, and timeline
- Session: feat/r-028-docs-site-package-accessible-board-popup-and-timeline
- Stage: plan
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: R-020
- Revisits:
- Note: Sliced from R-019 Docs-site package: consumer-ready for 1.0.0 with pm-shape on 2026-11-19; depends on R-020 Docs-site package: rich demo planning fixture for the planned milestone the timeline tests need. From the 2026-11-19 review. Empty card: the Milestones page (`src/routes/plan/milestones/index.astro`) shows a `No milestone` card reading `0 of 0 done` whenever anything was dropped, because `features()` gives dropped items `milestone: null`; R-011 hid it on the timeline and Roadmap page only (bug, cosmetic). Accessibility from the R-009 final review: card links do not say they open a popup (`aria-haspopup="dialog"`); a backdrop click does not close the item dialog; popup section headings share the dialog title's h2 level; Board collapse toggles render without JavaScript and do nothing (render them hidden, let `plan.ts` reveal them); `KanbanItemCard` keeps `tabindex=0` around a card that holds links, so each card costs extra tab stops; no browser test for a `localStorage` that throws. Timeline follow-ups from the R-011 final review (`src/components/timeline/Timeline.tsx`): keyboard focus drops to `<body>` when `Zoom in`, `Zoom out`, or `Reset zoom` becomes disabled at its limit (`aria-disabled` with a no-op guard keeps focus); the plain-wheel path scrolls by `deltaY` without scaling line-mode (`deltaMode` 1) deltas; the zoom-anchor browser test covers a single click, not two zoom changes before one render; the `planned` and `other` card markers are never rendered in a browser test (the fixture has no planned milestone); event de-duplication assumes the Now item is not also logged done or queued under another milestone, untested. From the 2026-11-20 review: `Graph.tsx:5-7` states in the island itself that it may import only types from `lib/graph`, but `Timeline.tsx` has no matching note that it may import only types from `lib/timeline` (values come from `lib/timeline-state.ts`); add a one-line header note. Optional: a `bun test` guard that walks `src/components/**` and fails on a value import of `lib/planning`, `lib/timeline`, `lib/graph`, or `lib/graph-layout`.
- Spec: docs/superpowers/specs/2026-11-20-docs-site-accessible-board-popup-timeline-design.md
- Plan:
- Started: 2026-11-20

## Done when

- Browser tests show the card's popup trigger with `aria-haspopup="dialog"`, a backdrop click closing the item dialog, popup section headings below the dialog title's level, one tab stop per card, Board collapse toggles hidden without JavaScript, the timeline's zoom buttons keeping focus at their limits, line-mode wheel deltas scaled, the zoom anchor holding across two zoom changes before one render, the timeline's `planned` and `other` markers rendered, the Now item de-duplicated when it is also logged done or queued, a `localStorage` that throws leaving the Board usable, and no `No milestone` card on the Milestones page without an open unassigned item.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: design
- Brief: planning/briefs/R-007-tenant-billing.md
- Milestone: M1
- Spec: docs/superpowers/specs/<file>.md
- Plan: docs/superpowers/plans/<file>.md
- Started: 2026-10-29

## Done when

- <observable check>

## Checkpoint 2026-10-29 14:55

- Stopped at: <last completed step>
- Next action: <one action>
- Start with: <exact command or file path>
- Decisions: <decisions made since the last checkpoint, with reasons | none>
- Context: <facts the next session needs that are not in the spec or plan | none>
- Open question: <only if blocking>
-->
