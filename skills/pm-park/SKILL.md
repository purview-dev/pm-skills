---
name: pm-park
description: Use when the user raises a new idea, feature, bug, or "we should also" that is not part of the current task, or says "park this". Capture only; never discuss.
---

# pm-park

Capture an off-task idea in about 10 seconds, then return to exactly where
work was. This is the only PM skill allowed during an active workflow
(Non-interruption rule 3).

## Rules

- Do not evaluate, discuss, estimate, or plan the idea.
- Do not ask follow-up questions. If the idea is unclear, store it verbatim.
- Do not edit `pm/NOW.md`, `pm/ROADMAP.md`, or any spec or plan.
- Write exactly one new file. Never edit existing inbox files.

## Exception: the idea is part of the current task

If the idea is required to meet the current item's `Done when` in
`pm/NOW.md`, do not park it. Reply with one line:
`Not parked: this is needed for <ID> "Done when". Continuing.` Then
continue.

## Steps

1. Get the time with `date +%Y-%m-%d-%H%M`.
2. Write `pm/inbox/<time>-<slug>.md` in the main worktree. The slug is 2 to
   5 lowercase words from the idea, joined with hyphens.

   ```markdown
   # <Short title>

   - Type: idea | bug | tech-debt | question
   - Raised during: <NOW item ID, or "none">
   - Date: <YYYY-MM-DD HH:MM>

   ## Raw

   <The user's words, verbatim.>
   ```

3. Reply with exactly one line, then resume the previous step without
   waiting:

   `Parked: <title> -> pm/inbox/<file>. Back to: <step in progress>.`
