---
name: pm-resume
description: Use at the start of a session, or when the user asks where work stopped or what to do next. Reads the PM state and reports the one next action. Read-only.
---

# pm-resume

Report where work stopped and the one next action. Read-only.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Guard

- If `<PM root>/config.md` or `<PM root>/NOW.md` is missing, reply:
  `No <PM root> state. Run pm-init.` Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- If `NOW.md` lacks the fields `Status`, `Item`, `Session`, `Stage`,
  `Spec`, `Plan`, `Started`, or the `## Done when` and `## Checkpoint`
  headings, reply: `NOW.md is malformed: missing <field>. Fix it by hand or
  restore it with git.` Stop. Do not repair it.

## Steps

1. Read `NOW.md`, `config.md`, and the Next list in `ROADMAP.md`.
2. Count inbox files in `<PM root>/inbox/`, excluding `README.md`.
3. Evaluate **Review due** (Shared definitions).
4. If `Status: idle`: the next action is `pm-next`. If review is due, it is
   `pm-review` instead.
5. If `Status: active`:
   - **Session match** (Shared definitions): a mismatch means another
     session owns the item. Report it read-only. The next action is
     `pm-next` only if Next has a ready item, which would claim a
     different item. Otherwise it is "wait or ask the owner".
   - If the `Plan` file exists, count its `- [ ]` (open) and `- [x]`
     (done) checkboxes.
   - If total > 0 and open = 0, the next action is the finish skill from
     the Handoffs table. Then check whether the branch is merged: find the
     default branch with `git symbolic-ref --short refs/remotes/origin/HEAD`
     (fall back to `main`, then `master`), then run
     `git branch --merged <default>`. If the session branch is listed, add
     the Note: `Branch <branch> is merged. Run pm-checkpoint to close <ID>.`
     and make that the next action.
   - Otherwise the next action is the `Next action` in the checkpoint. If
     there is no checkpoint, it is the skill for the `Stage` in the
     Handoffs table.
   - If a Spec or Plan path is set but the file does not exist, add the
     Note: `Missing file: <path>.`

## Output

```markdown
## Now

- Item: <ID Title | none>
- Stage: <stage | none>
- Progress: <done>/<total> plan steps | no plan yet
- Last checkpoint: <date time | none>

## Do this next

1. <one action>
   - Start with: <exact command, file, or skill name>
   - Done when: <observable check>

## Note

- <only if needed: review due, inbox count, session mismatch, missing file>
```

Do not start the action. Wait for the user.
