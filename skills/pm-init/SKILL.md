---
name: pm-init
description: Use only when the user explicitly asks to set up project management, create its state directory, or write the product vision for this repository. Creates the PM root, writes a challenged VISION.md, seeds the roadmap, and commits it.
---

# pm-init

Create the configured PM root, write its `VISION.md` with the user, and
seed the roadmap. This runs once per repository.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`).

## Guard

- Read the `PM state directory` setting from that section. This is the PM
  root; use `planning/` if no setting is present. Replace `<PM root>` with
  the configured path in file paths, commands, and user-facing output.
- If `<PM root>/config.md` and `<PM root>/NOW.md` already exist in the main
  worktree, stop. Reply:
  `<configured path> is already initialized. Run pm-resume, or pm-strategy to change the vision.`
- If any destination template file already exists but the PM state is not
  initialized, stop and report the existing paths; do not overwrite them.
- If a workflow is active (see the rules), apply Non-interruption rule 4.

## Steps

1. Find the main worktree: the first path in `git worktree list`.
2. Copy the templates from this skill's `templates/` folder into the PM
   root. In every copied file, replace `{{PM_ROOT}}` with the configured
   directory:

   | Template | Destination |
   | --- | --- |
   | `config.md` | `<PM root>/config.md` |
   | `VISION.md` | `<PM root>/VISION.md` |
   | `STRATEGY.md` | `<PM root>/STRATEGY.md` |
   | `NOW.md` | `<PM root>/NOW.md` |
   | `ROADMAP.md` | `<PM root>/ROADMAP.md` |
   | `LOG.md` | `<PM root>/LOG.md` |
   | `inbox-README.md` | `<PM root>/inbox/README.md` |
   | `briefs-README.md` | `<PM root>/briefs/README.md` |
   | `research-README.md` | `<PM root>/research/README.md` |

   In `config.md`, set `Last review` Date to `never`, and set `PM branch`
   to the repository's default branch: run
   `git symbolic-ref --short refs/remotes/origin/HEAD`, strip any `origin/`
   prefix, and fall back to `main`, then `master`, then the current branch.
   Set `Rules version` to the `version=N` in the pm-skills start marker when
   that marker still carries one (a legacy install); keep the template value
   when the marker is present without a version, because the template ships
   with the skills that `pm-setup` merged; and when no agent file has the
   marker, leave the value empty and add the Note `Rules not installed. Run
   pm-setup.`
   Then ask one choice question: `When a skill writes planning files, how
   should they be committed?` with the options `Commit automatically
   (recommended)`, `Ask me each time`, and `Never commit`; set `PM state
   commit` to `always`, `ask`, or `never` to match.

3. Read the repository for context before the vision questions: `README*`,
   package or project manifests, top-level folders, and the last 20 lines
   of `git log --oneline`. Record whether the repository already has
   substantial code (more than a scaffold).
4. Fill `<PM root>/VISION.md` by asking these questions **one at a time**,
   in this order. Use the question tool for each. Offer 2 or 3 drafted
   answers inferred from step 3 as options (when there is nothing to infer
   from, offer common shapes of answer). The free-text entry covers the
   rest.
   1. "In one sentence, what problem does the product solve?"
   2. "Who has this problem and pays to solve it?"
   3. "List 3 to 5 things that must be true for v1 to be done. Each one
      should be something you can check."
   4. "What is explicitly not in v1?"
   5. "Hours per week, monthly budget, and any fixed technology choices?"

   Write each answer to `VISION.md` before asking the next question, and
   show the line you wrote.

   If the repository is empty or a scaffold, run `pm-purview` (new mode)
   after question 5. It asks what is being built, the runtime, and the
   expected scale. Its accepted recommendations (none, for a non-.NET
   project) join the roadmap seed in step 6.
5. Challenge each answer once, using the Challenge protocol scaled to a
   vision line. Raise a challenge only when the answer:
   - describes a solution instead of a problem (question 1),
   - names no one who pays or decides (question 2),
   - cannot be checked, for example "it's polished" (question 3),
   - contradicts another answer or the repository (for example, a stack
     choice that differs from the manifests),
   - lists more v1 outcomes than the stated hours per week can plausibly
     deliver; state the arithmetic as an `Assumption:`.

   For each challenge, propose one concrete rewrite and ask a choice
   question: `Use this wording for <line>?` with the options `Use the
   rewrite (recommended)` and `Keep my wording`. Write the result
   immediately. If the user keeps their wording, append to `## Decisions`
   in `STRATEGY.md`: `- <date> Kept vision wording "<line>". Why: <reason
   given, or "user choice">.`
6. Seed the roadmap. Ask with the question tool: "Which features or tasks
   do you already have in mind?" Offer up to 3 drafted lists inferred from
   the repository and the v1 outcomes as options. Then:
   - Give each item an ID (`R-001` upwards), a `Serves:` line, an `Owner:`
     (`user` for work only the user can do, such as accounts, purchases,
     legal text, or design decisions), a `Done when:`, a size, and
     `Depends on:` where one item needs another.
   - For each `V` line with no item, propose one item that serves it, and
     say so.
   - Apply the Challenge protocol checks 1, 2, and 5 to each item. Items
     that serve no `V` line, or match "Out of scope", go to `## Later` with
     `Status: ready` and a `Note:` stating why.
   - Propose the top items for `## Next`, up to the max in `config.md`, in
     dependency order, with one reason per item. Ask one choice question:
     `Accept this Next list?` with the options `Accept (recommended)` and
     `Change the order or items`.
7. Verify the specs path in the Handoffs table: check whether the installed
   design skill states a save location. If it differs, update
   `<PM root>/config.md`.
8. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): initialise planning`. Then show the output.

## Output

```markdown
## Set up

- Created: `<PM root>/config.md`, `VISION.md`, `STRATEGY.md`, `NOW.md`, `ROADMAP.md`, `LOG.md`, `inbox/`, `briefs/`, `research/`
- Vision: <n> v1 outcomes, <n> out-of-scope items, <n> challenges raised
- Roadmap: <n> in Next (<n> for you), <n> in Later
- Last review: never
- PM state: <committed <short sha> | left uncommitted (policy: never)>

## Do this next

1. <If the repository has substantial code:> Run `pm-discover` to check the roadmap against the existing product.
   <Otherwise:> Run `pm-strategy` to set milestones, or `pm-next` to start <first claimable ID>.
   - Start with: <skill name>
   - Done when: <observable check>
```
