---
name: pm-next
description: Use only when pm/NOW.md is idle and the user asks what to work on next, or immediately after pm-checkpoint closes or pauses an item.
---

# pm-next

Pick one roadmap item, claim it in `pm/NOW.md`, and hand off to the design
skill.

Follow the Non-interruption rules and Communication contract in `AGENTS.md`.

## Guard

- If `pm/NOW.md` is `Status: active`, do not pick anything. Run
  `pm-resume` instead. To switch items, the user must say "switch". Then
  run `pm-checkpoint` in pause mode first.
- If a workflow is active, apply Non-interruption rule 4.

## Steps

1. Read `pm/VISION.md`, `pm/ROADMAP.md`, and `pm/config.md`.
2. Take the first item in `## Next` with `Status: ready` or
   `Status: paused`. Skip `blocked` items and name them in Notes.
3. If Next has no usable item, reply `Next is empty. Run pm-review.` and
   stop.
4. Check the item before claiming it:
   - **Scope.** Its `Serves:` line must match a v1 outcome in
     `pm/VISION.md`. If it does not, say `SCOPE CHANGE:` with the reason,
     and ask whether to start it anyway or skip it.
   - **Size.** If `Size: L`, or the item covers more than one independent
     subsystem, propose a split into 2 or 3 items. Each split item gets its
     own ID and `Done when:`. Ask for one confirmation, write the split to
     `pm/ROADMAP.md`, and take the first part.
   - **Done when.** If it cannot be checked, propose a checkable version
     and ask yes or no.
5. Claim the item. Write `pm/NOW.md` with `Status: active`, `Item`,
   `Session` (the branch name from the pattern in `pm/config.md`),
   `Stage: design`, `Started`, and `## Done when`. If the item was paused,
   copy its paused checkpoint into NOW.md and set `Stage` to the stage it
   was paused at.
6. Remove the item from `## Next` in `pm/ROADMAP.md`.
7. Print the output, then invoke the handoff skill for the current stage
   from `pm/config.md`. For a new item, that is the design skill. Pass:
   - the item title and `Done when`,
   - the v1 outcome it serves,
   - the relevant `Out of scope` and `Constraints` lines from the vision.

   If the handoff skill is not installed, stop and name the Handoffs row
   to fix. Do not do that stage without the skill.

## Output

```markdown
## Starting

- Item: <ID> <title>
- Why now: <one line, citing V1, V2, and so on>
- Done when: <observable check>

## Handing off

- Next: <handoff skill> (stage: <stage>)
- Branch, when created: `<branch>`

## Notes

- <Only if true: Skipped <ID> because it is blocked (<reason>).>
```
