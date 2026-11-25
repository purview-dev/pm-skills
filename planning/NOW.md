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
- Item: R-055 Engineering lint and skill review minors
- Session: feat/r-055-engineering-lint-and-skill-review-minors
- Stage: plan
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: S
- Depends on: R-034
- Revisits:
- Note: From the 2026-11-25 review (inbox 2026-11-24-2345, R-034 execute, final review). Item 8 is a managed-section change. (1) `fixStructure` cannot sort Principles while one heading has no EP ID (comparator returns 0, not transitive); `skills/pm-lint/scripts/structure.ts`. (2) `rules.md` lists the 8-word principle title under the error `engineering/principle`, but the code emits the warning `title/length`, whose description names only inbox files and risks (`rules.ts`, `rules.md`). (3) `rules.ts` and `rules.md` wording differs for `engineering/technology`, `engineering/principle`, and `engineering/removed`; the drift test compares IDs only. (4) A Technology heading shaped `### EP-001 Foo` is keyed as `Foo`, giving a false duplicate with `### Foo`. (5) `Decision: None` (capital N) is an error; other files accept `none` in any case. (6) `localeCompare` without a locale makes `engineering/order` depend on the host locale for non-ASCII names. (7) The `writes ENGINEERING.md on a fresh install` test proves only that the template exists, not `pm-init`'s file table row. (8) The Challenge protocol's "applies in" list in the managed section omits `pm-engineering` (add). (9) `pm-engineering` step 1 follows `superseded by` one step only; a superseded successor is recommended unchecked.
- Spec: docs/superpowers/specs/2026-11-25-engineering-lint-review-minors-design.md
- Plan:
- Started: 2026-11-25

## Done when

- Each of the nine findings in the Note is fixed or has a one-line won't-fix reason in the item's plan, the `lint.test.ts` drift test compares rule text as well as IDs, the Challenge protocol's "applies in" list names `pm-engineering`, and `just lint-check` passes.

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
