# Engineering lint review minors follow-ups

- Captured: 2026-11-25 16:05
- Source: agent (R-055 execute, final review)
- Kind: tech-debt
- Affects: skills/pm-lint/scripts/structure.ts, skills/pm-lint/scripts/lint.test.ts, skills/pm-engineering/SKILL.md
- Context: R-055 execute
- Discuss: no
- Related: R-055
- Brief: none
- Reviewed: 2026-11-26

## Idea

Five minors the R-055 whole-branch review found and deferred. (1) `engineering/values` and `engineering/decision-current` messages name a technology headed `### EP-001 Bun` as `EP-001`, because `checkEngineeringValues` uses `block.id || block.title`; use `block.name` for Technology blocks. (2) The `engineering/removed` message says "A removed entry is", while the rule text now says "A removed line is". (3) The `pm-engineering` view recommends `change <entry> Decision <ADR-MMM>` with the immediate successor, not the end of the `superseded by` chain that step 1 now follows; a deprecated chain end has no ADR to suggest. (4) The "orders technology with English collation" test passes on an English-locale host without the `"en"` argument; add a case where code-point order and English collation differ. (5) `pm-engineering` step 4 (`change`) does not name the Challenge protocol checks that the managed section now says apply to it.
