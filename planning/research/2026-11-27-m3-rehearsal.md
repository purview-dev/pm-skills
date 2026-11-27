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

Pending.

## Skill defects found

Pending.
