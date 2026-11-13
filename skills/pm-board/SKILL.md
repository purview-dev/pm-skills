---
name: pm-board
description: Use when the user asks for the task board, kanban, what is in progress, or asks to move, add, insert, or close a card on the board. Renders the columns from Now to Done and applies the shared roadmap order and edit rules in its edit modes. Read-only in view mode.
---

# pm-board

Show the task board, and apply one move, add, insert, or close on it. A
view writes nothing; an edit writes `ROADMAP.md` and, for a close,
`LOG.md`.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, Challenge protocol, Asking the user, and Communication contract in
the pm-skills section of the agent instructions file (`AGENTS.md` or
`CLAUDE.md`). PM root is its `PM state directory` setting (default
`planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `view` | Default: "board", "kanban", "what's in progress" | Render the board; write nothing |
| `move <ID> <column> [<position>]` | "move R-012 to Next", "put R-012 at the top" | Move one card to `now`, `next`, `foryou`, `waiting`, `later`, or `done` |
| `add <title> [<column>] [<position>]` | "add a card for ..." | Create one item, challenged first |
| `insert <ID> <before \| after> <ID>` | "put R-012 before R-008" | Reposition one item in its section |

If the request fits no mode, ask one choice question with the 2 or 3 most
likely modes as options.

## Guard

- If `<PM root>/config.md` or `ROADMAP.md` is missing: `No <PM root>
  state. Run pm-init.` Stop.
- If a workflow is active, only `view` may run, and only when the user
  asked for it (Non-interruption rule 3). Render the board, then resume the
  step in progress. Every edit mode applies Non-interruption rule 4.
- Never write `NOW.md`. The `Now` column is the active item. To change it,
  run `pm-next` (claim) or `pm-checkpoint` (switch or done), then return
  here.
- If the ID is not found in `ROADMAP.md` or `LOG.md`, reply `<ID> not
  found.` and list the open IDs. Stop.
- A `Done` entry is history. It is never moved back; restore the work as a
  new item with a new ID.

## Steps

1. Read `NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`, and `config.md`.
   Read `STACK.md` when it exists and count its entries. Count the open
   inbox and the `Discuss: yes` files (Shared definitions). If `NOW.md` has
   a plan, count its checkboxes.
2. Build the columns:
   - `Now`: the active item in `NOW.md`, with its stage and step count.
   - `Next (agent)`: `## Next` items with `Owner: agent` or `both`, in
     roadmap order. Include `Status: paused`.
   - `For you`: `Owner: user` items in `## Next`, in roadmap order, plus
     any open question in `NOW.md`.
   - `Waiting`: blocked items, and items whose `Depends on` is not in
     `## Done`; show the reason.
   - `Done`: `## Done` lines in `LOG.md` within the board window in
     `config.md`.
3. For `view`, render the template and stop.
4. For an edit, resolve the destination to one shared operation:
   - `add`: apply the shared `add` with the requested column and position.
     `For you` sets `Owner: user`; `Waiting` adds it to Next and blocks it;
     `Next` keeps the agent owner. With no column, ask one choice question
     `Where should "<title>" start?` with `Next`, `For you`, and `Later
     (recommended)` as the options; a `Later` card is named in `Changed` but
     does not appear on the board.
   - `insert`: apply the shared `insert`; the section does not change.
   - `now`: run `pm-next <ID>`. A board never claims an item itself.
   - `next`: `move <ID> next <position>`. If the card is in `Waiting`,
     `unblock` it first. Set `Owner: agent` when the card comes from
     `For you` and the user chose the agent column; keep `Owner: both` when
     it already is.
   - `foryou`: `move <ID> next <position>` and set `Owner: user`.
   - `waiting`: `move <ID> next <position>` and `block` it with the reason
     the user gives, or keep it `ready` under an unfinished `Depends on`.
   - `later`: `move <ID> later <position>`. The card leaves the board.
   - `done`: for the active item run `pm-checkpoint` (done); otherwise run
     `pm-item done <ID>` after the same evidence check. The completion
     record is committed on the item's branch and rides its pull request.
5. Show one change line with the title (`R-012 <title>: For you -> Next top
   (Owner agent)`), ask one choice question when the operation changes
   order, removes an item from `Next`, or adds an item — with `Show the
   roadmap` as the escape option — then apply it.
6. Name the items that became claimable or blocked.
7. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): <verb> <ID>`. A `view` writes nothing and does not commit.

## Output

```markdown
## Board <YYYY-MM-DD>

| Column | ID | Title | Owner | Size | Detail |
| --- | --- | --- | --- | --- | --- |
| Now | R-007 | Tenant billing | agent | M | execute, 4/9 steps |
| Next (agent) | R-008 | Invoice email | agent | S | ready |
| For you | R-009 | Open a Stripe account | user | S | blocks R-008 Invoice email |
| Waiting | R-010 | Usage export | agent | M | needs R-008 Invoice email |
| Done | R-006 | Tenant model | agent | M | 2026-10-28 |

- Inbox: <n> open, <n> to discuss. Later: <n>.

## Changed

- <R-012: For you -> Next top | none>

## Do this next

1. <Run pm-next to start <ID> <title> | Continue <ID> <title> at execute | Run pm-roadmap for the full roadmap>
   - Start with: <skill name>
   - Done when: <observable check>

## Note

- <commit result | none>
- <Stacked: n (ID stage) | none>
```

Omit `Changed` in view mode. Omit `Note` when there is nothing to report.
