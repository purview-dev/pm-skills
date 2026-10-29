---
name: pm-status
description: Use when the user asks for project status, the queue, or what is on the roadmap. Shows the active item, roadmap, inbox, and review state. Read-only.
---

# pm-status

Show the project state in one screen. Read-only.

Follow the Non-interruption rules, Shared definitions, and Communication
contract in the pm-skills section of the agent instructions file
(`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory` setting
(default `planning/`).

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.

## Steps

1. Read `NOW.md`, `ROADMAP.md`, `config.md`; count inbox files, excluding
   `README.md`.
2. Evaluate **Review due** (Shared definitions).
3. List Next items (ID, title, size, status) and the count of Later.
4. List blocked items from Next and Later.

## Output

```markdown
## Status

- Now: <ID Title (stage) | idle>
- Next (<n>/<max>): <ID Title [size, status]>, ...
- Later: <n> items
- Inbox: <n>
- Review: <due | not due> (last: <date | never>)

## Blocked

- <ID Title: reason>

## Do this next

1. <one action>
   - Start with: <skill name>
```
