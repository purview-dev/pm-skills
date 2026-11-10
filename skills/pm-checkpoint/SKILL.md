---
name: pm-checkpoint
description: Use when a session ends, the context is about to be compacted, a workflow stage finishes, the user says pause or stop, work on the active item is done, they want to switch items, or they need to suspend an operation and resume it later. Saves state, decisions, and open questions to NOW.md, stacks and restores suspended operations, closes finished items on their branch, and commits the PM state.
---

# pm-checkpoint

Save state so the next session, or this one after compaction, can continue
with no memory of the conversation. Writes only inside the PM root: the
main worktree, or the worktree that holds the item's branch in `done` mode
(rules: **Completion rides the branch**).

Follow the Non-interruption rules, Shared definitions, Persistence, Asking
the user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `stage` | A design or plan handoff skill just completed | Update `Stage`, `Spec`, `Plan`; continue to the next handoff |
| `pause` | Session ends, context is about to be compacted, or the user says "pause" or "stop" | Write the checkpoint; item stays active |
| `done` | The item's `Done when` checks all pass | Write the Completion record, commit it on the item's branch, set `NOW.md` to idle |
| `switch` | The user wants a different item | Move the active item back to Next as `paused`, set idle |
| `push` | The user asks to stack, suspend, or pause an operation, or an emergency needs the session | Write a stack entry, set `NOW.md` to idle |
| `pop` | The user asks to resume the stacked operation | Restore the top stack entry, hand off at its stage |

If the mode is unclear, show the active item's legend line, `R-NNN <title>
(owner, size, status)` (Shared definitions: Reference legend), then ask one
choice question: `<ID> <title> is at <stage>. What should I save?` with the
options `Pause it (recommended)`, `Mark it done`, `Switch to another item`,
and `Explain <ID>`.

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `Status: idle` and the mode is not `pop`: commit **Uncommitted PM
  state** if any (rules: Committing PM state), then reply `Nothing active.
  Run pm-next.` when the stack is empty, or `Nothing active. Run
  pm-checkpoint pop.` when `STACK.md` has an entry, and report the commit.
  Stop.
- If `Status: active` and the `Session` in `NOW.md` does not match the
  current session (Shared definitions), stop. Reply: `<ID> belongs to
  <Session>. Not changed.`
- **`done`:** if the item's branch is already merged into the PM branch,
  stop. Reply `Branch <branch> is merged but <ID> is still active. Run
  pm-rejoin.` Never close an item after its branch has merged. If a
  `## Done` line for `<ID>` already names this branch, reply `Completion for
  <ID> is already written. Run the finish step.` Stop.
- **`pop`:** if `STACK.md` is missing or empty, reply `Nothing stacked.`
  Stop. If a workflow is active, reply `A workflow is active. Finish or
  pause it, then run pop.` Stop. If `NOW.md` is active, ask one choice
  question: `R-NNN <title> is active. How should <stacked ID> be restored?`
  with the options `Push the active item, then pop (recommended)` (run
  `push`, then `pop`) and `Cancel pop`. If the current branch differs from
  the entry's `Branch`, reply `<ID> is stacked on <branch>. Switch to it,
  then run pop.` Stop.
- If a workflow is active and the user did not ask to pause or suspend,
  apply Non-interruption rule 4, except in `stage` mode right after a
  handoff skill finishes, in `pause` mode before compaction, and in `push`
  when the user asks (Non-interruption rule 10).

## Steps

1. Timestamp: Shared definitions.
2. **Follow-ups.** For each piece of work noticed this session that is
   outside `## Done when` and not yet parked, run `pm-park` in `agent`
   mode. Do this in every mode except `push` and `pop`, which reply in one
   line.
3. **stage:** set `Stage` to the next stage in Handoffs order
   (design, plan, execute, finish). Fill `Spec` or `Plan` with the file the
   finished skill wrote. Do not write a checkpoint block. Commit the PM
   state (step 9), then invoke the next handoff skill. In the output, show
   the commit as a Note, not under "Do this next".
4. **pause:** replace `## Checkpoint` with this block, using real values:

   ```markdown
   ## Checkpoint <YYYY-MM-DD HH:MM>

   - Stopped at: <last completed step>
   - Next action: <one action>
   - Start with: <exact command or file path>
   - Decisions: <decisions made since the last checkpoint, each with its reason | none>
   - Context: <facts the next session needs that are not in the spec, plan, or brief | none>
   - Open question: <only if blocking>
   ```

   Derive `Stopped at` from the plan checkboxes and `git status`. Take
   `Decisions` and `Context` from this session's conversation: anything
   agreed, ruled out, or discovered that would otherwise be lost on
   compaction. If the item has a brief, also append agreed scope changes
   to its `## Decision` with the date. List changed files outside the PM
   root as a Note, with one command that would commit them; do not run
   it. Step 9 commits the PM root.
5. **done:** check every line under `## Done when` against evidence (test
   output, file existence, command output). If any is unproven, stay in
   `pause` and list them. If the plan file has any `- [ ]` box, stay in
   `pause` and name the open steps. Otherwise:
   - **Choose the commit worktree** (rules: **Completion rides the branch**).
     The record starts from the committed PM state on the PM branch. When
     the item's branch is the PM branch, write it in place. Otherwise read
     `LOG.md`, `NOW.md`, `ROADMAP.md`, `STRATEGY.md`, and the brief from the
     PM branch (`git show <PM branch>:<PM root>/<file>`), apply the record
     to those contents, and write and commit them in the worktree that
     holds the item's branch. Stop when the PM branch has **Uncommitted PM
     state**, or when the item's worktree has uncommitted changes under the
     PM root.
   - Append to `## Done` in `LOG.md`:
     `- <date> <ID> <Title>. Milestone: <the Milestone in NOW.md, or none>.
     Owner: <owner>. Plan: <path | none>. Result: branch <branch>.`
     The branch is the durable locator: the finish step opens the pull
     request from it, so no PR number is written here.
   - If the item has a brief, set its `Status: done`.
   - If this item is the last open item of its milestone (no other item
     with that `Milestone` in `NOW.md`, `## Next`, or `## Later`), ask one
     choice question: `All <M> <Name> items are done.
     Mark the milestone done?` with the options `Mark it done
     (recommended)`, `Leave it for pm-strategy`, and `Explain <M>`. On
     mark, set `Status: done (<date>)` on its `### <M> <Name>` block in
     `STRATEGY.md` and append to `## Decisions`:
     `- <date> <M> <Name> complete. Why: <exit criteria evidence>.
     Rejected: none.` When the exit criteria cannot be checked from the
     repository, recommend `Leave it for pm-strategy` instead.
   - Set `NOW.md` to idle: `Status: idle`, every other field empty,
     `## Done when` and `## Checkpoint` empty.
   - If items in Next list this ID in `Depends on`, name the ones now
     claimable as a Note.
   - The next action is the `finish` skill from the Handoffs table: it
     pushes this branch and opens the pull request, so the completion
     commit is part of it. Say so under "Do this next".
6. **switch:** write a checkpoint first, as in `pause`. When the user names
   the item to switch to, show `R-NNN <title>`. Copy the active
   item to the top of `## Next` in `ROADMAP.md` with `Status: paused` and
   `Paused checkpoint:` set to that checkpoint, keeping its `Brief` and
   `Milestone`. If Next is at its max from `config.md`, apply the **Full
   Next** rule (Roadmap order and edits) and name the item moved to Later.
   Then set `NOW.md` to idle as in `done`.
7. **push:** create `<PM root>/STACK.md` when it is missing, then write one
   entry at its top, copying the values from `NOW.md`:

   ```markdown
   ### <ID> <Title>

   - Pushed: <YYYY-MM-DD HH:MM>
   - Branch: <current branch>
   - Stage: <Stage in NOW.md>
   - Brief: <path | none>
   - Spec: <path | none>
   - Plan: <path | none>
   - Milestone: <M | none>
   - Started: <Started in NOW.md>
   - Reason: <the user's reason, verbatim>
   - Done when:
     - <each line under ## Done when>
   - Checkpoint:
     - Stopped at: <...>
     - Next action: <...>
     - Start with: <...>
     - Decisions: <...>
     - Context: <...>
   ```

   Use the existing checkpoint, or write one as in `pause` when `NOW.md`
   has none. Then set `NOW.md` to idle as in `done`. The item, its stage,
   and its checkpoint are now on the stack and nowhere else. Step 9
   commits, then reply in one line and resume the interrupted step.
8. **pop:** read the top entry of `STACK.md` (Guard checks the stack,
   branch, and active item). Write its fields back into `NOW.md`:
   `Status: active`, `Item`, `Session` (the entry's `Branch`), `Stage`,
   `Brief`, `Milestone`, `Spec`, `Plan`, `Started`, its `Done when` under
   `## Done when`, and its checkpoint under `## Checkpoint`. Remove the
   entry from `STACK.md`, leaving the next entry as the top. Step 9
   commits; show one line (`pop <ID>: <stage> at its checkpoint`), then
   invoke the skill for `Stage` from
   the Handoffs table in `config.md`, passing the checkpoint's
   `Next action`; when the stack still has entries, name the next one as a
   Note.
9. **Commit** the PM state (rules: Committing PM state) in every mode,
   after the last PM file is written. In `done`, the commit worktree is the
   worktree that holds the item's branch and the message is
   `docs(pm): close <ID> <slug>`; the finish step pushes that commit inside
   the item's pull request. Other modes use `docs(pm): <mode> <ID>
   <detail>`, for example `docs(pm): pause R-007 at execute` or
   `docs(pm): stack R-007 on the failing build`. In `push` and `pop`, show
   the one-line reply instead of the full output block.

## Output

```markdown
## Saved

- Mode: <mode>
- Item: <ID Title | none>
- Stage: <stage | idle>
- Parked: <n follow-ups | none>
- Stack: <n suspended | none>
- Commit target: <branch>

## Do this next

1. <one action>
   - Start with: <exact command, file, or skill name>
   - Done when: <observable check>

## Note

- <commit result, changed files outside the PM root, assumptions, newly claimable items, the next stacked item>
```
