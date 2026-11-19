# pm-checkpoint pop and push field wording

- Captured: 2026-11-19 21:54
- Source: agent (R-018 finish review)
- Kind: tech-debt
- Affects: skills/pm-checkpoint/SKILL.md
- Context: R-018 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-018's final re-review found two wording gaps in `pm-checkpoint`. `pop` no longer states that the five item fields (`Serves`, `Owner`, `Size`, `Depends on`, `Revisits`) land after `Milestone` and before `Spec`, as `pm-rejoin` and `pm-next` step 7 do. `push` cites `now/fields` as the reason to copy the five as a group into `STACK.md`, but `now/fields` checks `NOW.md` only; `checkStack` does not enforce it. Add the position sentence to `pop` and reword the `push` citation. Needs a rules bump once rules 20 is released.

## Links

- docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md
