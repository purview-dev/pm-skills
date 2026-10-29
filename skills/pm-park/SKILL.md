---
name: pm-park
description: Use when the user mentions an off-task idea, feature, or bug during other work and wants it saved without discussion. Writes one inbox file and replies in one line. Capture only.
---

# pm-park

Capture one idea in one file, reply in one line, return to the task in
progress. This is the only `pm-*` skill that may run during an active
workflow.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Guard

- If `<PM root>/` does not exist, reply: `No <PM root> folder. Run pm-init.
  Idea (not saved): <the idea, verbatim>`. Stop.
- Write in the main worktree, not the current feature worktree.

## Steps

1. Build the slug: lowercase, ASCII letters, digits and hyphens, at most 5
   words from the idea.
2. Get the timestamp with the command for the current shell (see Shared
   definitions). The filename is `<PM root>/inbox/<YYYY-MM-DD-HHMM>-<slug>.md`.
   If that path exists, append `-2`, then `-3`, before `.md`.
3. Write the file:

   ```markdown
   # <Short title, max 8 words>

   - Captured: <YYYY-MM-DD HH:MM>
   - Context: <active item ID and stage, or "none">

   ## Idea

   <the user's words, verbatim, no rewriting>
   ```

4. Reply with exactly one line:
   `Parked: <filename>. Back to <current step>.`
5. Resume the step that was in progress. Do not evaluate, estimate, or
   discuss the idea. Ask no questions.

## Output

One line. Nothing else.
