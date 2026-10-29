# PM configuration

Read by every `pm-*` skill. Change behaviour here, not in the skills.

## Location

- PM root: `pm/` in the **main worktree**, which is the first path printed
  by `git worktree list`. Feature worktrees never edit `pm/`.

## Handoffs

The skills invoke these by name. To swap frameworks, change this table only.

| Stage | Skill | Output location |
| --- | --- | --- |
| design | `superpowers:brainstorming` | `docs/superpowers/specs/` |
| plan | `superpowers:writing-plans` | `docs/superpowers/plans/` |
| execute | `superpowers:subagent-driven-development` | Checkboxes in the plan file |
| execute-fallback | `superpowers:executing-plans` | Checkboxes in the plan file |
| finish | `superpowers:finishing-a-development-branch` | Git branch, PR, or merge |

<!-- Verify the specs path against your installed brainstorming skill. -->

## Limits

- WIP limit: 1
- Max items in Next: 5
- Review cadence: 7 days
- Inbox size that triggers a review prompt: 10
- Branch name pattern: `feat/<id>-<slug>` (example: `feat/r-007-tenant-billing`)

## Last review

- Date: never
