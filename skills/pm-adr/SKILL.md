---
name: pm-adr
description: Use when a technical or architecture decision is made, confirmed, or needs recording at any time, including in the middle of a design or build workflow ("record an ADR", "we decided to use X", "write that decision down"), or when the user asks to supersede, accept, deprecate, show, check, or import architecture decision records (ADRs), for example an existing docs/adr folder. Writes one ADR in the PM root's decisions folder in one line without interrupting a workflow, or manages and imports the ADRs.
---

# pm-adr

The architecture decision records. Record one technical decision as an
ADR, supersede, accept, or deprecate one, show or check them, or import an
existing ADR folder into `<PM root>/decisions/`. Recording never interrupts
a workflow.

Follow the Non-interruption rules, Shared definitions (Decisions folder,
ADR IDs, ADR, Named reference), Challenge protocol, Persistence, Committing
PM state, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Modes

| Mode | When | Effect | During a workflow |
| --- | --- | --- | --- |
| `new <decision>` | "record an ADR for ...", "we decided to ...", the design stage makes a technical decision | Write one ADR with the next ID, `Status: proposed` unless the caller says `accepted`, today's date | Yes: write, reply in one line, no questions, no commit |
| `supersede <ADR-NNN> <decision>` | "replace ADR-003 with ...", a decision reverses an accepted ADR | Write the new ADR with `Supersedes: <ADR-NNN>`; set the old one's `Status: superseded by <new ID>` | Yes: write, reply in one line, no questions, no commit |
| `accept <ADR-NNN>` | "accept ADR-004", the design is approved | `Status: proposed` to `accepted` | Yes: write, reply in one line, no questions, no commit |
| `deprecate <ADR-NNN> <reason>` | "ADR-002 no longer applies" | `Status: deprecated`, with the dated reason appended under `## Consequences` | No |
| `view [<ADR-NNN>]` | "show the ADRs", "what did we decide about X?" | Read-only: one ADR, or the list grouped by category, then status | Yes, read-only, when the user asks |
| `check` | "check the ADRs" | Read-only: missing fields, broken `Supersedes` links, duplicate IDs | Yes, read-only |
| `import <folder>` | "import docs/adr", `pm-init` or `pm-help` names an outside ADR folder | Copy every ADR in the folder into the decisions folder with new IDs, in source order; the originals stay | No; asks one confirmation question listing the files |

If the request fits no mode, ask one choice question with the 2 or 3 most
likely modes as options.

## Guard

- If `<PM root>/` does not exist, reply: `No <PM root> folder. Run pm-init.
  ADR (not saved): <the decision, verbatim>`. Stop.
- Write in the main worktree, not the current feature worktree, except
  `accept` applied by `pm-checkpoint` (`done`), which writes in the
  worktree that holds the item's branch (rules: **Completion rides the
  branch**).
- If `<PM root>/decisions/` is missing, create it before the first write.
  `view` and `check` write nothing and report that there are no ADRs.
- **During an active workflow** (Non-interruption rule 1), only `new`,
  `supersede`, `accept`, `view`, and `check` run, and `view` only when the
  user asks for it. `deprecate` and `import` apply Non-interruption rule 4
  and stop.
- During a workflow, `new`, `supersede`, and `accept` never ask, never
  apply the Challenge protocol, and never commit. `Item` is the active
  item's ID when this session owns it, else `none`.
- If an ID is not in the decisions folder, reply `<ADR-NNN> not found.`
  Stop. Outside a workflow, also list the ADRs as
  `ADR-NNN <title> (<status>)`; during a workflow the reply is that one
  line only.
- An accepted ADR is never rewritten (Shared definitions: ADR). Its only
  changes are `Status: superseded by <ADR-NNN>` (through `supersede`) and
  `Status: deprecated` with the appended reason (through `deprecate`).
- `accept` runs only on a `proposed` ADR. `supersede` and `deprecate` run
  only on a `proposed` or `accepted` ADR; for any other status, reply
  `ADR-NNN <title> is <status>.` and stop.
- Never edit `NOW.md`, `ROADMAP.md`, `LOG.md`, briefs, the inbox, specs, or
  code. This skill writes only the decisions folder.

## Steps

Whenever a question or reply names an ID, show `ADR-NNN <title> (<status>)`
or `R-NNN <title>` with it and add `Explain <ID>` to the question (Asking
the user).

1. **New ID:** the highest `ADR` number in the file names in
   `<PM root>/decisions/`, plus 1, written with at least 3 digits
   (Shared definitions: ADR IDs). The file is
   `<PM root>/decisions/ADR-NNN-<slug>.md`, the slug from the title in
   lowercase words joined by `-`.
2. **new:** write one ADR in the Shared definitions format.
   - Title: at most 8 words from the decision; keep its wording.
   - `Status: proposed`, or `accepted` when the caller says the decision
     is accepted. `Date: <today>`.
   - `Category`: the word from the suggested set the decision fits
     (`architecture`, `data`, `security`, `tooling`, `testing`,
     `operations`), or the caller's own word.
   - `Supersedes: none`. `Source: none`.
   - `Item`: the active item ID when the decision is made for it (from the
     session during a workflow, else from `NOW.md`), else `none`.
   - `## Context`, `## Decision`, `## Alternatives`, `## Consequences`:
     from the caller's words, or the spec or design discussion that made
     the decision. A section with nothing to say holds `None recorded.`

   Outside a workflow, first read the titles of the accepted ADRs
   (Shared definitions: ADR, Read before deciding). When one covers the
   same decision, ask one choice question: `ADR-NNN <title> (accepted)
   covers this. Supersede it, or record a new ADR?` with `Supersede
   ADR-NNN (recommended)` and `Record a new ADR`. Then apply the Challenge
   protocol checks 3 (at least two alternatives, including doing nothing,
   and which one wins and why) and 7 (the strongest argument against the
   decision), and write them under `## Alternatives`. Ask for a missing
   `Category` with the question tool, offering 2 or 3 drafted values.
3. **supersede:** write the new ADR as in step 2, with
   `Supersedes: <old ID>`, then set the old ADR's
   `Status: superseded by <new ID>`. Change nothing else in the old file.
   Both files are written in the same turn, so `Supersedes` and
   `superseded by` always agree.
4. **accept:** set `Status: accepted`. Change nothing else.
5. **deprecate:** set `Status: deprecated` and append
   `- <today> Deprecated: <reason>` as the last line under
   `## Consequences`. When no reason was given, ask for it, offering 2
   drafted reasons.
6. **Reply during a workflow:** after step 2, 3, or 4, reply with exactly
   one line, `Recorded ADR-NNN <title> (<status>).`, naming the new ADR
   for `supersede`, then resume the step that was in progress. Stop.
7. **view:** read the decisions folder and write nothing. With an ID,
   print that ADR's file. Without one, show the output (view).
8. **check:** when Bun is installed, run
   `bun <pm-lint skill>/scripts/lint.ts check <PM root>/decisions --root . --no-export`
   (rules `adr/header`, `adr/sections`, `adr/id`, `adr/links`) and report
   its findings. Without Bun, check the same rules by reading each ADR file:
   the header fields and sections in order, the file name against the
   heading, duplicate IDs, and that `Supersedes`, `superseded by`, and
   `Item` name an ADR or item that exists. `README.md` is not an ADR. Write
   nothing; name the mode that fixes each finding (`supersede`, `accept`,
   `deprecate`), or a hand edit of a `proposed` ADR.
9. **import:** list the ADR files in `<folder>`: every `.md` file except
   `README.md`, `index.md`, and a template (a file name containing
   `template`), in source order, the numeric order of the source file
   names. Ask one choice question: `Import <n> ADRs from <folder> into
   <PM root>/decisions/? The originals stay.` with the files listed above
   it, and `Import <n> ADRs (recommended)` and `Cancel`. On import, give
   every file its new ID first (step 1, counting up in source order), then
   for each file:
   - The title is its `#` heading without the source's own number
     (`# 3. Use Bun` is `Use Bun`).
   - Map its header from field bullets (`- Status: ...` or `* Status:
     ...`, MADR 2.x), MADR YAML frontmatter (`status`, `date`,
     `category`), a plain `Date: YYYY-MM-DD` line with no bullet
     (adr-tools/Nygard), or the first line of a `## Status` section. Write
     `Status` in lower case regardless of the source's own case
     (`Accepted` becomes `accepted`). A source link to another source ADR
     (`superseded by <file or number>`, or `supersedes ...`) names that
     file's new ID, and both ADRs of the pair are written to agree
     (`Status: superseded by <new>` on the old, `Supersedes: <old>` on the
     new). A missing status is `proposed`; a status
     outside the four (for example `rejected`) is `deprecated`, and the
     source's own status line is kept verbatim in `## Context`.
   - A missing `Category` is `uncategorised`. A missing `Date` is the
     file's first commit date,
     `git log --diff-filter=A --format=%as -- <file>`, else today.
     `Item: none`. `Source: <the original path>`.
   - Copy the body verbatim under the four sections: each source section
     goes under the section it names, as the target `##` heading
     replacing the source's own heading rather than alongside it
     (`Context and Problem Statement` becomes `## Context`, `Decision
     Outcome` becomes `## Decision`, `Considered Options` becomes
     `## Alternatives`), and every unmatched source heading goes under
     `## Context` one level lower. The header and `## Status` section are
     not copied again. An empty section holds `None recorded.`
   - Write each file to the **PM file format**: the words verbatim, the
     layout as `pm-lint fix` would make it (`-` bullets, blank lines
     around headings, lists, and fences, no trailing spaces or tabs). When
     Bun is installed, run
     `bun <pm-lint skill>/scripts/lint.ts fix <each written ADR path>
     --root "<main worktree>"` after writing, and correct any remaining
     finding before the output.

   Leave the originals in place; this skill never deletes or edits a file
   outside the PM root.
10. **Commit** the PM state outside a workflow (rules: Committing PM
    state), with the message `docs(pm): record ADR-NNN <slug>`,
    `docs(pm): supersede ADR-NNN <slug>` (the old ADR), `docs(pm): accept
    ADR-NNN <slug>`, `docs(pm): deprecate ADR-NNN <slug>`, or
    `docs(pm): import <n> ADRs`. During a workflow nothing is committed:
    the next PM commit, usually `pm-checkpoint` (`stage`), commits the
    ADRs. `view` and `check` never commit.

## Output

During a workflow, `new`, `supersede`, and `accept` reply with the one
line from step 6 and nothing else.

```markdown
## ADR

- ADR: ADR-NNN <title> (<status>)
- Category: <category>
- Path: <PM root>/decisions/ADR-NNN-<slug>.md
- Changed: <ADR-NNN <title> is now superseded by ADR-NNN | none>

## Do this next

1. <Run pm-adr accept ADR-NNN | name ADR-NNN in the spec | continue the current task>
   - Start with: <skill or command>
   - Done when: <observable check>

## Note

- <short sha> <subject> | PM state unchanged | PM state left uncommitted: <n> files
```

Omit `Changed` for `new`, `accept`, and `deprecate`.

## Output (view)

```markdown
## ADRs

- Accepted: <n>; proposed: <n>; superseded: <n>; deprecated: <n>

| Category | ID | ADR | Status | Date | Item |
| --- | --- | --- | --- | --- | --- |
| <every ADR, grouped by category, then status: accepted, proposed, superseded, deprecated> | | | | | |

## Do this next

1. <Run pm-adr accept ADR-NNN for the oldest proposed ADR | continue the current task>
   - Start with: <skill or command>
   - Done when: <observable check>
```

The table lists every ADR; it is exempt from the 5-bullet limit.

## Output (check)

```markdown
## ADR check

- Checked: <n> ADRs in <PM root>/decisions/
- Findings: <n | none>

| File | Line | Rule | Finding | Fix with |
| --- | --- | --- | --- | --- |
| <every finding> | | | | |

## Do this next

1. <the fix for the first finding | continue the current task>
   - Start with: <skill or command>
   - Done when: `pm-adr check` reports no findings
```

Omit the table when there are no findings.

## Output (import)

```markdown
## ADRs imported

- Imported: <n> from <folder>; the originals stay

| Source | ADR | Status | Category |
| --- | --- | --- | --- |
| <every imported file, in source order> | ADR-NNN <title> | | |

## Do this next

1. Run pm-adr check
   - Start with: `pm-adr check`
   - Done when: it reports no findings

## Note

- <short sha> <subject> | PM state unchanged | PM state left uncommitted: <n> files
```

The table lists every imported file; it is exempt from the 5-bullet limit.
