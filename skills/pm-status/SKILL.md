---
name: pm-status
description: Use when the user asks for project status, the task board, the roadmap, the queue, what they themselves need to do, or what is planned. Shows a summary, a board, a milestone roadmap, or the user's queue. Read-only.
---

# pm-status

Show the project state. Read-only.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Views

| View | When | Shows |
| --- | --- | --- |
| `summary` | Default | One screen: now, next, inbox, review |
| `board` | "Board", "kanban", "tasks", "what's in progress" | Columns from Now to Done |
| `roadmap` | "Roadmap", "milestones", "plan", "timeline" | Items grouped by milestone with progress |
| `mine` | "What do I need to do", "my tasks" | The user's queue only |

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.

## Steps

1. Read `NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`, and `config.md`;
   count the open inbox and the `Discuss: yes` files (Shared definitions).
   If `NOW.md` has a plan, count its checkboxes.
2. Evaluate **Review due** (Shared definitions) and which Next items are
   claimable.
3. Render the requested view with the matching template below. Boards and
   roadmaps list every item; they are exempt from the 5-bullet limit.

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

## Output: board

One row per item, in roadmap order within each column. Columns: `Now`
(the active item), `Next (agent)` (claimable or paused), `For you`
(`Owner: user` items in Next, plus open questions), `Waiting` (blocked, or
`Depends on` not done; show the reason), `Done` (from `LOG.md`, within the
board window in `config.md`).

```markdown
## Board <YYYY-MM-DD>

| Column | ID | Title | Owner | Size | Detail |
| --- | --- | --- | --- | --- | --- |
| Now | R-007 | Tenant billing | agent | M | execute, 4/9 steps |
| Next (agent) | R-008 | Invoice email | agent | S | ready |
| For you | R-009 | Open a Stripe account | user | S | blocks R-008 |
| Waiting | R-010 | Usage export | agent | M | needs R-008 |
| Done | R-006 | Tenant model | agent | M | 2026-10-28 |

- Inbox: <n> open, <n> to discuss. Later: <n>.
```

## Output: roadmap

Milestones in `STRATEGY.md` order; items without a milestone go last under
`Unassigned`. Mark each item `[done]`, `[now]`, `[next]`, `[later]`,
`[blocked]`, or `[waiting]`.

```markdown
## Roadmap <YYYY-MM-DD>

### M1 <Name> (focus): <done>/<total>, target <date | none>

- Exit criteria: <check>
- [done] R-006 Tenant model
- [now] R-007 Tenant billing
- [next] R-008 Invoice email (needs R-009)

### M2 <Name>: <done>/<total>

- [later] R-012 <title>

## Gaps

- <V line or exit criterion with no item>
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
