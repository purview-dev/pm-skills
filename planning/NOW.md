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
- Item: R-041 ADR skill follow-ups
- Session: feat/r-041-adr-skill-follow-ups
- Stage: plan
- Brief:
- Milestone: M4
- Serves: V5
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: From the 2026-11-22 review; R-039 final-review minors (inbox 2026-11-22-1632), a rules bump. (1) `pm-discover` and `pm-revise` write `Supersedes ADR-NNN <title> in design.` under an inbox file's `## Notes` without the `<YYYY-MM-DD>` prefix. (2) `pm-purview` in `check` mode, run inside `pm-shape` or `pm-discover`, is not stopped before step 6, whose ADR write contradicts "This skill never runs `pm-adr`" in those skills. (3) `pm-checkpoint` (`done`) looks for the item's ADRs on its branch; a design stage run in a separate worktree writes them in the main worktree (`pm-adr` Guard), so `done` stops with "has no file". (4) `pm-shape` and `pm-review` print `## For this question` for an ADR even when `## For this discussion` lists it. (5) An ADR or inbox file written mid-workflow is uncommitted at `done`, whose guard stops on uncommitted PM state in the item's worktree (predates R-039; applies to `pm-park` too). Spec: `docs/superpowers/specs/2026-11-22-adrs-across-the-pm-skills-design.md`.
- Spec: docs/superpowers/specs/2026-11-25-adr-skill-follow-ups-design.md
- Plan:
- Started: 2026-11-25

## Done when

- `pm-discover` and `pm-revise` write the `Supersedes` Notes line with its `<YYYY-MM-DD>` prefix.
- `pm-purview` step 6 excludes `check` mode.
- `pm-checkpoint` (`done`) finds an item's ADRs written in the main worktree.
- `pm-shape` and `pm-review` reuse a `## For this discussion` legend for an ADR.
- `pm-checkpoint` (`done`) commits or names captures written mid-workflow instead of stopping.
- `just lint-check` passes.

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
