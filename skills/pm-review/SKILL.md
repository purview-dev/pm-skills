---
name: pm-review
description: Use only when the user asks for a review, says they feel lost, off track, or overwhelmed by the backlog, or after pm-resume reports that a review is due.
---

# pm-review

Weekly triage: empty the inbox, check the roadmap against the vision, and
end with one clear next item. Takes 10 to 15 minutes.

Follow the Non-interruption rules and Communication contract in `AGENTS.md`.

## Guard

- If a workflow is active, apply Non-interruption rule 4.
- Never change the item in `pm/NOW.md` or its spec or plan. Review edits
  only `pm/ROADMAP.md`, `pm/inbox/`, `pm/LOG.md`, `pm/config.md`, and,
  with explicit approval, `pm/VISION.md`.

## Steps

Run the steps in order. Show the step number as `Step <n> of 5`.

1. **Inbox triage.** Show inbox items in batches of 5 as a table:

   | File | Title | Proposed | Reason |
   | --- | --- | --- | --- |
   | ... | ... | Next, Later, Drop, or Merge into R-NNN | One line |

   Use "Drop" for items that match `Out of scope`, and say so in the
   Reason column. The user replies "ok" or changes specific rows. Then
   apply the batch:
   - Next or Later: create an item with a new ID, then delete the inbox
     file.
   - Merge: add the raw text under the target item as `- Note:`, then
     delete the file.
   - Drop: add a line to `## Dropped` in `pm/LOG.md`, then delete the file.
2. **Scope check.** For each item in `## Next`, confirm that its `Serves:`
   line matches a v1 outcome. List mismatches. For each mismatch, propose
   one action: move to Later, or change the vision. Vision changes need an
   explicit "yes".
3. **Order Next.** Propose an order of at most 5 items, with one reason per
   item (dependency, risk, or value). Move any extra items to Later. One
   confirmation applies the order.
4. **Facts since last review.** Report numbers only:
   - Items closed (from `pm/LOG.md`).
   - Items started that were not in Next at the last review.
   - Ideas parked.
   - Days the current item has been active.

   If the current item has been active for more than 14 days, propose one
   option: split it, or pause it.
5. **Record.** Add a line to `## Reviews` in `pm/LOG.md`. Set `Last review`
   in `pm/config.md` to today.

## Output (final)

```markdown
## Review done

- Inbox: <n> to 0 (<n> added, <n> merged, <n> dropped)
- Next: <IDs in order>
- Scope changes: <none, or list>

## Do this next

1. <pm-resume if an item is active, otherwise pm-next>
   - Start with: `<skill name>`
   - Done when: <item> is claimed or resumed
```
