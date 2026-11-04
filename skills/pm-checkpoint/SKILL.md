---
name: pm-checkpoint
description: Use when a session ends, the context is about to be compacted, a workflow stage finishes, the user says pause or stop, work on the active item is done, or they want to switch items. Saves state, decisions, and open questions to NOW.md, closes finished items in the PM root, and commits the PM state.
---

# pm-checkpoint

Save state so the next session, or this one after compaction, can continue
with no memory of the conversation. Writes only inside the PM root, in the
main worktree.

Follow the Non-interruption rules, Shared definitions, Persistence, Asking
the user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `stage` | A design, plan, or finish handoff skill just completed | Update `Stage`, `Spec`, `Plan`; continue to the next handoff |
| `pause` | Session ends, context is about to be compacted, or the user says "pause" or "stop" | Write the checkpoint; item stays active |
| `done` | The item's `Done when` checks all pass | Log it, set `NOW.md` to idle |
| `switch` | The user wants a different item | Move the active item back to Next as `paused`, set idle |

If the mode is unclear, ask one choice question: `<ID> is at <stage>. What
should I save?` with the options `Pause it (recommended)`, `Mark it done`,
and `Switch to another item`.

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `Status: idle` and **Uncommitted PM state** exists, commit it (rules:
  Committing PM state) first, then reply `Nothing active. Run pm-next.`
  and report the commit. Stop. With no uncommitted PM state, reply
  `Nothing active. Run pm-next.` Stop.
- If the `Session` in `NOW.md` does not match the current session (Shared
  definitions), stop. Reply: `<ID> belongs to <Session>. Not changed.`
- If a workflow is active and the user did not ask to pause, apply
  Non-interruption rule 4, except in `stage` mode right after a handoff
  skill finishes, and in `pause` mode before compaction.

## Steps

1. Timestamp: Shared definitions.
2. **Follow-ups.** For each piece of work noticed this session that is
   outside `## Done when` and not yet parked, run `pm-park` in `agent`
   mode. Do this in every mode.
3. **stage:** set `Stage` to the next stage in Handoffs order
   (design, plan, execute, finish). Fill `Spec` or `Plan` with the file the
   finished skill wrote. Do not write a checkpoint block. Commit the PM
   state (step 7), then invoke the next handoff skill. In the output, show
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
   it. Step 7 commits the PM root.
5. **done:** check every line under `## Done when` against evidence (test
   output, file existence, command output). If any is unproven, stay in
   `pause` and list them. Otherwise:
   - Append to `## Done` in `LOG.md`:
     `- <date> <ID> <Title>. Milestone: <the Milestone in NOW.md, or none>.
     Owner: <owner>. Plan: <path>. Result: <PR or commit>.`
   - If the item has a brief, set its `Status: done`.
   - Set `NOW.md` to idle: `Status: idle`, every other field empty,
     `## Done when` and `## Checkpoint` empty.
   - If every item of its milestone is now in `## Done`, add the Note:
     `All <M> items are done. Run pm-strategy to check its exit criteria.`
   - If items in Next list this ID in `Depends on`, name the ones now
     claimable as a Note.
6. **switch:** write a checkpoint first, as in `pause`. Copy the active
   item to the top of `## Next` in `ROADMAP.md` with `Status: paused` and
   `Paused checkpoint:` set to that checkpoint, keeping its `Brief` and
   `Milestone`. If Next is at its max from `config.md`, apply the **Full
   Next** rule (Roadmap order and edits) and name the item moved to Later.
   Then set `NOW.md` to idle as in `done`.
7. **Commit** the PM state (rules: Committing PM state) in every mode,
   after the last PM file is written. Message: `docs(pm): <mode> <ID>
   <detail>`, for example `docs(pm): pause R-007 at execute` or
   `docs(pm): close R-007 tenant billing`.

## Output

```markdown
## Saved

- Mode: <mode>
- Item: <ID Title | none>
- Stage: <stage | idle>
- Parked: <n follow-ups | none>

## Do this next

1. <one action>
   - Start with: <exact command, file, or skill name>
   - Done when: <observable check>

## Note

- <commit result, changed files outside the PM root, assumptions, newly claimable items>
```
