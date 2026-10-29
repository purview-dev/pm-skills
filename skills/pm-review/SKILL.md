---
name: pm-review
description: Use when the user asks for a weekly review, or pm-resume reports review is due. Triages the inbox and reorders the roadmap against the vision, one decision at a time.
---

# pm-review

Triage the inbox and re-order the roadmap against `VISION.md`.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- Do not change the active item in `NOW.md`.

## Steps

1. Read `VISION.md`, `ROADMAP.md`, `NOW.md`, `LOG.md`, and `config.md`.
2. State these facts (all computable):
   - Days since last review, and days the active item has been active
     (from `Started`).
   - Items closed since the last review (`LOG.md` Done lines dated after
     it).
   - Inbox count, Next count against the max, Later count.
3. Triage the inbox **one file at a time**, oldest first. For each, show
   its title and idea, propose one action, then ask one choice question:
   the proposed action (recommended), the other actions, and `Type
   something`. Wait for the answer.
   - `add to Next` or `add to Later`: new roadmap item with a new ID (Shared
     definitions), `Serves`, `Done when`, `Size`, `Status: ready`. Put the
     idea text in `Note:`.
   - `merge into <ID>`: append the idea as a `Note:` line on that item.
   - `drop`: append to `## Dropped` in `LOG.md`:
     `- <date> <title>. Reason: <one line>.`
   - Delete the inbox file after the action is applied.
4. If Next is above its max, propose which items move to Later. If it has
   fewer ready items than the max, propose promotions from Later. Order
   Next by dependency, then by the vision's v1 outcomes. Ask one choice
   question: `Accept this order?` with the options `Accept (recommended)`
   and `Type changes`.
5. Set `Last review` Date in `config.md` to today. Append to `## Reviews`
   in `LOG.md`: `- <date> Inbox <n> to <m>. <one-line summary>.`

## Output

```markdown
## Review <YYYY-MM-DD>

- Closed since last review: <n>
- Inbox: <before> to <after>
- Next: <n>/<max>. Later: <n>.

## Do this next

1. Run `pm-next`, or `pm-status` to see the queue.
   - Done when: <NOW.md shows the claimed item | queue shown>
```
