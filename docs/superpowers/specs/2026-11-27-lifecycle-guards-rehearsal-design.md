# Lifecycle guards rehearsal (R-016)

- Item: R-016 Rehearse the lifecycle guards
- Serves: V2, V3 (M3 Verified lifecycle guards; bet B3, assumption A6)
- Branch: `feat/r-016-rehearse-the-lifecycle-guards`
- ADRs: none touched; this item makes no technical decision.

## Intent

Bet B3 says to find out whether `pm-resume` and the Non-interruption rules
hold in real use, or exactly where they break. The rehearsal produces
that evidence for M3's exit criterion. A failed step is a valid result,
as long as the report names it.

## Goals

- V2: after `/clear`, `pm-resume` names the active item, its stage, and
  the next action, from `planning/` alone.
- V3: during an active workflow, asking to shape an idea parks it, and
  the step in progress resumes.
- A report in `planning/research/` holds the verbatim output for each
  probe and a pass or fail result.

## Non-goals and anti-goals

- No fixes in R-016. Each defect is named in the report and captured with
  `pm-bug`, so it can be scheduled later.
- No scratch repository and no subagent standing in for a fresh session.
  Those are what A6 rules out.
- No `STRATEGY.md` edits. B3 and A6 statuses go to `pm-strategy` after
  R-016 closes.
- Anti-goal: a report that passes because the agent knew the test. Your
  prompts are typed as a user would type them, not as the rules describe
  them.

## Approaches

- **Live, in this repository, the user drives (chosen by the user).** The
  rehearsal uses a real `/clear`, the real agent, and the real PM state,
  as A6 states.
- Scratch repository with subagents (the M4 method). Rejected because it
  simulates `/clear` instead of running it.
- Both. Rejected because it roughly doubles the item without testing A6
  any further.

## Method

The rehearsal runs in the execute stage, after the plan is staged, so
`NOW.md` holds R-016 at `execute` with a checkpoint. The order is fixed.
The V3 probes go first, while a workflow (`executing-plans`) is active in
the session.

1. **V3a, plain idea.** The user types an idea in their own words and asks
   to talk it through (not naming a skill). Expected (rules 3 and 5):
   `pm-park` runs as a capture with `Discuss: yes`, replies in one line,
   writes one inbox file, asks no follow-up, and the plan step resumes.
2. **V3b, named skill.** The user types `/pm-shape <idea>`. Expected
   (rule 4): `pm-shape` does not run, and the agent asks `<skill> is at
   <step>. When should pm-shape run?` with `After <skill> finishes
   (recommended)` and `Pause now and run it`. The user picks the
   recommended option, and the step resumes. The report also records
   whether the idea was parked, because the item's `Done when` says
   "parking" while rule 4 says "ask".
3. **V2, resume.** The user runs `/clear`, then `pm-resume` (typed as
   `/pm-resume`, or as plain words like "where were we", recorded as
   whichever was used). Expected: the output names `R-016 Rehearse the
   lifecycle guards`, `execute`, and the checkpoint's `Next action`, and
   nothing contradicts `NOW.md`.

For each probe, the report records the exact prompt, the verbatim agent
output, the files written (`git status --porcelain`), and the commit sha,
with `Result: pass | fail (<rule broken>)`.

## Report

The report goes in `planning/research/2026-11-27-m3-rehearsal.md`, laid
out like `planning/research/2026-11-26-m4-rehearsal.md`. Its header gives
the item, branch, skills commit, and how the session was driven. It has
one `##` section per probe, then `## Skill defects found`, which lists
each failure with its inbox file. It must pass `pm-lint` and
`markdownlint-cli2`.

## Left to the builder

- The exact wording of the report, as long as it follows the layout
  above.
- Whether to run a probe again after a failure: once only, and the
  report records both runs.
