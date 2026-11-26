# R-006 Check pm-setup's skill counts in validate

- Item: R-006 Check pm-setup's skill counts in validate (Serves V1, M2)
- Date: 2026-11-26
- Status: approved
- ADRs: none (no architecture decision; none of ADR-001 to ADR-015 is touched)

## Intent

`skills/pm-setup/SKILL.md` states the size of its inventory twice: `- Skills: <n> of 26 installed.` (step 4 plan template) and `- Skills: <26 of 26 installed | missing: names>` (output template). When a skill is added or removed and these numbers are not updated, pm-setup reports a wrong count to consumers. `scripts/validate.ts` already checks that every shipped skill is named in the inventory (`validate.ts:55`) but not the numbers.

## Finding

The counts are correct today. The inventory (pm-setup step 2, item 4) names every shipped skill except `pm-setup`: 27 shipped `pm-*` skills (skills without `metadata.internal: true`; `release` is internal), minus `pm-setup`, is 26. The item's `Done when` names `22`, a number from when it was written; the check compares against the shipped count, whatever it is.

## Goals

- `just validate` fails when either count in `skills/pm-setup/SKILL.md` differs from the shipped skills minus `pm-setup`.
- It fails when no count is found, so rewording the line cannot disable the check silently.

## Non-goals

- Computing the number at runtime in pm-setup (would change `skills/`, forcing a rules bump, to remove a guard).
- Checking the `Workflow skills: <n> of <total>` line (no digits, and not about this repository's skills).

## Approaches

1. **Validate the literal numbers (chosen).** Match every `\d+ of \d+` in pm-setup's SKILL.md; each number must equal `shipped.filter(n => n !== "pm-setup").length`. Small, no skills change.
2. Replace the numbers with prose (`all inventory skills`) in pm-setup. Removes the drift but needs a skills change and rules bump, and loses the useful number in the output.
3. Do nothing. The inventory-name check catches a missing name but not a wrong number, so the drift recurs.

## Design

- In `scripts/validate.ts`, after the shipped-skill loop: let `expected` be the shipped count minus `pm-setup`. For each line of `setup` matching `/(\d+) of (\d+)/g`, fail `pm-setup/SKILL.md:<line>: skill count <N>, expected <expected>` for each number not equal to `expected`. If no match, fail `pm-setup/SKILL.md: no "<N> of <N>" skill count found`.
- Add the check to the `Validate only` list in `AGENTS.md`.
- No file under `skills/` changes, so the rules version stays.

## Left to the builder

- Exact placement and variable names in `validate.ts`; whether to verify by a temporary edit of the count or a scripted test, provided `just validate` is shown failing on a wrong count and passing on the real file.
