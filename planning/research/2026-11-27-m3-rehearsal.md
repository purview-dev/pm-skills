# M3 rehearsal 2026-11-27

- Item: R-016 Rehearse the lifecycle guards
- Branch: `feat/r-016-rehearse-the-lifecycle-guards`
- Skills commit: `29004e1`
- Session: live Claude Code session in this repository, driven by the user; skills from `skills/` through `just setup-skills`.
- Spec: `docs/superpowers/specs/2026-11-27-lifecycle-guards-rehearsal-design.md`
- Plan: `docs/superpowers/plans/2026-11-27-lifecycle-guards-rehearsal.md`

## Probe V3a: plain idea

The active workflow was `executing-plans` (rule 1), at plan Task 2, with R-016 at `execute`. The user typed:

```text
i want to change the branding to use pies and the colour green
```

The agent classified the idea from the words alone (Quick capture, fast path). It handed the write to a non-blocking background subagent (`Agent` tool), with the words verbatim, `Source: user`, and `Context: R-016 execute`. Its whole reply was:

```text
Parking "Pies and green branding" (improvement). Back to Task 2, Step 3: recording the probe.
```

The background task reported back only the path it wrote, `planning/inbox/2026-11-27-1553-pies-and-green-branding.md` (`Kind: improvement`, `Discuss: no`, `Related: none`). `pm-lint check` on that file is clean. `git status --porcelain` after the capture:

```text
?? .superpowers/sdd/
?? planning/inbox/2026-11-27-1553-pies-and-green-branding.md
?? planning/research/2026-11-27-m3-rehearsal.md
```

Nothing was committed (HEAD `29004e1`), no follow-up question was asked, no brief was started, and the plan step resumed.

`Discuss: no`: the prompt states a wish and does not ask to talk the idea through. Rule 3 sets `Discuss: yes` only when the user wants to discuss, so `no` follows the rules, and the plan's expected `Discuss: yes` assumed a different prompt.

Result: pass (rules 3 and 5; Quick capture, background)

## Probe V3b: /pm-shape

The active workflow was still `executing-plans` (rule 1), at plan Task 3. The user typed:

```text
/pm-shape more pies
```

Claude Code loaded `pm-shape`'s `SKILL.md` into the turn. The skill's own Guard, `If a workflow is active, do not shape. Run pm-park in capture mode with Discuss: yes and reply with its one line (Non-interruption rule 5)`, stopped it before step 1. The agent followed the Guard and handed the capture to a non-blocking background subagent. Its whole reply was:

```text
Parking "More pies" (feature, to discuss). Back to Task 3, Step 4: recording the probe.
```

The background task wrote `planning/inbox/2026-11-27-1602-more-pies.md` (`Kind: feature`, `Discuss: yes`), and `pm-lint check` on it is clean. No brief was written (`planning/briefs/*pies*` does not exist), and no question was asked. `git status --porcelain`:

```text
?? .superpowers/sdd/
?? planning/inbox/2026-11-27-1553-pies-and-green-branding.md
?? planning/inbox/2026-11-27-1602-more-pies.md
?? planning/research/2026-11-27-m3-rehearsal.md
```

**What stopped it:** the skill's Guard, not a rule the agent recalled. Non-interruption rule 4 says a PM skill named mid-workflow is not run, and that the agent asks `<skill> is at <step>. When should <pm-skill> run?` (`After <skill> finishes (recommended)`, `Pause now and run it`). `pm-shape`'s Guard and rule 5 say park it in one line. The two disagree, and the agent followed the more specific instruction, so the rule-4 question never appeared. The item's `Done when` ("parking an idea instead of running") matches the Guard.

Result: pass against the `Done when` (parked with `Discuss: yes`, no brief). Fail against rule 4 as written: no question was asked, because rule 4 and the `pm-shape` Guard conflict.

## Probe V2: resume after /clear

The agent ran `pm-checkpoint pause` (commit `fb7dba6 docs(pm): pause R-016 at execute`), and the user ran `/clear`. The first prompt in the new context was `/pm-review`, not a resume. It ran because the paused workflow no longer owned the session, and it left `NOW.md` unchanged. It removed the two probe inbox files at the user's request and committed `03237de docs(pm): review 2026-11-27`. The user then typed:

```text
/pm-resume
```

The agent read `NOW.md`, `config.md`, `ROADMAP.md`, `STRATEGY.md`, and the plan. It wrote no file. Its output, as printed (the question that followed it was `Start "Record the pm-resume output under Probe V2 in planning/research/2026-11-27-m3-rehearsal.md" (R-016 Rehearse the lifecycle guards, plan Task 4, Step 4) now?`, with `Start it (recommended)` and `Show the board first`; the user picked `Start it`):

```markdown
## Now

- Item: R-016 Rehearse the lifecycle guards
- Stage: execute
- Progress: 0/19 plan steps (the plan file has no checked boxes, although its progress ledger records V3a and V3b as done)
- Last checkpoint: 2026-11-27 16:03
- Stack: none
- Paused: none
- Focus: M3 Verified lifecycle guards

## Decisions so far

- V3a scored pass with `Discuss: no`, because the prompt did not ask to discuss.
- V3b followed the pm-shape Guard (park) over the rule-4 question; the conflict is logged as a defect in Task 5.
- The plan ledger is `.superpowers/sdd/2026-11-27-lifecycle-guards-rehearsal/progress.md`, never committed; ledger lines are written by hand, because the bash helper scripts cannot run on the P: drive.

## Do this next

1. Record this `pm-resume` output under "Probe V2" in the rehearsal report (plan Task 4, Step 4).
   - Start with: `planning/research/2026-11-27-m3-rehearsal.md`
   - Done when: the report's "Probe V2" section holds this output, `git status --porcelain` before and after, and a `Result:` line.

## For you

- 5 inbox files wait for discussion (`Discuss: yes`), including the major bug "Bare IDs in questions and feedback".

## Note

- Uncommitted PM state: none. `git status --porcelain` shows only `?? .superpowers/sdd/`, and no `PAUSE.md` exists.
- `feat/r-016-rehearse-the-lifecycle-guards` has no upstream; `main` is level with `origin/main`.
- Review not due: the last review was today.
- The V3a inbox file the plan expected to be uncommitted at `/clear` has been committed, and then deleted by today's second review. So V2 tests a clean tree.
```

`git status --porcelain` before and after `pm-resume` was the same (HEAD `03237de`, no `PAUSE.md`):

```text
?? .superpowers/sdd/
```

Field check against `planning/NOW.md`:

| Field | `NOW.md` | `pm-resume` output | Match |
| --- | --- | --- | --- |
| Item | R-016 Rehearse the lifecycle guards | R-016 Rehearse the lifecycle guards | yes |
| Stage | execute | execute | yes |
| Next action | Record the pm-resume output under "Probe V2" in planning/research/2026-11-27-m3-rehearsal.md (plan Task 4, Step 4) | Record this `pm-resume` output under "Probe V2" in the rehearsal report (plan Task 4, Step 4), starting with `planning/research/2026-11-27-m3-rehearsal.md` | yes |

The plan's precondition (the V3a inbox file still uncommitted at `/clear`) did not hold. The pause commit swept the file in, and the review removed it. So V2 shows that `pm-resume` stays read-only on a clean tree, not that it reports a loose inbox file. `Progress: 0/19` is accurate for the plan file: this session tracks steps in the `.superpowers/sdd/` ledger, not in the plan's checkboxes.

Result: pass (names the item, stage, and checkpoint `Next action`; contradicts no `NOW.md` field; writes nothing)

## Skill defects found

- V3b: Non-interruption rule 4 (ask) conflicts with the `pm-shape` Guard and rule 5 (park), `planning/inbox/2026-11-27-1631-rule-4-and-pm-shape-guard-conflict.md`
