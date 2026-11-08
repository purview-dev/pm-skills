---
name: pm-revise
description: Use when work that was already designed, planned, or built is not what the user wanted, a Done when check fails, or the user asks to change, correct, rework, or revise something that already exists, including mid-workflow. Corrects the active item by rewinding a stage or fixing it in place, opens a revision item that revisits the original, or parks the change.
---

# pm-revise

Correct work that is already built. A revision is recorded in PM state, not
only in the conversation, and never reopens a `Done` line.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, Challenge protocol, Persistence, Asking the user, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `inspect` | Always first | Show the item, what was asked, and what exists |
| `rewind` | The spec or the plan is wrong, size `S` or `M` | Pause, set `Stage` back to `design`, `plan`, or `execute`, hand off |
| `fix-in-place` | The implementation is wrong, the plan still holds | Pause, keep the stage, hand back with the correction |
| `new item` | The original is in `## Done`, another session owns it, or the change is new scope | New `R-NNN` with `Revisits`, at the top of Next |
| `queue` | The original is still open in Next or Later | Raise it in Next, add the correction to its `Note:` |
| `park` | Not now | `pm-park` with `Discuss: yes` |

## Interrupting

This skill may run while a workflow is active (Non-interruption rule 8).
The order is fixed: record the scope, then `pm-checkpoint` (`pause`), then
correct. Never hand back to a development skill while the revision exists
only in the conversation, and never resume the interrupted step silently.

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `<PM root>/briefs/` does not exist and the item has a `Brief`, create
  the directory before writing the revision into it.
- Never edit source code, specs, or plans. PM skills record the correction
  in the brief's `## Revisions` and in `NOW.md`; the workflow skills change
  the spec and the plan.
- If another session owns the active item (Shared definitions: Current
  session) and this branch is not its branch, do not rewind or
  `fix-in-place`. Offer `new item` or `park`.
- If the target is not found in `ROADMAP.md`, `NOW.md`, or `LOG.md`, reply
  `<ID or title> not found.` and list the open IDs as `R-NNN <title>`. Stop.

## Steps

1. **Resolve the target.** Take the active item in `NOW.md`, an `R-NNN`, a
   title, or a `## Done` line in `LOG.md`. When two candidates fit, list up
   to three as `R-NNN <title>` and ask one choice question `Which item is
   wrong?` with them as the options.
2. **Inspect, read-only.** Build the evidence of what was asked and what
   exists:
   - The item's fields and `Done when`, or the `## Done` line in `LOG.md`.
   - The brief's `## Proposal`, `## Done when`, and any existing
     `## Revisions`.
   - The `Spec` and `Plan` paths: whether each exists, and its `- [ ]` and
     `- [x]` counts.
   - When the item is active: `git status --porcelain` and
     `git log --oneline -5`.
   - Items whose `Depends on` names this ID.

   Show the `## Revision` output block with `Mode:` empty. Write nothing yet.
3. **Ask the revision questions**, one at a time, writing each answer before
   the next. Draft 2 or 3 options from step 2 and put the recommended one
   first:
   1. What is wrong, and what should it do instead? (the screen, route, or
      file, and the words the user used)
   2. Was the mistake in the spec, the plan, or the code? State the evidence
      you found before asking; this answer selects the mode.
   3. How much is affected: which finished plan steps are invalidated? Quote
      the checkbox counts.
   4. What else depends on it: other items, briefs, or a `STRATEGY.md`
      decision?
   5. Contain or patch forward: is anything in use that needs a stop-gap?

   Write each answer as a `## Revisions` entry in the brief, in this form:

   ```markdown
   - <YYYY-MM-DD> <what was wrong>. Must now: <what it must do instead>.
     Mode: <rewind to <stage> | fix-in-place | new item R-NNN>. Supersedes:
     <spec or plan path | none>.
   ```

   When the item has no brief, hold the entries and write them into the
   `NOW.md` checkpoint `Context` (step 5), or into the new item's `Note:`
   (step 6).
4. **Choose the mode.** Recommend from the evidence: a wrong spec is
   `rewind` to `design`, a wrong plan is `rewind` to `plan`, a wrong
   implementation is `fix-in-place` at `execute`, an original in `## Done` or
   another session's item or new scope is `new item`, an original still open
   in Next or Later is `queue`, and not now is `park`. Ask one choice
   question `How should <ID title> be corrected?` with the recommended
   option first, the others after it, and `Explain <ID>`.
5. **`rewind` and `fix-in-place`.** These apply to the active item; for a
   `paused` item in Next, run `pm-next <ID>` first, which restores its
   paused checkpoint, then return here.
   - Run `pm-checkpoint` (`pause`). It writes and commits the checkpoint.
   - `rewind`: set `Stage` to the chosen earlier stage. Keep `Brief`,
     `Milestone`, `Spec`, `Plan`, and `Started`.
   - `fix-in-place`: keep `Stage`.
   - In both, replace `## Checkpoint` with a pause block whose `Stopped at`
     names the last step that still holds, whose `Next action` is the first
     step of the corrected work, whose `Start with` is that stage's skill,
     and whose `Context` reads `Revision <date>: <one line>` followed, when
     the item has no brief, by the `## Revisions` entries, then `The
     spec/plan at <path> is superseded.`
   - Commit `docs(pm): revise <ID> rewind to <stage>` or `docs(pm): revise
     <ID> in place`, then hand off to the stage skill from the Handoffs
     table, passing the revision and naming the superseded files.
6. **`new item`.** Create `R-NNN` with a new ID (Shared definitions),
   `Serves`, `Milestone` copied from the original where it has one, `Owner`,
   an observable `Done when` in the user's terms, `Size`, `Depends on: none`
   unless the user names one, `Status: ready`, `Revisits: <old ID>`, the
   original's `Brief` when it has one, and a `Note:` holding the `## Revisions`
   entries plus `Revision of <old ID> (<done date or last state>).` Place it
   at the top of `## Next` under the **Full Next** rule and name the item
   that moved to Later. Commit it (step 9) before asking `Start <new ID>
   now?` with `Start it now (recommended)` (run `pm-next <new ID>`) and
   `Leave it queued`.
7. **`queue`.** The original is still open: `move <ID> next top` under the
   Roadmap order and edits rules, set `Status: ready`, append the revision
   to its `Note:`, and name the item that moved to Later.
8. **`park`.** Run `pm-park` with `Discuss: yes`, `Kind: improvement` (or
   `bug` when the user is reporting a defect), and `Related: <ID>`.
9. **Commit** once, after the last PM file is written, unless step 5
   already committed: `docs(pm): revise <ID> <short reason>`.
10. **Hand back.** Invoke the stage skill from the Handoffs table in
    `config.md` and pass the revision. Never name a development skill that
    is not in that table.

## Output

```markdown
## Revision: <ID Title>

- Target: <active | paused | open | done | another session's>
- Wrong: <one line, in the user's words>
- Mode: <rewind to <stage> | fix-in-place at <stage> | new item R-NNN | queued at the top of Next | parked>
- Recorded: <brief path ## Revisions | item Note | inbox file>
- PM state: <commit result>

## Do this next

1. <one action>
   - Start with: <skill from the Handoffs table, or pm skill>
   - Done when: <observable check>

## Note

- <superseded files, the interrupted step, what moved to Later, assumptions>
```
