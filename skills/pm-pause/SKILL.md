---
name: pm-pause
description: Use when the user asks to pause the session, save where they are, or stop now and continue later ("pause here", "save state, I'll pick this up tomorrow"), with or without an active item, including mid-workflow. Writes the current position - the skill or workflow step in progress, the open question, the files in use, and the one next action - to the pause file, checkpoints the active item, and commits the PM state. pm-resume continues from the pause file and deletes it.
---

# pm-pause

Write down where the session is, so the next session continues from the
exact step without the conversation. It covers what `NOW.md` does not
hold: a PM operation in progress (`pm-shape` at its third question,
`pm-review` at inbox file 4 of 9), a question waiting for the user, or a
workflow step. `pm-resume` reads the pause file first, continues from it,
and deletes it.

Follow the Non-interruption rules, Shared definitions, Persistence, Context
budget, Committing PM state, Asking the user, and Communication contract in
the pm-skills section of the agent instructions file (`AGENTS.md` or
`CLAUDE.md`). PM root is its `PM state directory` setting (default
`planning/`).

## Guard

- If `<PM root>/config.md` or `<PM root>/NOW.md` is missing, reply:
  `No <PM root> state. Run pm-init.` Stop.
- It runs mid-workflow only when the user asks to pause (Non-interruption
  rules 1 and 2): the user's pause ends the workflow at the step in
  progress. It never starts on its own.
- It never runs the upgrade check (rules: Upgrading before work resumes):
  saving the state comes first.
- If `NOW.md` is active and its `Session` does not match the current
  session (Shared definitions), the item belongs to another session: write
  the pause file without the item, and add the Note `<ID> <title> belongs
  to <Session>; its checkpoint is not changed.`
- If the **Pause file** exists with a different `Session`, show its
  `Paused`, `Session`, and `Next action`, then ask one choice question:
  `A pause for <Session> from <Paused> is waiting. Replace it?` with the
  options `Keep it and stop (recommended)` and `Replace it`. On keep, stop
  with nothing written. A pause with the same `Session` is replaced
  without asking.

## Steps

1. **Read the position.** Timestamp (Shared definitions), the current
   branch (`git branch --show-current`), `NOW.md`, and
   `git status --porcelain` for changed files outside the PM root. From
   this session, name the skill or workflow in progress and its step, the
   question waiting for the user, and the PM files it uses (brief, spec,
   plan, research report, inbox file).
2. **Write through first** (rules: Persistence). Every decision and answer
   from this session must already be in its file: the brief, the research
   report, `STRATEGY.md`, or an inbox file. Write any that is missing to
   that file now, under the heading its skill uses. The pause file points
   to them and never holds a decision only.
3. **Checkpoint the item.** When `NOW.md` is active for this session,
   apply `pm-checkpoint` (`pause`) steps 1, 2, and 4: park follow-ups and
   replace `## Checkpoint`. Its step 9 commit is replaced by step 5 here.
4. **Write the pause file.** Write `<PM root>/PAUSE.md`, replacing any pause
   for this session, with real values:

   ```markdown
   # Pause

   - Paused: <YYYY-MM-DD HH:MM>
   - Session: <branch>
   - Item: <ID title (stage) | none>
   - Running: <skill or workflow, and its step | none>
   - Files: <PM root paths, spec, or plan in use | none>
   - Uncommitted outside PM root: <n files: paths | none>

   ## Resume with

   - Next action: <one action>
   - Start with: <skill and mode, exact command, or file path>
   - Open question: <the question waiting for the user, verbatim | none>

   ## Context

   - <facts the next session needs that no PM file holds, at most 5 | none>
   ```

   With an active item, `Next action` and `Start with` equal its new
   checkpoint. `Context` holds only what is not in the brief, spec, plan,
   or checkpoint (rules: Context budget), never a transcript.
5. **Commit** the PM state (rules: Committing PM state) with
   `docs(pm): pause session on <branch>`. Files outside the PM root are
   listed in the pause file and the `Note`; never stage or commit them.

## Output

```markdown
## Paused

- Session: <branch>
- Item: <ID Title (stage) | none>
- Running: <skill or workflow, and its step | none>
- Open question: <text | none>
- Pause file: <PM root>/PAUSE.md

## Do this next

1. Resume in the next session.
   - Start with: `pm-resume` on `<branch>`
   - Done when: `pm-resume` shows this pause and `<PM root>/PAUSE.md` is deleted after it resumes

## Note

- <commit result, uncommitted files outside the PM root, an item owned by another session>
```
