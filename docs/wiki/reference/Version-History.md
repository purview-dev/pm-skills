# Version history

What each rules version changed for an installed project, from version 5 to version 13.

> [!NOTE]
> The upgrade notes for every version, including 14 and later, are kept in the managed rules:
> [`skills/pm-setup/references/AGENTS-section.md`](../../../skills/pm-setup/references/AGENTS-section.md),
> under *Upgrading before work resumes*.

## Version 5

Version 5 adds the `Commits` section to `config.md`. Without it, a PM
commit asks before each commit and treats the main worktree's current
branch as the planning branch. Add the section to choose `always`, `ask`,
or `never`, and to name the branch.

Version 5 also adds the upgrade check. `pm-resume`, `pm-rejoin`, and
`pm-next` compare the installed rules version with the installed skills
version and offer `pm-setup` before any work resumes.

## Version 6

Version 6 moves that version of record out of the agent file: it is
`Rules version` in `planning/config.md`, so a merge, rewrite, or removed
marker in `AGENTS.md` cannot lose it. Installed markers therefore carry no
version, and `pm-setup` migrates an older `version=` marker into
`config.md` the next time it runs. If the section itself is dropped from
the agent file, the recorded version lets `pm-setup` reinstall or re-wrap
it instead of appending a second copy.

## Version 7

Version 7 splits the two views out of `pm-status`. `pm-board` owns the
task board, `pm-roadmap` owns the full milestone roadmap, and `pm-up-next`
shows the ordered queue without claiming anything. `pm-board`, `pm-roadmap`,
and `pm-item` can move, add, and insert items; the shared **Roadmap order
and edits** rules define positions, full-Next demotion, board-column
mapping, and confirmation. The read-only views may answer mid-workflow.
Done lines in `LOG.md` now record a `Milestone:` so roadmap progress can be
counted per milestone.

## Version 8

Version 8 makes every question show what it is about. A question that names
a milestone, item, bet, `V` line, or inbox file prints a
`## For this question` legend above it — each ID with the words needed to
decide it — and carries one escape option, `Explain <ID>`,
`Show the roadmap`, or `Show the board`, which prints the full block or runs
the read-only view and then asks the same question again. Neither the legend
nor the escape option changes state or counts as an answer.

## Version 9

Version 9 adds three skills and a derived state file. `pm-bug` logs a defect with
the facts a fix needs — symptom, expected and actual, reproduction,
severity, and evidence — in an inbox file with `Kind: bug`, then routes it
to a fix, the roadmap, shaping, or the parking lot. `pm-revise` corrects
work that is already built: it rewinds the active item to an earlier stage,
fixes it in place, or opens a revision item whose `Revisits` names the
original. It may interrupt an active workflow to correct it, and it records
the scope and pauses the item first. `pm-export` writes
`planning/planning.json` with `planning/planning.schema.json` in a fixed,
validated shape, or checks them without writing. Seed data comes from the
same files as before; bugs add `Severity`, `Affects`, and a
`## Reproduction` block to the inbox format, and revisions add an optional
`## Revisions` heading to a brief.

## Version 10

Version 10 adds `pm-docs-site` and Non-interruption rule 9. `plan` adds the
site, a module, or a page as a roadmap item; `check` compares an installed
site with the templates and the export, read-only, even mid-workflow; and
`scaffold`, `extend`, and `upgrade` build it inside that item's `execute`
stage. The site reads `planning/planning.json` only. When `pm-export`'s
`schemaVersion` moves, the site's build fails until `pm-docs-site upgrade`
runs, and `pm-help` reports the difference.

## Version 11

Version 11 makes completion ride the branch and adds the operation stack.
`pm-checkpoint` (`done`) writes the Completion record and commits it on the
item's branch, so the item's pull request carries it before CI runs; it is
never closed on the planning branch after the merge, and it never gets a
pull request of its own. When the last open item of a milestone closes, the
skill asks once and records the milestone as done in the same commit.
`pm-checkpoint` (`push`, `pop`) suspends and restores an operation through
`planning/STACK.md`, so an emergency never loses work and the interrupted
operation resumes at its checkpoint. `pm-rejoin` repairs a `merged-unclosed`
item whose completion missed its branch.

## Version 12

Version 12 adds the risk register and `pm-risk`. `planning/RISKS.md` holds
one block per risk with likelihood, impact, RAG, status, owner, trigger,
and mitigation; RAG is derived from likelihood × impact unless an override
records why. `pm-risk capture` may run mid-workflow like `pm-park`: it
writes one risk, replies in one line, and never commits. `pm-export` moves
to `schemaVersion` 3 with a `risks` key, and the docs site gains a Risks
page with a likelihood × impact matrix, a Red risks tile, and a Home list;
run `pm-docs-site upgrade` for an installed site.

## Version 13

Version 13 adds the context budget and named references. Each item is one
context: `pm-checkpoint` (`done`) tells you to start a new session (`/new`
or `/clear`) before `pm-next`, and a stage handoff passes the spec or plan
path instead of the conversation that produced it. Every skill prints an ID
with its title (`R-007 Tenant billing`) wherever its output names one, not
just the ID.
