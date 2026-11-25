# ADR-010 Item close names captures, accepts ADRs in place

- Status: proposed
- Date: 2026-11-25
- Category: architecture
- Supersedes: ADR-003
- Item: R-041
- Source: none

## Context

ADR-003 has `pm-checkpoint` (`done`) accept the spec's proposed ADRs on the item's branch, inside the Completion record commit, and refuse to close when a named ADR has no file there. `pm-adr`, `pm-park`, and `pm-risk` write in the main worktree (ADR-001). When the item's branch is checked out in a separate worktree, the design stage's ADRs land on the PM branch, so `done` stops with "has no file"; and any capture written mid-workflow leaves uncommitted PM state that `done`'s guard stops on, in either worktree (R-041 problems 3 and 5).

## Decision

`pm-checkpoint` (`done`) never stops for a mid-workflow capture. An uncommitted capture (an inbox file, a decisions-folder file, or `RISKS.md`) in the item's worktree is swept into the Completion record commit; one in the main worktree when that is another worktree is named in a `Note` for the next PM commit on the PM branch. A spec-named ADR is looked for on the item's branch first, then in the main worktree's decisions folder; when it is found only in the main worktree and is `proposed` with `Item: <this ID>`, `done` applies `pm-adr accept` there, in place, and names it in the `Note`. Only a named ADR found in neither place keeps `done` in `pause`. Other uncommitted PM state (`NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`, a brief) still stops it.

## Alternatives

- Do nothing: `done` keeps stopping on the separate-worktree layout and on every mid-workflow capture.
- Sweep or move at done: move the item's ADRs from the main worktree into the item's worktree before accepting them, so the accepted status rides the pull request as ADR-003 requires. Rejected: `done` would delete uncommitted files in the main worktree.
- Captures follow the active item: `pm-park`, `pm-risk`, and `pm-adr` write in the active item's worktree. Rejected: supersedes ADR-001 and hides captures from other sessions until the merge.
- Chosen: name them, never stop, the smallest change to five skills' interplay. Strongest argument against: in the separate-worktree layout the accepted status lands on the PM branch in a later PM commit, not inside the item's pull request, and the spec on the branch names an ADR the branch does not carry.

## Consequences

- ADR-001 is unchanged: captures and ADRs are still written in the main worktree.
- In the separate-worktree layout, the accepted ADR and the captures reach the PM branch through its next PM commit, not through the item's merge.
- `pm-adr`'s Guard names both places `accept` may write when `pm-checkpoint` (`done`) applies it.
