---
name: pm-bug
description: Use when the user reports or asks to add a bug, defect, or regression, or asks to log something that does not work as expected, at any time. Asks for the facts a fix needs - symptom, expected and actual, reproduction, severity, and evidence - checks for a duplicate, writes one inbox file, and routes it to a fix, the roadmap, shaping, or the parking lot.
---

# pm-bug

Capture one bug with the facts needed to fix it, then route it. A bug is an
inbox file with `Kind: bug`: the same parking lot as every other idea, with
the fields a fix needs.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM root
is its `PM state directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `report` | Default: "add a bug", "there's a bug in ...", "log a defect" | Ask the bug questions, write one inbox file, route it |
| `update <file>` | A bug was parked during a workflow, or an inbox file lacks the bug fields | Add the missing fields to that file in place |

During an active workflow, `report` does not run. Run `pm-park` in capture
mode with `Kind: bug` (Non-interruption rule 3), reply with its one line,
and say the questions run later with `pm-bug update`. This skill never
interrupts a workflow; only `pm-revise` may (rule 8).

## Guard

- If `<PM root>/` does not exist: `No <PM root> folder. Run pm-init. Bug
  (not saved): <the bug, verbatim>`. Stop.
- Write in the main worktree, not the current feature worktree.
- Create `<PM root>/inbox/` if it is missing.
- If the user is describing a change to what should have been built, rather
  than a defect, run `pm-revise` instead.
- Never edit source code, specs, or plans. This skill writes one inbox file.

## Steps

1. **Deduplicate before asking.** Search inbox titles and `## Idea` text,
   `ROADMAP.md` titles and `Note:` lines, `briefs/`, and `## Done` and
   `## Dropped` in `LOG.md` for the bug's key nouns. Show each close match
   as `R-NNN <title>` or `<file> <title>`. With one or more matches, ask one
   choice question `<ID> or <file> may already cover this. What should
   happen?` with the options `Merge into <match> (recommended)` and `Log a
   new bug`, plus `Explain <ID>`. On merge, append
   `- <YYYY-MM-DD> Recurrence: <the user's words, verbatim>` under `## Notes`
   in that file or item, then go to step 7. Record every match in `Related:`
   either way; use `none` when nothing matches.
2. **Open the file** at `<PM root>/inbox/<YYYY-MM-DD-HHMM>-<slug>.md`, the
   slug built from the symptom (lowercase ASCII, digits, hyphens, at most 5
   words). Write the Inbox file format from Shared definitions with
   `Source: user`, `Kind: bug`, `Context` from `NOW.md`, `Discuss: no`,
   `Brief: none`, `Reviewed: never`, and the user's words verbatim under
   `## Idea`.
3. **Ask the questions** below, one decision at a time. Draft 2 or 3 likely
   answers from the repository and PM state and put the recommended one
   first. Write each answer to the file before asking the next, and skip any
   question the user already answered.

   | # | Ask | Written to |
   | --- | --- | --- |
   | 1 | What happens now, and where (screen, route, file)? | `## Idea`, verbatim |
   | 2 | What should happen instead? | `- Expected:` under `## Reproduction` |
   | 3 | What are the steps, and does it happen every time? | `- Actual:`, `- Steps:`, `- Frequency: always \| intermittent \| once` |
   | 4 | Any error text, log line, screenshot, or failing test? | `- Evidence:`, plus `## Links` for URLs and paths |
   | 5 | Who is affected, and is any stored data already wrong? | `- Impact:`, and `Affects:` |
   | 6 | How bad is it? | `Severity:` |

   For question 5, `Affects:` names an open `R-NNN`, a component, or a file
   path, so the bug is findable from that work. For question 6, offer
   `blocker` (crash, data loss, wrong money, or a security hole), `major`
   (the job cannot be done without a workaround), `minor` (the job is done,
   wrongly or slowly), and `cosmetic` (look or wording only). Name the
   consequence in each option label and recommend the one the evidence
   supports.
4. **Route.** Ask one choice question `What should happen with "<title>"?`
   with the recommendation first, then the two or three most plausible
   others, plus `Show the board` as the escape option:
   - `blocker`: `Fix it now (recommended)`. Run `pm-revise` for the active
     item or for work already in `## Done`; otherwise run `pm-item add
     "<title>" next top`, then ask `Start <ID> now?` with `Start it
     (recommended)` (run `pm-next <ID>`) and `Leave it queued`.
   - `major` or `minor`: `Add to Next`, `Add to Later`, `Shape the fix`
     (size `M` or `L`, or an unknown cause), and `Keep it parked`.
   - `cosmetic`: `Keep it parked (recommended)`, with `Add to Later` and
     `Drop it`.
5. **Write the outcome.** For an item, create it with the Roadmap order and
   edits rules, `Status: ready`, and a `Note:` holding the whole bug: `Bug,
   severity <severity>. Expected <x>, actual <y>. Steps <z>. Evidence <e>.
   Affects <R-NNN, component, or path>.` Delete the inbox file, because the
   item now carries every fact. For `Shape the fix`, set `Discuss: yes` and
   keep the file. For `Keep it parked`, keep the file with `Reviewed:
   never`. For `Drop it`, append `- <date> <title>. Reason: <reason>.` to
   `## Dropped` in `LOG.md` and delete the file.
6. **State the challenge.** In one line each: the duplicate result, the
   severity with its consequence, and what the fix delays. A `blocker` also
   names the item it stops (Challenge protocol, scaled to the severity).
7. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): bug <slug>` or `docs(pm): merge bug into <ID>`.
8. Show the output, then hand off to the skill named in `Do this next`.

## Output

```markdown
## Bug logged

- File: <path | merged into <ID or file>>
- Severity: <severity>; affects <R-NNN, component, or path | none>
- Related: <IDs or files | none>
- Routed: <Fix it now with pm-revise | R-NNN at the top of Next | R-NNN in Later | Shaped with pm-shape | Parked | Merged into <ID>>
- PM state: <commit result>

## Do this next

1. <one action>
   - Start with: <skill name or file path>
   - Done when: <observable check>

## Note

- <duplicates considered, assumptions>
```
