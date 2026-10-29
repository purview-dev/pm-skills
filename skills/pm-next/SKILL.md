---
name: pm-next
description: Use only when the user asks what to build next, or no item is active and they want to start one. Claims the top ready roadmap item, writes NOW.md, and hands off to the design skill.
---

# pm-next

Claim the next roadmap item and start its design. Writes only `NOW.md` and
`ROADMAP.md`.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Guard

- If `<PM root>/config.md` or `NOW.md` is missing: `No <PM root> state. Run
  pm-init.` Stop.
- If `NOW.md` lacks the schema fields (see pm-resume), say it is malformed
  and stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- If `Status: active`, stop. Reply: `<ID> is active. Run pm-checkpoint
  (switch) first, or pm-resume.`
- If Next has no `Status: ready` item: `Next is empty. Run pm-review.` Stop.

## Steps

1. Take the first `Status: ready` item in `## Next`. Show it.
2. If its `Size` is `L`, or its `Done when` is not observable, propose a
   split into items of size S or M, with new IDs from the ID rule. Ask for
   one confirmation (`ok` or changes). Insert the parts at the top of Next
   in dependency order. If Next would then exceed the max in `config.md`,
   move the lowest items to the top of Later and say which. Then claim the
   first part.
3. Ask one question only if the item is ambiguous: `Assumption: <x>. Is
   this right? (yes / change)`
4. Write `NOW.md` with the schema fields: `Status: active`, `Item`,
   `Session` (current branch), `Stage: design`, `Started` (today),
   empty `Spec` and `Plan`, and the item's `Done when` under `## Done
   when`. Leave `## Checkpoint` empty.
5. Remove the item from `## Next` in `ROADMAP.md`.
6. Invoke the `design` handoff skill from the Handoffs table in
   `config.md`, passing the item title, `Serves`, and `Done when`.

If the item has a `Paused checkpoint`, copy it under `## Checkpoint` and set
`Stage` to the stage recorded there. Then invoke that stage's skill instead
of design.

## Output

```markdown
## Started

- Item: <ID Title>
- Done when: <check>

## Do this next

1. Answer the design questions from <skill>.
   - Start with: <skill name>
   - Done when: a spec exists at the path in config.md
```
