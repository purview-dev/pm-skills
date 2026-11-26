# pm-setup suggests ADR import before init (R-057)

- Item: R-057 pm-setup suggests ADR import before init (Serves V1, Milestone M2)
- Branch: `feat/r-057-pm-setup-suggests-adr-import-before-init`
- ADRs followed: ADR-001 ADRs live in the PM root. None written.

## Intent

`pm-setup` checks for an outside ADR folder only inside Step 5, item 4,
which runs only when `<PM state directory>/config.md` exists, so a
`pm-setup` run before `pm-init` says nothing about existing ADRs. Make the
check run on every `pm-setup`.

Correction (2026-11-26): R-057's `Note` says no import Note appeared in the
M4 rehearsal. The rehearsal report
(`planning/research/2026-11-26-m4-rehearsal.md`, Skill defects found) says
`pm-init` step 3 does print it. The real defect is only that `pm-setup`'s
own copy of the check is dead before init.

## Goals

- `pm-setup` prints an ADR import Note whenever `<PM state
  directory>/decisions/` does not exist and one of `docs/adr/`,
  `docs/decisions/`, `doc/adr/`, or `docs/architecture/decisions/` does,
  with or without `config.md`.

## Non-goals

- No change to `pm-init` step 3, `pm-adr`, or the rules text.
- No question and no write: the check stays read-only.

## Approaches

| Approach | Trade-off |
| --- | --- |
| Own Step 5 item that always runs (chosen) | One check, next to the other Step 5 output |
| Add it to the Step 2 inventory as well | Duplicates the check |
| Do nothing | `pm-init` already tells a fresh install; rejected by the user, who chose the fix |

## Design

- `skills/pm-setup/SKILL.md`: remove the "Also check, read-only" paragraph
  from Step 5, item 4. Add Step 5, item 7, **Outside ADR folder
  (read-only)**, which runs whether or not `config.md` exists, with the
  condition above and the output Note:
  - with `config.md`: `Existing ADRs in <folder>. Run pm-adr import <folder> to bring them in.`
  - without `config.md`: `Existing ADRs in <folder>. After pm-init, run pm-adr import <folder> to bring them in.`
- The Output template's `Note` line lists both forms.
- `just bump prerelease` (`21.0.0-pre.13` to `21.0.0-pre.14`): `skills/`
  changes on the unreleased line; the rules text is unchanged, so no
  upgrade note.
- Docs site: nothing; this is setup output, not PM state.

## Evidence for Done when

A fresh agent session follows the edited `skills/pm-setup/SKILL.md` in a
scratch repository with `docs/adr/0001-example.md` and no `planning/`, and
its output Note reads `Existing ADRs in docs/adr/. After pm-init, run
pm-adr import docs/adr/ to bring them in.` The command and output go in
the pull request description. `just validate` and `just lint-check` pass.

## Left to the builder

- Exact wording of item 7 around the condition.
