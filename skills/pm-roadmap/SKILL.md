---
name: pm-roadmap
description: Use when the user asks for the full roadmap, milestones, the plan, the timeline, or asks to move, add, or insert items on the roadmap. Groups every open item by milestone with progress and applies the shared roadmap order and edit rules in its edit modes. Read-only in view mode.
---

# pm-roadmap

Show the full roadmap, and apply one move, add, or insert on it. A view
writes nothing; an edit writes `ROADMAP.md`.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, Challenge protocol, Asking the user, and Communication contract in
the pm-skills section of the agent instructions file (`AGENTS.md` or
`CLAUDE.md`). PM root is its `PM state directory` setting (default
`planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `view` | Default: "roadmap", "milestones", "plan", "timeline" | Render every open item by milestone; write nothing |
| `move <ID> <next \| later> [<position>]` | "move R-012 to Later", "put R-012 at the top of Next" | Apply the shared move rules |
| `add <title> [<next \| later>] [<position>] [<milestone M>]` | "add ... to M2" | Create one item, challenged first |
| `insert <ID> <before \| after> <ID>` | "put R-012 before R-008" | Reposition one item in its section |

If the request fits no mode, ask one choice question with the 2 or 3 most
likely modes as options.

## Guard

- If `<PM root>/config.md` or `ROADMAP.md` is missing: `No <PM root>
  state. Run pm-init.` Stop.
- If a workflow is active, only `view` may run, and only when the user
  asked for it (Non-interruption rule 3). Render the roadmap, then resume
  the step in progress. `move`, `add`, and `insert` apply Non-interruption
  rule 4.
- Never write `NOW.md`. The active item is read-only here; change it with
  `pm-next` or `pm-checkpoint`.
- If the ID is not found in `ROADMAP.md`, reply `<ID> not found.` and list
  the open IDs. Stop.
- `add` needs `Serves`, `Milestone` (or `Unassigned`), `Owner`, `Done
  when`, and `Size`. Ask for any missing field with the question tool,
  offering drafted values. Reject a `Milestone` or `Serves` value that does
  not exist in `STRATEGY.md` or `VISION.md`.

## Steps

1. Read `VISION.md`, `STRATEGY.md`, `ROADMAP.md`, `NOW.md`, `LOG.md`, and
   `config.md`.
2. Build every open item: `## Next`, `## Later`, and the active item in
   `NOW.md`. In `Later`, keep the milestone group order from
   `STRATEGY.md`, with `Unassigned` last.
3. For `view`, render the template and stop.
4. For an edit, resolve to one shared operation. Adding to a milestone sets
   `Milestone: <M>`; adding without one leaves it unassigned. Resolve
   `before <ID>` and `after <ID>` inside the destination section and
   milestone group.
5. Show one change line (`R-012: Later M2 -> Next top`), ask one choice
   question when the operation changes order, removes an item from `Next`,
   or adds an item, then apply it.
6. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): <verb> <ID>`. A `view` writes nothing and does not commit.

## Output

Milestones in `STRATEGY.md` order; items without a milestone go last under
`Unassigned`. Mark each item `[now]`, `[next]`, `[later]`, `[blocked]`, or
`[waiting]`. Progress is done items over done plus open items; a done item
counts under its milestone only when its `LOG.md` line records
`Milestone: <M>`.

```markdown
## Roadmap <YYYY-MM-DD>

### M1 <Name> (focus): <done>/<total>, target <date | none>

- Exit criteria: <check>
- [now] R-007 Tenant billing
- [next] R-008 Invoice email (needs R-009)
- [later] R-012 <title>
- Done: <R-006, R-003 | none>

### M2 <Name>: <done>/<total>, target <date | none>

- Exit criteria: <check>
- [later] R-015 <title>

## Unassigned

- [later] R-020 <title>

## Gaps

- <V line or exit criterion with no item>

## Changed

- <R-012: Later M2 -> Next top | none>

## Do this next

1. <Run pm-next to start R-012 | Continue R-007 at execute | Run pm-board for the board>
   - Start with: <skill name>
   - Done when: <observable check>

## Note

- <commit result, or the count of done items without a recorded milestone | none>
```

Omit `Changed` in view mode. Omit `Note` when there is nothing to report.
