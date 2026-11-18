# Log

<!-- Newest first in each section. Nothing is deleted without a line here. -->

## Done

- 2026-11-18 R-014 Create the npm @purview-dev scope and token. Milestone: M1. Owner: user. Plan: none. Result: `Done when` restated in the brief (trusted publishing replaced the `NPM_TOKEN` secret); the `@purview-dev` scope exists, `npm view @purview-dev/pm-docs-site@0.1.0-pre.1 version` returns `0.1.0-pre.1`, tag `pm-docs-site-v0.1.0-pre.1` exists, and the trusted publisher for `publish-pm-docs-site.yml` has publish, stage publish, and manageDistTags.
- 2026-11-17 R-004 Verify the aspire module against a real AppHost. Milestone: M1. Owner: both. Plan: none. Result: branch feat/r-004-verify-the-aspire-module.
- 2026-11-17 R-009 Docs-site package: backlinks everywhere. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-17-docs-site-package-backlinks.md. Result: branch feat/r-009-docs-site-package-backlinks.
- 2026-11-17 R-008 Docs-site package: skeleton at parity. Milestone: M1. Owner: agent. Plan: docs/superpowers/plans/2026-11-17-docs-site-package-skeleton.md. Result: branch feat/r-008-docs-site-package-skeleton.
- 2026-11-17 R-001 Set milestones and focus. Milestone: none. Owner: both. Plan: none. Result: branch feat/r-001-set-milestones-and-focus.

<!-- - 2026-10-29 R-007 Tenant billing. Milestone: M1. Owner: agent. Plan: <path>. Result: branch <branch>. -->
<!-- - 2026-10-30 R-009 Open a Stripe account. Milestone: M1. Owner: user. Plan: none. Result: <evidence>. -->

## Dropped

- 2026-11-17 R-003 Fix pm-export's ajv validation command. Reason: v19.0.0 replaced the ajv command in pm-export's guard with `bun scripts/export.ts validate`, which exits 0 on `planning/planning.json`.
- 2026-11-17 R-007 Docs-site extension pages. Reason: the Now, Inbox, Briefs, and Strategy pages already exist in the pm-docs-site templates. Brief: planning/briefs/2026-11-17-docs-site-package.md.
- 2026-11-17 R-005 Rehearse a schemaVersion bump through the docs site. Reason: folded into R-013's Done when. Brief: planning/briefs/2026-11-17-docs-site-package.md.
- 2026-11-17 R-002 Check the docs-site Board at three widths. Reason: folded into R-009's Done when. Brief: planning/briefs/2026-11-17-docs-site-package.md.

<!-- - 2026-10-29 R-012 <title>. Reason: <one line>. -->
<!-- Inbox items dropped before they became roadmap items have no ID. -->

## Reviews

<!-- - 2026-10-29 Inbox 12 to 0. Next reordered. 1 item dropped. -->
