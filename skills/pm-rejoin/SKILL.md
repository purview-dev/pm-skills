---
name: pm-rejoin
description: Use when the pm-* lifecycle has been lost or left behind - the agent is running a development workflow that NOW.md does not record, NOW.md says idle while work is in progress, the active item belongs to another branch or session, an item's branch is merged but it is still active, a session started mid-task without pm-resume, or the user asks where they are in the pm lifecycle and how to get back on track. Locates the true position from git and PM state, reports it, and with the user's consent repairs NOW.md so the right stage skill takes over.
---

# pm-rejoin

Put a session back inside the lifecycle. Read the evidence, say where the
work actually is, and rejoin at that stage. `locate` writes nothing;
`repair` writes `NOW.md`, the roadmap item it claims, and one PM commit.

Follow the Non-interruption rules, Shared definitions, Persistence, Asking
the user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `locate` | Default. The thread was lost, a session started mid-task, the agent is mid-workflow with no PM state, or `pm-resume` reported drift | Report the position, the drift, and the stage skill |
| `repair` | The user chose rejoin | Rewrite `NOW.md`, claim the item, commit, hand off to the stage skill |

The skill never guesses between two positions: when the evidence is
ambiguous, ask which one is true.

## Guard

- First, in both modes, run the upgrade check (rules: Upgrading before work
  resumes), then continue.
- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `NOW.md` lacks the fields `pm-resume` requires, reply `NOW.md is
  malformed: missing <field>.` Stop. A broken file is repaired by hand or
  with git, not by inference.
- If a workflow is active, `locate` may still run, read-only, then the step
  in progress resumes (Non-interruption rule 3). `repair` follows
  Non-interruption rule 4.
- If another session owns the item and this branch is not its branch,
  report read-only and stop. Never rewrite another session's `NOW.md`.

## Steps (locate)

1. Collect the evidence. Read `NOW.md`, `config.md` (Handoffs, `Branch name
   pattern`, `PM branch`, `PM state commit`), `ROADMAP.md`, and `STACK.md`
   (when it exists), then:
   - `git branch --show-current` (blank output means detached HEAD), `git
     worktree list`, and **Uncommitted PM state** (Shared definitions).
   - For the `Spec` and `Plan` paths in `NOW.md`: whether each exists, and
     the `- [ ]` and `- [x]` counts of the plan.
   - For an ID in the current branch name: its line in `ROADMAP.md` (Next
     or Later) and any brief matching `<PM root>/briefs/<ID>-*.md`.
   - Whether the session branch is merged: the default branch from
     `git symbolic-ref --short refs/remotes/origin/HEAD` (fall back to
     `main`, then `master`), then `git branch --merged <default>`.
   - Recent work that `NOW.md` does not mention: `git status --porcelain`
     plus `git log --since=24.hours --name-only --format=`, checked against
     the output locations in the Handoffs table.
2. Match the evidence to exactly one position:

   | Evidence | Position |
   | --- | --- |
   | `Status: active`, and the `Session` branch is merged into the PM branch | `merged-unclosed`: the completion record did not ride the branch |
   | `Status: active`, `Session` equals the current branch | `recorded`: the item at its `Stage` |
   | `Status: active`, `Session` differs, and the current branch is the item's branch under `Branch name pattern` | `moved`: the branch was renamed or re-created |
   | `Status: active`, `Session` differs, no matching branch | `another session's`: read-only |
   | `Status: idle`, branch matches `Branch name pattern`, the ID is in `## Done` with this branch | `completed`: the record is written and the branch is not merged; only the finish step remains |
   | `Status: idle`, the current branch matches a stack entry's `Branch` | `stacked`: the operation is suspended; pop it |
   | `Status: idle`, branch matches `Branch name pattern`, the ID is in `ROADMAP.md` | `unclaimed`: the work exists and was never written to `NOW.md` |
   | `Status: idle`, branch matches `Branch name pattern`, the ID is not in `ROADMAP.md` | `unplanned`: work outside the roadmap |
   | `Status: idle`, no branch match, and a plan, spec, or recent change exists | `unrecorded`: a workflow is running with no PM state |

3. Derive the stage from the evidence, in this order: a plan with every
   box checked is `finish`; a plan with any box unchecked is `execute`; a
   spec with no plan is `plan`; no spec is `design`. A `merged-unclosed`
   item is at `finish`, a `completed` item is at `finish` with its record
   already written, and a `stacked` item is at the stage in its stack
   entry. State the rule you used when the stage comes from anything other
   than `NOW.md`.
4. Show the `## Where you are` template below. Write nothing.
5. Show the item's legend line, `R-NNN <title>` (Shared definitions:
   Reference legend). Ask one choice question with the options for that
   position:
   - `moved`, `unclaimed`, `unplanned`, `unrecorded`: `Rejoin <ID> <title>`
     `at <stage>?` with `Rejoin at <stage> (recommended)` (run `repair`),
     `Pick a roadmap item first` (run `pm-next`), and `Explain <ID>`.
   - `merged-unclosed`: `Close <ID> <title>?` with `Close it on the PM branch
     (recommended)` (run `repair`), `Leave it active`, and `Explain <ID>`.
   - `completed`: `Finish <ID> <title>?` with `Run the finish skill
     (recommended)` (invoke the finish skill, no repair) and `Explain <ID>`.
   - `stacked`: `Resume <ID> <title>?` with `Pop it (recommended)` (run
     `pm-checkpoint` pop) and `Explain <ID>`.
   - `recorded`: `Continue <ID> <title> at <stage>?` with
     `Continue (recommended)` (invoke the stage skill, no repair) and
     `Run pm-resume`.
   - `another session's`: `Wait for <Session>?` with `Read only: show the
     board (recommended)` (run `pm-board`) and `Wait`.
6. On `Pick a roadmap item first`, run `pm-next`. On `Continue` or `Run the
   finish skill`, invoke the stage skill from the Handoffs table. On `Pop
   it`, run `pm-checkpoint` (`pop`). Otherwise run `repair`.

## Steps (repair)

1. **Item.** Use the ID and title from `NOW.md`, else from the branch name,
   else the one the user picked. Skip the `ROADMAP.md` check for
   `merged-unclosed`: the item is active, not listed. Otherwise, if the ID
   is missing from `ROADMAP.md`, say so, then ask: `Add "<title>" as an
   item?` with the options `Add it to Next (recommended)` (run `pm-item
   add`) and `Pick an existing item`.
2. **`merged-unclosed`.** Write the Completion record, not a claim:
   - Append to `## Done` in `LOG.md`:
     `- <date> <ID> <Title>. Milestone: <M | none>. Owner: <owner>. Plan:
     <path | none>. Result: branch <branch> (merged).`
   - If the item has a brief, set its `Status: done`.
   - When this was the last open item of its milestone, apply the milestone
     prompt from `pm-checkpoint` (`done`) and record it in the same commit.
   - Set `NOW.md` to idle.
   - Commit `docs(pm): close <ID> late` (rules: Committing PM state); switch
     to the PM branch when the commit offers it. The next branch carries the
     commit when the PM branch is protected, and it never gets a pull
     request of its own.
   - Show the output with the `Note` `Completion for <ID> was late; no
     stage to hand off.` and stop.
3. **Write `NOW.md`.** Set `Status: active`, `Item` (`<ID Title>`),
   `Session` (the current branch; if HEAD is detached, say so and stop),
   `Stage` (from the evidence), `Brief`, `Milestone` (from the item, or
   empty), `Spec`, and `Plan` (only paths that exist), `Started` (today, or
   the value `NOW.md` already records for this item), and the item's `Done
   when` under `## Done when`.
4. **Write `## Checkpoint`** in the `pause` format from `pm-checkpoint`:
   `Stopped at` (the last checked plan step, or `nothing built yet`),
   `Next action` (the first unchecked plan step, or the stage skill's first
   step), `Start with` (the exact file, command, or skill name), and
   `Decisions: none` unless the user stated one.
5. **Roadmap.** Remove the item from `## Next` in `ROADMAP.md`. If it has a
   brief, set the brief's `Status` to `on roadmap (<ID>), active`.
6. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): rejoin <ID> at <stage>`.
7. **Hand off.** Invoke the skill for `Stage` from the Handoffs table in
   `config.md`, passing the item title, `Serves`, `Done when`, the brief
   path, and the checkpoint's `Next action`. If that stage has no skill in
   the table, say so and ask the user to edit `config.md`; never name a
   development skill that is not in that table.

## Output

```markdown
## Where you are

- Item: <ID Title | none>
- Position: <merged-unclosed | completed | stacked | recorded | moved | another session's | unclaimed | unplanned | unrecorded>
- Stage: <design | plan | execute | finish | none>
- Progress: <done>/<total> plan steps | no plan yet
- Stack: <n suspended | none>
- Branch: <branch | detached HEAD>
- Worktree: <current worktree>; PM state in <main worktree>
- PM state: <n> uncommitted files | unchanged

## Drift

- <what disagrees, with the file or command it came from>

## Do this next

1. <Rejoin <ID> <title> at <stage> | Continue at <stage> | Show the board | Pick a roadmap item>
   - Start with: <skill from the Handoffs table, or pm skill>
   - Done when: <observable check>
```

Show `Drift` only when the position is not `recorded`. Then ask the
question from step 5.
