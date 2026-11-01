---
name: pm-discover
description: Use when the user asks to analyse the existing product, codebase, usage data, feedback, issues, or project history to find what to build, fix, or stop next, or asks a factual question about how the product currently works or is used. Writes an evidence-backed research report in the PM root, challenges the current roadmap with it, and parks the chosen opportunities in the inbox.
---

# pm-discover

Find out what the existing product and its history say about what to work
on. Every finding cites evidence. Reads anything in the repository; writes
only inside the PM root.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `analyse [area]` | The user asks what to build or fix, or for a product or codebase review | Sweep the chosen sources, write a report, park opportunities |
| `question <text>` | The user asks how something works today, whether it is used, or what changed | Answer with evidence, write a short report |

If the mode is unclear, ask one choice question: `What should I look
into?` with the options `Analyse the product for opportunities
(recommended)` and `Answer a specific question`.

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- Never modify code, run migrations, or run the product against production
  data. Running read-only commands and the test suite is allowed.
- Use only local sources and sources the user names. Before any network
  call (for example `gh issue list`), ask: `Read <source> over the
  network?` with the options `Read it (recommended)` and `Skip it`.
- Never copy secrets or personal data into the report. Summarise usage data
  as counts.

## Steps

1. **Scope.** For `analyse`, ask one multi-select question: `Which sources
   should I analyse?` with the options `Codebase`, `Git history`, `PM
   history` (all three recommended) and `Usage data, feedback, or issues`.
   If the user picks the last one, ask for the path or source as a
   free-text question with likely locations found in the repository as
   options.
2. **Start the report.** Create
   `<PM root>/research/<YYYY-MM-DD>-<slug>.md` (create the folder if
   missing) with the template below, and fill each section as findings
   arrive (Persistence).
3. **Gather evidence** from the chosen sources:
   - **Codebase:** the features that exist (routes, commands, screens,
     jobs); unfinished work (`TODO`, `FIXME`, `HACK`, stubs, disabled
     feature flags); modules without tests; error paths that are swallowed;
     documentation that disagrees with the code.
   - **Git history:** churn hot spots with
     `git log --since=90.days --name-only --format=` (count by file); fix
     frequency with `git log --since=90.days -i --grep=fix --oneline`;
     reverts with `git log -i --grep=revert --oneline`.
   - **PM history:** for each `V` line in `VISION.md`, the items done
     (`LOG.md`) and open (`ROADMAP.md`); items blocked longer than the stale
     limit; inbox ideas that recur; dropped ideas that keep returning;
     average days from `Started` to done.
   - **Usage data, feedback, or issues:** counts by feature or event, error
     rates, the most frequent complaints or requests, the oldest open
     issues, and anything used far more or far less than its roadmap
     weight suggests.
   - **question mode:** only the sources needed to answer, then go to
     step 6.
4. **Challenge the findings.** For each opportunity, state the strongest
   alternative explanation of the evidence (for example, "high churn
   because the file is a config registry, not because it is fragile") and
   set confidence to `high`, `medium`, or `low`. Remove opportunities the
   counter-explanation defeats, and list them under `Discarded` with the
   reason.
   If the codebase is .NET and a finding matches a need in `pm-purview`'s
   description (telemetry, validation, typed IDs, expected-failure
   handling, event history, Aspire, architecture rules, build
   conventions, integration tests), run `pm-purview` (check mode) for
   that finding and add its result to the opportunity.
5. **Challenge the roadmap.** Compare the findings with `## Next`,
   `STRATEGY.md`, and the active item. List items in Next that no evidence
   supports, opportunities the evidence ranks above them, and `V` lines
   with no work. These are proposals only; this skill does not reorder the
   roadmap.
6. **Answer or summarise.** Write `## Answer` (question mode) or
   `## Summary` (analyse mode) in at most 5 bullets, each with evidence.
7. **Park.** Ask one multi-select question: `Which opportunities should I
   park in the inbox?` with each opportunity as an option (title, size,
   confidence), `high` confidence ones listed first. Write each chosen one
   as an inbox file (Shared definitions) with `Source: agent (pm-discover)`,
   `Discuss: yes`, the evidence under `## Idea`, and the report path under
   `## Links`. In question mode, offer this only if the answer revealed an
   opportunity.

## Report template

```markdown
# <Title>

- Date: <YYYY-MM-DD>
- Mode: analyse <area> | question
- Sources: <list>

## Question

<the question, or the scope of the analysis>

## Summary

- <finding> (evidence: <path:line | command | number>)

## Findings

| Finding | Evidence | Confidence |
| --- | --- | --- |

## Vision coverage

| V line | Done | Open | Gap |
| --- | --- | --- | --- |

## Opportunities

### O1 <title>

- Problem: <who, what, how often>
- Evidence: <citations>
- Against: <strongest counter-explanation>
- Size: <S | M | L>. Serves: <V line | none>. Confidence: <level>.

## Roadmap challenges

- <item or gap, with evidence>

## Discarded

- <opportunity>. Reason: <counter-explanation that defeated it>.
```

## Output

```markdown
## Discovered: <title>

- Report: <path>
- Findings: <n> (<n> high confidence)
- Parked: <n> inbox files
- Roadmap challenges: <n>

## Do this next

1. <Run pm-shape on <top parked idea> | Run pm-review to reorder Next | Run pm-strategy, the evidence changes the focus>
   - Start with: <skill name>
   - Done when: <observable check>
```
