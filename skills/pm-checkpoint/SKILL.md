---
name: pm-checkpoint
description: Use when a session ends, a workflow stage finishes, the user says pause or stop, work on the active item is done, or they want to switch items. Saves state to NOW.md and closes finished items in the PM root.
---

# pm-checkpoint

Save state so the next session can continue with no memory of this one.
Writes only inside the PM root, in the main worktree.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `stage` | A design, plan, or finish handoff skill just completed | Update `Stage`, `Spec`, `Plan`; continue to the next handoff |
| `pause` | Session ends, or the user says "pause" or "stop" | Write the checkpoint; item stays active |
| `done` | The item's `Done when` checks all pass | Log it, set `NOW.md` to idle |
| `switch` | The user wants a different item | Move the active item back to Next as `paused`, set idle |

If the mode is unclear, ask one choice question: `What should I save?`
with the options `Pause (recommended)`, `Mark done`, `Switch item`, and
`Type something`.

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `Status: idle`, reply `Nothing active. Run pm-next.` Stop.
- If the `Session` in `NOW.md` does not match the current session (Shared
  definitions), stop. Reply: `<ID> belongs to <Session>. Not changed.`
- If a workflow is active and the user did not say "pause", apply
  Non-interruption rule 4, except in `stage` mode right after a handoff
  skill finishes.

## Steps

1. Timestamp: Shared definitions.
2. **stage:** set `Stage` to the next stage in Handoffs order
   (design, plan, execute, finish). Fill `Spec` or `Plan` with the file the
   finished skill wrote. Do not write a checkpoint block. Then invoke the
   next handoff skill. In the output, show any commit as a Note, not under
   "Do this next".
3. **pause:** replace `## Checkpoint` with this block, using real values:

   ```markdown
   ## Checkpoint <YYYY-MM-DD HH:MM>

   - Stopped at: <last completed step>
   - Next action: <one action>
   - Start with: <exact command or file path>
   - Open question: <only if blocking>
   ```

   Derive `Stopped at` from the plan checkboxes and `git status`. List
   uncommitted files as a Note.
4. **done:** check every line under `## Done when` against evidence (test
   output, file existence). If any is unproven, stay in `pause` and list
   them. Otherwise append to `## Done` in `LOG.md`:
   `- <date> <ID> <Title>. Plan: <path>. Result: <PR or commit>.`
   Then set `NOW.md` to idle: `Status: idle`, every other field empty,
   `## Done when` and `## Checkpoint` empty.
5. **switch:** copy the active item to the top of `## Next` in
   `ROADMAP.md` with `Status: paused` and `Paused checkpoint:` set to the
   current checkpoint (write one first, as in `pause`). If Next is at its
   max from `config.md`, move the lowest Next item to the top of Later and
   say so. Then set `NOW.md` to idle as in `done`.

## Output

```markdown
## Saved

- Mode: <mode>
- Item: <ID Title | none>
- Stage: <stage | idle>

## Do this next

1. <one action>
   - Start with: <exact command, file, or skill name>
   - Done when: <observable check>

## Note

- <uncommitted files, commit command to run, assumptions>
```

Do not run `git commit`. Print suggested commands for the user.
