---
name: pm-item
description: Use when the user asks to drop, block, unblock, or move a roadmap item (to Next or Later) by ID. Edits ROADMAP.md and LOG.md only.
---

# pm-item

Change one roadmap item that is not active.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Modes

| Mode | Effect |
| --- | --- |
| `drop <ID> <reason>` | Remove the item; log it under `## Dropped` |
| `block <ID> <reason>` | Set `Status: blocked (<reason>)` |
| `unblock <ID>` | Set `Status: ready` |
| `move <ID> next` / `move <ID> later` | Move between sections |

## Guard

- If `<PM root>/ROADMAP.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- If the ID is the active item in `NOW.md`, reply: `<ID> is active. Run
  pm-checkpoint (switch) first.` Stop.
- If the ID is not found in `ROADMAP.md`, reply `<ID> not found.` and list
  the IDs. Stop.
- `move <ID> next` when Next is at the max in `config.md`: refuse and list
  the Next items. Do not move anything else.

## Steps

1. Show the item and the change. For `drop`, ask one choice question:
   `Drop <ID> <title>?` with the options `Drop it`, `Keep it
   (recommended)`, and `Type something`. Other modes need no confirmation.
2. Apply the edit to `ROADMAP.md`. Moves to Next go at the bottom.
3. For `drop`, append to `## Dropped` in `LOG.md`:
   `- <date> <ID> <title>. Reason: <reason>.`

## Output

```markdown
## Updated

- <ID Title>: <what changed>

## Do this next

1. Run `pm-status` to see the queue, or continue the current task.
```
