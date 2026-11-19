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
- Item: R-018 Export the Now card's owner and size
- Session: feat/r-018-export-the-now-cards-owner-and-size
- Stage: execute
- Brief:
- Milestone: M1
- Serves: V4
- Owner: agent
- Size: M
- Depends on: none
- Revisits:
- Spec: docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md
- Plan: docs/superpowers/plans/2026-11-19-now-item-owner-size-links.md
- Started: 2026-11-19

## Done when

- `bun skills/pm-export/scripts/export.ts write` gives the active item's Now card its roadmap `owner` and `size` instead of `null`.
- The export gives the active item its own `dependsOn` and `revisits`, and the R-012 dependency graph draws those edges (for example R-008 -> R-012).
- The graph's `Own links not exported yet` notice is removed.
- The schema field docs, `planning.example.json`, and the docs-site fixture agree, and `just test` covers it.

## Checkpoint 2026-11-19 19:45

- Stopped at: Task 6 Step 1 of the plan (Tasks 1 to 5 done and reviewed, commits ed29d42..00e1bac)
- Next action: When R-012 Docs-site package: dependency graph has merged, run `git merge origin/main` and execute Task 6
- Start with: docs/superpowers/plans/2026-11-19-now-item-owner-size-links.md (Task 6) and .superpowers/sdd/2026-11-19-now-item-owner-size-links/progress.md
- Decisions: pm-setup's backfill read Size S from the claim commit; set to M because the user widened R-018 to size M in design. Task 4 ran in the main session because pm-setup asks the user to apply.
- Context: origin/main gained R-021 (package TypeScript source with a build step) and R-017, so Task 6's package file paths (`lib/schema-version.ts` and others) may have moved to `.ts` source; re-check them after the merge. Deferred minors for the final review are in the progress ledger (unused `itemRef` def, `references/spec.md` still at schemaVersion 3, Stack file prose wording, switch on an un-backfilled legacy item). `pm-lint` is not linked into `.claude/skills/` (`just setup-skills`).
- Open question: R-012's pull request has not merged; Task 6 waits for it.

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
