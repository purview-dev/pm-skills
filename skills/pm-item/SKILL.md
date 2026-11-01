---
name: pm-item
description: Use when the user asks to add, edit, drop, block, unblock, move, reassign, or mark done one roadmap item by ID or title, including user-owned tasks the user has finished themselves. Edits ROADMAP.md and LOG.md only.
---

# pm-item

Change one roadmap item that is not active.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Modes

| Mode | Effect |
| --- | --- |
| `add <title>` | Create one item; challenged before it is written |
| `edit <ID> <field> <value>` | Change `Serves`, `Milestone`, `Done when`, `Size`, or `Note` |
| `owner <ID> <agent \| user \| both>` | Reassign who does the item |
| `depends <ID> <IDs \| none>` | Set `Depends on` |
| `done <ID>` | Close an item finished outside the workflow (usually `Owner: user`) |
| `drop <ID> <reason>` | Remove the item; log it under `## Dropped` |
| `block <ID> <reason>` | Set `Status: blocked (<reason>, since <date>)` |
| `unblock <ID>` | Set `Status: ready` |
| `move <ID> next` / `move <ID> later` | Move between sections |

If the user's request fits no mode, ask one choice question with the 2 or
3 most likely modes as options.

## Guard

- If `<PM root>/ROADMAP.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop. A new
  idea mid-workflow goes to `pm-park` instead of `add`.
- If the ID is the active item in `NOW.md`, reply: `<ID> is active. Run
  pm-checkpoint (switch or done) first.` Stop.
- If the ID is not found in `ROADMAP.md`, reply `<ID> not found.` and list
  the IDs. Stop.
- `move <ID> next` when Next is at the max in `config.md`: refuse and list
  the Next items. Do not move anything else.

## Steps

1. **add:** apply the Challenge protocol checks 1, 2, and 5, plus a search
   of `ROADMAP.md`, briefs, and `LOG.md` Dropped for duplicates. Ask for
   any missing required field with the question tool, offering drafted
   values. If the size is `M` or `L`, or the problem is unclear, ask: `Add
   "<title>" now or shape it first?` with the options `Shape it first
   (recommended)` (run `pm-shape`) and `Add it now`. Write a new ID and
   `Status: ready`, at the bottom of Later unless the user asked for Next.
2. **edit:** for `Done when`, the new value must be observable; if not,
   propose an observable version and ask. For `Serves` or `Milestone`, the
   target must exist in `VISION.md` or `STRATEGY.md`.
3. **depends:** reject IDs that do not exist, and any change that creates
   a cycle; name the cycle.
4. **done:** show the item's `Done when` and ask: `Is <ID> done? <Done
   when>` with the options `Mark it done (recommended)` and `Not yet`. If
   the check can be verified from the repository, verify it instead of
   asking and state the evidence. Append to `## Done` in `LOG.md`:
   `- <date> <ID> <Title>. Owner: <owner>. Result: <evidence>.` Remove the
   item from `ROADMAP.md`. Name items whose `Depends on` is now met.
5. **drop:** apply the Challenge protocol checks 2 and 5 (what serves that
   `V` line instead, and what depends on it). Ask one choice question:
   `Drop <ID> <title>?` with the options `Keep it (recommended)` and `Drop
   it`. Recommend `Drop it` instead when the item serves no `V` line. On
   drop, append to `## Dropped` in `LOG.md`:
   `- <date> <ID> <title>. Reason: <reason>.` and flag items that depend
   on it.
6. **block, unblock, move, owner:** apply the edit. Moves to Next go at the
   bottom.

## Output

```markdown
## Updated

- <ID Title>: <what changed>

## Do this next

1. <Run pm-status to see the board | Run pm-next: <ID> is now claimable | continue the current task>
```
