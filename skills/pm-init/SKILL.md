---
name: pm-init
description: Use only when the user explicitly asks to set up project management, create the pm folder, or write the product vision for this repository.
---

# pm-init

Create the `pm/` folder and write `pm/VISION.md` with the user. This runs
once per repository.

Follow the Non-interruption rules and Communication contract in `AGENTS.md`.

## Guard

- If `pm/` already exists in the main worktree, stop. Reply:
  `pm/ already exists. Run pm-resume, or pm-review to change the vision.`
- If a workflow is active (see `AGENTS.md`), apply Non-interruption rule 4.

## Steps

1. Find the main worktree: the first path in `git worktree list`.
2. Copy the templates from this skill's `templates/` folder:

   | Template | Destination |
   | --- | --- |
   | `config.md` | `pm/config.md` |
   | `VISION.md` | `pm/VISION.md` |
   | `NOW.md` | `pm/NOW.md` |
   | `ROADMAP.md` | `pm/ROADMAP.md` |
   | `LOG.md` | `pm/LOG.md` |
   | `inbox-README.md` | `pm/inbox/README.md` |

3. Fill `pm/VISION.md` by asking these questions **one at a time**, in this
   order. After each answer, show the line you wrote and move on. Do not
   debate the answer.
   1. "In one sentence, what problem does the product solve?"
   2. "Who has this problem and pays to solve it?"
   3. "List 3 to 5 things that must be true for v1 to be done. Each one
      should be something you can check."
   4. "What is explicitly not in v1?"
   5. "Hours per week, monthly budget, and any fixed technology choices?"
4. If an answer to question 3 cannot be checked (for example "it's
   polished"), propose one checkable version and ask for yes or no.
5. Seed the roadmap. Ask: "List the features you already have in mind, in
   any order." Then:
   - Give each item an ID (`R-001` upwards), a `Serves:` line (V1, V2, and
     so on), a `Done when:`, and a size.
   - Anything matching "Out of scope" goes to `## Later` with
     `Status: ready` and the note `Out of scope for v1`.
   - Propose the top 5 for `## Next` in dependency order, with one reason
     per item. Ask for one confirmation: "ok", or the user's changes.
6. Verify the specs path in the Handoffs table: check whether the installed
   design skill states a save location. If it differs, update
   `pm/config.md`.

## Output

```markdown
## Set up

- Created: pm/config.md, VISION.md, NOW.md, ROADMAP.md, LOG.md, inbox/
- Vision: <n> v1 outcomes, <n> out-of-scope items
- Roadmap: <n> in Next, <n> in Later

## Do this next

1. Commit the PM files.
   - Start with: `git add pm && git commit -m "pm: initialise"`
   - Done when: `git status` shows pm/ clean
2. Run `pm-next` to start R-001.
```
