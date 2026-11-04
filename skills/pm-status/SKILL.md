---
name: pm-status
description: Use when the user asks for project status, a one-screen summary, or the queue of work for themselves. Shows the summary or the user's queue. Read-only.
---

# pm-status

Show the project summary or the user's own queue. Read-only.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Views

| View | When | Shows |
| --- | --- | --- |
| `summary` | Default | One screen: now, next, inbox, review |
| `mine` | "What do I need to do", "my tasks" | The user's queue only |

For the task board, run `pm-board`. For the full roadmap, run `pm-roadmap`.
For the ordered queue without starting anything, run `pm-up-next`.

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If the user asks for the board, the roadmap, or the up-next queue, run
  the matching skill instead.
- If a workflow is active, render the view when the user explicitly asked
  for it (Non-interruption rule 3), then resume the step in progress. Do
  not move, add, or close anything.

## Steps

1. Read `NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`, and `config.md`;
   count the open inbox and the `Discuss: yes` files (Shared definitions).
   If `NOW.md` has a plan, count its checkboxes.
2. Evaluate **Review due** (Shared definitions) and which Next items are
   claimable.
3. Render the requested view with the matching template below.

## Output: summary

```markdown
## Status

- Now: <ID Title (stage, done/total steps) | idle>
- Focus: <M Name, done/total | none set>
- Next (<n>/<max>): <ID Title [owner, size, status]>, ...
- Later: <n> items
- Inbox: <n> open, <n> to discuss
- Review: <due | not due> (last: <date | never>)

## Blocked

- <ID Title: reason, since date>

## Do this next

1. <one action>
   - Start with: <skill name>
```

## Output: mine

```markdown
## For you

1. <ID Title>
   - Done when: <check>
   - Unblocks: <IDs | nothing>
2. <Open question from NOW.md or a brief, with its file>

## Do this next

1. <the item that unblocks the most agent work>
   - Close it with: `pm-item done <ID>`
```
