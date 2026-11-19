# Stack entries are not backfilled on upgrade

- Captured: 2026-11-19 21:55
- Source: agent (R-018 finish review)
- Kind: improvement
- Affects: skills/pm-setup/SKILL.md, skills/pm-checkpoint/SKILL.md
- Context: R-018 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

`pm-setup` Step 5 item 5 backfills the five item fields of an active `NOW.md` on the upgrade to rules 20, but not of entries already in `STACK.md`. An item pushed before the upgrade pops back without them, so its Now card exports `owner`/`size` null and the graph draws no edges for it. Likewise `pm-checkpoint switch` on an item that was never backfilled (the user chose `Continue on v19`) restores a roadmap block without `Serves` and `Size`, which `roadmap/item` requires. Either backfill stack entries in `pm-setup`, or have `pop` and `switch` ask for missing values the way the backfill does.

## Links

- docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md
