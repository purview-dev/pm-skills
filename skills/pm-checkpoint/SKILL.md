---
name: pm-checkpoint
description: Use when a session ends, the context is about to be compacted, a workflow stage finishes, the user says pause or stop, work on the active item is done, they want to switch items, or they need to suspend an operation and resume it later. Saves state, decisions, and open questions to NOW.md, stacks and restores suspended operations, closes finished items on their branch, and commits the PM state.
---

# pm-checkpoint

Save state so the next session, or this one after compaction, can continue
with no memory of the conversation. Writes only inside the PM root: the
main worktree, or the worktree that holds the item's branch in `done` mode
(rules: **Completion rides the branch**).

Follow the Non-interruption rules, Shared definitions, Feature branches,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent
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
  current session (Shared definitions), stop. Reply: `<ID> <title> belongs
  to <Session>. Not changed.`
- **`done`:** if the item's branch is already merged into the PM branch,
  stop. Reply `Branch <branch> is merged but <ID> <title> is still active.
  Run pm-rejoin.` Never close an item after its branch has merged. If a
  `## Done` line for `<ID>` already names this branch, reply `Completion for
  <ID> <title> is already written. Run the finish step.` Stop.
- **`pop`:** if `STACK.md` is missing or empty, reply `Nothing stacked.`
  Stop. If a workflow is active, reply `A workflow is active. Finish or
  pause it, then run pop.` Stop. If `NOW.md` is active, ask one choice
  question: `R-NNN <title> is active. How should <stacked ID> <title> be
  restored?`
  with the options `Push the active item, then pop (recommended)` (run
  `push`, then `pop`) and `Cancel pop`. If the current branch differs from
  the entry's `Branch`, ask one choice question: `<ID> <title> is stacked
  on <branch>. Move there to restore it?` with the options `Switch to
  <branch> and pull (recommended)` and `Cancel pop`. On switch, run
  `git switch <branch>`, then **Pull latest** (rules: Feature branches,
  rule 4); a blocked move or a failed pull stops with nothing written.
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
   state (step 9), then invoke the next handoff skill with that file path,
   not the conversation that produced it (rules: Context budget). When the
   next stage is `plan`, the handoff also passes the principles and ADRs
   (Shared definitions: **Every plan handoff**). In the
   output, show the commit as a Note, not under "Do this next".
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
   compaction. Write only what the next session needs, never a transcript
   (rules: Context budget). If the item has a brief, also append agreed scope changes
   to its `## Decision` with the date. List changed files outside the PM
   root as a Note, with one command that would commit them; do not run
   it. Step 9 commits the PM root.
5. **done:** check every line under `## Done when` against evidence (test
   output, file existence, command output). If any is unproven, stay in
   `pause` and list them. If the plan file has any `- [ ]` box, stay in
   `pause` and name the open steps.
   **The spec's ADRs** (Shared definitions: ADR): read every `ADR-NNN` ID
   in the file named by `Spec` in `NOW.md`. With no `Spec`, or no IDs in
   it, skip this check and write no ADR line. Look for each ID's
   `ADR-NNN-*.md` file in the decisions folder of the worktree that holds
   the item's branch, committed or not, and then, when the main worktree
   is another worktree, in its decisions folder, where `pm-adr` writes
   (ADR-010). When an ID is in neither, stay in `pause` and list `ADR-NNN
   named in <spec> has no file.` Otherwise:
   - **Principles check** (ADR-013): changed files are `git diff
     --name-only --diff-filter=d <PM base>...HEAD` in the worktree that
     holds the item's branch, excluding the PM root. Read `ENGINEERING.md`
     from the **PM base**. A missing file, or no principle whose `Applies
     to` is `all` or matches a changed file, is the Note `Principles: none
     apply.` Otherwise, for each matching principle with a
     `Check: <command>`, the command runs in the item's worktree, in the
     shell the session uses; a non-zero exit, or a command that cannot run
     (not found; in PowerShell `$?` is false while `$LASTEXITCODE` may stay
     0), keeps `done` in `pause` with nothing written, listing
     `EP-NNN <title>: <command> failed (exit <n>).`, or
     `failed (not run: <error>).` for a command that cannot run, with the
     last 20 lines of output — run every matching command check before
     stopping, so every failure is listed at once. The `Check: review`
     principles wait for **Principles review**, which runs only when every
     command check has passed and **Check before writing** has passed.
   - **Check before writing** (ADR-010). A capture is an uncommitted inbox
     file, decisions-folder file, or `RISKS.md`, written mid-workflow by
     `pm-park`, `pm-bug`, `pm-risk`, or `pm-adr`. Captures never stop the
     close. Stop, with nothing written, only when the PM branch and its
     remote have diverged, or when either worktree has another uncommitted
     PM path (`NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`,
     `ENGINEERING.md`, a brief): the record must start from committed
     state. Captures in the item's worktree are swept into this commit.
     Captures in the main worktree, when it is another worktree, stay
     there: add the Note `<n> captures
     uncommitted on <main worktree's branch>: <paths>. The next PM commit
     there carries them.`
   - **Principles review** (ADR-013): for each matching principle with
     `Check: review`, read the diff of the matching files against `Rule`;
     each break found is the Note `EP-NNN <title>: <file> <finding>` and
     one inbox file by `pm-park` (`agent` mode, `Kind: tech-debt`,
     `Affects: <ID>`, `Source: agent (<ID> done)`). Its inbox file is a
     capture (ADR-010), swept into this commit or named in the captures
     Note as **Check before writing** says. A review finding never blocks.
     Record the principles result as one Note:
     `Principles: <n> command checks passed, <m> review findings.`
   - **Choose the commit worktree** (rules: **Completion rides the branch**).
     Fetch first: the record starts from the **PM base**. When the item's
     branch is the PM branch, run **Pull latest** and write it in place.
     Otherwise read `LOG.md`, `NOW.md`, `ROADMAP.md`, `STRATEGY.md`,
     `ENGINEERING.md`, and the brief from the **PM base** (`git show <PM
     base>:<PM root>/<file>`), apply the record to those contents, and
     write and commit them in the worktree that holds the item's branch.
   - Append to `## Done` in `LOG.md`:
     `- <date> <ID> <Title>. Milestone: <the Milestone in NOW.md, or none>.
     Owner: <owner>. Plan: <path | none>. Result: branch <branch>.`
     `<owner>` is the `Owner` in `NOW.md`, or `agent` when it is missing.
     The branch is the durable locator: the finish step opens the pull
     request from it, so no PR number is written here.
   - If the item has a brief, set its `Status: done`.
   - **Accept the item's ADRs:** for each ADR with `Status: proposed` and
     `Item: <this ID>` that the spec names, or whose `Supersedes` names an
     ADR the spec names (a `pm-revise` replacement), apply `pm-adr accept`: its
     write steps only, changing only the `Status` line (no `pm-adr` output
     or commit), looking in both folders as above. An ADR in the worktree
     that holds the item's branch is accepted there, with the Note
     `Accepted ADR-NNN <title>.` An ADR found only in the main worktree,
     when that is another worktree, is accepted there, in place, and only
     after step 9's commit succeeds, so a failed close leaves it
     `proposed`; add the Note `Accepted ADR-NNN <title> in the main
     worktree; the next PM commit on <main worktree's branch> carries it.`
     The decisions folder is never read from the **PM base**. Leave every other ADR as it is, including a proposed ADR
     of another item that the spec only cites.
   - **Record the Purview package** (ADR-014): when the `Note` in `NOW.md`
     holds `Purview package: <PackageId>`, search the item branch's
     manifests (`*.csproj`, `Directory.Packages.props`,
     `Directory.Build.props`, `global.json` for an SDK) for it. Not found:
     write nothing to `ENGINEERING.md` and add the Note `Purview package
     <PackageId> is not in a manifest; not recorded.` Found: apply
     `pm-engineering` `add technology` write steps only (no question,
     output, or commit): `Kind: library` (`tool` for an SDK found in
     `global.json`), `Version` from the `PackageReference` or the central
     `PackageVersion` in `Directory.Packages.props`, `Reason` the first
     sentence of `## Decision` in the ADR whose `Item` is this ID and that
     names the package (accepted or still proposed), else `Adopted through
     <ID> <title> (pm-purview).`, `Decision` that ADR, or `none` when there
     is none, `Source` the path of the manifest that holds the
     `PackageReference` (or `global.json` for an SDK), even when the
     version comes from `Directory.Packages.props`, `Added` today. An existing
     `### <Name>` entry of that name gets only its `Version` changed. Add
     the Note `Recorded <PackageId> <version> in ENGINEERING.md.`
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
   - Stay on this branch while its pull request is pending; do not switch
     to the PM branch (rules: Feature branches, rule 5). Add the Note
     `Stay on <branch> until its pull request merges; pm-next starts the
     next item from the PM base.`
   - End this item's context here. Add a second numbered action under
     "Do this next": `Start a new session (/new or /clear) before pm-next
     for another item.` The completion record and its handoff are all the
     next session reads (rules: Context budget).
6. **switch:** write a checkpoint first, as in `pause`. When the user names
   the item to switch to, show `R-NNN <title>`. Copy the active
   item to the top of `## Next` in `ROADMAP.md` with `Status: paused` and
   `Paused checkpoint:` set to that checkpoint, keeping its `Brief`,
   `Milestone`, `Serves`, `Owner`, `Size`, `Depends on`, `Revisits`, and
   `Note` from `NOW.md` (omit an optional field `NOW.md` does not have), and
   `Done when` built by joining the `## Done when` bullets with a semicolon
   and a space. A roadmap item requires `Serves` and `Size`
   (`roadmap/item`): when `NOW.md` lacks them (an item claimed before rules
   20), recover the item fields as `pm-setup` Step 5, item 5 does — the
   item's block in `git show <claim commit>^:<PM root>/ROADMAP.md`, with
   `Owner` `agent` and `Depends on` `none` when the block lacks them — and
   ask one choice question per required value still missing (`Serves`: the
   `V` lines in `VISION.md`; `Size`: `S`, `M`, `L`). If Next
   is at its max from `config.md`, apply the **Full Next** rule (Roadmap
   order and edits) and name the item moved to Later. Then set `NOW.md` to
   idle as in `done`.
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
   - Serves: <Serves in NOW.md>
   - Owner: <Owner in NOW.md>
   - Size: <Size in NOW.md>
   - Depends on: <Depends on in NOW.md>
   - Revisits: <Revisits in NOW.md>
   - Note: <Note in NOW.md; omit the line when NOW.md has none>
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

   Copy Serves, Owner, Size, Depends on, and Revisits as a group: when
   `NOW.md` carries them (every active item does, from `pm-next` step 7),
   copy all five verbatim, `none` and blank included — `Depends on: none`
   and a blank `Revisits` are valid values, not an absent field. When
   `NOW.md` is in the rules-19 shape (none of the five present), omit all
   five from the entry instead of writing fabricated values. They travel as
   a group so `pop` writes back a `NOW.md` that `now/fields` (`pm-lint`)
   accepts, which a partial set is not. Copy `Note` verbatim after
   `Revisits` when `NOW.md` has it, and omit it otherwise.

   Use the existing checkpoint, or write one as in `pause` when `NOW.md`
   has none. Then set `NOW.md` to idle as in `done`. The item, its stage,
   and its checkpoint are now on the stack and nowhere else. Step 9
   commits, then reply in one line and resume the interrupted step. Never
   switch or create a branch for the interruption: it runs on the branch
   that is checked out (rules: Feature branches, rule 3).
8. **pop:** read the top entry of `STACK.md` (Guard checks the stack,
   branch, and active item). Write its fields back into `NOW.md`:
   `Status: active`, `Item`, `Session` (the entry's `Branch`), `Stage`,
   `Brief`, `Milestone`, `Spec`, `Plan`, `Started`, its `Done when` under
   `## Done when`, and its checkpoint under `## Checkpoint`. Write
   `Serves`, `Owner`, `Size`, `Depends on`, and `Revisits` as a group: when
   the entry carries them, write all five verbatim, `none` and blank
   included; when it carries none of them (a rules-19 entry), omit all
   five instead of writing fabricated values — never a partial set, which
   `now/fields` (`pm-lint`) rejects. Write `Note` after `Revisits` when the
   entry has it. These fields land after `Milestone` and before `Spec`,
   matching `pm-next` step 7. Remove the
   entry from `STACK.md`, leaving the next entry as the top. Step 9
   commits; show one line (`pop <ID> <title>: <stage> at its checkpoint`),
   then invoke the skill for `Stage` from
   the Handoffs table in `config.md`, passing the checkpoint's
   `Next action`; when the stack still has entries, name the next one as a
   Note. When the restored `Stage` is `design`, the handoff also passes the
   ADR instruction (Shared definitions: **Every design handoff**); when it
   is `plan`, the handoff also passes the principles and ADRs (Shared
   definitions: **Every plan handoff**).
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
2. <In done only: start a new session (/new or /clear) before pm-next for another item.>

## Note

- <commit result, changed files outside the PM root, assumptions, newly claimable items, the next stacked item, the principles check result>
```

Omit item 2 in every mode except `done`.
