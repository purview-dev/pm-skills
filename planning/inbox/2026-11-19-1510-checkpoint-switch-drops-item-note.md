# pm-checkpoint switch drops the item's Note

- Captured: 2026-11-19 15:10
- Source: agent (R-018 design)
- Kind: improvement
- Affects: skills/pm-checkpoint/SKILL.md
- Context: R-018 design
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-018's design keeps `Note` out of `NOW.md`, so `pm-checkpoint` `switch` (and `push`/`pop`) still restore a roadmap item without the `Note` it had before `pm-next` claimed it. Carry `Note` through `NOW.md` or the stack entry so a switched item comes back unchanged.

## Links

- docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md
