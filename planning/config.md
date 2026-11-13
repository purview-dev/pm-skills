# PM configuration

Read by every `pm-*` skill. Change behaviour here, not in the skills.

## Location

- PM root: `planning/` in the **main worktree**, which is the first path
  printed by `git worktree list`. Feature worktrees never edit the PM root,
  except the Completion record committed on the item's branch.

## Install

- Rules version: 17

## Handoffs

The skills invoke these by name. To swap frameworks, change this table only.

| Stage | Skill | Output location |
| --- | --- | --- |
| design | `superpowers:brainstorming` | `docs/superpowers/specs/` |
| plan | `superpowers:writing-plans` | `docs/superpowers/plans/` |
| execute | `superpowers:subagent-driven-development` | Checkboxes in the plan file |
| execute-fallback | `superpowers:executing-plans` | Checkboxes in the plan file |
| finish | `superpowers:finishing-a-development-branch` | Git branch, PR, or merge, with the completion record |

The finish step includes the Completion record: run `pm-checkpoint` (`done`)
at the end of `execute`, before the finish step opens the pull request.

<!-- Verify the specs path against your installed brainstorming skill. -->

## Limits

- Max items in Next: 5
- Review cadence: 7 days
- Inbox size that triggers a review prompt: 10
- Blocked item is stale after: 14 days
- Board shows items done in the last: 14 days
- Branch name pattern: `feat/<id>-<slug>` (example: `feat/r-007-tenant-billing`)

## Commits

- PM state commit: always
- PM branch: main
- Export on commit: if present

## Last review

- Date: never
