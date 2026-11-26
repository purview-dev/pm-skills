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
- Item: R-056 Package tests stable under full lint-check
- Session: feat/r-056-package-tests-stable-under-full-lint-check
- Stage: execute
- Brief:
- Milestone: M5
- Serves: V4
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From the 2026-11-25 strategy re-plan (bug, inbox 2026-11-25-0717, severity minor, from R-041 execute). Two consecutive `just lint-check` runs on a prose-only branch failed in `package-test`, each on a different test that passes alone: `cli.test.ts` timed out after 180000ms (4.27s alone), and `graph.browser.ts:296` found `.plan-graph__toolbar` hidden within 5000ms (482ms alone). Reproduction: run `just lint-check` twice on Windows; one package test fails per run under load. 2026-11-26: started as is outside the current focus (M2 Verified install and upgrade), because M2 has no open items since R-015 was dropped.
- Spec: docs/superpowers/specs/2026-11-26-package-tests-stable-under-load-design.md
- Plan: docs/superpowers/plans/2026-11-26-package-tests-stable-under-load.md
- Started: 2026-11-26

## Done when

- Two consecutive `just lint-check` runs on Windows pass `package-test`, including `test/cli.test.ts` "still reads a site whose config is astro.config.mjs" and `test/browser/graph.browser.ts` "usable at 320px".

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
