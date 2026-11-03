---
name: pm-review
description: Use when the user asks for a weekly review or triage, or pm-resume reports review is due. Triages the inbox one idea at a time, challenges roadmap health against the vision and strategy, and reorders Next.
---

# pm-review

Triage the inbox and re-order the roadmap against `VISION.md` and
`STRATEGY.md`. Larger changes to focus or milestones go to `pm-strategy`;
ideas that need discussion go to `pm-shape`.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- Do not change the active item in `NOW.md`.

## Steps

1. Read `VISION.md`, `STRATEGY.md`, `ROADMAP.md`, `NOW.md`, `LOG.md`, and
   `config.md`.
2. State these facts (all computable):
   - Days since last review, and days the active item has been active
     (from `Started`).
   - Items closed since the last review (`LOG.md` Done lines dated after
     it), split by owner.
   - Open inbox count, `Discuss: yes` count, Next count against the max,
     Later count.
   - Focus milestone progress: done and open items.
3. **Triage the open inbox one file at a time**, oldest first. Skip files
   whose `Reviewed` date is after the last review unless they have
   `Discuss: yes`. For each, show its title, kind, source, and idea, apply
   the Challenge protocol checks 1, 2, and 5, state the result in one line,
   and ask one choice question: `What should happen to "<title>"?` with
   the proposed action first (recommended) and the next two most plausible
   actions. Wait for the answer, then apply it before the next file:
   - `Add to Next` or `Add to Later`: new roadmap item with a new ID
     (Shared definitions), `Serves`, `Milestone`, `Owner`, `Done when`,
     `Size`, `Depends on`, `Status: ready`, and the idea text in `Note:`.
     If it has a brief, set `Brief:` and update the brief's `Status`.
     Recommend `Shape it` instead for size `M` or `L`, or an unclear
     problem.
   - `Merge into <ID>`: append the idea as a `Note:` line on that item.
   - `Shape it`: set `Discuss: yes`. It is listed in "Do this next" and
     shaped after the review, not during it.
   - `Keep it parked`: set `Reviewed:` to today. Use for inspiration and
     ideas that are not yet actionable.
   - `Drop it`: append to `## Dropped` in `LOG.md`:
     `- <date> <title>. Reason: <one line>.`
   - Delete the inbox file after `Add` or `Merge` or `Drop` is applied.
4. **Roadmap health.** Check for, and state as challenges with evidence:
   - Next items that do not serve the focus milestone.
   - Items with no `Serves`, an unobservable `Done when`, or size `L`.
   - Blocked items past the stale limit in `config.md`.
   - `Depends on` cycles, or dependencies on dropped items.
   - `Owner: user` items that block agent items and have not moved since
     the last review.
   - The active item running longer than twice the average from `LOG.md`.

   For each, propose one fix and ask a choice question with the fix first.
5. **Order Next.** If Next is above its max, propose which items move to
   Later. If it has fewer claimable items than the max, propose promotions
   from Later. Order Next by focus milestone, then dependency, then the
   vision's v1 outcomes. Ask one choice question: `Accept this Next
   order?` with the options `Accept (recommended)` and `Change the order`.
6. **Strategy check.** If the focus milestone's items are all done, or the
   findings contradict a bet or assumption in `STRATEGY.md`, recommend
   `pm-strategy` in "Do this next" and say why. Vision changes are made
   only with `pm-strategy` (vision mode).
7. Set `Last review` Date in `config.md` to today. Append to `## Reviews`
   in `LOG.md`: `- <date> Inbox <n> to <m>. <one-line summary>.`
8. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): review <date>`.

## Output

```markdown
## Review <YYYY-MM-DD>

- Closed since last review: <n> (<n> by you)
- Inbox: <before> to <after> (<n> to shape)
- Next: <n>/<max>. Later: <n>.
- Focus: <M Name> <done>/<total>
- Challenges: <n> raised, <n> applied
- PM state: <commit result>

## Do this next

1. <Run pm-shape on <title> | Run pm-strategy: <reason> | Run pm-next>
   - Start with: <skill name>
   - Done when: <brief written | STRATEGY.md updated | NOW.md shows the claimed item>
```
