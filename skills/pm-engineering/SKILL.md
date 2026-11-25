---
name: pm-engineering
description: Use when the user asks to show, add, change, or remove the project's technology or engineering principles ("we use zod", "record the principle that ...", "bump Bun to 1.3", "we dropped Jest", "show the engineering file", "what are our principles?"). Shows or edits one technology or principle in ENGINEERING.md, each citing its Source and pointing to the ADR that holds its reason.
---

# pm-engineering

The engineering file. Show, add, change, or remove one technology or one
principle in `<PM root>/ENGINEERING.md`. The file records what is in use
and what work must follow; the reason beyond one line lives in the ADR an
entry's `Decision` names.

Follow the Non-interruption rules, Shared definitions (Engineering file,
Principle IDs, ADR, Decision split), Challenge protocol, Persistence,
Committing PM state, Asking the user, and Communication contract in the
pm-skills section of the agent instructions file (`AGENTS.md` or
`CLAUDE.md`). PM root is its `PM state directory` setting (default
`planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `view [technology \| principles \| <name or EP-NNN>]` | "show the engineering file", "what do we use", "show EP-002" | Read-only: render the file, one section, or one entry |
| `add technology <name>` | "we use zod", "record Bun", "adopted Astro" | Write one technology block, asking for the missing fields; challenged first |
| `add principle <title>` | "record the principle that ...", "rule: scripts are TypeScript" | Write one principle block with a new EP ID, asking for the missing fields; challenged first |
| `change <name or EP-NNN> <field> <value>` | "bump Bun to 1.3", "EP-002 applies to src/**" | Change the named fields of one entry |
| `remove <name or EP-NNN> <reason>` | "we dropped Jest", "remove EP-003" | Delete one entry; log it under `## Removed` |

If the request fits no mode, ask one choice question with the 2 or 3 most
likely modes as options.

## Guard

- If `<PM root>/` does not exist, reply `No <PM root> folder. Run pm-init.`
  Stop.
- Write in the main worktree, not the current feature worktree.
- If `<PM root>/ENGINEERING.md` is missing, create it from `pm-init`'s
  `templates/ENGINEERING.md` before the first write. `view` writes nothing
  and shows an empty file instead.
- **During an active workflow** (Non-interruption rule 1), only `view` runs,
  and only when the user asks for it. `add`, `change`, and `remove` apply
  Non-interruption rule 4 and stop. A library chosen during design is
  recorded with `pm-adr new`; it reaches this file after the workflow.
- If a named entry is not in the file, reply `<name or EP-NNN> not found.`
  and list the technology names and the principles as `EP-NNN <title>`.
  Stop.
- Never record a value read from a config or env file: names and versions
  only.
- Never edit any other PM file, ADRs, or code.

## Steps

Whenever a question or reply names a principle, show `EP-NNN <title>`; an
ADR, `ADR-NNN <title> (<status>)`. Add `Explain <ID>` to the question
(Asking the user).

1. **Decision check** (`add`, `change` of `Decision`): the ADR must exist in
   the decisions folder. When its `Status` is `superseded by ADR-MMM`, ask
   one choice question: `ADR-NNN <title> (<status>) is superseded by
   ADR-MMM <title>. Use it instead?` with `Use ADR-MMM (recommended)` and
   `Set Decision: none`. A `deprecated` ADR offers `Set Decision: none`
   and `Record a new ADR with pm-adr new` (then stop). An unknown ID is
   refused: `ADR-NNN has no file in <PM root>/decisions/.`
2. **add technology:** search `## Technology` for the name, ignoring case;
   on a match, ask `<Name> is already recorded. Change it instead?` with
   `Change <Name> (recommended)` and `Cancel`. Apply the Challenge protocol
   checks 1 (the evidence it is in use: a manifest, lockfile, or the
   user's words), 2 (fit with the accepted ADRs and `Out of scope` in
   `VISION.md`), and 5 (what adopting it costs). Ask for each missing
   field with the question tool, up to 4 at once, drafting values from the
   repository: `Kind`, `Version` (from the manifest or lockfile),
   `Reason`, and `Decision` (the accepted ADR that names it, or `none`).
   `Source` is the file and heading the evidence came from, or
   `user (<today>)`; `Added` is today. Run step 1, then insert the block
   in alphabetical order.
3. **add principle:** search `## Principles` for a principle with the same
   rule, and the accepted ADRs for one it contradicts; ask a choice
   question for either. Apply the Challenge protocol checks 1, 2, and 5.
   Ask for each missing field, drafting values: `Rule` (one or two
   sentences), `Applies to` (globs from the repository layout, or `all`),
   `Check` (a backticked command that fails when the rule is broken, or
   `review` when it needs judgment), and `Decision`. Title at most 8
   words. Give it a new ID (Shared definitions: Principle IDs), run step 1,
   and append the block at the end of `## Principles`.
4. **change:** show one change line, for example `EP-002 Applies to: all
   -> src/**` or `Bun Version: 1.2 -> 1.3`, and ask one choice question:
   `Apply this change?` with `Apply it (recommended)` and `Cancel`. A
   rename is `remove` then `add`. A changed `Decision` runs step 1. Write
   only the named fields; keep `Added`.
5. **remove:** ask one choice question: `Remove <Name | EP-NNN title>?
   Removed entries keep only one line.` with `Remove it (recommended)` and
   `Cancel`. On remove, delete the block and add
   `- <date> <Name | EP-NNN title>. Reason: <reason>.` at the top of
   `## Removed`. A removed EP ID is never reused.
6. **view:** read `ENGINEERING.md` and the ADR titles its `Decision` fields
   name, and write nothing. Show the output (view).
7. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): <add | change | remove> <name or EP-NNN> engineering`.
   `view` never commits.

## Output

```markdown
## Engineering <Name | EP-NNN Title>

- Section: <Technology | Principles>
- Changed: <the change line, or added | removed>
- Decision: <ADR-NNN title (status) | none>
- Source: <source>
- PM state: <commit result>

## Do this next

1. <Run pm-adr new to record the reason | Run pm-engineering view | continue the current task>
   - Start with: <skill or command>
   - Done when: <observable check>
```

## Output (view)

```markdown
## Engineering

- Technology: <n>; principles: <n> (<c> command checks, <r> review checks); removed: <n>

| Technology | Kind | Version | Decision | Source |
| --- | --- | --- | --- | --- |
| <every technology, in file order> | | | | |

| ID | Principle | Applies to | Check | Decision |
| --- | --- | --- | --- | --- |
| <every principle, in file order> | | | | |

## Do this next

1. <Run pm-engineering add technology <name> | Run pm-engineering add principle <title> | continue the current task>
   - Start with: <skill or command>
   - Done when: <observable check>
```

The tables list every entry; they are exempt from the 5-bullet limit. A
`Decision` whose ADR is superseded or deprecated shows `(superseded)` and
recommends `pm-engineering change <entry> Decision <ADR-MMM>`.
