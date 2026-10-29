---
name: pm-resume
description: Use at the start of a session in this repository, or when the user asks "where was I", "what am I doing", "resume", or "what's next" while an item is in progress.
---

# pm-resume

Tell the user where work stopped and the single next action. Read-only:
this skill writes nothing.

Follow the Non-interruption rules and Communication contract in `AGENTS.md`.

## Guard

- If a workflow is already active in this conversation, apply
  Non-interruption rule 4.
- If `pm/` does not exist, reply: `No pm/ folder. Run pm-init.` and stop.

## Steps

1. Read `pm/NOW.md`, `pm/config.md`, and `pm/ROADMAP.md` from the main
   worktree.
2. If `Status: idle`, show the top ready item in Next and say to run
   `pm-next`. Stop.
3. If `Session` names a branch that is not the current branch, say which
   session owns the item. Do not take it over (Non-interruption rule 7).
4. Gather facts:
   - Plan progress: count `- [x]` and `- [ ]` in the plan file.
   - `git log --oneline -5 <session branch>`.
   - Checkpoint date and its age in days.
   - Number of files in `pm/inbox/`, excluding `README.md`.
   - Days since `Last review` in `pm/config.md`.
5. If commits exist after the checkpoint time, trust git. Derive "Stopped
   at" from the latest commit message and state
   `Assumption: checkpoint is older than the latest commits.`
6. The next action must start in under 15 minutes and name an exact command
   or file. If the checkpoint's next action is vague, rewrite it from the
   plan's first unchecked task.

## Output

```markdown
## Where you are

- Working on: <ID> <title> (stage: <stage>)
- Progress: <done>/<total> plan tasks
- Stopped at: <one line>

## Do this next

1. <single action>
   - Start with: `<command or path>`
   - Done when: <observable check>

## Notes

- <Only if true: Inbox has <n> items, a review is due. Run pm-review.>
- <Only if true: Checkpoint is <n> days old.>
- <Only if true: Open question: ...>
```

Then ask one yes or no question: `Continue with <execute skill from
Handoffs>?` On yes, invoke that skill with the plan path.
