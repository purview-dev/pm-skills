---
name: pm-init
description: Use only when the user explicitly asks to set up project management, create its state directory, or write the product vision for this repository.
---

# pm-init

Create the configured PM root and write its `VISION.md` with the user. This
runs once per repository.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`).

## Guard

- Read the `PM state directory` setting from that section. This is the PM
  root; use `planning/` if no setting is present. Replace `<PM root>` with
  the configured path in file paths, commands, and user-facing output.
- If `<PM root>/config.md` and `<PM root>/NOW.md` already exist in the main
  worktree, stop. Reply:
  `<configured path> is already initialized. Run pm-resume, or pm-review to change the vision.`
- If any destination template file already exists but the PM state is not
  initialized, stop and report the existing paths; do not overwrite them.
- If a workflow is active (see the rules), apply Non-interruption rule 4.

## Steps

1. Find the main worktree: the first path in `git worktree list`.
2. Copy the templates from this skill's `templates/` folder into the PM
   root. In `config.md`, replace `{{PM_ROOT}}` with the configured directory
   and set `Last review` Date to `never`:

   | Template | Destination |
   | --- | --- |
   | `config.md` | `<PM root>/config.md` |
   | `VISION.md` | `<PM root>/VISION.md` |
   | `NOW.md` | `<PM root>/NOW.md` |
   | `ROADMAP.md` | `<PM root>/ROADMAP.md` |
   | `LOG.md` | `<PM root>/LOG.md` |
   | `inbox-README.md` | `<PM root>/inbox/README.md` |

3. Fill `<PM root>/VISION.md` by asking these questions **one at a time**,
   in this order. Ask each as a free-text question; do not offer preset
   answers. After each answer, show the line you wrote and move on. Do not
   debate the answer.
   1. "In one sentence, what problem does the product solve?"
   2. "Who has this problem and pays to solve it?"
   3. "List 3 to 5 things that must be true for v1 to be done. Each one
      should be something you can check."
   4. "What is explicitly not in v1?"
   5. "Hours per week, monthly budget, and any fixed technology choices?"
4. If an answer to question 3 cannot be checked (for example "it's
   polished"), propose one checkable version and ask a choice question:
   `Use this wording?` with the options `Use it (recommended)`, `No`, and
   `Type your own`.
5. Seed the roadmap. Ask as a free-text question: "List the features you
   already have in mind, in any order." Then:
   - Give each item an ID (`R-001` upwards), a `Serves:` line (V1, V2, and
     so on), a `Done when:`, and a size.
   - Anything matching "Out of scope" goes to `## Later` with
     `Status: ready` and the note `Out of scope for v1`.
   - Propose the top 5 for `## Next` in dependency order, with one reason
     per item. Ask one choice question: `Accept this Next list?` with the
     options `Accept (recommended)` and `Type changes`.
6. Verify the specs path in the Handoffs table: check whether the installed
   design skill states a save location. If it differs, update
   `<PM root>/config.md`.

## Output

```markdown
## Set up

- Created: `<PM root>/config.md`, `VISION.md`, `NOW.md`, `ROADMAP.md`, `LOG.md`, `inbox/`
- Vision: <n> v1 outcomes, <n> out-of-scope items
- Roadmap: <n> in Next, <n> in Later

## Do this next

1. Commit the PM files.
   - Start with: `git add <PM root> && git commit -m "chore: initialise project planning"`
   - Done when: `git status` shows the PM root clean
2. Run `pm-next` to start R-001.
```
