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
- Item: R-052 Docs-site package: brief and inbox pages
- Session: feat/r-052-docs-site-package-brief-and-inbox-pages
- Stage: execute
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Milestone: M5
- Serves: V4
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From the 2026-11-25 review (inbox 2026-11-23-1525, user, R-013 design). The package must contain everything before 1.0.0. A page per brief and per inbox file, as items, risks, and ADRs already have, with links and Linked from (S). Sliced out of R-013 by the user's choice on 2026-11-23; 1.0.0 depends on it. 2026-11-26: Started as is although Current focus is M2 Verified install and upgrade: M2 is done (2026-11-26) and every Next item serves M5 (user's choice).
- Spec: docs/superpowers/specs/2026-11-26-docs-site-brief-and-inbox-pages-design.md
- Plan: docs/superpowers/plans/2026-11-26-docs-site-brief-and-inbox-pages.md
- Started: 2026-11-26

## Done when

- The package builds one page per brief and one per inbox file, each with links and a Linked from list as item, risk, and ADR pages have, a test in `packages/pm-docs-site/test/` covers both, and `just package-test` and `just docs-check` pass.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: execute
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
