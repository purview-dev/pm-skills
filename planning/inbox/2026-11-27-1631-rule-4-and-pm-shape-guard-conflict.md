# Rule 4 and pm-shape Guard conflict

- Captured: 2026-11-27 16:31
- Source: agent (R-016 execute)
- Kind: bug
- Severity: minor
- Affects: Non-interruption rule 4 (skills/pm-setup/references/AGENTS-section.md), skills/pm-shape/SKILL.md Guard
- Context: R-016 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

When the user names `pm-shape` mid-workflow, Non-interruption rule 4 says the agent asks `<skill> is at <step>. When should pm-shape run?` (`After <skill> finishes (recommended)`, `Pause now and run it`). But `pm-shape`'s Guard and rule 5 say park the idea with `pm-park` in capture mode and reply in one line. The two instructions disagree. The agent followed the Guard, so the rule-4 question never appeared. Make rule 4 name the exception for `pm-shape` (rule 5 wins), or change the Guard to ask the rule-4 question.

## Reproduction

- Expected: one instruction for `/pm-shape <idea>` typed during an active workflow.
- Actual: rule 4 says ask; the `pm-shape` Guard and rule 5 say park without asking.
- Steps: start a plan with `executing-plans`, then type `/pm-shape more pies`.
- Frequency: every run.
- Evidence: `planning/research/2026-11-27-m3-rehearsal.md`, Probe V3b.
