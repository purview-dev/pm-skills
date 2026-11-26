# pm-setup current install skips Step 5 checks

- Captured: 2026-11-26 11:30
- Source: agent (R-057 execute)
- Kind: question
- Affects: pm-setup
- Context: R-057 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

pm-setup Step 4 stops after showing the plan when the install is already current, so Step 5 never runs; the read-only Step 5 checks (item 7, the outside ADR folder Note) then never surface on a current install. Decide whether read-only checks belong before the Step 4 stop.

## Links

- skills/pm-setup/SKILL.md
