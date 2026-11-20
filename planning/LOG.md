# Log

<!-- Newest first in each section. Nothing is deleted without a line here. -->

## Done

- 2026-11-20 R-026 pm-checkpoint keeps every item field through switch, push, and pop. Milestone: none. Owner: agent. Plan: docs/superpowers/plans/2026-11-20-checkpoint-keeps-item-fields.md. Result: branch feat/r-026-checkpoint-keeps-item-fields.
- 2026-11-20 R-027 Docs-site package: build hardening. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-20-docs-site-package-build-hardening.md. Result: branch feat/r-027-docs-site-package-build-hardening.
- 2026-11-20 R-019 Docs-site package: consumer-ready for 1.0.0. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-20-docs-site-consumer-ready.md. Result: branch feat/r-019-docs-site-package-consumer-ready-for-1-0-0.
- 2026-11-20 R-020 Docs-site package: rich demo planning fixture. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-20-docs-site-demo.md. Result: branch feat/r-020-docs-site-demo-fixture.
- 2026-11-20 R-023 Docs-site package: stable browser tests. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-20-docs-site-package-stable-browser-tests.md. Result: branch feat/r-023-docs-site-package-stable-browser-tests.
- 2026-11-20 R-022 Docs-site package: timeline hydrates in dev. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-19-docs-site-package-timeline-dev-hydration.md. Result: branch feat/r-022-docs-site-package-timeline-hydrates-in-dev.
- 2026-11-19 R-018 Export the Now card's owner and size. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-19-now-item-owner-size-links.md. Result: branch feat/r-018-export-the-now-cards-owner-and-size.
- 2026-11-19 R-012 Docs-site package: dependency graph. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-19-docs-site-package-dependency-graph.md. Result: branch feat/r-012-docs-site-package-dependency-graph.
- 2026-11-18 R-017 Docs-site package: in-repo dev hydrates. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-18-docs-site-package-in-repo-dev.md. Result: branch feat/r-017-docs-site-package-in-repo-dev-hydrates.
- 2026-11-18 R-021 Docs-site package: TypeScript source with a build step. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-18-docs-site-package-typescript.md. Result: branch feat/r-021-docs-site-package-typescript-source-with-a-build-step.
- 2026-11-18 R-011 Docs-site package: milestone timeline. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-18-docs-site-package-milestone-timeline.md. Result: branch feat/r-011-docs-site-package-milestone-timeline.
- 2026-11-18 R-010 Docs-site package: board filters and swimlanes. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-18-docs-site-package-board-filters.md. Result: branch feat/r-010-docs-site-package-board-filters-and-swimlanes.
- 2026-11-18 R-014 Create the npm @purview-dev scope and token. Milestone: M1. Owner: user. Plan: none. Result: `Done when` restated in the brief (trusted publishing replaced the `NPM_TOKEN` secret); the `@purview-dev` scope exists, `npm view @purview-dev/pm-docs-site@0.1.0-pre.1 version` returns `0.1.0-pre.1`, tag `pm-docs-site-v0.1.0-pre.1` exists, and the trusted publisher for `publish-pm-docs-site.yml` has publish, stage publish, and manageDistTags.
- 2026-11-17 R-004 Verify the aspire module against a real AppHost. Milestone: M1. Owner: both. Plan: none. Result: branch feat/r-004-verify-the-aspire-module.
- 2026-11-17 R-009 Docs-site package: backlinks everywhere. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-17-docs-site-package-backlinks.md. Result: branch feat/r-009-docs-site-package-backlinks.
- 2026-11-17 R-008 Docs-site package: skeleton at parity. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-17-docs-site-package-skeleton.md. Result: branch feat/r-008-docs-site-package-skeleton.
- 2026-11-17 R-001 Set milestones and focus. Milestone: none. Owner: both. Plan: none. Result: branch feat/r-001-set-milestones-and-focus.

<!-- - 2026-10-29 R-007 Tenant billing. Milestone: M1. Owner: agent. Plan: <path>. Result: branch <branch>. -->
<!-- - 2026-10-30 R-009 Open a Stripe account. Milestone: M1. Owner: user. Plan: none. Result: <evidence>. -->

## Dropped

- 2026-11-19 Name 1.0.0 in the publish item and the M1 exit criterion. Reason: decided on 2026-11-18 (STRATEGY.md Decisions) to keep "returns a version" in both.
- 2026-11-17 R-003 Fix pm-export's ajv validation command. Reason: v19.0.0 replaced the ajv command in pm-export's guard with `bun scripts/export.ts validate`, which exits 0 on `planning/planning.json`.
- 2026-11-17 R-007 Docs-site extension pages. Reason: the Now, Inbox, Briefs, and Strategy pages already exist in the pm-docs-site templates. Brief: planning/briefs/2026-11-17-docs-site-package.md.
- 2026-11-17 R-005 Rehearse a schemaVersion bump through the docs site. Reason: folded into R-013's Done when. Brief: planning/briefs/2026-11-17-docs-site-package.md.
- 2026-11-17 R-002 Check the docs-site Board at three widths. Reason: folded into R-009's Done when. Brief: planning/briefs/2026-11-17-docs-site-package.md.

<!-- - 2026-10-29 R-012 <title>. Reason: <one line>. -->
<!-- Inbox items dropped before they became roadmap items have no ID. -->

## Reviews

- 2026-11-19 Inbox 19 to 3. Added R-022, R-023, R-024, R-025, R-026; 9 files merged, 1 dropped, 2 to shape; R-019 promoted to Next for re-slicing; Next reordered.

<!-- - 2026-10-29 Inbox 12 to 0. Next reordered. 1 item dropped. -->
