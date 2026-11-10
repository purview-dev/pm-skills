---
name: pm-up-next
description: Use when the user asks what is next, what is up next, what to work on next, or wants to see the ordered queue without starting an item. Shows the active item, the ordered Next queue, the next items from Later, and one next action. Read-only.
---

# pm-up-next

Show the ordered queue and the one next action. This skill never claims an
item: starting one is `pm-next`.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If a workflow is active, render the view when the user explicitly asked
  for it (Non-interruption rule 3), then resume the step in progress. Do
  not claim, move, or add anything.
- If `NOW.md` lacks the fields `pm-resume` requires, say it is malformed
  and stop.

## Steps

1. Read `NOW.md`, `ROADMAP.md`, `STRATEGY.md`, `LOG.md`, `config.md`, and
   `STACK.md` (when it exists).
2. Evaluate **Review due**, **Drift**, and **Uncommitted PM state** (Shared
   definitions).
3. Build the queue:
   - `Next`: every `## Next` item in roadmap order, with owner, size,
     status, and whether it is claimable.
   - `After that`: up to 3 items from `## Later` in the focus milestone
     first, then by dependency, then by `Serves` order in `VISION.md`.
   - `For you`: up to 3 `Owner: user` items in `Next`, flagging the ones
     that block agent items, plus any open question in `NOW.md`.
4. Pick the one next action, in this order: continue the active item; when
   no item is active and `STACK.md` has an entry, `pm-checkpoint` (`pop`);
   the first claimable item in `Next`; the user task that unblocks the
   most items; `pm-review` when review is due; `pm-rejoin` when the state
   has drifted.
5. Render the template. Then ask one choice question:
   - Idle with a stacked operation: `Resume <stacked ID>?` with the options
     `Pop it (recommended)` (run `pm-checkpoint` pop) and `Show the board`
     (run `pm-board`).
   - Idle: `Start <ID> now?` with the options `Start it (recommended)`
     (run `pm-next`) and `Show the board` (run `pm-board`).
   - Active: `Continue <ID>?` with the options `Continue (recommended)`
     (run `pm-resume`) and `Show the board` (run `pm-board`).
   - No claimable item: `Run pm-review?` with the options `Run it
     (recommended)` and `Show the roadmap` (run `pm-roadmap`).

## Output

```markdown
## Up next <YYYY-MM-DD>

- Now: <ID Title (stage, done/total steps) | idle>
- Focus: <M Name, done/total | none set>
- Next: <n>/<max> (<n> claimable, <n> for you)

## Next queue

1. <ID Title> [owner, size, status] - <why here>
2. <ID Title> [owner, size, status] - <why here>

## After that

- <ID Title> (<milestone>, <size>) - <why it follows>
- <ID Title> (<milestone>, <size>) - <why it follows>

## For you

- <ID Title: Done when, Unblocks: IDs | none>

## Do this next

1. <Run pm-next to start <ID> | Continue <ID> with <stage skill> | Do <user task> | Run pm-review>
   - Start with: <skill name or command>
   - Done when: <observable check>

## Note

- <review due, drift, uncommitted PM state, stacked operations, or none>
```

The `Next queue` lists every item in `Next`; it is exempt from the 5-bullet
limit. Omit `After that` or `For you` when empty. Omit `Note` when there is
nothing to report.
