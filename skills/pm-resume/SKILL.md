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

- Before step 1, run the upgrade check (rules: Upgrading before work
  resumes). Put any `Upgrade debt` in the `Note`. A workflow is never
  interrupted by it.
- If `<PM root>/config.md` or `<PM root>/NOW.md` is missing, reply:
  `No <PM root> state. Run pm-init.` Stop.
- If a workflow is active and this is not a post-compaction resume, apply
  Non-interruption rule 4 and stop. After compaction, run the steps
  silently, report only the `## Now` section, and continue the workflow
  step recorded in the checkpoint.
- If `NOW.md` lacks the fields `Status`, `Item`, `Session`, `Stage`,
  `Spec`, `Plan`, `Started`, or the `## Done when` and `## Checkpoint`
  headings, reply: `NOW.md is malformed: missing <field>. Fix it by hand or
  restore it with git.` Stop. Do not repair it. `Brief` and `Milestone` are
  optional.

## Steps

1. Read `NOW.md`, `config.md`, `ROADMAP.md`, and `STRATEGY.md` (focus
   milestone only). Read `STACK.md` when it exists and count its entries.
   If `NOW.md` has a `Brief`, read its `## Decision` and
   `## Open questions`.
2. Count the open inbox (Shared definitions) and the inbox files with
   `Discuss: yes`. List briefs with `Status: shaping`. Count the
   **Uncommitted PM state** files for the `Note` section.
3. Evaluate **Review due** (Shared definitions).
4. **Remote.** Run `git fetch <remote> --prune` (Shared definitions:
   Remote); it moves remote refs only and writes no file. When the current
   branch is behind its upstream, add the Note `<branch> is <n> commits
   behind <upstream>. Pull: git pull --ff-only`. When the current branch
   is not the PM branch and the local PM branch is behind `<remote>/<PM
   branch>`, name the count only; `pm-next` branches from the **PM base**,
   so the PM branch needs no checkout.
5. If `Status: idle`: check for drift first (Shared definitions). When the
   current branch is a **Pending pull request** whose `## Done` line is
   written, it is not drift: the next action is `pm-next`, which starts
   from the **PM base**, with the Note `Stay on <branch> until its pull
   request merges.` Otherwise the state has drifted when the current branch
   matches the `Branch name pattern` in `config.md`, because then the
   branch names an item that `NOW.md` does not record. The next action is
   then `pm-rejoin`, not `pm-next`. When the
   stack has an entry, the next action is `pm-checkpoint pop`: suspended
   work comes back before new work is claimed. Otherwise the next action is
   `pm-next`. If review is due, it is `pm-review` instead. If Next has no
   claimable item, it is the user task that unblocks the most items, or
   `pm-review`.
6. If `Status: active`:
   - **Session match** (Shared definitions): a mismatch means another
     session owns the item. Report it read-only, unless the current branch
     matches the `Branch name pattern` in `config.md` for this item's ID:
     then the work moved to this branch and the next action is `pm-rejoin`.
     Otherwise the next action is `pm-next` only if Next has a claimable
     item, which would claim a different item. Otherwise it is
     `wait, or ask the owner of <Session>`.
   - If the `Plan` file exists, count its `- [ ]` (open) and `- [x]`
     (done) checkboxes.
   - Check whether the session branch is merged: run
     `git branch -a --merged <remote>/<PM branch>`, using the refs fetched
     in step 4 (a repository with no remote uses the local PM branch). If
     the session branch is listed, the item is **Merged-unclosed** (Shared
     definitions): add the Note `Branch <branch> is merged but <ID> <title>
     is still active.` and make the next action `pm-rejoin`. Never close it
     after the merge.
   - If total > 0 and open = 0, the next action is `pm-checkpoint` (`done`)
     on this branch, and then the finish skill from the Handoffs table. The
     completion record must be committed before the finish step opens the
     pull request.
   - Otherwise the next action is the `Next action` in the checkpoint. If
     there is no checkpoint, it is the skill for the `Stage` in the
     Handoffs table.
   - If a Spec, Plan, or Brief path is set but the file does not exist, add
     the Note: `Missing file: <path>.`
7. **For you:** collect, in this order, up to 5 of: the checkpoint's `Open
   question`; `Owner: user` items in Next with `Status: ready`, in roadmap
   order, flagging those that block agent items; `## Open questions` from briefs with `Status:
   shaping`; the count of inbox files with `Discuss: yes`.
8. Show the output. Then ask one choice question: `Start "<next action>"
   now?` with the options `Start it (recommended)` and `Show the board
   first` (run `pm-board`). If a "For you" item blocks the next
   action, put `Do <user item> first` as the recommended option instead.

## Output

```markdown
## Now

- Item: <ID Title | none>
- Stage: <stage | none>
- Progress: <done>/<total> plan steps | no plan yet
- Last checkpoint: <date time | none>
- Stack: <n suspended | none>
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

- <only if needed: review due, inbox count, session mismatch, drift, uncommitted PM state, missing file>
```
