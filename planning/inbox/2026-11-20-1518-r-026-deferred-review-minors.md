# R-026 deferred review minors

- Captured: 2026-11-20 15:18
- Source: agent (R-026 execute)
- Kind: tech-debt
- Affects: skills/pm-lint, skills/pm-checkpoint, skills/pm-next
- Context: R-026 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Minors from the R-026 pm-checkpoint keeps every item field final review, deferred: (1) `skills/pm-lint/scripts/structure.ts` comment on `NOW_NOTE` says "rules 22"; the change shipped on rules 21 (21.0.0-pre.2). (2) The R-026 spec (design item 6) and plan (Task 3) still describe `just bump major` to rules 22; add a superseded line. (3) The `now/fields` rule text in `rules.md`, `rules.ts`, and the `checkNow` message says "and then an optional Note", readable as after `Started`; say "an optional Note after Revisits". (4) `pm-checkpoint` `switch` recovery runs only when `Serves`/`Size` are missing and never restores `Note`, so an item claimed under 21.0.0-pre.1 (whose `pm-next` dropped the Note) switches back without it; also restore `Note` from the claim-commit block when `NOW.md` lacks one. (5) `pm-next` steps 3 and 5 can each hold a `Note:`, but step 7 joins "a held note" in the singular; state the order for two. (6) A blank `- Note:` on an item: say "a non-empty Note" in `pm-next` step 7 and `pm-rejoin` step 3. (7) No test pins that a `Note` without the five item fields fails `now/fields`.
