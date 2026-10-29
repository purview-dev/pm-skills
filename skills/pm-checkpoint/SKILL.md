---
name: pm-checkpoint
description: Use when the user says stop, pause, done for today, checkpoint, or switch; or immediately after a design, plan, or finish handoff skill from pm/config.md completes.
---

# pm-checkpoint

Save exactly where work stopped, so `pm-resume` can restart it with no
thinking required. It also records stage changes and closes finished items.

Follow the Non-interruption rules and Communication contract in `AGENTS.md`.

## Guard

- Never run in the middle of a workflow step. If the user says "pause"
  during a workflow, let the current atomic step finish (the current test,
  edit, or command), then run.
- Only the session named in `pm/NOW.md` may checkpoint that item
  (Non-interruption rule 7).

## Modes

Choose the mode from the trigger:

| Trigger | Mode |
| --- | --- |
| Design skill completed | `stage` (record spec, set `Stage: plan`) |
| Plan skill completed | `stage` (record plan, set `Stage: execute`) |
| User stops or pauses, item unfinished | `save` |
| User says "switch" | `pause` |
| Finish skill completed | `close` |

## Steps

1. Get the time with `date "+%Y-%m-%d %H:%M"`.
2. **stage**: in `pm/NOW.md`, set `Stage` and add the `Spec` or `Plan`
   path that the handoff skill reported. Then also do step 3.
3. **save** (and after **stage**): replace the `## Checkpoint` section in
   `pm/NOW.md` with:
   - `Stopped at:` the last completed step (a commit, task number, or
     file).
   - `Next action:` one action that can start in under 15 minutes.
   - `Start with:` an exact command or file path.
   - `Open question:` only if something blocks the next action.
4. **pause**: do step 3. Then move the item back to the top of `## Next` in
   `pm/ROADMAP.md` with `Status: paused` and the checkpoint copied into
   `Paused checkpoint:`. Set `pm/NOW.md` to `Status: idle`.
5. **close**: check each `Done when` line against evidence (test output,
   endpoint response, merged commit). Then:
   - If every line passes, add a line to `## Done` in `pm/LOG.md` with the
     date, ID, title, plan path, and PR or commit. Set `pm/NOW.md` to
     `Status: idle`.
   - If any line fails, do not close. List the failing lines and run
     **save** mode.
6. Print the suggested commit command. Do not run it (Non-interruption rule
   6).

## Output

```markdown
## Checkpoint saved

- Item: <ID> <title> (stage: <stage>)
- Mode: <stage | save | pause | close>
- Next time: <next action, or "closed">

## Do this next

1. Commit PM state.
   - Start with: `git -C <main worktree> add pm && git -C <main worktree> commit -m "pm: <mode> <ID>"`
   - Done when: pm/ is clean in `git status`
```

After a `stage` checkpoint, continue straight into the next handoff skill,
without waiting.

After `close` or `pause`, ask one question: `Run pm-next?`
