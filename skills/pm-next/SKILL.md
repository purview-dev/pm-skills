---
name: pm-next
description: Use only when the user asks what to build next, names a roadmap item to start, or no item is active and they want to start one. Checks the first claimable roadmap item is still the right one, claims it, writes NOW.md, and hands off to the design skill with its brief.
---

# pm-next

Claim the next roadmap item and start its design. Writes only `NOW.md` and
`ROADMAP.md`.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `NOW.md` lacks the schema fields (see pm-resume), say it is malformed
  and stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- If `Status: active`, stop. Ask: `<ID> is active. What should happen to
  it?` with the options `Resume <ID> (recommended)` (run `pm-resume`) and
  `Pause <ID> and switch` (run `pm-checkpoint` switch, then this skill).
- If the user named an ID, it must be in `## Next` or `## Later` and be
  claimable apart from its position; otherwise say which condition fails
  (owner, status, or which `Depends on` ID is not done) and stop. A named
  item in Later moves to the top of Next first.
- If Next has no claimable item: `Nothing in Next is claimable.` List the
  reasons per item (owner `user`, blocked, dependency not done), then
  recommend `pm-review`, or the user task that unblocks the most items.
  Stop.

## Steps

1. Take the named item, or the first claimable item in `## Next`. Show it.
   List any `Owner: user` items above it under "For you".
2. **Check it is still the right item** (Challenge protocol, scaled). Ask
   only if a check fails:
   - It serves the `Current focus` milestone in `STRATEGY.md`, if one is
     set.
   - Its `Done when` is observable.
   - Its size is `S` or `M`.
   - An item of size `M`, or one with an unclear problem, has a `Brief`.
   - Nothing in `LOG.md` or the inbox since it was added contradicts it.

   On a failure, state the claim with evidence and ask one choice
   question: `<ID> <failed check>. How should we start?` with the
   recommended fix first:
   `Shape it first` (run `pm-shape` on it), `Split it` (step 3), or
   `Pick <other ID>`; then `Start <ID> as is`. Record a `Start <ID> as is`
   answer as a `Note:` on the item with the reason.
3. **Split.** If its `Size` is `L`, or the user chose to split it, propose
   items of size S or M, each with its own `Done when` and new IDs from the
   ID rule. Ask one choice question: `Accept this split?` with the options
   `Accept (recommended)` and `Change the split`. Insert the parts at the
   top of Next in dependency order. If Next would then exceed the max in
   `config.md`, move the lowest items to the top of Later and say which.
   Then claim the first part.
4. **Ambiguity.** If the item is still ambiguous, state the assumption
   first, then ask a choice question: `<ID>: is this assumption right?
   <assumption>` with the options `Yes, that's right (recommended)` and
   `No, it's different`. Write the answer to the item's brief, if any, or
   as a `Note:`.
5. Write `NOW.md` with the schema fields: `Status: active`, `Item`,
   `Session` (current branch), `Stage: design`, `Brief` (from the item, or
   empty), `Started` (today), empty `Spec` and `Plan`, and the item's
   `Done when` under `## Done when`. Leave `## Checkpoint` empty.
6. Remove the item from `## Next` in `ROADMAP.md`. If it has a brief, set
   the brief's `Status: on roadmap (<ID>), active`.
7. Invoke the `design` handoff skill from the Handoffs table in
   `config.md`, passing the item title, `Serves`, `Done when`, and the
   brief path. Tell it the brief already records the problem, the
   alternatives, the challenges, and the ramifications, so it does not ask
   those again.

If the item has a `Paused checkpoint`, copy it under `## Checkpoint` and set
`Stage` to the stage recorded there. Then invoke that stage's skill instead
of design.

If the current branch does not match the branch name pattern in
`config.md`, add a Note with the expected name. Do not create or switch
branches.

## Output

```markdown
## Started

- Item: <ID Title>
- Brief: <path | none>
- Done when: <check>

## For you

- <user-owned item above it in Next: ID Title, Done when>

## Do this next

1. Answer the design questions from <skill>.
   - Start with: <skill name>
   - Done when: a spec exists at the path in config.md

## Note

- <branch name, assumptions>
```
