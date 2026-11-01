---
name: pm-resume
description: Use at the start of a session, after the context has been compacted, or when the user asks where work stopped or what to do next. Reads the PM state and reports the next action for the agent, the user's own queue, and anything waiting for discussion. Read-only.
---

# pm-resume

Report where work stopped, the one next action, and what is waiting for
the user. Read-only. After compaction, this is how the session gets its
memory back: the PM files win over anything recalled from the
conversation.

Follow the Non-interruption rules, Shared definitions, Persistence, Asking
the user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Guard

- If `<PM root>/config.md` or `<PM root>/NOW.md` is missing, reply:
  `No <PM root> state. Run pm-init.` Stop.
- If a workflow is active and this is not a post-compaction resume, apply
  Non-interruption rule 4 and stop. After compaction, run the steps
  silently, report only the `## Now` section, and continue the workflow
  step recorded in the checkpoint.
- If `NOW.md` lacks the fields `Status`, `Item`, `Session`, `Stage`,
  `Spec`, `Plan`, `Started`, or the `## Done when` and `## Checkpoint`
  headings, reply: `NOW.md is malformed: missing <field>. Fix it by hand or
  restore it with git.` Stop. Do not repair it. `Brief` is optional.

## Steps

1. Read `NOW.md`, `config.md`, `ROADMAP.md`, and `STRATEGY.md` (focus
   milestone only). If `NOW.md` has a `Brief`, read its `## Decision` and
   `## Open questions`.
2. Count the open inbox (Shared definitions) and the inbox files with
   `Discuss: yes`. List briefs with `Status: shaping`.
3. Evaluate **Review due** (Shared definitions).
4. If `Status: idle`: the next action is `pm-next`. If review is due, it is
   `pm-review` instead. If Next has no claimable item, it is the user task
   that unblocks the most items, or `pm-review`.
5. If `Status: active`:
   - **Session match** (Shared definitions): a mismatch means another
     session owns the item. Report it read-only. The next action is
     `pm-next` only if Next has a claimable item, which would claim a
     different item. Otherwise it is
     `wait, or ask the owner of <Session>`.
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
   - If a Spec, Plan, or Brief path is set but the file does not exist, add
     the Note: `Missing file: <path>.`
6. **For you:** collect, in this order, up to 5 of: the checkpoint's `Open
   question`; `Owner: user` items in Next with `Status: ready`, in roadmap
   order, flagging those that block agent items; `## Open questions` from briefs with `Status:
   shaping`; the count of inbox files with `Discuss: yes`.
7. Show the output. Then ask one choice question: `Start "<next action>"
   now?` with the options `Start it (recommended)` and `Show the board
   first` (run `pm-status` board). If a "For you" item blocks the next
   action, put `Do <user item> first` as the recommended option instead.

## Output

```markdown
## Now

- Item: <ID Title | none>
- Stage: <stage | none>
- Progress: <done>/<total> plan steps | no plan yet
- Last checkpoint: <date time | none>
- Focus: <M Name | none set>

## Decisions so far

- <from the checkpoint and the brief's Decision, only if any>

## Do this next

1. <one action>
   - Start with: <exact command, file, or skill name>
   - Done when: <observable check>

## For you

- <open question, user task, or idea waiting for discussion>

## Note

- <only if needed: review due, inbox count, session mismatch, missing file>
```
