---
name: pm-next
description: Use only when the user asks to start or claim a roadmap item, names an item to start, or no item is active and they want to start one. Checks the first claimable roadmap item is still the right one, pulls the latest PM branch, moves to the item's feature branch, claims it there, writes NOW.md, and hands off to the design skill with its brief.
---

# pm-next

Claim the next roadmap item on its own feature branch and start its
design. Writes only `NOW.md` and `ROADMAP.md`.

Follow the Non-interruption rules, Shared definitions, Feature branches,
Challenge protocol, Persistence, Asking the user, and Communication
contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Guard

- Before step 1, run the upgrade check (rules: Upgrading before work
  resumes). Do not claim an item while the rules are older than the skills,
  unless the user accepts `Continue on v<old>` and the `Upgrade debt` Note
  is written.
- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `NOW.md` lacks the schema fields (see pm-resume), say it is malformed
  and stop.
- If `<PM root>/STACK.md` has an entry, continue: add the Note `Stacked:
  <ID> (<stage>). It resumes with pm-checkpoint pop.` so the suspended
  work is not forgotten.
- If the current branch has an unmerged completion (a `## Done` line in
  `LOG.md` whose `Result: branch <branch>` matches the current branch, and
  the branch is not merged) and the finish step has not pushed it (no
  upstream, or `git rev-list --count @{upstream}..HEAD` is not 0), stop.
  Reply `Branch <branch> has an unmerged completion for <ID> <title>. Run
  the finish step, then pm-next.` A completion rides its branch, and a new
  item waits until it has. When it is pushed, it is a **Pending pull
  request**: continue from this branch, without switching to the PM branch
  (rules: Feature branches, rule 5).
- If a workflow is active, apply Non-interruption rule 4 and stop.
- If `Status: active`, stop. Ask: `<ID> <title> is active. What should
  happen to it?` with the options `Resume <ID> <title> (recommended)` (run
  `pm-resume`) and `Pause <ID> <title> and switch` (run `pm-checkpoint`
  switch, then this skill).
- If the user named an ID, it must be in `## Next` or `## Later` and be
  claimable apart from its position; otherwise say which condition fails
  (owner, status, or which `Depends on` ID is not done) and stop. A named
  item in Later moves to the top of Next first (Roadmap order and edits).
- If Next has no claimable item: `Nothing in Next is claimable.` List the
  reasons per item (owner `user`, blocked, dependency not done), then
  recommend `pm-review`, or the user task that unblocks the most items.
  Stop.

## Steps

Steps 1 to 5 read and ask only. Their writes (split items, `Note:` lines,
brief answers) are applied in step 8, on the **Item branch**, so nothing is
written to the branch the session is leaving.

1. **Pull latest.** Fetch and find the **PM base** (Shared definitions).
   Read `ROADMAP.md`, `LOG.md`, and `STRATEGY.md` from it
   (`git show <PM base>:<PM root>/<file>`), not from the current checkout,
   which may be a **Pending pull request**. Skip every item **Claimed on a
   branch** and name it in a Note: `<ID> <title> is on <branch>.`
2. Take the named item, or the first claimable item in `## Next`. Show its
   legend line, `R-NNN <title> (owner, size, status)`. List any
   `Owner: user` items above it under "For you".
3. **Check it is still the right item** (Challenge protocol, scaled). Ask
   only if a check fails:
   - It serves the `Current focus` milestone in `STRATEGY.md`, if one is
     set.
   - Its `Done when` is observable.
   - Its size is `S` or `M`.
   - An item of size `M`, or one with an unclear problem, has a `Brief`.
   - Nothing in `LOG.md` or the inbox since it was added contradicts it.

   On a failure, state the claim with evidence and ask one choice
   question: `<ID> <title> <failed check>. How should we start?` with the
   recommended fix first:
   `Shape it first` (run `pm-shape` on it), `Split it` (step 4), or
   `Pick <other ID>` (label each candidate `R-NNN <title>`); then
   `Start it as is`, plus `Explain <ID>`. Record a `Start it as is`
   answer as a `Note:` on the item with the reason.
4. **Split.** If its `Size` is `L`, or the user chose to split it, propose
   items of size S or M, each with its own `Done when` and new IDs from the
   ID rule. Ask one choice question: `Accept this split?` with the options
   `Accept (recommended)` and `Change the split`. Insert the parts at the
   top of Next in dependency order. If Next would then exceed the max in
   `config.md`, apply the **Full Next** rule (Roadmap order and edits) and
   say which item moved to Later. Then claim the first part.
5. **Ambiguity.** If the item is still ambiguous, state the assumption
   first, then ask a choice question: `<ID>: is this assumption right?
   <assumption>` with the options `Yes, that's right (recommended)` and
   `No, it's different`. Write the answer to the item's brief, if any, or
   as a `Note:`.
6. **Move to the Item branch** (rules: Feature branches). Name it from the
   `Branch name pattern` in `config.md` for the claimed ID and title.
   - When the user asked to stay on the current branch, stay, run **Pull
     latest** on it, and add the Note `Stayed on <branch> at the user's
     request.` When that branch is the PM branch, the claim and the item's
     work land on it directly.
   - When the current branch is already the **Item branch**, run **Pull
     latest** on it.
   - When the **Item branch** exists, locally or on the remote, run
     `git switch <Item branch>`, then **Pull latest**.
   - Otherwise run `git switch -c <Item branch> <PM base>`.

   A path outside the PM root with uncommitted changes blocks the move:
   ask the Feature branches rule 4 question, and on `Stop so I can commit
   them` stop with nothing written. A failed pull stops the same way.
7. Write `NOW.md` with the schema fields: `Status: active`, `Item`,
   `Session` (current branch), `Stage: design`, `Brief` (from the item, or
   empty), `Milestone` (from the item, or empty), `Started` (today), empty
   `Spec` and `Plan`, and the item's `Done when` under `## Done when`. Leave
   `## Checkpoint` empty.
8. Remove the item from `## Next` in `ROADMAP.md`, and apply the writes
   held from steps 3 to 5. If it has a brief, set the brief's
   `Status: on roadmap (<ID>), active`.
9. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): claim <ID> <slug>`, on the **Item branch**. The claim must
   survive compaction, so commit before the handoff.
10. Invoke the `design` handoff skill from the Handoffs table in
    `config.md`, passing the item title, `Serves`, `Done when`, and the
    brief path. Tell it the brief already records the problem, the
    alternatives, the challenges, and the ramifications, so it does not
    ask those again. Tell it the work happens on `<Item branch>`, which is
    checked out, so it does not create another branch. Start that stage
    from the item, its brief, and this output only; never carry an earlier
    item's conversation into it (rules: Context budget).

If the item has a `Paused checkpoint`, copy it under `## Checkpoint` and set
`Stage` to the stage recorded there. Then invoke that stage's skill instead
of design.

## Output

```markdown
## Started

- Item: <ID Title>
- Branch: <Item branch> (from <PM base>)
- Brief: <path | none>
- Done when: <check>

## For you

- <user-owned item above it in Next: ID Title, Done when>

## Do this next

1. Answer the design questions from <skill>.
   - Start with: <skill name>
   - Done when: a spec exists at the path in config.md

## Note

- <commit result, items on other branches, stayed on a branch, assumptions>
```
