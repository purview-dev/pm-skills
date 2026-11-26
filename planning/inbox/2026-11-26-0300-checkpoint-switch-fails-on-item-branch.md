# pm-checkpoint switch commit fails on item branch

- Captured: 2026-11-26 03:00
- Source: agent (R-036 execute)
- Kind: bug
- Severity: minor
- Affects: pm-checkpoint
- Context: R-036 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`pm-checkpoint switch` run on an item branch writes NOW.md and ROADMAP.md, then the PM commit's recommended option `Switch to main and commit` fails: `git switch` refuses because NOW.md and ROADMAP.md differ between the item branch and main.

## Reproduction

Found in the M4 rehearsal re-run (`planning/research/2026-11-26-m4-rehearsal.md`, Skill defects found): claim an item on its branch, stage it to plan, run `pm-checkpoint switch`, accept `Switch to main and commit (recommended)`. Every run.

## Links

- planning/research/2026-11-26-m4-rehearsal.md
- skills/pm-checkpoint/SKILL.md
